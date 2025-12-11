import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { FeatureAccess, FEATURE_CONFIG } from "../utils/featureAccess.js";

// Get user's subscription status
const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  
  console.warn('Subscription checks are currently disabled - returning active pro subscription');
  
  // Always return active pro subscription during development
  let subscription = await Subscription.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        plan: "pro",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        billingCycle: "monthly",
        cancelAtPeriodEnd: false,
        usage: {}
      }
    },
    { 
      upsert: true,
      new: true,
      setDefaultsOnInsert: true 
    }
  );
  
  // Update user subscription reference if needed
  if (!user.subscription || !user.subscription.equals(subscription._id)) {
    user.subscription = subscription._id;
    await user.save();
  }

  // Reset monthly usage if needed
  await subscription.resetMonthlyUsage();

  const subscriptionData = {
    plan: subscription.plan,
    status: subscription.status,
    isActive: subscription.isActive(),
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    billingCycle: subscription.billingCycle,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    usage: subscription.usage,
    features: FeatureAccess.getPlanFeatures(subscription.plan),
  };

  return res.status(200).json(
    new ApiResponse(200, subscriptionData, "Subscription status retrieved successfully")
  );
});

// Upgrade subscription
const upgradeSubscription = asyncHandler(async (req, res) => {
  const { plan, billingCycle = "monthly" } = req.body;
  const user = req.user;

  if (!plan || !["starter", "pro"].includes(plan)) {
    throw new ApiError(400, "Invalid plan. Must be 'starter' or 'pro'");
  }

  if (!["monthly", "yearly"].includes(billingCycle)) {
    throw new ApiError(400, "Invalid billing cycle. Must be 'monthly' or 'yearly'");
  }

  let subscription = await Subscription.findOne({ userId: user._id });
  
  if (!subscription) {
    // Create new subscription
    subscription = new Subscription({
      userId: user._id,
      plan,
      status: "active",
      billingCycle,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });
  } else {
    // Update existing subscription
    subscription.plan = plan;
    subscription.billingCycle = billingCycle;
    subscription.status = "active";
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    subscription.cancelAtPeriodEnd = false;
  }

  await subscription.save();
  
  // Update user subscription reference
  user.subscription = subscription._id;
  await user.save();

  const subscriptionData = {
    plan: subscription.plan,
    status: subscription.status,
    isActive: subscription.isActive(),
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    billingCycle: subscription.billingCycle,
    features: FeatureAccess.getPlanFeatures(subscription.plan),
  };

  return res.status(200).json(
    new ApiResponse(200, subscriptionData, "Subscription upgraded successfully")
  );
});

// Cancel subscription
const cancelSubscription = asyncHandler(async (req, res) => {
  const user = req.user;
  
  const subscription = await Subscription.findOne({ userId: user._id });
  
  if (!subscription) {
    throw new ApiError(404, "No subscription found");
  }

  subscription.cancelAtPeriodEnd = true;
  await subscription.save();

  return res.status(200).json(
    new ApiResponse(200, { cancelAtPeriodEnd: true }, "Subscription will be cancelled at the end of the current period")
  );
});

// Reactivate subscription
const reactivateSubscription = asyncHandler(async (req, res) => {
  const user = req.user;
  
  const subscription = await Subscription.findOne({ userId: user._id });
  
  if (!subscription) {
    throw new ApiError(404, "No subscription found");
  }

  subscription.cancelAtPeriodEnd = false;
  await subscription.save();

  return res.status(200).json(
    new ApiResponse(200, { cancelAtPeriodEnd: false }, "Subscription reactivated successfully")
  );
});

// Get feature usage
const getFeatureUsage = asyncHandler(async (req, res) => {
  const user = req.user;
  
  const subscription = await Subscription.findOne({ userId: user._id });
  
  if (!subscription) {
    throw new ApiError(404, "No subscription found");
  }

  // Reset monthly usage if needed
  await subscription.resetMonthlyUsage();

  const usageData = {};
  
  Object.keys(FEATURE_CONFIG.features).forEach(featureName => {
    const feature = FEATURE_CONFIG.features[featureName];
    const planLimit = feature.limits[subscription.plan];
    const currentUsage = subscription.usage[featureName]?.used || 0;
    
    usageData[featureName] = {
      name: feature.name,
      description: feature.description,
      used: currentUsage,
      limit: planLimit,
      remaining: planLimit === -1 ? -1 : Math.max(0, planLimit - currentUsage),
      canUse: FeatureAccess.canAccessFeature(subscription, featureName),
      needsUpgrade: FeatureAccess.needsUpgrade(subscription, featureName),
    };
  });

  return res.status(200).json(
    new ApiResponse(200, usageData, "Feature usage retrieved successfully")
  );
});

// Get upgrade suggestions for a specific feature
const getUpgradeSuggestions = asyncHandler(async (req, res) => {
  const { featureName } = req.params;
  
  if (!FEATURE_CONFIG.features[featureName]) {
    throw new ApiError(400, "Invalid feature name");
  }

  const suggestions = FeatureAccess.getUpgradeSuggestions(featureName);

  return res.status(200).json(
    new ApiResponse(200, suggestions, "Upgrade suggestions retrieved successfully")
  );
});

// Get all available plans
const getAvailablePlans = asyncHandler(async (req, res) => {
  const plans = Object.entries(FEATURE_CONFIG.plans).map(([planKey, plan]) => ({
    key: planKey,
    name: plan.name,
    price: plan.price,
    features: plan.features.map(featureName => ({
      name: featureName,
      ...FEATURE_CONFIG.features[featureName],
    })),
  }));

  return res.status(200).json(
    new ApiResponse(200, plans, "Available plans retrieved successfully")
  );
});

// Webhook handler for payment processing (placeholder)
const handlePaymentWebhook = asyncHandler(async (req, res) => {
  // This would integrate with your payment processor (InstaSend, etc.)
  // For now, it's a placeholder
  const { userId, plan, status, billingCycle } = req.body;

  if (!userId || !plan) {
    throw new ApiError(400, "Missing required fields");
  }

  let subscription = await Subscription.findOne({ userId });
  
  if (!subscription) {
    subscription = new Subscription({
      userId,
      plan,
      status: status || "active",
      billingCycle: billingCycle || "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  } else {
    subscription.plan = plan;
    subscription.status = status || "active";
    subscription.billingCycle = billingCycle || "monthly";
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    subscription.lastPaymentDate = new Date();
  }

  await subscription.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Payment webhook processed successfully")
  );
});

export {
  getSubscriptionStatus,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getFeatureUsage,
  getUpgradeSuggestions,
  getAvailablePlans,
  handlePaymentWebhook,
}; 