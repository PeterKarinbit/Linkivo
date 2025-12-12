import { createRateLimiter } from "./rateLimit.middleware.js";

/**
 * Upload-specific rate limiter
 * Limits: 10 uploads per hour per user
 */
export const uploadRateLimit = createRateLimiter({
  windowSeconds: 3600, // 1 hour
  maxRequests: 10 // 10 uploads per hour
});

/**
 * Analysis-specific rate limiter
 * Limits: 20 analysis requests per hour per user
 */
export const analysisRateLimit = createRateLimiter({
  windowSeconds: 3600, // 1 hour
  maxRequests: 20 // 20 analyses per hour
});

































