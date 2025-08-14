import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureAccess } from "../../hooks/useFeatureAccess.jsx";
import {
  fetchSubscriptionStatus,
  fetchFeatureUsage,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  selectSubscription,
  selectIsLoading,
  selectError,
} from "../../store/subscriptionSlice.js";
import { Link } from "react-router-dom";

const SubscriptionDashboard = () => {
  const dispatch = useDispatch();
  const subscription = useSelector(selectSubscription);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const { getCurrentPlanName, getUsageDisplay, isFreePlan, isStarterPlan, isProPlan } = useFeatureAccess();

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
    dispatch(fetchFeatureUsage());
  }, [dispatch]);

  const handleUpgrade = async (plan) => {
    try {
      await dispatch(upgradeSubscription({ plan, billingCycle: "monthly" })).unwrap();
      // Refresh data after upgrade
      dispatch(fetchSubscriptionStatus());
      dispatch(fetchFeatureUsage());
    } catch (error) {
      console.error("Upgrade failed:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await dispatch(cancelSubscription()).unwrap();
      dispatch(fetchSubscriptionStatus());
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  const handleReactivate = async () => {
    try {
      await dispatch(reactivateSubscription()).unwrap();
      dispatch(fetchSubscriptionStatus());
    } catch (error) {
      console.error("Reactivate failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading subscription: {error}</p>
      </div>
    );
  }

  const planNames = {
    free: "Free",
    starter: "Test/Starter",
    pro: "Pro",
  };

  const planColors = {
    free: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    starter: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    pro: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  };

  const features = [
    { name: "resumeScoringCards", label: "Resume Scoring Cards" },
    { name: "jobRecommendations", label: "Job Recommendations" },
    { name: "autonomousApplications", label: "Autonomous Applications" },
    { name: "advancedAnalytics", label: "Advanced Analytics" },
    { name: "referralProgram", label: "Referral Program" },
    { name: "resumeExport", label: "Resume Export" },
    { name: "earlyAccess", label: "Early Access" },
    { name: "prioritySupport", label: "Priority Support" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Subscription & Usage
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your plan and track feature usage
            </p>
          </div>
          <Link
            to="/upgrade"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            Manage Plan
          </Link>
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${planColors[subscription?.plan || "free"]}`}>
                {getCurrentPlanName()}
              </span>
              {subscription?.cancelAtPeriodEnd && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                  Cancelling
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {subscription?.isActive ? "Active" : "Inactive"} subscription
            </p>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="text-right">
            {subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivate}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Reactivate
              </button>
            ) : !isFreePlan() && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Feature Usage
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const usage = subscription?.usage?.[feature.name];
            const canUse = usage?.canUse;
            const needsUpgrade = usage?.needsUpgrade;
            
            return (
              <div
                key={feature.name}
                className={`p-4 rounded-lg border ${
                  canUse
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : needsUpgrade
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {feature.label}
                  </h4>
                  <div className="flex items-center gap-2">
                    {canUse && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {needsUpgrade && (
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {usage?.limit === -1 ? (
                    <span className="text-green-600 dark:text-green-400">Unlimited</span>
                  ) : (
                    <span>
                      {usage?.used || 0} / {usage?.limit || 0} used
                    </span>
                  )}
                </div>
                
                {needsUpgrade && (
                  <Link
                    to="/upgrade"
                    className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Upgrade to access
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Options */}
      {isFreePlan() && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upgrade Your Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Test/Starter</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                <li>• 20 resume scoring cards</li>
                <li>• 50 job recommendations</li>
                <li>• 25 autonomous applications</li>
                <li>• Basic analytics</li>
              </ul>
              <button
                onClick={() => handleUpgrade("starter")}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Upgrade to Starter
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-green-500">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Best Value
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pro</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$24.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                <li>• Unlimited everything</li>
                <li>• Advanced analytics</li>
                <li>• Resume export</li>
                <li>• Priority support</li>
              </ul>
              <button
                onClick={() => handleUpgrade("pro")}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard; 