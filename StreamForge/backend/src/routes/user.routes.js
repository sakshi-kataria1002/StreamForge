const express = require('express');
const router = express.Router();
const { getUserVideos } = require('../controllers/video.controller');
const { getChannel } = require('../controllers/user.controller');
const { optionalProtect } = require('../middleware/auth.middleware');

// GET /api/v1/users/:userId/channel  (public, optional auth for isSubscribed)
router.get('/:userId/channel', optionalProtect, getChannel);
// GET /api/v1/users/:userId/videos
router.get('/:userId/videos', getUserVideos);

module.exports = router;
