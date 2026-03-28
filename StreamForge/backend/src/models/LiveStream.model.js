const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true },
    message: { type: String, required: true, maxlength: 500, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const liveStreamSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Stream title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    streamKey: {
      type: String,
      unique: true,
      required: true,
    },
    viewerCount: { type: Number, default: 0 },
    chatMessages: { type: [chatMessageSchema], default: [] },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

liveStreamSchema.index({ host: 1 });
liveStreamSchema.index({ status: 1 });

module.exports = mongoose.model('LiveStream', liveStreamSchema);
