const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const Video = require('../models/Video.model');
const WatchHistory = require('../models/WatchHistory.model');
const Notification = require('../models/Notification.model');
const Subscription = require('../models/Subscription.model');

// ── Multer storage config ──────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video or image files are allowed'), false);
  }
};

// 500 MB max
const upload = multer({ storage, fileFilter, limits: { fileSize: 500 * 1024 * 1024 } });
exports.upload = upload;
exports.uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// ── Controllers ───────────────────────────────────────────────────

// POST /api/v1/videos  (multipart/form-data: file, title, description)
exports.uploadVideo = async (req, res) => {
  try {
    const videoFile = req.files?.['video']?.[0];
    const thumbnailFile = req.files?.['thumbnail']?.[0];

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Video file is required' },
      });
    }

    const { title, description } = req.body;
    if (!title || !title.trim()) {
      fs.unlinkSync(videoFile.path);
      if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TITLE', message: 'Title is required' },
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${baseUrl}/uploads/${videoFile.filename}`;
    const thumbnailUrl = thumbnailFile ? `${baseUrl}/uploads/${thumbnailFile.filename}` : undefined;

    const rawTags = req.body.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags.map((t) => t.trim()).filter(Boolean).slice(0, 10)
      : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
      : [];

    // Scheduled publishing
    const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();

    const video = await Video.create({
      title: title.trim(),
      description: description?.trim() || '',
      owner: req.user.id,
      filePath: videoFile.path,
      fileUrl,
      ...(thumbnailUrl && { thumbnailUrl }),
      status: isScheduled ? 'scheduled' : 'ready',
      ...(isScheduled && { scheduledAt }),
      category: req.body.category || 'Other',
      tags,
    });

    await video.populate('owner', 'name');

    // Notify subscribers only for immediately published videos
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
    if (req.files?.['video']?.[0]) fs.unlinkSync(req.files['video'][0].path);
    if (req.files?.['thumbnail']?.[0]) fs.unlinkSync(req.files['thumbnail'][0].path);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos  (public — supports ?q=&category=&tag=&duration=&dateFrom=&sortBy=)
exports.getVideos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { status: 'ready', $or: [{ scheduledAt: null }, { scheduledAt: { $lte: new Date() } }] };

    if (req.query.q) {
      const safe = req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = { $regex: safe, $options: 'i' };
      filter.$or = [{ title: re }, { description: re }, { tags: re }];
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag)      filter.tags = req.query.tag;
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

    res.json({
      success: true,
      data: { videos, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/trending  (public)
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

// GET /api/v1/videos/:id/related  (public)
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
    })
      .limit(8)
      .populate('owner', 'name');

    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/:id  (public — stream or direct URL)
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('owner', 'name');
    if (!video) {
      return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    }
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Record watch history for authenticated users
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

// GET /api/v1/videos/liked  (protected — current user's liked videos)
exports.getLikedVideos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ likes: req.user.id, status: 'ready' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name'),
      Video.countDocuments({ likes: req.user.id, status: 'ready' }),
    ]);

    res.json({
      success: true,
      data: { videos, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/users/:userId/videos  (public — user's uploaded videos)
exports.getUserVideos = async (req, res) => {
  try {
    const videos = await Video.find({ owner: req.params.userId, status: 'ready' })
      .sort({ createdAt: -1 })
      .populate('owner', 'name');
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/videos/:id/like  (toggle like)
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

// POST /api/v1/videos/:id/dislike  (toggle dislike)
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

// PUT /api/v1/videos/:id  (owner only)
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

// POST /api/v1/videos/:id/thumbnail  (owner only — replace thumbnail)
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `thumb-${uuidv4()}${ext}`);
  },
});
const thumbnailUploadMiddleware = multer({
  storage: thumbnailStorage,
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

    // Delete old thumbnail if local
    if (video.thumbnailUrl && video.thumbnailUrl.includes('/uploads/')) {
      const oldPath = path.join(uploadDir, path.basename(video.thumbnailUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    video.thumbnailUrl = `${baseUrl}/uploads/${req.file.filename}`;
    await video.save();
    res.json({ success: true, data: { thumbnailUrl: video.thumbnailUrl } });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/videos/:id  (owner only)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    }
    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }
    // Delete file from disk
    if (fs.existsSync(video.filePath)) fs.unlinkSync(video.filePath);
    await video.deleteOne();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
