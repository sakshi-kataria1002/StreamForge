const Notification = require('../models/Notification.model');

// GET /api/v1/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('actor', 'name')
      .populate('video', 'title thumbnailUrl');

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
