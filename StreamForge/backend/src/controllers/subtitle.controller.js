const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Video = require('../models/Video.model');

// ── Multer storage for subtitle files ────────────────────────────────
const subtitleDir = path.join(__dirname, '../../uploads/subtitles');
if (!fs.existsSync(subtitleDir)) fs.mkdirSync(subtitleDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, subtitleDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    cb(null, `${req.params.id}_${ts}.srt`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.srt') {
    cb(null, true);
  } else {
    cb(new Error('Only .srt subtitle files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

exports.subtitleUpload = upload.single('subtitle');

// POST /api/v1/videos/:id/subtitles
exports.uploadSubtitle = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Video not found' },
      });
    }

    if (video.owner.toString() !== req.user.id.toString()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the video owner can upload subtitles' },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'A .srt subtitle file is required' },
      });
    }

    // Delete old subtitle file from disk if it exists
    if (video.subtitleUrl) {
      const oldFilename = path.basename(video.subtitleUrl);
      const oldPath = path.join(subtitleDir, oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const subtitleUrl = `${baseUrl}/uploads/subtitles/${req.file.filename}`;

    video.subtitleUrl = subtitleUrl;
    await video.save();

    res.json({ success: true, data: { subtitleUrl } });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/videos/:id/subtitles
exports.deleteSubtitle = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Video not found' },
      });
    }

    if (video.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the video owner can remove subtitles' },
      });
    }

    if (!video.subtitleUrl) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_SUBTITLE', message: 'This video has no subtitle file' },
      });
    }

    const filename = path.basename(video.subtitleUrl);
    const filePath = path.join(subtitleDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    video.subtitleUrl = null;
    await video.save();

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
