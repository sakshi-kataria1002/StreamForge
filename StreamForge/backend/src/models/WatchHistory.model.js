const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, watchedAt: -1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
