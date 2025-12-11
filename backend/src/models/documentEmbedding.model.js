import mongoose from 'mongoose';

const documentEmbeddingSchema = new mongoose.Schema({
  // Reference to the original document (if applicable)
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Type of document (e.g., 'resume', 'cv', 'portfolio')
  documentType: {
    type: String,
    required: true,
    index: true
  },
  
  // User who owns this document
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // The actual text content chunk
  text: {
    type: String,
    required: true
  },
  
  // Vector embedding of the text (stored as an array of numbers)
  embedding: {
    type: [Number],
    required: true
  },
  
  // Metadata for this chunk
  metadata: {
    chunkIndex: Number,       // Position of this chunk in the document
    chunkSize: Number,        // Size of this chunk in characters
    totalChunks: Number,      // Total number of chunks in the document
    source: String,          // Source file name or identifier
    pageNumber: Number,      // Page number (if from PDF)
    section: String,         // Document section (if applicable)
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a vector index for similarity search
documentEmbeddingSchema.index(
  { embedding: 'knnVector' },
  {
    knnVectorOptions: {
      dimensions: 1536,  // Dimension of the embedding vector (adjust based on your embedding model)
      similarity: 'cosine'  // Distance function (cosine, euclidean, dotProduct)
    }
  }
);

// Text index for full-text search
documentEmbeddingSchema.index({ text: 'text' });

// Create the model
const DocumentEmbedding = mongoose.model('DocumentEmbedding', documentEmbeddingSchema);

export default DocumentEmbedding;
