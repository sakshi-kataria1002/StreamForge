const User = require('../models/User.model');
const Video = require('../models/Video.model');
const Subscription = require('../models/Subscription.model');

// GET /api/v1/users/:userId/channel  (public, optional auth)
exports.getChannel = async (req, res) => {
  try {
    const [user, videos, subscriberCount] = await Promise.all([
      User.findById(req.params.userId).select('name createdAt'),
      Video.find({ owner: req.params.userId, status: 'ready' })
        .sort({ createdAt: -1 })
        .populate('owner', 'name'),
      Subscription.countDocuments({ creator: req.params.userId }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'Channel not found' } });
    }

    let isSubscribed = false;
    if (req.user) {
      isSubscribed = !!(await Subscription.exists({ subscriber: req.user.id, creator: req.params.userId }));
    }

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

    res.json({
      success: true,
      data: {
        channel: {
          _id: user._id,
          name: user.name,
          createdAt: user.createdAt,
          subscriberCount,
          totalViews,
          videoCount: videos.length,
          isSubscribed,
        },
        videos,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
