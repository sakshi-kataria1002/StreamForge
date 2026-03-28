const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
    stripeSubscriptionId: { type: String },
    stripeCustomerId: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

membershipSchema.index({ member: 1, creator: 1 });
membershipSchema.index({ member: 1 });
membershipSchema.index({ creator: 1 });
membershipSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
