const Video = require('../models/Video.model');
const Subscription = require('../models/Subscription.model');

// GET /api/v1/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [videos, subscriberCount] = await Promise.all([
      Video.find({ owner: req.user.id, status: 'ready' }).sort({ createdAt: -1 }),
      Subscription.countDocuments({ creator: req.user.id }),
    ]);

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likes?.length || 0), 0);

    res.json({
      success: true,
      data: {
        stats: {
          totalVideos: videos.length,
          totalViews,
          totalLikes,
          subscriberCount,
        },
        videos,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
