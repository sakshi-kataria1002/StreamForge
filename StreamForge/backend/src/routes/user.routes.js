const express = require('express');
const router = express.Router();
const { getUserVideos } = require('../controllers/video.controller');

// GET /api/v1/users/:userId/videos
router.get('/:userId/videos', getUserVideos);

module.exports = router;
