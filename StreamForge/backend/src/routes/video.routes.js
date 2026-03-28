const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { toggleSave, getSaveStatus } = require('../controllers/saved.controller');
const summaryController = require('../controllers/summary.controller');
const subtitleController = require('../controllers/subtitle.controller');
const { protect, optionalProtect } = require('../middleware/auth.middleware');

// Public (with optional auth for like/save state)
router.get('/', videoController.getVideos);
router.get('/trending', videoController.getTrending);
router.get('/liked', protect, videoController.getLikedVideos);
router.get('/:id', optionalProtect, videoController.getVideo);
router.get('/:id/related', videoController.getRelatedVideos);

// Protected — video CRUD
router.post('/', protect, videoController.uploadFields, videoController.uploadVideo);
router.put('/:id', protect, videoController.updateVideo);
router.delete('/:id', protect, videoController.deleteVideo);

// Protected — interactions
router.post('/:id/like', protect, videoController.likeVideo);
router.post('/:id/dislike', protect, videoController.dislikeVideo);
router.post('/:id/save', protect, toggleSave);
router.get('/:id/save-status', protect, getSaveStatus);

// AI Summary (open — no auth; generation is idempotent)
router.post('/:id/summary', summaryController.generateSummary);

// Thumbnail (owner-protected)
router.post('/:id/thumbnail', protect, videoController.thumbnailUpload, videoController.uploadThumbnail);

// Subtitles (owner-protected)
router.post('/:id/subtitles', protect, subtitleController.subtitleUpload, subtitleController.uploadSubtitle);
router.delete('/:id/subtitles', protect, subtitleController.deleteSubtitle);

module.exports = router;
