# Feature Access Control System

This document describes the comprehensive feature access control system implemented for JobHunter, which manages user access to features based on their subscription tiers.

## Overview

The system provides:
- **Dynamic access control** based on subscription tiers (Free, Starter, Pro)
- **Usage tracking** for limited features
- **Automatic upgrade prompts** when users reach limits
- **Backend route protection** to prevent bypassing UI limitations
- **Scalable configuration** for easy feature and plan management

## Architecture

### Backend Components

#### 1. Subscription Model (`backend/src/models/subscription.model.js`)
- Tracks user subscription details
- Manages usage limits and billing cycles
- Provides methods for feature access checking

#### 2. Feature Access Configuration (`backend/src/utils/featureAccess.js`)
- Centralized configuration for all features and plans
- Defines limits per subscription tier
- Provides helper functions for access control

#### 3. Feature Access Middleware (`backend/src/middlewares/featureAccess.middleware.js`)
- `requireFeatureAccess(featureName)` - Checks if user can access a feature
- `trackFeatureUsage()` - Increments usage after successful operations
- `getSubscriptionStatus()` - Adds subscription info to requests

#### 4. Subscription Controller (`backend/src/controllers/subscription.controller.js`)
- Manages subscription upgrades/downgrades
- Handles usage tracking and billing
- Provides subscription status endpoints

### Frontend Components

#### 1. Redux Store (`frontend/src/store/subscriptionSlice.js`)
- Manages subscription state
- Handles API calls for subscription management
- Provides selectors for feature access

#### 2. Feature Access Hook (`frontend/src/hooks/useFeatureAccess.jsx`)
- `useFeatureAccess()` - Main hook for subscription management
- `useFeature(featureName)` - Hook for specific feature checking

#### 3. Feature Guard Components (`frontend/src/components/Common/FeatureGuard.jsx`)
- `FeatureGuard` - Conditionally renders content based on access
- `UsageLimit` - Shows usage information
- `FeatureButton` - Button that redirects to upgrade when needed

## Configuration

### Feature Definitions

Features are defined in `backend/src/utils/featureAccess.js`:

```javascript
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
  // ... more features
}
```

### Plan Definitions

Plans are also defined in the same file:

```javascript
plans: {
  free: {
    name: "Free",
    price: 0,
    features: ["resumeScoringCards", "jobRecommendations"],
  },
  starter: {
    name: "Test/Starter",
    price: 9.99,
    features: ["resumeScoringCards", "jobRecommendations", "autonomousApplications"],
  },
  pro: {
    name: "Pro",
    price: 24.99,
    features: ["resumeScoringCards", "jobRecommendations", "autonomousApplications", "resumeExport"],
  },
}
```

## Usage Examples

### Backend Route Protection

```javascript
import { requireFeatureAccess, trackFeatureUsage } from '../middlewares/featureAccess.middleware.js';

// Protect a route with feature access control
router.post('/analyze-resume', 
  verifyJWT,
  requireFeatureAccess('resumeScoringCards'),
  trackFeatureUsage(),
  upload.single('resume'), 
  async (req, res) => {
    // Route logic here
  }
);
```

### Frontend Feature Guarding

```jsx
import FeatureGuard from '../components/Common/FeatureGuard.jsx';
import { useFeature } from '../hooks/useFeatureAccess.jsx';

// Using FeatureGuard component
function ResumeAnalysis() {
  return (
    <FeatureGuard feature="resumeScoringCards">
      <ResumeAnalysisForm />
    </FeatureGuard>
  );
}

// Using useFeature hook
function ResumeAnalysis() {
  const { canUse, needsUpgrade, usage } = useFeature('resumeScoringCards');
  
  if (!canUse) {
    return <UpgradePrompt feature="resumeScoringCards" />;
  }
  
  return <ResumeAnalysisForm />;
}
```

### Usage Tracking Display

```jsx
import { UsageLimit } from '../components/Common/FeatureGuard.jsx';

function ResumeAnalysisForm() {
  return (
    <UsageLimit feature="resumeScoringCards">
      <form>
        {/* Form content */}
      </form>
    </UsageLimit>
  );
}
```

## API Endpoints

### Subscription Management

