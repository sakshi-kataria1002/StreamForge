const Stripe = require('stripe');
const Membership = require('../models/Membership.model');
const User = require('../models/User.model');

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in .env');
  }
  return Stripe(process.env.STRIPE_SECRET_KEY);
};

// POST /api/v1/memberships/checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const { creatorId, tier, price } = req.body;

    if (!creatorId || !tier || price === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'creatorId, tier, and price are required' },
      });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ success: false, error: { message: 'Creator not found' } });
    }

    if (req.user.id.toString() === creatorId) {
      return res.status(400).json({
        success: false,
        error: { message: 'You cannot join your own channel' },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creator.name} — ${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
              description: `Monthly membership to ${creator.name}'s channel on StreamForge`,
            },
            unit_amount: Math.round(price * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/channel/${creatorId}`,
      metadata: {
        memberId: req.user.id.toString(),
        creatorId: creatorId.toString(),
        tier,
        price: price.toString(),
      },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// POST /api/v1/memberships/webhook
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, error: { message: `Webhook error: ${err.message}` } });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { memberId, creatorId, tier, price } = session.metadata;

      const existing = await Membership.findOne({ member: memberId, creator: creatorId, status: 'active' });
      if (!existing) {
        await Membership.create({
          member: memberId,
          creator: creatorId,
          tier,
          price: parseFloat(price),
          status: 'active',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          startDate: new Date(),
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await Membership.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: 'cancelled', endDate: new Date() }
      );
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/memberships/status/:creatorId
exports.getMembershipStatus = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      member: req.user.id,
      creator: req.params.creatorId,
      status: 'active',
    }).select('tier price startDate stripeSubscriptionId');

    res.json({ success: true, data: { isMember: !!membership, membership: membership || null } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// DELETE /api/v1/memberships/:membershipId
exports.cancelMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.membershipId);

    if (!membership) {
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    }

    if (membership.member.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'Not authorised to cancel this membership' } });
    }

    if (membership.status !== 'active') {
      return res.status(400).json({ success: false, error: { message: 'Membership is not active' } });
    }

    if (membership.stripeSubscriptionId) {
      await getStripe().subscriptions.update(membership.stripeSubscriptionId, { cancel_at_period_end: true });
    }

    membership.status = 'cancelled';
    membership.endDate = new Date();
    await membership.save();

    res.json({ success: true, data: { message: 'Membership cancelled successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
