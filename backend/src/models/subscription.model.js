import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "starter", "pro"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "past_due"],
      default: "active",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    // Usage tracking
    usage: {
      resumeScoringCards: {
        used: { type: Number, default: 0 },
        limit: { type: Number, default: 3 }, // Free tier default
        resetDate: { type: Date, default: Date.now },
      },
      jobRecommendations: {
        used: { type: Number, default: 0 },
        limit: { type: Number, default: 10 }, // Free tier default
        resetDate: { type: Date, default: Date.now },
      },
      autonomousApplications: {
        used: { type: Number, default: 0 },
        limit: { type: Number, default: 0 }, // Free tier default
        resetDate: { type: Date, default: Date.now },
      },
      careerMemories: {
        used: { type: Number, default: 0 },
        limit: { type: Number, default: 20 }, // Free tier default
        resetDate: { type: Date, default: Date.now },
      },
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["mpesa", "card", "bank_transfer"],
    },
    lastPaymentDate: Date,
    nextBillingDate: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" && this.currentPeriodEnd > new Date();
};

// Method to get plan limits
subscriptionSchema.methods.getPlanLimits = function () {
  const limits = {
    free: {
      resumeScoringCards: 3,
      jobRecommendations: 10,
      autonomousApplications: 0,
      careerMemories: 20,
    },
    starter: {
      resumeScoringCards: 20,
      jobRecommendations: 50,
      autonomousApplications: 25,
      careerMemories: 200,
    },
    pro: {
      resumeScoringCards: -1, // Unlimited
      jobRecommendations: -1, // Unlimited
      autonomousApplications: -1, // Unlimited
      careerMemories: -1, // Unlimited
    },
  };
  
  return limits[this.plan] || limits.free;
};

// Method to check if user can use a feature
subscriptionSchema.methods.canUseFeature = function (featureName) {
  if (!this.isActive()) return false;
  
  const limits = this.getPlanLimits();
  const featureLimit = limits[featureName];
  
  if (featureLimit === -1) return true; // Unlimited
  
  const currentUsage = this.usage[featureName]?.used || 0;
  return currentUsage < featureLimit;
};

// Method to increment usage
subscriptionSchema.methods.incrementUsage = function (featureName) {
  if (this.usage[featureName]) {
    this.usage[featureName].used += 1;
  }
  return this.save();
};

// Method to reset monthly usage
subscriptionSchema.methods.resetMonthlyUsage = function () {
  const now = new Date();
  const lastReset = this.usage.resumeScoringCards.resetDate;
  
  // Check if it's a new month
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    this.usage.resumeScoringCards.used = 0;
    this.usage.resumeScoringCards.resetDate = now;
    this.usage.jobRecommendations.used = 0;
    this.usage.jobRecommendations.resetDate = now;
    this.usage.autonomousApplications.used = 0;
    this.usage.autonomousApplications.resetDate = now;
    return this.save();
  }
  
  return this;
};

export const Subscription = mongoose.model("Subscription", subscriptionSchema); 