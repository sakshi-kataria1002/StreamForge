const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');
const Video = require('../models/Video.model');
const WatchHistory = require('../models/WatchHistory.model');
const Notification = require('../models/Notification.model');
const Subscription = require('../models/Subscription.model');

// ── Cloudinary config ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer — memory storage (no disk, buffers go straight to Cloudinary) ──
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video or image files are allowed'), false);
  }
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 500 * 1024 * 1024 } });
exports.upload = upload;
exports.uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// ── Helper: upload buffer to Cloudinary ───────────────────────────
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ── Controllers ───────────────────────────────────────────────────

// POST /api/v1/videos
exports.uploadVideo = async (req, res) => {
  try {
    const videoFile = req.files?.['video']?.[0];
    const thumbnailFile = req.files?.['thumbnail']?.[0];

    if (!videoFile) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Video file is required' } });
    }

    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: { code: 'NO_TITLE', message: 'Title is required' } });
    }

    // Upload video to Cloudinary
    const videoResult = await uploadToCloudinary(videoFile.buffer, {
      resource_type: 'video',
      folder: 'streamforge/videos',
    });

    // Upload thumbnail to Cloudinary (if provided)
    let thumbnailUrl;
    if (thumbnailFile) {
      const thumbResult = await uploadToCloudinary(thumbnailFile.buffer, {
        resource_type: 'image',
        folder: 'streamforge/thumbnails',
      });
      thumbnailUrl = thumbResult.secure_url;
    }

    const rawTags = req.body.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags.map((t) => t.trim()).filter(Boolean).slice(0, 10)
      : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
      : [];

    const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();

    const video = await Video.create({
      title: title.trim(),
      description: description?.trim() || '',
      owner: req.user.id,
      filePath: videoResult.public_id,
      fileUrl: videoResult.secure_url,
      ...(thumbnailUrl && { thumbnailUrl }),
      status: isScheduled ? 'scheduled' : 'ready',
      ...(isScheduled && { scheduledAt }),
      category: req.body.category || 'Other',
      tags,
    });

    await video.populate('owner', 'name');

    if (!isScheduled) {
      const subs = await Subscription.find({ creator: req.user.id }).select('subscriber');
      if (subs.length > 0) {
        const notifications = subs.map((s) => ({
          recipient: s.subscriber,
          type: 'new_upload',
          actor: req.user.id,
          video: video._id,
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos
exports.getVideos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { status: 'ready', $and: [{ $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] }] };

    if (req.query.excludeOwner) filter.$and.push({ owner: { $ne: req.query.excludeOwner } });

    if (req.query.q) {
      const safe = req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = { $regex: safe, $options: 'i' };
      filter.$and.push({ $or: [{ title: re }, { description: re }, { tags: re }] });
    }
    if (req.query.category) filter.$and.push({ category: req.query.category });
    if (req.query.tag)      filter.$and.push({ tags: req.query.tag });
    if (req.query.duration === 'short')  filter.duration = { $gt: 0, $lt: 240 };
    if (req.query.duration === 'medium') filter.duration = { $gte: 240, $lte: 1200 };
    if (req.query.duration === 'long')   filter.duration = { $gt: 1200 };
    const dateMap = { today: 1, week: 7, month: 30 };
    if (dateMap[req.query.dateFrom]) {
      filter.createdAt = { $gte: new Date(Date.now() - dateMap[req.query.dateFrom] * 86400000) };
    }

    const sortMap = { views: { views: -1 }, oldest: { createdAt: 1 } };
    const sort = sortMap[req.query.sortBy] || { createdAt: -1 };

    const [videos, total] = await Promise.all([
      Video.find(filter).sort(sort).skip(skip).limit(limit).populate('owner', 'name'),
      Video.countDocuments(filter),
    ]);

    res.json({ success: true, data: { videos, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/trending
exports.getTrending = async (req, res) => {
  try {
    const videos = await Video.aggregate([
      { $match: { status: 'ready', $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] } },
      { $addFields: { score: { $add: ['$views', { $multiply: [{ $size: { $ifNull: ['$likes', []] } }, 5] }] } } },
      { $sort: { score: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'ownerArr' } },
      { $unwind: { path: '$ownerArr', preserveNullAndEmptyArrays: true } },
      { $addFields: { owner: { _id: '$ownerArr._id', name: '$ownerArr.name' } } },
      { $project: { ownerArr: 0, score: 0 } },
    ]);
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/:id/related
exports.getRelatedVideos = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).select('tags category owner');
    if (!video) return res.status(404).json({ success: false, error: { message: 'Not found' } });

    const related = await Video.find({
      _id: { $ne: req.params.id },
      status: 'ready',
      $or: [
        ...(video.tags?.length ? [{ tags: { $in: video.tags } }] : []),
        { category: video.category },
        { owner: video.owner },
      ],
    }).limit(8).populate('owner', 'name');

    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/:id
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('owner', 'name');
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });

    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const userId = req.user?.id;
    if (userId) {
      await WatchHistory.findOneAndUpdate(
        { user: userId, video: req.params.id },
        { watchedAt: new Date() },
        { upsert: true }
      );
    }

    const videoObj = video.toObject();
    videoObj.likesCount = video.likes.length;
    videoObj.dislikesCount = video.dislikes.length;
    videoObj.liked = userId ? video.likes.map(String).includes(userId) : false;
    videoObj.disliked = userId ? video.dislikes.map(String).includes(userId) : false;
    res.json({ success: true, data: videoObj });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/liked
exports.getLikedVideos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ likes: req.user.id, status: 'ready' }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name'),
      Video.countDocuments({ likes: req.user.id, status: 'ready' }),
    ]);

    res.json({ success: true, data: { videos, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/users/:userId/videos
exports.getUserVideos = async (req, res) => {
  try {
    const videos = await Video.find({ owner: req.params.userId, status: 'ready' }).sort({ createdAt: -1 }).populate('owner', 'name');
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/videos/:id/like
exports.likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });

    const userId = req.user.id;
    const alreadyLiked = video.likes.map(String).includes(userId);
    if (alreadyLiked) {
      video.likes.pull(userId);
    } else {
      video.likes.addToSet(userId);
      video.dislikes.pull(userId);
    }
    await video.save();
    res.json({ success: true, data: { likes: video.likes.length, dislikes: video.dislikes.length, liked: !alreadyLiked, disliked: false } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/videos/:id/dislike
exports.dislikeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });

    const userId = req.user.id;
    const alreadyDisliked = video.dislikes.map(String).includes(userId);
    if (alreadyDisliked) {
      video.dislikes.pull(userId);
    } else {
      video.dislikes.addToSet(userId);
      video.likes.pull(userId);
    }
    await video.save();
    res.json({ success: true, data: { likes: video.likes.length, dislikes: video.dislikes.length, liked: false, disliked: !alreadyDisliked } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// PUT /api/v1/videos/:id
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }
    const { title, description } = req.body;
    if (title !== undefined) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    await video.save();
    await video.populate('owner', 'name');
    res.json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/videos/:id/thumbnail
const thumbnailUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('thumbnail');

exports.thumbnailUpload = thumbnailUploadMiddleware;

exports.uploadThumbnail = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'Image file required' } });

    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'image',
      folder: 'streamforge/thumbnails',
    });

    video.thumbnailUrl = result.secure_url;
    await video.save();
    res.json({ success: true, data: { thumbnailUrl: video.thumbnailUrl } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/videos/:id
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }

    // Delete from Cloudinary
    if (video.filePath) {
      await cloudinary.uploader.destroy(video.filePath, { resource_type: 'video' }).catch(() => {});
    }

    await video.deleteOne();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
