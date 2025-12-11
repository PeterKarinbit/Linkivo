let redisClient;

// Try to import Redis but don't fail if it's not available
try {
  const { ensureRedisConnected } = await import("../utils/redis.js");
  redisClient = await ensureRedisConnected().catch(() => null);
} catch (err) {
  console.warn('Redis not available, using in-memory rate limiting');
  redisClient = null;
}

// In-memory rate limiting for when Redis is not available
const memoryStore = new Map();
const cleanupInterval = setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, { timestamp }] of memoryStore.entries()) {
    if (now - timestamp > 60) { // Clean up old entries
      memoryStore.delete(key);
    }
  }
}, 60000); // Run cleanup every minute

// Handle process termination
process.on('SIGTERM', () => clearInterval(cleanupInterval));
process.on('SIGINT', () => clearInterval(cleanupInterval));

export function createRateLimiter({ windowSeconds = 60, maxRequests = 120 } = {}) {
  return async function rateLimit(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";
    const key = `rl:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    
    try {
      if (redisClient) {
        // Redis-based rate limiting
        const pipeline = redisClient.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, windowSeconds);
        const results = await pipeline.exec();
        const current = results?.[0]?.[1] || 0;
        
        if (current > maxRequests) {
          res.setHeader("Retry-After", String(windowSeconds));
          return res.status(429).json({ success: false, message: "Too many requests" });
        }
      } else {
        // In-memory rate limiting
        const entry = memoryStore.get(key) || { count: 0, timestamp: now };
        
        if (now - entry.timestamp > windowSeconds) {
          // Reset counter if window has passed
          entry.count = 1;
          entry.timestamp = now;
        } else {
          entry.count += 1;
        }
        
        memoryStore.set(key, entry);
        
        if (entry.count > maxRequests) {
          res.setHeader("Retry-After", String(windowSeconds));
          return res.status(429).json({ success: false, message: "Too many requests" });
        }
      }
      
      return next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      // Fail open - allow the request to proceed if there's an error
      return next();
    }
  };
}


