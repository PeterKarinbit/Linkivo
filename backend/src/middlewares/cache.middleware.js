import { getJson, setJson, delPattern } from '../utils/redisClient.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Cache middleware that caches successful GET requests
 * @param {Object} options - Cache options
 * @param {number} [options.ttl=3600] - Time to live in seconds
 * @param {string} [options.prefix='cache:'] - Cache key prefix
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (options = {}) => {
  const { ttl = 3600, prefix = 'cache:' } = options;
  
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();
    
    const key = `${prefix}${req.originalUrl || req.url}`;
    
    try {
      // Try to get cached data
      const cachedData = await getJson(key);
      if (cachedData) {
        console.log(`Cache hit for ${key}`);
        return res.status(200).json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Don't cache streaming responses or very large responses
          if (!res.getHeader('content-type')?.includes('text/event-stream') && 
              JSON.stringify(body).length < 10000) {
            setJson(key, body, ttl).catch(console.error);
          }
        }
        return originalJson.call(res, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache entries matching a pattern
 * @param {string} pattern - Pattern to match cache keys (default: 'cache:*')
 * @returns {Promise<number>} Number of keys deleted
 */
export const invalidateCache = async (pattern = 'cache:*') => {
  try {
    const count = await delPattern(pattern);
    console.log(`Invalidated ${count} cache entries for pattern: ${pattern}`);
    return count;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    throw error;
  }
};
