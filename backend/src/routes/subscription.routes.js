import { Router } from "express";
import {
  getSubscriptionStatus,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getFeatureUsage,
  getUpgradeSuggestions,
  getAvailablePlans,
  handlePaymentWebhook,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireFeatureAccess } from "../middlewares/featureAccess.middleware.js";

const router = Router();

// All subscription routes require authentication
router.use(verifyJWT);

// Get user's subscription status
router.get("/status", getSubscriptionStatus);

// Get feature usage
router.get("/usage", getFeatureUsage);

// Get available plans
router.get("/plans", getAvailablePlans);

// Upgrade subscription
router.post("/upgrade", upgradeSubscription);

// Cancel subscription
router.post("/cancel", cancelSubscription);

// Reactivate subscription
router.post("/reactivate", reactivateSubscription);

// Get upgrade suggestions for a specific feature
router.get("/upgrade-suggestions/:featureName", getUpgradeSuggestions);

// Payment webhook (no auth required for webhooks)
router.post("/webhook", handlePaymentWebhook);

export default router; 