// Feature Access Control Configuration
// This file defines which features are available at each subscription tier

export const FEATURE_CONFIG = {
  // Feature definitions with their limits per tier
  features: {
    resumeScoringCards: {
      name: "Resume Scoring Cards",
      description: "AI-powered resume analysis and scoring",
      limits: {
        free: 3,
        starter: 20,
        pro: -1, // Unlimited
      },
      requiresAuth: true,
    },
    jobRecommendations: {
      name: "Job Recommendations",
      description: "Personalized job recommendations",
      limits: {
        free: 10,
        starter: 50,
        pro: -1, // Unlimited
      },
      requiresAuth: true,
    },
    autonomousApplications: {
      name: "Autonomous Job Applications",
      description: "AI-powered automatic job applications",
      limits: {
        free: 0,
        starter: 25,
        pro: -1, // Unlimited
      },
      requiresAuth: true,
    },
    careerMemories: {
      name: "Career Memories",
      description: "LLM-synthesized memories from journals (vectorized)",
      limits: {
        free: 20,
        starter: 200,
        pro: -1,
      },
      requiresAuth: true,
    },
    advancedAnalytics: {
      name: "Advanced Analytics",
      description: "Detailed career analytics and insights",
      limits: {
        free: false,
        starter: true,
        pro: true,
      },
      requiresAuth: true,
    },
    referralProgram: {
      name: "Referral Program",
      description: "Access to referral program features",
      limits: {
        free: false,
        starter: "limited",
        pro: true,
      },
      requiresAuth: true,
    },
    resumeExport: {
      name: "Resume Export/Download",
      description: "Export and download resume in various formats",
      limits: {
        free: false,
        starter: false,
        pro: true,
      },
      requiresAuth: true,
    },
    earlyAccess: {
      name: "Early Access to New Features",
      description: "Early access to beta features",
      limits: {
        free: false,
        starter: false,
        pro: true,
      },
      requiresAuth: true,
    },
    prioritySupport: {
      name: "Priority Support",
      description: "Priority customer support",
      limits: {
        free: false,
        starter: false,
        pro: true,
      },
      requiresAuth: true,
    },
  },

  // Plan definitions
  plans: {
    free: {
      name: "Free",
      price: 0,
      features: [
        "resumeScoringCards",
        "jobRecommendations",
      ],
    },
    starter: {
      name: "Test/Starter",
      price: 9.99,
      features: [
        "resumeScoringCards",
        "jobRecommendations",
        "autonomousApplications",
        "advancedAnalytics",
        "referralProgram",
      ],
    },
    pro: {
      name: "Pro",
      price: 24.99,
      features: [
        "resumeScoringCards",
        "jobRecommendations",
        "autonomousApplications",
        "advancedAnalytics",
        "referralProgram",
        "resumeExport",
        "earlyAccess",
        "prioritySupport",
      ],
    },
  },
};

// Helper functions for feature access control
export const FeatureAccess = {
  // Check if a user can access a specific feature
  canAccessFeature: (subscription, featureName) => {
    if (!subscription || !subscription.isActive()) {
      return false;
    }

    const feature = FEATURE_CONFIG.features[featureName];
    if (!feature) {
      return false;
    }

    const planLimit = feature.limits[subscription.plan];
    
    // For boolean features (true/false)
    if (typeof planLimit === 'boolean') {
      return planLimit;
    }
    
    // For unlimited features
    if (planLimit === -1) {
      return true;
    }
    
    // For limited features, check usage
    if (typeof planLimit === 'number') {
      const currentUsage = subscription.usage[featureName]?.used || 0;
      return currentUsage < planLimit;
    }
    
    // For string-based limits (like "limited")
    if (typeof planLimit === 'string') {
      return planLimit !== 'false';
    }
    
    return false;
  },

  // Get remaining usage for a feature
  getRemainingUsage: (subscription, featureName) => {
    if (!subscription || !subscription.isActive()) {
      return 0;
    }

    const feature = FEATURE_CONFIG.features[featureName];
    if (!feature) {
      return 0;
    }

    const planLimit = feature.limits[subscription.plan];
    
    if (planLimit === -1) {
      return -1; // Unlimited
    }
    
    if (typeof planLimit === 'number') {
      const currentUsage = subscription.usage[featureName]?.used || 0;
      return Math.max(0, planLimit - currentUsage);
    }
    
    return 0;
  },

  // Get all available features for a plan
  getPlanFeatures: (planName) => {
    const plan = FEATURE_CONFIG.plans[planName];
    if (!plan) {
      return [];
    }
    
    return plan.features.map(featureName => ({
      name: featureName,
      ...FEATURE_CONFIG.features[featureName],
    }));
  },

  // Check if user needs to upgrade for a feature
  needsUpgrade: (subscription, featureName) => {
    if (!subscription) {
      return true;
    }

    const feature = FEATURE_CONFIG.features[featureName];
    if (!feature) {
      return false;
    }

    const currentPlanLimit = feature.limits[subscription.plan];
    
    // If current plan doesn't have the feature at all
    if (currentPlanLimit === false || currentPlanLimit === 0) {
      return true;
    }
    
    // If it's a limited feature and user has reached the limit
    if (typeof currentPlanLimit === 'number' && currentPlanLimit > 0) {
      const currentUsage = subscription.usage[featureName]?.used || 0;
      return currentUsage >= currentPlanLimit;
    }
    
    return false;
  },

  // Get upgrade suggestions for a feature
  getUpgradeSuggestions: (featureName) => {
    const suggestions = [];
    
    Object.entries(FEATURE_CONFIG.plans).forEach(([planName, plan]) => {
      const feature = FEATURE_CONFIG.features[featureName];
      if (feature && plan.features.includes(featureName)) {
        const limit = feature.limits[planName];
        if (limit === true || limit === -1 || (typeof limit === 'number' && limit > 0)) {
          suggestions.push({
            plan: planName,
            planName: plan.name,
            price: plan.price,
            limit: limit,
          });
        }
      }
    });
    
    return suggestions.sort((a, b) => a.price - b.price);
  },
};

export default FeatureAccess; 