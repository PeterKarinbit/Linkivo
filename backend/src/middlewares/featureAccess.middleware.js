import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { FeatureAccess } from "../utils/featureAccess.js";

// Temporarily bypassing subscription checks for development
// TODO: Re-enable subscription checks before production

export function requireFeature(featureName) {
  return async function(req, res, next) {
    try {
      const userId = req.user?._id;
      if (!userId) throw new ApiError(401, "Unauthorized");

      // Bypass subscription checks - temporarily allowing all features
      console.warn('Subscription checks are currently disabled for development');
      
      // Still try to get or create subscription for tracking
      let sub = await Subscription.findOne({ userId });
      if (!sub) {
        sub = await Subscription.create({
          userId,
          plan: "pro",  // Default to pro features
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        });
      }
      
      req.subscription = sub;
      next();
    } catch (err) {
      console.error('Error in requireFeature middleware:', err);
      // Allow access even if subscription creation fails
      next();
    }
  };
}


// Middleware to check if user can access a specific feature
export const requireFeatureAccess = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    try {
      console.warn('Feature access checks are currently disabled for development - allowing access to:', featureName);
      const user = req.user;
      if (!user) {
        throw new ApiError(401, "Authentication required");
      }

      // Get or create subscription for user
      let subscription = await Subscription.findOne({ userId: user._id });
      
      if (!subscription) {
        // Create default free subscription for new users
        subscription = await Subscription.create({
          userId: user._id,
          plan: "free",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });
        
        // Update user with subscription reference
        user.subscription = subscription._id;
        await user.save();
      }

      // Reset monthly usage if needed
      await subscription.resetMonthlyUsage();

      // Check if user can access the feature
      const canAccess = FeatureAccess.canAccessFeature(subscription, featureName);
      
      if (!canAccess) {
        const needsUpgrade = FeatureAccess.needsUpgrade(subscription, featureName);
        const upgradeSuggestions = FeatureAccess.getUpgradeSuggestions(featureName);
        
        throw new ApiError(403, "Feature access denied", {
          feature: featureName,
          needsUpgrade,
          upgradeSuggestions,
          currentPlan: subscription.plan,
          usage: subscription.usage[featureName] || { used: 0, limit: 0 },
        });
      }

      // Add subscription info to request for later use
      req.subscription = subscription;
      req.featureName = featureName;
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Error checking feature access");
    }
  });
};

// Middleware to track feature usage after successful operation
export const trackFeatureUsage = () => {
  return asyncHandler(async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only track usage if the response was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const subscription = req.subscription;
        const featureName = req.featureName;
        
        if (subscription && featureName) {
          // Increment usage asynchronously (don't wait for it)
          subscription.incrementUsage(featureName).catch(err => {
            console.error('Error tracking feature usage:', err);
          });
        }
      }
      
      originalSend.call(this, data);
    };
    
    next();
  });
};

// Middleware to get user's subscription status
export const getSubscriptionStatus = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      req.subscriptionStatus = null;
      return next();
    }

    let subscription = await Subscription.findOne({ userId: user._id });
    
    if (!subscription) {
      // Create default free subscription
      subscription = await Subscription.create({
        userId: user._id,
        plan: "free",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      
      user.subscription = subscription._id;
      await user.save();
    }

    // Reset monthly usage if needed
    await subscription.resetMonthlyUsage();

    // Add subscription status to request
    req.subscriptionStatus = {
      plan: subscription.plan,
      status: subscription.status,
      isActive: subscription.isActive(),
      currentPeriodEnd: subscription.currentPeriodEnd,
      usage: subscription.usage,
      billingCycle: subscription.billingCycle,
    };

    next();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    req.subscriptionStatus = null;
    next();
  }
});

// Middleware to check if user has any active subscription
export const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  const subscription = await Subscription.findOne({ userId: user._id });
  
  if (!subscription || !subscription.isActive()) {
    throw new ApiError(403, "Active subscription required");
  }

  req.subscription = subscription;
  next();
});

// Helper function to get feature limits for a plan
export const getFeatureLimits = (planName) => {
  return FeatureAccess.getPlanFeatures(planName);
};

// Helper function to check if user needs upgrade for a feature
export const checkUpgradeNeeded = (subscription, featureName) => {
  return FeatureAccess.needsUpgrade(subscription, featureName);
}; 