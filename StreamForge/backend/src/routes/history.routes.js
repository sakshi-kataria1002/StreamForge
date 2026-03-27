const express = require('express');
const router = express.Router();
const { getHistory, clearHistory } = require('../controllers/history.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getHistory);
router.delete('/', protect, clearHistory);

module.exports = router;
