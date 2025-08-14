import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  selectCanUseFeature,
  selectFeatureRemaining,
  selectNeedsUpgrade,
  selectCurrentPlan,
  selectIsActiveSubscription,
  selectUsage,
  selectIsLoading,
  fetchFeatureUsage,
  fetchSubscriptionStatus,
} from "../store/subscriptionSlice.js";

export const useFeatureAccess = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const currentPlan = useSelector(selectCurrentPlan);
  const isActiveSubscription = useSelector(selectIsActiveSubscription);
  const usage = useSelector(selectUsage);

  // Fetch subscription data on mount
  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
    dispatch(fetchFeatureUsage());
  }, [dispatch]);

  // Helper function to check if user can use a specific feature
  const canUseFeature = (featureName) => {
    return useSelector((state) => selectCanUseFeature(state, featureName));
  };

  // Helper function to get remaining usage for a feature
  const getFeatureRemaining = (featureName) => {
    return useSelector((state) => selectFeatureRemaining(state, featureName));
  };

  // Helper function to check if user needs upgrade for a feature
  const needsUpgrade = (featureName) => {
    return useSelector((state) => selectNeedsUpgrade(state, featureName));
  };

  // Get feature usage data
  const getFeatureUsage = (featureName) => {
    return usage[featureName] || null;
  };

  // Check if feature is unlimited
  const isFeatureUnlimited = (featureName) => {
    const featureUsage = getFeatureUsage(featureName);
    return featureUsage?.limit === -1;
  };

  // Get upgrade message for a feature
  const getUpgradeMessage = (featureName) => {
    const featureUsage = getFeatureUsage(featureName);
    if (!featureUsage) return null;

    if (featureUsage.needsUpgrade) {
      if (featureUsage.limit === 0) {
        return `Upgrade to access ${featureUsage.name}`;
      } else if (featureUsage.limit > 0) {
        return `You've used all ${featureUsage.limit} ${featureUsage.name}. Upgrade for more!`;
      }
    }
    return null;
  };

  // Get usage display text
  const getUsageDisplay = (featureName) => {
    const featureUsage = getFeatureUsage(featureName);
    if (!featureUsage) return null;

    if (featureUsage.limit === -1) {
      return "Unlimited";
    }

    return `${featureUsage.used}/${featureUsage.limit}`;
  };

  // Check if user has any active subscription
  const hasActiveSubscription = () => {
    return isActiveSubscription;
  };

  // Get current plan name
  const getCurrentPlanName = () => {
    const planNames = {
      free: "Free",
      starter: "Test/Starter",
      pro: "Pro",
    };
    return planNames[currentPlan] || "Free";
  };

  // Check if user is on free plan
  const isFreePlan = () => {
    return currentPlan === "free";
  };

  // Check if user is on pro plan
  const isProPlan = () => {
    return currentPlan === "pro";
  };

  // Check if user is on starter plan
  const isStarterPlan = () => {
    return currentPlan === "starter";
  };

  return {
    // State
    isLoading,
    currentPlan,
    isActiveSubscription,
    usage,
    
    // Feature access methods
    canUseFeature,
    getFeatureRemaining,
    needsUpgrade,
    getFeatureUsage,
    isFeatureUnlimited,
    getUpgradeMessage,
    getUsageDisplay,
    
    // Plan methods
    hasActiveSubscription,
    getCurrentPlanName,
    isFreePlan,
    isStarterPlan,
    isProPlan,
    
    // Actions
    refreshData: () => {
      dispatch(fetchSubscriptionStatus());
      dispatch(fetchFeatureUsage());
    },
  };
};

// Hook for checking a specific feature
export const useFeature = (featureName) => {
  const dispatch = useDispatch();
  const canUse = useSelector((state) => selectCanUseFeature(state, featureName));
  const remaining = useSelector((state) => selectFeatureRemaining(state, featureName));
  const needsUpgrade = useSelector((state) => selectNeedsUpgrade(state, featureName));
  const usage = useSelector((state) => selectUsage(state)[featureName]);

  useEffect(() => {
    dispatch(fetchFeatureUsage());
  }, [dispatch, featureName]);

  return {
    canUse,
    remaining,
    needsUpgrade,
    usage,
    isUnlimited: usage?.limit === -1,
    upgradeMessage: needsUpgrade ? `Upgrade to access ${usage?.name || featureName}` : null,
    usageDisplay: usage?.limit === -1 ? "Unlimited" : `${usage?.used || 0}/${usage?.limit || 0}`,
  };
}; 