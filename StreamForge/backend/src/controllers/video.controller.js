const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cloudinary = require('cloudinary').v2;
const Video = require('../models/Video.model');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'filename and contentType are required' },
      });
    }

    const s3Key = `videos/${req.user.id}/${Date.now()}-${filename}`;
    const bucket = process.env.AWS_S3_BUCKET;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({ success: true, data: { uploadUrl, s3Key, bucket } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, s3Key, s3Bucket } = req.body;

    if (!title || !s3Key || !s3Bucket) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'title, s3Key, and s3Bucket are required' },
      });
    }

    const video = await Video.create({
      title,
      description: description || '',
      owner: req.user.id,
      s3Key,
      s3Bucket,
      status: 'pending',
    });

    // Trigger Cloudinary transcoding asynchronously (do not await)
    const s3Url = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`;
    cloudinary.uploader
      .upload(s3Url, {
        resource_type: 'video',
        public_id: video._id.toString(),
        eager: [{ quality: 'auto', format: 'mp4' }],
        eager_async: true,
      })
      .then(async (result) => {
        await Video.findByIdAndUpdate(video._id, {
          status: 'ready',
          cloudinaryPublicId: result.public_id,
          thumbnailUrl: result.secure_url.replace('/upload/', '/upload/so_0/').replace('.mp4', '.jpg'),
          duration: Math.round(result.duration || 0),
        });
      })
      .catch(async () => {
        // Leave as processing — a webhook or retry job would handle this in production
      });

    video.status = 'processing';
    video.cloudinaryPublicId = video._id.toString();
    await video.save();

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getVideoStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).select('status thumbnailUrl cloudinaryPublicId owner');

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Video not found' },
      });
    }

    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    res.json({
      success: true,
      data: {
        status: video.status,
        thumbnailUrl: video.thumbnailUrl,
        cloudinaryPublicId: video.cloudinaryPublicId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ status: 'ready' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name'),
      Video.countDocuments({ status: 'ready' }),
    ]);

    res.json({
      success: true,
      data: { videos, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
