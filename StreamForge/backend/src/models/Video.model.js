const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filePath: {
      type: String,
      required: true, // relative path on disk e.g. "uploads/abc123.mp4"
    },
    fileUrl: {
      type: String,
      required: true, // public URL e.g. "http://localhost:5000/uploads/abc123.mp4"
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['ready', 'scheduled'],
      default: 'ready',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    category: {
      type: String,
      enum: ['Education', 'Entertainment', 'Gaming', 'Music', 'News', 'Sports', 'Technology', 'Travel', 'Other'],
      default: 'Other',
    },
    tags: {
      type: [String],
      default: [],
      validate: { validator: (arr) => arr.length <= 10, message: 'Max 10 tags allowed' },
    },
    summary: {
      type: String,
      default: null,
    },
    subtitleUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

videoSchema.index({ owner: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ category: 1 });
videoSchema.index({ tags: 1 });

module.exports = mongoose.model('Video', videoSchema);
