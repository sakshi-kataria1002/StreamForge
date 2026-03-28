const WatchHistory = require('../models/WatchHistory.model');

// GET /api/v1/history  — last 50 watched videos
exports.getHistory = async (req, res) => {
  try {
    const history = await WatchHistory.find({ user: req.user.id })
      .sort({ watchedAt: -1 })
      .limit(50)
      .populate({ path: 'video', populate: { path: 'owner', select: 'name' } });

    // filter out entries where the video was deleted
    const valid = history.filter((h) => h.video !== null);
    res.json({ success: true, data: valid });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/history  — clear all history
exports.clearHistory = async (req, res) => {
  try {
    await WatchHistory.deleteMany({ user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
