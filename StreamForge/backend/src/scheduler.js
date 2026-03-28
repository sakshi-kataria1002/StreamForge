/**
 * Background scheduler — runs every 60 seconds.
 * Publishes any scheduled videos whose scheduledAt time has passed.
 */
const Video = require('./models/Video.model');
const Notification = require('./models/Notification.model');
const Subscription = require('./models/Subscription.model');

async function publishDueVideos() {
  try {
    const due = await Video.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    });

    if (due.length === 0) return;

    for (const video of due) {
      video.status = 'ready';
      await video.save();

      // Notify subscribers
      const subs = await Subscription.find({ creator: video.owner }).select('subscriber');
      if (subs.length > 0) {
        const notifications = subs.map((s) => ({
          recipient: s.subscriber,
          type: 'new_upload',
          actor: video.owner,
          video: video._id,
        }));
        await Notification.insertMany(notifications);
      }

      console.log(`[scheduler] Published scheduled video: "${video.title}" (${video._id})`);
    }
  } catch (err) {
    console.error('[scheduler] Error publishing scheduled videos:', err.message);
  }
}

function startScheduler() {
  // Run once immediately on startup, then every 60 seconds
  publishDueVideos();
  setInterval(publishDueVideos, 60 * 1000);
  console.log('[scheduler] Auto-publish scheduler started (checks every 60s)');
}

module.exports = { startScheduler };
