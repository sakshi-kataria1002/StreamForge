const SavedVideo = require('../models/SavedVideo.model');
const Video = require('../models/Video.model');

// POST /api/v1/videos/:id/save  — toggle save
exports.toggleSave = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: { message: 'Video not found' } });

    const existing = await SavedVideo.findOne({ user: req.user.id, video: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, data: { saved: false } });
    }
    await SavedVideo.create({ user: req.user.id, video: req.params.id });
    res.json({ success: true, data: { saved: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/saved  — list saved videos
exports.getSaved = async (req, res) => {
  try {
    const saved = await SavedVideo.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'video', populate: { path: 'owner', select: 'name' } });

    const valid = saved.filter((s) => s.video !== null);
    res.json({ success: true, data: valid });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/videos/:id/save-status
exports.getSaveStatus = async (req, res) => {
  try {
    const existing = await SavedVideo.findOne({ user: req.user.id, video: req.params.id });
    res.json({ success: true, data: { saved: !!existing } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
