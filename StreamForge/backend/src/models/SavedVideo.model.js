const mongoose = require('mongoose');

const savedVideoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  },
  { timestamps: true }
);

savedVideoSchema.index({ user: 1, video: 1 }, { unique: true });
savedVideoSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedVideo', savedVideoSchema);
