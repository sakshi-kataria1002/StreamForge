const Playlist = require('../models/Playlist.model');
const Video = require('../models/Video.model');

// POST /api/v1/playlists
exports.createPlaylist = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Title is required' } });
    }
    const playlist = await Playlist.create({
      title: title.trim(),
      description: description?.trim() || '',
      visibility: visibility || 'public',
      owner: req.user.id,
      videos: [],
    });
    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/playlists/my
exports.getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('videos', 'thumbnailUrl title');
    res.json({ success: true, data: playlists });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/playlists/video-status/:videoId
exports.getVideoPlaylistStatus = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id }).select('title videos');
    const result = playlists.map((p) => ({
      _id: p._id,
      title: p.title,
      hasVideo: p.videos.map((v) => v.toString()).includes(req.params.videoId),
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/playlists/:id
exports.getPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'name _id')
      .populate({
        path: 'videos',
        select: 'title thumbnailUrl fileUrl views duration owner createdAt',
        populate: { path: 'owner', select: 'name _id' },
      });

    if (!playlist) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }

    const isOwner = req.user?.id?.toString() === playlist.owner._id.toString();
    if (playlist.visibility === 'private' && !isOwner) {
      return res.status(403).json({ success: false, error: { message: 'This playlist is private' } });
    }

    res.json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// PATCH /api/v1/playlists/:id
exports.updatePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }

    const { title, description, visibility, videos } = req.body;
    if (title !== undefined) playlist.title = title.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (visibility !== undefined) playlist.visibility = visibility;
    if (Array.isArray(videos)) playlist.videos = videos; // for reorder

    await playlist.save();
    res.json({ success: true, data: playlist });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/playlists/:id
exports.deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }
    await playlist.deleteOne();
    res.json({ success: true, data: { message: 'Playlist deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/playlists/:id/videos
exports.addVideo = async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ success: false, error: { message: 'videoId is required' } });
    }
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }
    if (playlist.videos.map((v) => v.toString()).includes(videoId)) {
      return res.status(400).json({ success: false, error: { message: 'Video already in playlist' } });
    }
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    }
    playlist.videos.push(videoId);
    await playlist.save();
    res.json({ success: true, data: { message: 'Added to playlist', videoCount: playlist.videos.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/playlists/:id/videos/:videoId
exports.removeVideo = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }
    playlist.videos = playlist.videos.filter((v) => v.toString() !== req.params.videoId);
    await playlist.save();
    res.json({ success: true, data: { message: 'Removed from playlist', videoCount: playlist.videos.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
