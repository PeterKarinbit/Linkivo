import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MCPKnowledgeBaseService } from '../src/services/mcpKnowledgeBaseService.js';

// Load environment variables
dotenv.config();

const USER_ID = '68ce5bc0d065dc2b4a9a0a2e';

async function main() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Initializing MCP Knowledge Base Service...');
    const mcpService = new MCPKnowledgeBaseService();
    await mcpService.initialize();
    
    console.log(`🔄 Manually updating knowledge base for user ${USER_ID}...`);
    const result = await mcpService.updateUserKnowledgeBase(USER_ID);
    
    if (result.success) {
      console.log('✅ Successfully updated knowledge base');
      console.log('📊 Stats:', {
        userId: USER_ID,
        lastUpdated: result.data?.lastUpdated,
        version: result.data?.version,
        filePath: result.data?.filePath
      });
    } else {
      console.error('❌ Failed to update knowledge base:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
