const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Playlist title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  { timestamps: true }
);

playlistSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Playlist', playlistSchema);
