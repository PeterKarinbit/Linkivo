import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

class VectorDBSetup {
  constructor() {
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || "http://localhost:8000"
    });
    
    this.collections = {
      userProfiles: 'user_career_profiles',
      journalEntries: 'journal_entries',
      knowledgeBase: 'knowledge_base',
      marketData: 'market_intelligence',
      recommendations: 'ai_recommendations'
    };
  }

  async setup() {
    try {
      console.log('🚀 Starting Vector Database Setup...');
      
      // Test ChromaDB connection
      await this.testConnection();
      
      // Create collections
      await this.createCollections();
      
      // Create indexes
      await this.createIndexes();
      
      // Initialize with sample data (disabled for production)
      // await this.initializeSampleData();
      
      console.log('✅ Vector Database Setup Completed Successfully!');
      
    } catch (error) {
      console.error('❌ Vector Database Setup Failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔍 Testing ChromaDB connection...');
      
      // Try to get server version
      const heartbeat = await this.chromaClient.heartbeat();
      console.log('✅ ChromaDB connection successful');
      console.log(`📊 ChromaDB version: ${heartbeat.nanosecond_heartbeat}`);
      
    } catch (error) {
      console.error('❌ ChromaDB connection failed:', error);
      console.log('💡 Make sure ChromaDB is running on http://localhost:8000');
      console.log('💡 Start ChromaDB with: docker run -p 8000:8000 chromadb/chroma');
      throw error;
    }
  }

  async createCollections() {
    console.log('📚 Creating collections...');
    
    for (const [key, collectionName] of Object.entries(this.collections)) {
      try {
        // Check if collection exists
        try {
          await this.chromaClient.getCollection({ name: collectionName });
          console.log(`✅ Collection ${collectionName} already exists`);
        } catch (error) {
          // Collection doesn't exist, create it
          await this.chromaClient.createCollection({
            name: collectionName,
            metadata: { 
              description: `AI Career Coach ${key}`,
              created_at: new Date().toISOString(),
              version: '1.0.0'
            }
          });
          console.log(`✅ Created collection: ${collectionName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create collection ${collectionName}:`, error);
        throw error;
      }
    }
  }

  async createIndexes() {
    console.log('🔍 Creating vector indexes...');
    
    // ChromaDB automatically handles vector indexing
    // We just need to ensure collections are properly configured
    for (const [key, collectionName] of Object.entries(this.collections)) {
      try {
        const collection = await this.chromaClient.getCollection({ name: collectionName });
        console.log(`✅ Collection ${collectionName} is ready for vector operations`);
      } catch (error) {
        console.error(`❌ Failed to verify collection ${collectionName}:`, error);
      }
    }
  }

  // Sample data initialization removed for production
  // This prevents test data from being added to the knowledge base

  async healthCheck() {
    try {
      console.log('🔍 Running health check...');
      
      const heartbeat = await this.chromaClient.heartbeat();
      
      // Check all collections
      const collectionStatus = {};
      for (const [key, collectionName] of Object.entries(this.collections)) {
        try {
          const collection = await this.chromaClient.getCollection({ name: collectionName });
          collectionStatus[collectionName] = 'healthy';
        } catch (error) {
          collectionStatus[collectionName] = 'unhealthy';
        }
      }
      
      const health = {
        status: 'healthy',
        chroma_version: heartbeat.nanosecond_heartbeat,
        collections: collectionStatus,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Health check completed:', health);
      return health;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new VectorDBSetup();
  
  setup.setup()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export default VectorDBSetup;
