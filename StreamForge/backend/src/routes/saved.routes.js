const express = require('express');
const router = express.Router();
const { getSaved } = require('../controllers/saved.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getSaved);

module.exports = router;
