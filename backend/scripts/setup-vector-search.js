import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupVectorSearch() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Create a collection for document embeddings if it doesn't exist
    const collectionName = 'documentembeddings';
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️ Creating collection:', collectionName);
      await db.createCollection(collectionName);
    }

    // Create vector search index
    console.log('🔨 Creating vector search index...');
    await db.command({
      createIndexes: collectionName,
      indexes: [
        {
          name: 'vector_index',
          key: { embedding: 'knnVector' },
          knnVector: {
            dimensions: 384,  // Match the dimensions of our local embedding model
            similarity: 'cosine',
            type: 'knnVector',
          },
        },
      ],
    });

    // Create other useful indexes
    await db.collection(collectionName).createIndex({ userId: 1 });
    await db.collection(collectionName).createIndex({ documentId: 1 });
    await db.collection(collectionName).createIndex({ documentType: 1 });
    
    console.log('✅ Successfully set up vector search!');
    console.log('\nNext steps:');
    console.log('1. Run the test-vector-store.js script to test the implementation');
    console.log('2. Check MongoDB Atlas to verify the index was created');
    
  } catch (error) {
    console.error('❌ Error setting up vector search:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

setupVectorSearch();
