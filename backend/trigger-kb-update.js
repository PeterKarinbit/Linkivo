import 'dotenv/config';
import mongoose from 'mongoose';
import mcpKnowledgeBaseService from './src/services/mcpKnowledgeBaseService.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://linkivoai_db_user:Karin%406397@linkivo.3kj02jj.mongodb.net/';

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize the service
    console.log('🚀 Initializing MCP Knowledge Base Service...');
    await mcpKnowledgeBaseService.initialize();
    
    // User ID from the logs
    const userId = '68ce5bc0d065dc2b4a9a0a2e';
    
    console.log(`\n🔄 Triggering knowledge base update for user: ${userId}`);
    const result = await mcpKnowledgeBaseService.updateKnowledgeBase(userId, {}, 'manual');
    
    console.log('\n✅ Knowledge base update completed!');
    console.log('📊 Results:', {
      version: result.version,
      lastUpdated: result.lastUpdated,
      changes: result.updateHistory?.[0]?.changes?.length || 0
    });
    
    // Find and display the knowledge base file
    const fs = await import('fs/promises');
    const path = await import('path');
    const kbDir = path.join(process.cwd(), 'data', 'knowledge-bases');
    const kbFile = path.join(kbDir, `user-${userId}.json`);
    
    console.log('\n🔍 Checking for knowledge base file at:', kbFile);
    
    try {
      // Check if directory exists
      try {
        await fs.access(kbDir);
      } catch (dirError) {
        console.log('⚠️ Directory does not exist, creating it...');
        await fs.mkdir(kbDir, { recursive: true });
      }
      
      // Try to read the file
      try {
        const kbContent = await fs.readFile(kbFile, 'utf-8');
        console.log('\n📝 Knowledge Base Content:');
        console.log(JSON.stringify(JSON.parse(kbContent), null, 2));
      } catch (readError) {
        console.log('\n⚠️ Could not read knowledge base file. It may not exist yet.');
        console.log('Attempting to write the knowledge base data...');
        
        // Try to write the knowledge base data
        try {
          // Get the knowledge base data from the service
          const kbData = await mcpKnowledgeBaseService.getKnowledgeContents(userId);
          if (kbData) {
            const fullKb = {
              userId,
              version: '1.0.0',
              lastUpdated: new Date().toISOString(),
              data: kbData
            };
            await fs.writeFile(kbFile, JSON.stringify(fullKb, null, 2));
            console.log('✅ Successfully wrote knowledge base to:', kbFile);
            
            // Show a preview of the saved data
            console.log('\n📝 Knowledge Base Preview:');
            console.log(JSON.stringify({
              userId: fullKb.userId,
              version: fullKb.version,
              lastUpdated: fullKb.lastUpdated,
              sections: Object.keys(kbData)
            }, null, 2));
          } else {
            console.log('❌ No knowledge base data available to write');
          }
        } catch (writeError) {
          console.error('❌ Failed to write knowledge base file:', writeError);
        }
      }
    } catch (error) {
      console.error('❌ Error accessing knowledge base directory:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
