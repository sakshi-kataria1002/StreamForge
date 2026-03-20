const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth.middleware');

// Mount at app level:
//   app.use('/api/users', subscriptionRouter)  → handles /:creatorId/subscribe
//   app.use('/api', subscriptionRouter)         → handles /feed

router.post('/users/:creatorId/subscribe', protect, subscriptionController.toggleSubscribe);
router.get('/users/:creatorId/subscribe', protect, subscriptionController.getSubscriptionStatus);
router.get('/feed', protect, subscriptionController.getFeed);

module.exports = router;
