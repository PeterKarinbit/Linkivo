import cache, { CACHE_KEYS, CACHE_TTL } from './initCache.js';

class MarketDataCache {
  /**
   * Get market trends with caching
   * @param {Function} fetchFn - Function to fetch fresh data if not in cache
   * @returns {Promise<Array>} - Market trends data
   */
  static async getMarketTrends(fetchFn) {
    return cache.getOrCreate(
      CACHE_KEYS.MARKET_TRENDS,
      async () => {
        console.log('Fetching fresh market trends data...');
        return await fetchFn();
      },
      CACHE_TTL.MARKET_DATA
    );
  }

  /**
   * Get skill demand data with caching
   * @param {Array<string>} skills - Array of skills to get demand for
   * @param {Function} fetchFn - Function to fetch fresh data if not in cache
   * @returns {Promise<Object>} - Skill demand data
   */
  static async getSkillDemand(skills, fetchFn) {
    const cacheKey = `${CACHE_KEYS.SKILL_DEMAND}:${skills.sort().join(',')}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log(`Fetching fresh skill demand data for ${skills.length} skills...`);
        return await fetchFn(skills);
      },
      CACHE_TTL.MARKET_DATA
    );
  }

  /**
   * Get job market insights with caching
   * @param {Object} filters - Filters for the insights
   * @param {Function} fetchFn - Function to fetch fresh data if not in cache
   * @returns {Promise<Array>} - Job market insights
   */
  static async getJobMarketInsights(filters, fetchFn) {
    const cacheKey = `${CACHE_KEYS.JOB_MARKET_INSIGHTS}:${JSON.stringify(filters)}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log('Fetching fresh job market insights...');
        return await fetchFn(filters);
      },
      CACHE_TTL.MARKET_DATA
    );
  }

  /**
   * Invalidate all market data caches
   */
  static async invalidateAll() {
    const patterns = [
      CACHE_KEYS.MARKET_TRENDS,
      `${CACHE_KEYS.SKILL_DEMAND}:*`,
      `${CACHE_KEYS.JOB_MARKET_INSIGHTS}:*`
    ];

    await Promise.all(patterns.map(pattern => cache.invalidate(pattern)));
    console.log('Invalidated all market data caches');
  }
}

export default MarketDataCache;
