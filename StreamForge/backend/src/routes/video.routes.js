const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { toggleSave, getSaveStatus } = require('../controllers/saved.controller');
const { protect, optionalProtect } = require('../middleware/auth.middleware');

// Public (with optional auth for like/save state)
router.get('/', videoController.getVideos);
router.get('/liked', protect, videoController.getLikedVideos);
router.get('/:id', optionalProtect, videoController.getVideo);

// Protected
router.post('/', protect, videoController.uploadFields, videoController.uploadVideo);
router.put('/:id', protect, videoController.updateVideo);
router.delete('/:id', protect, videoController.deleteVideo);
router.post('/:id/like', protect, videoController.likeVideo);
router.post('/:id/dislike', protect, videoController.dislikeVideo);
router.post('/:id/save', protect, toggleSave);
router.get('/:id/save-status', protect, getSaveStatus);

module.exports = router;
