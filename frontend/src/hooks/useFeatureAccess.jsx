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
    return true; // Beta: Always allowed
  };

  // Helper function to get remaining usage for a feature
  const getFeatureRemaining = (featureName) => {
    return 9999; // Beta: Unlimited
  };

  // Helper function to check if user needs upgrade for a feature
  const needsUpgrade = (featureName) => {
    return false; // Beta: No upgrades needed
  };

  // Get feature usage data
  const getFeatureUsage = (featureName) => {
    return usage[featureName] || { used: 0, limit: -1 };
  };

  // Check if feature is unlimited
  const isFeatureUnlimited = (featureName) => {
    return true;
  };

  // Get upgrade message for a feature
  const getUpgradeMessage = (featureName) => {
    return null;
  };

  // Get usage display text
  const getUsageDisplay = (featureName) => {
    return "Unlimited (Beta)";
  };

  // Check if user has any active subscription
  const hasActiveSubscription = () => {
    return true; // Treat as active
  };

  // Get current plan name
  const getCurrentPlanName = () => {
    return "Beta Member";
  };

  // Check if user is on free plan
  const isFreePlan = () => {
    return false;
  };

  // Check if user is on pro plan
  const isProPlan = () => {
    return true; // Treat as Pro for Logic
  };

  // Check if user is on starter plan
  const isStarterPlan = () => {
    return false;
  };

  return {
    // State
    isLoading,
    currentPlan: 'beta', // Override
    isActiveSubscription: true,
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
  // Bypass backend selectors
  const canUse = true;
  const remaining = 9999;
  const needsUpgrade = false;
  const usage = useSelector((state) => selectUsage(state)[featureName]);

  useEffect(() => {
    dispatch(fetchFeatureUsage());
  }, [dispatch, featureName]);

  return {
    canUse,
    remaining,
    needsUpgrade,
    usage,
    isUnlimited: true,
    upgradeMessage: null,
    usageDisplay: "Unlimited (Beta)",
  };
}; 