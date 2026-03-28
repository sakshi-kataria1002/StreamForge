const router = require('express').Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/playlist.controller');

router.post('/', protect, ctrl.createPlaylist);
router.get('/my', protect, ctrl.getMyPlaylists);
router.get('/video-status/:videoId', protect, ctrl.getVideoPlaylistStatus);
router.get('/:id', optionalProtect, ctrl.getPlaylist);
router.patch('/:id', protect, ctrl.updatePlaylist);
router.delete('/:id', protect, ctrl.deletePlaylist);
router.post('/:id/videos', protect, ctrl.addVideo);
router.delete('/:id/videos/:videoId', protect, ctrl.removeVideo);

module.exports = router;
