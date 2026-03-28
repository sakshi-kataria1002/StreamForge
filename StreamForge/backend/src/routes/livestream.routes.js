const express = require('express');
const router = express.Router();
const livestreamController = require('../controllers/livestream.controller');
const { protect, optionalProtect } = require('../middleware/auth.middleware');

router.get('/', optionalProtect, livestreamController.getLiveStreams);
router.post('/', protect, livestreamController.createStream);
router.get('/:streamId', optionalProtect, livestreamController.getStream);
router.patch('/:streamId/go-live', protect, livestreamController.goLive);
router.patch('/:streamId/end', protect, livestreamController.endStream);

module.exports = router;
