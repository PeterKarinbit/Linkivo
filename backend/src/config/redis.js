import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initialized = false;
  }

  /**
   * Initialize the Redis client
   */
  async init() {
    if (this.initialized) return;
    
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not set, Redis caching will be disabled');
      this.initialized = true;
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.warn('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 200, 2000); // Exponential backoff
          }
        }
      });

      // Event handlers
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.initialized = true;
      
      // Test the connection
      await this.client.ping();
      console.log('Redis connection established successfully');
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      this.initialized = true;
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - The key to get
   * @returns {Promise<any>} - The value or null if not found
   */
  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Redis get failed for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key - The key to set
   * @param {any} value - The value to set
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - True if successful
   */
  async set(key, value, ttl = 0) {
    if (!this.isConnected) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.set(key, serialized, { EX: ttl });
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.warn(`Redis set failed for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} - True if successful
   */
  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn(`Redis delete failed for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Clear all keys matching a pattern
   * @param {string} pattern - The pattern to match
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clearByPattern(pattern) {
    if (!this.isConnected) return 0;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const pipeline = this.client.pipeline();
      keys.forEach(key => pipeline.del(key));
      await pipeline.exec();
      
      return keys.length;
    } catch (error) {
      console.warn(`Redis clear by pattern failed for ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Close the Redis connection
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
const redisClient = new RedisClient();

// Initialize on import
redisClient.init().catch(err => {
  console.error('Failed to initialize Redis client:', err);
});

// Handle process termination
process.on('SIGINT', async () => {
  await redisClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.close();
  process.exit(0);
});

export default redisClient;
