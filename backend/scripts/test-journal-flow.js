import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { JournalEntry } from '../src/models/aiCareerCoach.model.js';
import EnhancedAICareerCoachService from '../src/utils/ai/enhancedAICareerCoach.service.js';

dotenv.config();

// Test user ID (use an existing user ID from your database)
const TEST_USER_ID = '660f4e3e8f8e8e8e8e8e8e8e'; // Replace with a valid user ID

// Test journal entry content
const TEST_JOURNAL_ENTRY = `
Today I had a great day at work! I worked on implementing a new REST API endpoint using Node.js and Express. 
I also learned about JWT authentication and how to properly secure API routes. 
I'm excited to apply these skills to build more secure applications in the future.

I'm also thinking about learning more about cloud technologies like AWS and Docker to improve our deployment process.
`;

async function testJournalFlow() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/jobhunter';
    if (!mongoUri) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
    });
    
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
    console.log(`📊 Host: ${mongoose.connection.host}`);

    // Initialize services
    const aiService = EnhancedAICareerCoachService;

    // 1. Create a test journal entry
    console.log('\n📝 Creating test journal entry...');
    const journalEntry = await aiService.createJournalEntry({
      userId: TEST_USER_ID,
      content: TEST_JOURNAL_ENTRY,
      entry_date: new Date(),
      tags: ['work', 'learning', 'api']
    });

    console.log('✅ Journal entry created:', {
      id: journalEntry._id,
      entry_id: journalEntry.entry_id,
      content: journalEntry.content.substring(0, 100) + '...',
      created_at: journalEntry.createdAt
    });

    // 2. Wait a moment for the background processing to complete
    console.log('\n⏳ Waiting for background processing (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 3. Retrieve the processed journal entry
    console.log('\n🔍 Retrieving processed journal entry...');
    const [savedEntry] = await aiService.getJournalEntries({
      userId: TEST_USER_ID,
      limit: 1,
      sort: { 'metadata.date': -1 }
    });

    console.log('\n📋 Processed Journal Entry:');
    console.log('----------------------------------------');
    console.log(`📅 Date: ${savedEntry.entry_date}`);
    console.log(`🏷️  Tags: ${savedEntry.tags?.join(', ') || 'None'}`);
    console.log(`📊 Word Count: ${savedEntry.word_count}`);
    console.log(`😊 Sentiment: ${savedEntry.sentiment || 'Neutral'}`);
    
    if (savedEntry.ai_insights) {
      console.log('\n🧠 AI Insights:');
      console.log('----------------------------------------');
      console.log(`🔑 Key Themes: ${savedEntry.ai_insights.key_themes?.join(', ') || 'None'}`);
      console.log(`✅ Action Items: ${savedEntry.ai_insights.action_items?.join('\n   - ') || 'None'}`);
      console.log(`💡 Skill Mentions: ${savedEntry.ai_insights.skill_mentions?.map(s => s.skill).join(', ') || 'None'}`);
    }

    // 4. Get career recommendations based on the journal entry
    console.log('\n🔮 Getting career recommendations...');
    const recommendations = await aiService.generateProactiveRecommendations(TEST_USER_ID);
    
    if (recommendations && recommendations.length > 0) {
      console.log('\n🎯 Career Recommendations:');
      console.log('----------------------------------------');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Type: ${rec.type}`);
        console.log('   ---');
      });
    }

    // 5. Get all journal entries for the user
    console.log('\n📚 All Journal Entries:');
    console.log('----------------------------------------');
    const allEntries = await aiService.getJournalEntries({
      userId: TEST_USER_ID,
      limit: 5,
      sort: { 'metadata.date': -1 }
    });

    allEntries.forEach((entry, index) => {
      console.log(`\n📄 Entry ${index + 1}:`);
      console.log(`   ID: ${entry.entry_id}`);
      console.log(`   Date: ${entry.entry_date}`);
      console.log(`   Preview: ${entry.content.substring(0, 80)}...`);
      console.log(`   Topics: ${entry.topics?.join(', ') || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testJournalFlow();
