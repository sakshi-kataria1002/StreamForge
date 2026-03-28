const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

router.post('/reports', protect, moderationController.submitReport);
router.get('/reports', protect, adminOnly, moderationController.getReports);
router.patch('/reports/:reportId', protect, adminOnly, moderationController.updateReportStatus);

module.exports = router;
