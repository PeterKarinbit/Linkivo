import cache, { CACHE_KEYS, CACHE_TTL } from './initCache.js';

class ResourceCache {
  /**
   * Get resume templates with caching
   * @param {Function} fetchFn - Function to fetch fresh templates if not in cache
   * @returns {Promise<Array>} - Resume templates
   */
  static async getResumeTemplates(fetchFn) {
    return cache.getOrCreate(
      CACHE_KEYS.RESUME_TEMPLATES,
      async () => {
        console.log('Fetching fresh resume templates...');
        return await fetchFn();
      },
      CACHE_TTL.RESOURCES
    );
  }

  /**
   * Get cover letter templates with caching
   * @param {Function} fetchFn - Function to fetch fresh templates if not in cache
   * @returns {Promise<Array>} - Cover letter templates
   */
  static async getCoverLetterTemplates(fetchFn) {
    return cache.getOrCreate(
      CACHE_KEYS.COVER_LETTER_TEMPLATES,
      async () => {
        console.log('Fetching fresh cover letter templates...');
        return await fetchFn();
      },
      CACHE_TTL.RESOURCES
    );
  }

  /**
   * Get interview questions with caching
   * @param {string} role - Job role to get questions for
   * @param {Function} fetchFn - Function to fetch fresh questions if not in cache
   * @returns {Promise<Array>} - Interview questions
   */
  static async getInterviewQuestions(role, fetchFn) {
    const cacheKey = `${CACHE_KEYS.INTERVIEW_QUESTIONS}:${role.toLowerCase()}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log(`Fetching fresh interview questions for ${role}...`);
        return await fetchFn(role);
      },
      CACHE_TTL.RESOURCES
    );
  }

  /**
   * Get common embeddings with caching
   * @param {string} text - Text to get embeddings for
   * @param {Function} fetchFn - Function to compute embeddings if not in cache
   * @returns {Promise<Array>} - Embeddings
   */
  static async getCommonEmbeddings(text, fetchFn) {
    const cacheKey = `${CACHE_KEYS.COMMON_EMBEDDINGS}:${text.substring(0, 50)}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log('Computing fresh embeddings...');
        return await fetchFn(text);
      },
      CACHE_TTL.NEVER_EXPIRE // Embeddings are deterministic, so we can cache them forever
    );
  }

  /**
   * Invalidate all resource caches
   */
  static async invalidateAll() {
    const patterns = [
      CACHE_KEYS.RESUME_TEMPLATES,
      CACHE_KEYS.COVER_LETTER_TEMPLATES,
      `${CACHE_KEYS.INTERVIEW_QUESTIONS}:*`,
      `${CACHE_KEYS.COMMON_EMBEDDINGS}:*`
    ];

    await Promise.all(patterns.map(pattern => cache.invalidate(pattern)));
    console.log('Invalidated all resource caches');
  }
}

export default ResourceCache;
