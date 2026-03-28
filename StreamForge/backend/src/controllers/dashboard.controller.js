const Video = require('../models/Video.model');
const Subscription = require('../models/Subscription.model');
const WatchHistory = require('../models/WatchHistory.model');

// GET /api/v1/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [videos, subscriberCount] = await Promise.all([
      Video.find({ owner: req.user.id, status: { $in: ['ready', 'scheduled'] } }).sort({ createdAt: -1 }),
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

// GET /api/v1/dashboard/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const videoIds = await Video.find({ owner: req.user.id }).select('_id').lean();
    const ids = videoIds.map((v) => v._id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [viewsByDay, topVideos, subscriberCount, subscriberGrowth] = await Promise.all([
      WatchHistory.aggregate([
        { $match: { video: { $in: ids }, watchedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } }, views: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Video.find({ owner: req.user.id, status: 'ready' })
        .sort({ views: -1 })
        .limit(5)
        .select('title views likes thumbnailUrl createdAt'),
      Subscription.countDocuments({ creator: req.user.id }),
      Subscription.aggregate([
        { $match: { creator: req.user._id ?? req.user.id, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, subs: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ success: true, data: { viewsByDay, topVideos, subscriberCount, subscriberGrowth } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