- `GET /api/v1/subscription/status` - Get user's subscription status
- `GET /api/v1/subscription/usage` - Get feature usage
- `POST /api/v1/subscription/upgrade` - Upgrade subscription
- `POST /api/v1/subscription/cancel` - Cancel subscription
- `POST /api/v1/subscription/reactivate` - Reactivate subscription
- `GET /api/v1/subscription/plans` - Get available plans
- `GET /api/v1/subscription/upgrade-suggestions/:featureName` - Get upgrade suggestions

### Error Responses

When a user tries to access a feature they don't have access to:

```json
{
  "success": false,
  "message": "Feature access denied",
  "data": {
    "feature": "resumeScoringCards",
    "needsUpgrade": true,
    "upgradeSuggestions": [
      {
        "plan": "starter",
        "planName": "Test/Starter",
        "price": 9.99,
        "limit": 20
      }
    ],
    "currentPlan": "free",
    "usage": {
      "used": 3,
      "limit": 3
    }
  }
}
```

## Adding New Features

### 1. Define the Feature

Add to `backend/src/utils/featureAccess.js`:

```javascript
features: {
  newFeature: {
    name: "New Feature",
    description: "Description of the new feature",
    limits: {
      free: false,
      starter: true,
      pro: -1, // Unlimited
    },
    requiresAuth: true,
  },
}
```

### 2. Add to Plans

Update the plans that should have access:

```javascript
plans: {
  starter: {
    features: [...existingFeatures, "newFeature"],
  },
  pro: {
    features: [...existingFeatures, "newFeature"],
  },
}
```

### 3. Protect Routes

Add middleware to your routes:

```javascript
router.post('/new-feature', 
  verifyJWT,
  requireFeatureAccess('newFeature'),
  trackFeatureUsage(),
  async (req, res) => {
    // Route logic
  }
);
```

### 4. Update Frontend

Use the feature in your components:

```jsx
<FeatureGuard feature="newFeature">
  <NewFeatureComponent />
</FeatureGuard>
```

## Subscription Lifecycle

### 1. User Registration
- New users automatically get a free subscription
- Usage tracking starts immediately

### 2. Usage Tracking
- Usage is tracked per feature per month
- Limits reset monthly
- Unlimited features are always available

### 3. Upgrade Process
- Users can upgrade at any time
- New limits take effect immediately
- Usage history is preserved

### 4. Downgrade/Cancellation
- Users can cancel anytime
- Access continues until period end
- Can reactivate before period ends

## Security Considerations

### Backend Protection
- All feature-protected routes require authentication
- Feature access is checked on every request
- Usage tracking prevents abuse

### Frontend Protection
- UI components are conditionally rendered
- Upgrade prompts guide users to paid plans
- Usage indicators show remaining limits

### Data Integrity
- Usage tracking is atomic
- Subscription status is cached but validated
- Payment webhooks update subscription status

## Monitoring and Analytics

### Usage Metrics
- Track feature usage per user
- Monitor upgrade conversion rates
- Analyze feature popularity

### Subscription Metrics
- Active subscription counts
- Churn rates
- Revenue tracking

## Troubleshooting

### Common Issues

1. **Feature not working after upgrade**
   - Check if subscription status was updated
   - Verify usage limits were reset
   - Clear frontend cache

2. **Usage not tracking**
   - Ensure `trackFeatureUsage()` middleware is applied
   - Check if route returns success status
   - Verify subscription exists for user

3. **Upgrade not working**
   - Check payment webhook integration
   - Verify plan configuration
   - Ensure user authentication

### Debug Mode

Enable debug logging by setting environment variable:
```
DEBUG_FEATURE_ACCESS=true
```

This will log all feature access checks and usage tracking.

## Future Enhancements

### Planned Features
- **Usage Analytics Dashboard** - Detailed usage reports
- **Custom Limits** - Per-user limit overrides
- **Feature Bundles** - Grouped feature packages
- **Trial Periods** - Temporary access to premium features
- **Usage Alerts** - Notifications when approaching limits

### Scalability Considerations
- **Redis Caching** - For subscription status
- **Background Jobs** - For usage tracking
- **Microservices** - Separate subscription service
- **API Rate Limiting** - Prevent abuse

## Support

For questions or issues with the feature access system:
1. Check this documentation
2. Review the code examples
3. Test with the provided debugging tools
4. Contact the development team 