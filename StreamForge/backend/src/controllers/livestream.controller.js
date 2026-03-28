const { v4: uuidv4 } = require('uuid');
const LiveStream = require('../models/LiveStream.model');

// POST /api/v1/livestreams
exports.createStream = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Stream title is required' } });
    }

    const stream = await LiveStream.create({
      host: req.user.id,
      title: title.trim(),
      description: description?.trim() ?? '',
      streamKey: uuidv4(),
      status: 'scheduled',
    });

    await stream.populate('host', 'name');
    res.status(201).json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/livestreams/:streamId
exports.getStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId)
      .populate('host', 'name')
      .select('-chatMessages');

    if (!stream) {
      return res.status(404).json({ success: false, error: { message: 'Stream not found' } });
    }

    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// PATCH /api/v1/livestreams/:streamId/go-live
exports.goLive = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId);

    if (!stream) {
      return res.status(404).json({ success: false, error: { message: 'Stream not found' } });
    }
    if (stream.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }
    if (stream.status === 'ended') {
      return res.status(400).json({ success: false, error: { message: 'Stream has already ended' } });
    }

    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();
    await stream.populate('host', 'name');

    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// PATCH /api/v1/livestreams/:streamId/end
exports.endStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId);

    if (!stream) {
      return res.status(404).json({ success: false, error: { message: 'Stream not found' } });
    }
    if (stream.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised' } });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();

    res.json({ success: true, data: { message: 'Stream ended' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/livestreams
exports.getLiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: 'live' })
      .sort({ startedAt: -1 })
      .populate('host', 'name')
      .select('-chatMessages');

    res.json({ success: true, data: streams });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
