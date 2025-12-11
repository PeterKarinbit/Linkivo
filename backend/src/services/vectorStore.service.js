import { getLocalEmbedding } from '../utils/ai/localEmbedding.service.js';
import DocumentEmbedding from '../models/documentEmbedding.model.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Cosine similarity function
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  return dotProduct / (normA * normB);
}

class VectorStoreService {
  constructor() {
    this.chunkSize = 1000; // characters per chunk
    this.chunkOverlap = 200; // characters overlap between chunks
    this.similarityThreshold = 0.7; // Minimum similarity score to include in results
  }

  /**
   * Split text into chunks with overlap
   */
  chunkText(text, chunkSize = this.chunkSize, overlap = this.chunkOverlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to end at a sentence boundary
      const lastPunctuation = Math.max(
        text.lastIndexOf('.', end),
        text.lastIndexOf('!', end),
        text.lastIndexOf('?', end),
        text.lastIndexOf('\n', end)
      );
      
      if (lastPunctuation > start + chunkSize * 0.5) {
        end = lastPunctuation + 1;
      }
      
      chunks.push({
        text: text.substring(start, end).trim(),
        start,
        end
      });
      
      start = end - overlap;
      if (start >= text.length - overlap) break;
    }
    
    return chunks;
  }

  /**
   * Process a document: chunk text and create embeddings
   */
  async processDocument({ documentId, userId, documentType, text, metadata = {} }) {
    try {
      // Split text into chunks
      const chunks = this.chunkText(text);
      
      // Process each chunk
      const embeddings = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Get embedding for this chunk
          const embedding = await getLocalEmbedding(chunk.text);
          
          // Prepare chunk metadata
          const chunkMetadata = {
            ...metadata, // Preserve original metadata
            chunkIndex: i,
            chunkSize: chunk.text.length,
            totalChunks: chunks.length,
            // Ensure we have title and type from metadata or use defaults
            title: metadata?.title || `Document ${documentId.toString().substring(0, 6)}`,
            type: documentType || 'document',
            source: metadata?.source || 'unknown',
            timestamp: metadata?.timestamp || new Date()
          };
          
          // Create document embedding record
          const docEmbedding = new DocumentEmbedding({
            documentId: new mongoose.Types.ObjectId(documentId),
            userId: new mongoose.Types.ObjectId(userId),
            documentType,
            text: chunk.text,
            embedding,
            metadata: chunkMetadata
          });
          
          await docEmbedding.save();
          embeddings.push(docEmbedding);
          
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error.message);
          // Continue with next chunk even if one fails
          continue;
        }
      }
      
      return {
        success: true,
        chunksProcessed: embeddings.length,
        totalChunks: chunks.length
      };
      
    } catch (error) {
      console.error('Error in processDocument:', error);
      throw error;
    }
  }

  /**
   * Enhanced vector similarity search with better result processing
   */
  async vectorSearch(query, { userId, documentType, limit = 5, minScore = 0.3 } = {}) {
    try {
      console.log(`🔍 Performing vector search for: "${query}"`);
      
      // Get embedding for the query
      const queryEmbedding = await getLocalEmbedding(query);
      
      // Build the query with proper type conversion for userId
      const queryConditions = {};
      if (userId) {
        queryConditions.userId = mongoose.Types.ObjectId.isValid(userId) 
          ? new mongoose.Types.ObjectId(userId) 
          : userId;
      }
      if (documentType) queryConditions.documentType = documentType;
      
      console.log('🔍 Search conditions:', {
        userId: userId ? 'provided' : 'not provided',
        documentType: documentType || 'any',
        limit,
        minScore
      });
      
      // Get all relevant documents (with pagination for large collections)
      const allDocuments = await DocumentEmbedding.find(queryConditions)
        .limit(200) // Increased limit for better recall
        .lean();
      
      console.log(`📊 Found ${allDocuments.length} documents to analyze`);
      
      if (allDocuments.length === 0) {
        console.log('ℹ️ No documents found matching the criteria');
        return [];
      }
      
      // Calculate similarity scores and process results
      const results = allDocuments
        .map(doc => {
          // Ensure we have a valid embedding
          if (!doc.embedding || !Array.isArray(doc.embedding) || doc.embedding.length === 0) {
            console.warn(`⚠️ Document ${doc._id} has no valid embedding`);
            return null;
          }
          
          const score = cosineSimilarity(queryEmbedding, doc.embedding);
          
          // Ensure metadata exists and has required fields
          const metadata = {
            title: doc.metadata?.title || 'Untitled Document',
            type: doc.documentType || doc.metadata?.type || 'document',
            source: doc.metadata?.source || 'unknown',
            ...doc.metadata,
            // Remove the embedding to reduce response size
            embedding: undefined
          };
          
          return {
            id: doc._id,
            documentId: doc.documentId,
            text: doc.text || '',
            metadata,
            score: parseFloat(score.toFixed(4)) // Round to 4 decimal places
          };
        })
        .filter(doc => doc !== null && doc.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      console.log(`✅ Found ${results.length} relevant results (score >= ${minScore})`);
      return results;
      
    } catch (error) {
      console.error('Error in vectorSearch:', error);
      throw error;
    }
  }

  /**
   * Delete all embeddings for a document
   */
  async deleteDocumentEmbeddings(documentId) {
    try {
      await DocumentEmbedding.deleteMany({ documentId });
      return { success: true };
    } catch (error) {
      console.error('Error deleting document embeddings:', error);
      throw error;
    }
  }

  /**
   * Hybrid search: combine vector search with text search
   */
  async hybridSearch(query, options = {}) {
    try {
      // Perform vector search
      const vectorResults = await this.vectorSearch(query, options);
      
      // If we have text index, we could also perform text search here
      // and combine the results
      
      // For now, just return vector results
      return vectorResults;
      
    } catch (error) {
      console.error('Error in hybridSearch:', error);
      throw error;
    }
  }
}

export default new VectorStoreService();
