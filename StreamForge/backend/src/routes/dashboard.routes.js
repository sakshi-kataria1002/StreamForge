const express = require('express');
const router = express.Router();
const { getDashboard, getAnalytics } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getDashboard);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
