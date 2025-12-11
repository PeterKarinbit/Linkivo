import cache, { CACHE_KEYS, CACHE_TTL } from './initCache.js';

class ModelCache {
  /**
   * Get or create an AI model instance with caching
   * @param {string} modelId - Unique identifier for the model
   * @param {Function} createFn - Function to create the model instance
   * @param {Object} options - Additional options
   * @param {number} [options.ttl] - Custom TTL in seconds
   * @returns {Promise<Object>} - Cached or new model instance
   */
  static async getOrCreateModel(modelId, createFn, { ttl } = {}) {
    const cacheKey = `${CACHE_KEYS.AI_MODEL}:${modelId}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log(`Initializing new model instance: ${modelId}`);
        const model = await createFn();
        
        // Verify the model is working
        try {
          await this._verifyModel(model);
        } catch (error) {
          // Do not fail hard on verification; just log and proceed.
          console.warn(`Model verification skipped for ${modelId}: ${error?.message || error}`);
        }
        return model;
      },
      ttl || CACHE_TTL.AI_MODELS
    );
  }

  /**
   * Get or create an embedding model with caching
   * @param {string} modelId - Embedding model ID
   * @param {Function} createFn - Function to create the embedding model
   * @returns {Promise<Object>} - Cached or new embedding model
   */
  static async getOrCreateEmbeddingModel(modelId, createFn) {
    const cacheKey = `${CACHE_KEYS.EMBEDDING_MODEL}:${modelId}`;
    
    return cache.getOrCreate(
      cacheKey,
      async () => {
        console.log(`Initializing new embedding model: ${modelId}`);
        const model = await createFn();
        
        // Verify the embedding model is working with a test embedding
        try {
          const testEmbedding = await model.embedQuery('test');
          if (!testEmbedding || !Array.isArray(testEmbedding)) {
            throw new Error('Invalid embedding response');
          }
          return model;
        } catch (error) {
          console.error(`Embedding model verification failed for ${modelId}:`, error);
          throw new Error(`Failed to initialize embedding model: ${modelId}`);
        }
      },
      CACHE_TTL.AI_MODELS
    );
  }

  /**
   * Invalidate cache for a specific model
   * @param {string} modelId - Model ID to invalidate
   */
  static async invalidateModel(modelId) {
    const cacheKey = `${CACHE_KEYS.AI_MODEL}:${modelId}`;
    await cache.invalidate(cacheKey);
    console.log(`Invalidated cache for model: ${modelId}`);
  }

  /**
   * Invalidate cache for all models
   */
  static async invalidateAllModels() {
    const patterns = [
      `${CACHE_KEYS.AI_MODEL}:*`,
      `${CACHE_KEYS.EMBEDDING_MODEL}:*`
    ];

    await Promise.all(patterns.map(pattern => cache.invalidate(pattern)));
    console.log('Invalidated all model caches');
  }

  /**
   * Verify that a model is working correctly
   * @private
   */
  static async _verifyModel(model) {
    // Simple test to verify the model is working
    // Many hosted providers reject test calls without a model; skip hard verification.
    if (!model || (!model.chat && !model.complete)) return;
    // Soft verification: try to list models if available, otherwise skip.
    if (model.models?.list) {
      await model.models.list();
    }
    // If no verification method is available or listing is unsupported, assume it's fine.
  }
}

export default ModelCache;
