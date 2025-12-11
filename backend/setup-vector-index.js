import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupVectorIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the database instance
    const db = mongoose.connection.db;
    
    // Collection name
    const collectionName = 'documentembeddings';
    
    // Check if the collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length === 0) {
      console.log(`ℹ️ Collection '${collectionName}' does not exist. Creating it...`);
      await db.createCollection(collectionName);
    }
    
    // Drop existing vector index if it exists
    try {
      await db.command({
        dropIndexes: collectionName,
        index: 'vector_index'
      });
      console.log('ℹ️ Dropped existing vector index');
    } catch (e) {
      // Ignore if index doesn't exist
      if (e.codeName !== 'IndexNotFound') {
        throw e;
      }
    }
    
    // Create vector search index
    console.log('🔨 Creating vector search index...');
    const createIndexResult = await db.command({
      createIndexes: collectionName,
      indexes: [
        {
          name: 'vector_index',
          key: {
            'embedding': 'knnVector'
          },
          knnVector: {
            dimensions: 384,  // Match the dimensions of your embedding model
            similarity: 'cosine',  // Use cosine similarity for semantic search
            type: 'knnVector',
          }
        }
      ]
    });
    
    console.log('✅ Vector search index created successfully!');
    console.log('Index creation result:', JSON.stringify(createIndexResult, null, 2));
    
    // Create other useful indexes
    console.log('\n🔨 Creating supporting indexes...');
    await db.collection(collectionName).createIndex({ userId: 1 });
    await db.collection(collectionName).createIndex({ documentId: 1 });
    await db.collection(collectionName).createIndex({ documentType: 1 });
    
    console.log('✅ All indexes have been created');
    
    // Verify the indexes
    const indexes = await db.collection(collectionName).indexes();
    console.log('\n🔍 Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
  } catch (error) {
    console.error('❌ Error setting up vector index:', error);
    if (error.codeName === 'OperationNotSupportedInTransaction') {
      console.error('\n⚠️  This operation is not supported in a transaction.');
      console.error('Please run this script directly against your MongoDB instance, not through a transaction.');
    } else if (error.codeName === 'IndexOptionsConflict') {
      console.error('\n⚠️  There was a conflict with existing index options.');
      console.error('You may need to drop existing indexes first.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupVectorIndex();
