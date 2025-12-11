import Redis from 'ioredis';

let redisClient = null;
let isConnecting = false;
let connectionPromise = null;

// Simple in-memory fallback cache
const memoryCache = new Map();
let useMemoryCache = false;

const createRedisClient = () => {
  try {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const isProduction = process.env.NODE_ENV === 'production';
    const safeUrl = isProduction 
      ? url.replace(/:([^:]*?)@/, ':***@') 
      : url; // Show full URL in development
    
    console.log(`📡 Connecting to Redis at ${safeUrl}`);
    
    // Parse URL to extract components
    const parsedUrl = new URL(url);
    const client = new Redis({
      host: parsedUrl.hostname || '127.0.0.1',
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379,
      username: parsedUrl.username || undefined,
      password: parsedUrl.password || undefined,
      db: parsedUrl.pathname ? parseInt(parsedUrl.pathname.slice(1)) || 0 : 0,
      
      // Disable problematic features
      enableReadyCheck: false,
      enableAutoPipelining: false,
      autoResubscribe: false,
      autoResendUnfulfilledCommands: false,
      
      // Connection settings
      connectTimeout: 10000, // 10 seconds
      commandTimeout: 5000,  // 5 seconds
      maxRetriesPerRequest: 1,
      
      // Disable CLIENT SETINFO
      showFriendlyErrorStack: false,
      
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Max Redis reconnection attempts reached, using memory cache');
          useMemoryCache = true;
          return null;
        }
        const delay = Math.min(times * 100, 1000);
        console.warn(`♻️  Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      reconnectOnError: (err) => {
        const errorMessage = err?.message || 'Unknown error';
        // Ignore SETINFO errors
        if (errorMessage.includes('SETINFO')) {
          return false;
        }
        console.warn(`⚠️  Redis reconnecting after error: ${errorMessage}`);
        // Don't try to reconnect on invalid auth
        if (errorMessage.includes('WRONGPASS') || errorMessage.includes('NOAUTH')) {
          console.error('❌ Invalid Redis credentials. Please check your REDIS_URL');
          useMemoryCache = true;
          return false;
        }
        return true;
      }
    });

    // Override the internal _readyCheck method to prevent SETINFO
    const originalReadyCheck = client['_readyCheck'];
    client['_readyCheck'] = function(callback) {
      if (typeof callback === 'function') {
        callback(null, 'OK');
      }
      return true;
    };

    // Add event listeners
    client.on('connect', () => {
      console.log('✅ Redis connected');
      useMemoryCache = false;
    });

    client.on('error', (err) => {
      // Ignore SETINFO errors
      if (err?.message?.includes('SETINFO')) {
        return;
      }
      console.error('❌ Redis error:', err?.message || err);
      useMemoryCache = true;
    });

    client.on('end', () => {
      console.warn('🔴 Redis connection ended');
      useMemoryCache = true;
    });

    return client;
  } catch (error) {
    console.error('❌ Failed to create Redis client, using memory cache:', error.message);
    useMemoryCache = true;
    return {
      get: (key) => memoryCache.get(key),
      set: (key, value) => memoryCache.set(key, value)
    };
  }
    // Disable unsupported features
    enableOfflineQueue: true,
    //enableTLSForSentinelMode: false,
    // Disable auto-pipelining for better compatibility
    //enableOfflineQueue: true,
  

  // Add more detailed event listeners
  client.on('connect', () => console.log('🔌 Redis client connected'));
  client.on('ready', () => console.log('✅ Redis client ready'));
  client.on('error', (err) => {
    console.error('❌ Redis error:', err?.message || err);
    // Don't set isConnecting to false here to allow retries
  });
  client.on('end', () => {
    console.warn('🔴 Redis connection ended');
    isConnecting = false;
  });
  client.on('reconnecting', (ms) => 
    console.log(`🔄 Redis reconnecting in ${ms}ms`));
  client.on('warning', (warning) => 
    console.warn('⚠️  Redis warning:', warning));

  return client;
};

export const getRedisClient = () => {
  if (redisClient && redisClient.status === 'ready') return redisClient;
  
  // If we're already trying to connect, return the pending promise
  if (isConnecting && connectionPromise) {
    return connectionPromise.then(() => redisClient);
  }
  
  isConnecting = true;
  redisClient = createRedisClient();
  
  // Set up event listeners
  redisClient.on('connect', () => console.log('Redis client connected'));
  redisClient.on('ready', () => console.log('Redis client ready'));
  redisClient.on('error', (err) => {
    console.error('Redis error:', err?.message || err);
    // Don't set isConnecting to false here to allow retries
  });
  redisClient.on('end', () => {
    console.warn('Redis connection ended');
    isConnecting = false;
  });
  
  // Create a connection promise that resolves when connected
  connectionPromise = new Promise((resolve, reject) => {
    redisClient.once('ready', () => {
      isConnecting = false;
      resolve();
    });
    
    redisClient.once('error', (err) => {
      isConnecting = false;
      console.error('Failed to connect to Redis:', err?.message);
      reject(err);
    });
  });
  
  return redisClient;
};

export const ensureRedisConnected = async () => {
  try {
    const client = getRedisClient();
    if (client.status === 'ready') return true;
    
    console.log('Waiting for Redis connection...');
    await connectionPromise;
    
    // Test the connection with a ping
    await client.ping();
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    return false;
  }
};

/**
 * Get all keys matching a pattern
 * @param {string} pattern - Pattern to match keys against
 * @returns {Promise<string[]>} Array of matching keys
 */
export const keys = async (pattern) => {
  const client = getRedisClient();
  return client.keys(pattern);
};

/**
 * Delete keys matching a pattern
 * @param {string} pattern - Pattern to match keys against
 * @returns {Promise<number>} Number of keys deleted
 */
export const delPattern = async (pattern) => {
  const client = getRedisClient();
  const matchingKeys = await client.keys(pattern);
  if (matchingKeys.length === 0) return 0;
  return client.del(...matchingKeys);
};

export const setJson = async (key, value, ttlSeconds = null) => {
  try {
    const client = getRedisClient();
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await client.set(key, payload);
    }
    return true;
  } catch (_) {
    return false;
  }
};

export const getJson = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (_) {
    return null;
  }
};

// Simple distributed lock using SET NX PX and token verification on release
export const acquireLock = async (key, ttlMs = 15000) => {
  try {
    const client = getRedisClient();
    const token = Math.random().toString(36).slice(2);
    const ok = await client.set(key, token, 'PX', ttlMs, 'NX');
    if (ok !== 'OK') return null;
    return { key, token, ttlMs };
  } catch (_) {
    return null;
  }
};

export const releaseLock = async (lock) => {
  if (!lock) return false;
  try {
    const client = getRedisClient();
    const script = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
    const res = await client.eval(script, 1, lock.key, lock.token);
    return res === 1;
  } catch (_) {
    return false;
  }
};

export const withLock = async (key, ttlMs, fn) => {
  const lock = await acquireLock(key, ttlMs);
  if (!lock) return { locked: false, result: null };
  try {
    const result = await fn();
    return { locked: true, result };
  } finally {
    await releaseLock(lock);
  }
};


