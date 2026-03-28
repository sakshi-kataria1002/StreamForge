const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membership.controller');
const { protect } = require('../middleware/auth.middleware');

// Stripe webhook needs raw body — must be before express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), membershipController.handleWebhook);

router.post('/checkout', protect, membershipController.createCheckoutSession);
router.get('/status/:creatorId', protect, membershipController.getMembershipStatus);
router.delete('/:membershipId', protect, membershipController.cancelMembership);

module.exports = router;
