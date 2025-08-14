import React from "react";
import { useFeature } from "../../hooks/useFeatureAccess.jsx";
import { Link } from "react-router-dom";

const FeatureGuard = ({
  feature,
  children,
  fallback = null,
  showUpgradePrompt = true,
  upgradeMessage = null,
  className = "",
}) => {
  const { canUse, needsUpgrade, upgradeMessage: defaultUpgradeMessage } = useFeature(feature);

  // If user can use the feature, render children
  if (canUse) {
    return <>{children}</>;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If upgrade prompt is disabled, render nothing
  if (!showUpgradePrompt) {
    return null;
  }

  // Show upgrade prompt
  const message = upgradeMessage || defaultUpgradeMessage || `Upgrade to access ${feature}`;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center ${className}`}>
      <div className="mb-4">
        <svg
          className="w-12 h-12 mx-auto text-blue-500 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {needsUpgrade ? "Upgrade Required" : "Feature Locked"}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {message}
      </p>
      
      <Link
        to="/upgrade"
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        Upgrade Now
      </Link>
    </div>
  );
};

// Usage Limit component for showing usage information
export const UsageLimit = ({ feature, children, className = "" }) => {
  const { usage, isUnlimited, usageDisplay, remaining } = useFeature(feature);

  if (!usage) return <>{children}</>;

  return (
    <div className={className}>
      {children}
      
      {/* Usage indicator */}
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {isUnlimited ? (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Unlimited usage
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {usageDisplay} remaining
          </span>
        )}
      </div>
      
      {/* Progress bar for limited features */}
      {!isUnlimited && usage.limit > 0 && (
        <div className="mt-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((usage.used / usage.limit) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Button component that shows upgrade prompt when needed
export const FeatureButton = ({
  feature,
  onClick,
  children,
  disabled = false,
  className = "",
  ...props
}) => {
  const { canUse, needsUpgrade } = useFeature(feature);

  const handleClick = (e) => {
    if (!canUse) {
      e.preventDefault();
      // Redirect to upgrade page
      window.location.href = "/upgrade";
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !canUse}
      className={`${className} ${
        !canUse
          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          : ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

export default FeatureGuard; 