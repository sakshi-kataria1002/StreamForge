const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { protect } = require('../middleware/auth.middleware');

// IMPORTANT: /upload-url must be defined before /:id routes to avoid param shadowing
router.post('/upload-url', protect, videoController.getUploadUrl);
router.post('/', protect, videoController.createVideo);
router.get('/', videoController.getVideos);
router.get('/:id/status', protect, videoController.getVideoStatus);

module.exports = router;
