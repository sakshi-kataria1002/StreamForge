const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth.middleware');

// /api/videos/:videoId/comments
router.post('/', protect, commentController.addComment);
router.get('/', commentController.getComments);

// /api/comments/:commentId
router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;
