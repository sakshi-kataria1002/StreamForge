const Comment = require('../models/Comment.model');

exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'BODY_REQUIRED', message: 'Comment body is required' },
      });
    }

    const comment = await Comment.create({
      body: body.trim(),
      author: req.user.id,
      videoId,
    });

    await comment.populate('author', 'name');

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name'),
      Comment.countDocuments({ videoId }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }

    if (comment.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own comments' },
      });
    }

    await comment.deleteOne();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
