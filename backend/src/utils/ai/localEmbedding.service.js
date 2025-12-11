import { pipeline } from '@xenova/transformers';

// Initialize the embedding pipeline
let embeddingPipeline = null;

/**
 * Get embedding vector using a local model
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function getLocalEmbedding(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Initialize the pipeline if it doesn't exist
    if (!embeddingPipeline) {
      console.log('Loading local embedding model...');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2', // Small but effective model
        { quantized: true } // Use quantized version for better performance
      );
    }

    console.log('Generating embedding for text:', text.substring(0, 50) + '...');

    // Generate the embedding
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true
    });

    // Convert to regular array (from Tensor)
    const embedding = Array.from(output.data);

    console.log('Generated embedding with dimensions:', embedding.length);
    return embedding;

  } catch (error) {
    console.error('Error in getLocalEmbedding:', error);
    throw error;
  }
}

export default {
  getLocalEmbedding
};
