const Subscription = require('../models/Subscription.model');
const Video = require('../models/Video.model');
const User = require('../models/User.model');
const { sendNewSubscriberEmail } = require('../services/email.service');

exports.toggleSubscribe = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (req.user.id.toString() === creatorId) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_SUBSCRIBE', message: 'You cannot subscribe to yourself' },
      });
    }

    const existing = await Subscription.findOne({
      subscriber: req.user.id,
      creator: creatorId,
    });

    if (existing) {
      await existing.deleteOne();
    } else {
      await Subscription.create({ subscriber: req.user.id, creator: creatorId });

      try {
        const creator = await User.findById(creatorId).select('email');
        if (creator && creator.email) {
          sendNewSubscriberEmail(creator.email, req.user.name).catch(() => {});
        }
      } catch { /* email failure must never surface to the client */ }
    }

    const subscriberCount = await Subscription.countDocuments({ creator: creatorId });

    res.json({
      success: true,
      data: { subscribed: !existing, subscriberCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const [existing, subscriberCount] = await Promise.all([
      Subscription.findOne({ subscriber: req.user.id, creator: creatorId }),
      Subscription.countDocuments({ creator: creatorId }),
    ]);

    res.json({
      success: true,
      data: { subscribed: !!existing, subscriberCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find({ subscriber: req.user.id }).select('creator');
    const creatorIds = subscriptions.map((s) => s.creator);

    if (creatorIds.length === 0) {
      return res.json({
        success: true,
        data: { videos: [], total: 0, page, totalPages: 0 },
      });
    }

    const [videos, total] = await Promise.all([
      Video.find({ owner: { $in: creatorIds }, status: 'ready' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name'),
      Video.countDocuments({ owner: { $in: creatorIds }, status: 'ready' }),
    ]);

    res.json({
      success: true,
      data: { videos, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
