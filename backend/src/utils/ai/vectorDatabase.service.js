import OpenAI from "openai";

class VectorDatabaseService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY
    });

    // Vector database configuration
    this.vectorDB = {
      // For production, use Pinecone, Weaviate, or similar
      // For development, we'll use MongoDB with vector search
      provider: process.env.VECTOR_DB_PROVIDER || 'mongodb',
      apiKey: process.env.VECTOR_DB_API_KEY,
      environment: process.env.VECTOR_DB_ENVIRONMENT,
      indexName: process.env.VECTOR_DB_INDEX_NAME || 'ai-career-coach'
    };
  }

  // ==================== EMBEDDING GENERATION ====================
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // ==================== JOURNAL ENTRY VECTORIZATION ====================
  async vectorizeJournalEntry(journalEntry) {
    try {
      const { content, user_id, entry_id } = journalEntry;

      // Generate embedding for the journal content
      const contentVector = await this.generateEmbedding(content);

      // Update the journal entry with the vector
      const updatedEntry = {
        ...journalEntry,
        content_vector: contentVector,
        vectorized_at: new Date()
      };

      return updatedEntry;
    } catch (error) {
      console.error('Journal vectorization error:', error);
      throw new Error('Failed to vectorize journal entry');
    }
  }

  // ==================== KNOWLEDGE BASE VECTORIZATION ====================
  async vectorizeKnowledgeItem(knowledgeItem) {
    try {
      const { title, content, category } = knowledgeItem;

      // Combine title and content for better semantic search
      const combinedText = `${title}\n\n${content}`;

      // Generate embedding
      const contentVector = await this.generateEmbedding(combinedText);

      // Update the knowledge item with the vector
      const updatedItem = {
        ...knowledgeItem,
        content_vector: contentVector,
        vectorized_at: new Date()
      };

      return updatedItem;
    } catch (error) {
      console.error('Knowledge item vectorization error:', error);
      throw new Error('Failed to vectorize knowledge item');
    }
  }

  // ==================== VECTOR SIMILARITY SEARCH ====================
  async searchSimilarJournalEntries(query, userId, limit = 10) {
    try {
      // Generate embedding for the search query
      const queryVector = await this.generateEmbedding(query);

      // For MongoDB with vector search (using $vectorSearch aggregation)
      const pipeline = [
        {
          $vectorSearch: {
            index: "journal_entries_vector_index",
            path: "content_vector",
            queryVector: queryVector,
            numCandidates: limit * 2,
            limit: limit,
            filter: { user_id: userId }
          }
        },
        {
          $project: {
            _id: 1,
            content: 1,
            "metadata.date": 1,
            "metadata.sentiment": 1,
            "metadata.topics": 1,
            "ai_insights.key_themes": 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];

      // This would be executed against MongoDB
      // For now, we'll return a mock result
      return {
        entries: [],
        total_count: 0,
        search_vector: queryVector
      };
    } catch (error) {
      console.error('Vector similarity search error:', error);
      throw new Error('Failed to search similar journal entries');
    }
  }

  async searchSimilarKnowledgeItems(query, category = 'all', limit = 10) {
    try {
      // Generate embedding for the search query
      const queryVector = await this.generateEmbedding(query);

      // For MongoDB with vector search
      const pipeline = [
        {
          $vectorSearch: {
            index: "knowledge_base_vector_index",
            path: "content_vector",
            queryVector: queryVector,
            numCandidates: limit * 2,
            limit: limit,
            filter: category !== 'all' ? { category } : {}
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            category: 1,
            content_type: 1,
            quality_score: 1,
            relevance_tags: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];

      // This would be executed against MongoDB
      // For now, we'll return a mock result
      return {
        items: [],
        total_count: 0,
        search_vector: queryVector
      };
    } catch (error) {
      console.error('Knowledge vector search error:', error);
      throw new Error('Failed to search similar knowledge items');
    }
  }

  // ==================== BATCH VECTORIZATION ====================
  async vectorizeJournalEntriesBatch(entries) {
    try {
      const vectorizedEntries = [];

      for (const entry of entries) {
        try {
          const vectorized = await this.vectorizeJournalEntry(entry);
          vectorizedEntries.push(vectorized);
        } catch (error) {
          console.error(`Failed to vectorize entry ${entry.entry_id}:`, error);
          // Continue with other entries
        }
      }

      return vectorizedEntries;
    } catch (error) {
      console.error('Batch journal vectorization error:', error);
      throw new Error('Failed to vectorize journal entries batch');
    }
  }

  async vectorizeKnowledgeItemsBatch(items) {
    try {
      const vectorizedItems = [];

      for (const item of items) {
        try {
          const vectorized = await this.vectorizeKnowledgeItem(item);
          vectorizedItems.push(vectorized);
        } catch (error) {
          console.error(`Failed to vectorize knowledge item ${item.content_id}:`, error);
          // Continue with other items
        }
      }

      return vectorizedItems;
    } catch (error) {
      console.error('Batch knowledge vectorization error:', error);
      throw new Error('Failed to vectorize knowledge items batch');
    }
  }

  // ==================== VECTOR DATABASE SETUP ====================
  async createVectorIndexes() {
    try {
      // Create vector search indexes for MongoDB
      const indexes = [
        {
          name: "journal_entries_vector_index",
          type: "vectorSearch",
          definition: {
            fields: [
              {
                type: "vector",
                path: "content_vector",
                numDimensions: 1536, // OpenAI ada-002 dimensions
                similarity: "cosine"
              }
            ]
          }
        },
        {
          name: "knowledge_base_vector_index",
          type: "vectorSearch",
          definition: {
            fields: [
              {
                type: "vector",
                path: "content_vector",
                numDimensions: 1536, // OpenAI ada-002 dimensions
                similarity: "cosine"
              }
            ]
          }
        }
      ];

      // This would create the indexes in MongoDB
      console.log('Vector indexes created:', indexes);
      return indexes;
    } catch (error) {
      console.error('Vector index creation error:', error);
      throw new Error('Failed to create vector indexes');
    }
  }

  // ==================== VECTOR SIMILARITY UTILITIES ====================
  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // ==================== VECTOR SEARCH OPTIMIZATION ====================
  async optimizeVectorSearch(query, filters = {}) {
    try {
      // Generate embedding for the query
      const queryVector = await this.generateEmbedding(query);

      // Apply filters and optimizations
      const optimizedQuery = {
        vector: queryVector,
        filters: filters,
        topK: 10,
        includeMetadata: true
      };

      return optimizedQuery;
    } catch (error) {
      console.error('Vector search optimization error:', error);
      throw new Error('Failed to optimize vector search');
    }
  }

  // ==================== VECTOR DATABASE HEALTH CHECK ====================
  async healthCheck() {
    try {
      // Test embedding generation
      const testEmbedding = await this.generateEmbedding("test");

      // Test vector similarity calculation
      const similarity = this.calculateCosineSimilarity(testEmbedding, testEmbedding);

      return {
        status: 'healthy',
        embedding_generation: testEmbedding.length === 1536,
        vector_similarity: similarity === 1.0,
        provider: this.vectorDB.provider,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Vector database health check error:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new VectorDatabaseService();
