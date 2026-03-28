const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.post('/read-all', protect, markAllRead);

module.exports = router;
