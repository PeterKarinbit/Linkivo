import { getLocalEmbedding } from './localEmbedding.service.js';

// Lazy load OpenAI client only if needed
let openaiClient = null;

async function getOpenAIClient() {
  if (!openaiClient) {
    const OpenAI = (await import('openai')).default;
    let apiKey = process.env.NOVITA_API_KEY;
    let baseURL = process.env.NOVITA_API_URL || 'https://api.novita.ai/openai';
    let siteUrl = process.env.NOVITA_SITE_URL || 'http://localhost:3000';
    let appName = process.env.NOVITA_APP_NAME || 'JobHunter';

    // Fallback to OpenRouter if Novita is missing
    if (!apiKey && process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      siteUrl = process.env.OPENROUTER_SITE_URL || siteUrl;
      appName = process.env.OPENROUTER_APP_NAME || appName;
    }
    // Fallback to OpenAI
    else if (!apiKey && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
      baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    }

    if (!apiKey) {
      console.warn('[EMBEDDING] No API key found (checked OpenRouter, Novita, OpenAI). Will use local embeddings only.');
      return null;
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      defaultHeaders: {
        'HTTP-Referer': siteUrl,
        'X-Title': appName
      }
    });

    console.log('[DEBUG] OpenAI Client Encapsulated Config:');
    console.log(`- BaseURL: ${baseURL}`);
    // Safe logging of key
    const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : 'none';
    console.log(`- API Key Prefix: ${keyPreview}`);
  }
  return openaiClient;
}

/**
 * Get embedding vector for a given text
 * Uses local Xenova transformers by default (free, no API needed)
 * Falls back to API if local fails and API key is available
 * @param {string} text - The text to embed
 * @param {Object} options - Options for embedding
 * @param {boolean} options.forceAPI - Force API usage even if local is available
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const { forceAPI = false, preferLocal = false } = options;

  // check if we have API access
  const client = await getOpenAIClient();
  const hasAPI = !!client;

  // Decision logic:
  // 1. If forceAPI is true, use API (error if missing)
  // 2. If preferLocal is true, try local first
  // 3. If !hasAPI, must use local
  // 4. Default: Use API if available (to match 1536 dim index), else local

  let useLocalFirst = preferLocal || !hasAPI;

  if (forceAPI) {
    useLocalFirst = false;
    if (!hasAPI) {
      throw new Error('Embedding generation failed: API forced but no API key configured.');
    }
  }

  if (useLocalFirst) {
    try {
      console.log('[EMBEDDING] Using local Xenova transformers for:', text.substring(0, 50) + '...');
      const embedding = await getLocalEmbedding(text);
      console.log('[EMBEDDING] Local embedding generated successfully, dimensions:', embedding.length);
      return embedding;
    } catch (localError) {
      console.warn('[EMBEDDING] Local embedding failed:', localError.message);
      if (!hasAPI) throw localError; // No fallback possible
      console.log('[EMBEDDING] Falling back to API...');
    }
  }

  // If we are here, we either want API first, or local failed and we have API
  try {
    console.log('[EMBEDDING] Using API for:', text.substring(0, 50) + '...');

    // Try different embedding models based on available API
    const models = [
      'text-embedding-3-small', // OpenAI
      'text-embedding-ada-002', // OpenAI
      'BAAI/bge-small-en-v1.5', // OpenRouter
      'sentence-transformers/all-MiniLM-L6-v2', // OpenRouter
    ];

    let lastError = null;
    for (const model of models) {
      try {
        const response = await client.embeddings.create({
          model: model,
          input: text,
          encoding_format: 'float'
        });

        console.log(`[EMBEDDING] API embedding generated successfully using ${model}, dimensions:`, response.data[0].embedding.length);
        return response.data[0].embedding;
      } catch (modelError) {
        console.warn(`[EMBEDDING] Model ${model} failed:`, modelError.message);
        lastError = modelError;
        continue;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All embedding models failed');
  } catch (apiError) {
    console.error('[EMBEDDING] API embedding failed:', apiError.message);

    // Last resort: try local if we haven't already
    if (!useLocalFirst) {
      try {
        console.log('[EMBEDDING] Retrying with local embeddings after API failure...');
        return await getLocalEmbedding(text);
      } catch (finalError) {
        throw new Error(`Embedding generation failed completely. API: ${apiError.message}, Local: ${finalError.message}`);
      }
    }
    throw apiError;
  }
}