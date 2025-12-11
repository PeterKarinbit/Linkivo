import { createClient } from 'redis';
import { promisify } from 'util';

// Cache TTLs in seconds
const TTL = {
  SHORT: 60 * 30,        // 30 minutes
  MEDIUM: 60 * 60 * 24,  // 1 day
  LONG: 60 * 60 * 24 * 7 // 1 week
};

// In-memory cache for development and fallback
const memoryCache = new Map();
let redisClient = null;
let isRedisConnected = false;

// Initialize Redis client
const initRedis = async () => {
  if (!process.env.REDIS_URL) return false;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('Max Redis reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 200, 2000); // Exponential backoff
        },
        connectTimeout: 10000, // 10 seconds
        keepAlive: 5000, // 5 seconds
      },
      // Disable unsupported commands for older Redis versions
      disableOfflineQueue: false,
      // Disable auto pipelining for better compatibility
      disableAutoPipelining: true,
      // Disable auto resubscribing for better compatibility
      disableAutoResubscribing: true,
      // Disable auto resending unfulfilled commands for better compatibility
      disableAutoCommandReplay: true,
      // Disable unsupported features
      disableReadyCheck: true,
      // Disable unsupported commands
      disableCommandQueue: true,
      // Disable unsupported features
      disableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isRedisConnected = true;
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('Redis connection failed, using in-memory cache only:', error.message);
    return false;
  }
};

// Initialize Redis on require
(async () => {
  await initRedis();
})();

// Promisify Redis methods
const redisGet = async (key) => {
  if (!isRedisConnected) return null;
  try {
    const getAsync = promisify(redisClient.get).bind(redisClient);
    const data = await getAsync(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Redis get failed:', error.message);
    return null;
  }
};

const redisSet = async (key, value, ttl = TTL.MEDIUM) => {
  if (!isRedisConnected) return false;
  try {
    const setAsync = promisify(redisClient.set).bind(redisClient);
    await setAsync(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    console.warn('Redis set failed:', error.message);
    return false;
  }
};

// Cache management
const cache = {
  /**
   * Get a cached value directly
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  get: async (key) => {
    if (isRedisConnected) {
      return await redisGet(key);
    }
    return memoryCache.get(key) || null;
  },

  /**
   * Set a cached value directly
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds
   */
  set: async (key, value, ttl = TTL.MEDIUM) => {
    if (isRedisConnected) {
      return await redisSet(key, value, ttl);
    }
    memoryCache.set(key, value);
    return true;
  },

  /**
   * Get a cached instance or create a new one
   * @param {string} key - Cache key
   * @param {Function} factory - Factory function to create the instance
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<any>} - Cached or new instance
   */
  getOrCreate: async (key, factory, ttl = TTL.MEDIUM) => {
    // Try Redis first
    if (isRedisConnected) {
      try {
        const cached = await redisGet(key);
        if (cached) {
          console.log(`[Cache] Using Redis cached instance for ${key}`);
          return cached;
        }
      } catch (error) {
        console.warn(`[Cache] Redis get failed for ${key}:`, error.message);
      }
    }

    // Fallback to in-memory cache in development
    if (process.env.NODE_ENV !== 'production' && memoryCache.has(key)) {
      console.log(`[Cache] Using in-memory cached instance for ${key}`);
      return memoryCache.get(key);
    }

    // Create new instance
    console.log(`[Cache] Creating new instance for ${key}`);
    const instance = await factory();

    // Cache the instance
    if (isRedisConnected) {
      await redisSet(key, instance, ttl);
    } else if (process.env.NODE_ENV !== 'production') {
      memoryCache.set(key, instance);
    }

    return instance;
  },

  /**
   * Invalidate cache for a specific key
   * @param {string} key - Cache key to invalidate
   */
  invalidate: async (key) => {
    if (isRedisConnected) {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.warn(`[Cache] Failed to invalidate ${key}:`, error.message);
      }
    }
    memoryCache.delete(key);
  },

  /**
   * Clear all caches (use with caution)
   */
  clearAll: async () => {
    if (isRedisConnected) {
      try {
        await redisClient.flushdb();
      } catch (error) {
        console.warn('[Cache] Failed to clear Redis cache:', error.message);
      }
    }
    memoryCache.clear();
  }
};

// Cache keys and configurations
export const CACHE_KEYS = {
  // AI Models
  AI_MODEL: 'ai:model',
  EMBEDDING_MODEL: 'ai:embedding:model',

  // Vector Database
  CHROMA_CLIENT: 'chroma:client',
  VECTOR_STORE: 'vector:store',

  // Market Data
  MARKET_TRENDS: 'market:trends',
  SKILL_DEMAND: 'market:skills:demand',
  JOB_MARKET_INSIGHTS: 'market:insights',

  // Common Resources
  RESUME_TEMPLATES: 'resources:resume:templates',
  COVER_LETTER_TEMPLATES: 'resources:coverletter:templates',
  INTERVIEW_QUESTIONS: 'resources:interview:questions',

  // Processed Data
  COMMON_EMBEDDINGS: 'data:embeddings:common',
  JOB_DESCRIPTIONS: 'data:jobs:descriptions',
  CAREER_PATHWAYS: 'data:career:pathways'
};

// TTL configurations for different cache types
export const CACHE_TTL = {
  // Short-lived caches (30 minutes)
  SESSION: TTL.SHORT,
  USER_PREFERENCES: TTL.SHORT,

  // Medium-term caches (1 day)
  AI_MODELS: TTL.MEDIUM,
  VECTOR_STORES: TTL.MEDIUM,

  // Long-term caches (1 week)
  MARKET_DATA: TTL.LONG,
  RESOURCES: TTL.LONG,

  // Special cases
  NEVER_EXPIRE: 0 // 0 = no expiration
};

export default cache;
