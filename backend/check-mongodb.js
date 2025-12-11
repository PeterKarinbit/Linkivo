import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Get the database instance
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('\n📂 Collections in database:');
    const collections = await db.listCollections().toArray();
    console.log(collections.map(c => `- ${c.name}`).join('\n'));
    
    // Check if our collections exist
    const documentEmbeddingsExists = collections.some(c => c.name === 'documentembeddings');
    const documentsExists = collections.some(c => c.name === 'documents');
    
    // Check indexes for documentembeddings
    if (documentEmbeddingsExists) {
      console.log('\n🔍 Checking indexes for documentembeddings:');
      const indexes = await db.collection('documentembeddings').indexes();
      console.log(JSON.stringify(indexes, null, 2));
    } else {
      console.log('\n⚠️ documentembeddings collection does not exist yet');
    }
    
    // Check indexes for documents
    if (documentsExists) {
      console.log('\n🔍 Checking indexes for documents:');
      const indexes = await db.collection('documents').indexes();
      console.log(JSON.stringify(indexes, null, 2));
    } else {
      console.log('\n⚠️ documents collection does not exist yet');
    }
    
    // Create necessary indexes if they don't exist
    console.log('\n🛠️  Setting up indexes...');
    
    // For documentembeddings collection
    if (!documentEmbeddingsExists) {
      console.log('Creating documentembeddings collection with indexes...');
      await db.createCollection('documentembeddings');
    }
    
    // For documents collection
    if (!documentsExists) {
      console.log('Creating documents collection with indexes...');
      await db.createCollection('documents');
    }
    
    // Create indexes for documentembeddings
    await db.collection('documentembeddings').createIndex({ userId: 1 });
    await db.collection('documentembeddings').createIndex({ documentId: 1 });
    
    // Create indexes for documents
    await db.collection('documents').createIndex({ userId: 1 });
    await db.collection('documents').createIndex({ documentType: 1 });
    await db.collection('documents').createIndex({ status: 1 });
    
    // Create text index for search
    await db.collection('documents').createIndex(
      { textContent: 'text' },
      { name: 'text_search_index' }
    );
    
    console.log('\n✅ All indexes have been created');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkMongoDB();
