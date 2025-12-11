import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { JournalEntry } from '../src/models/aiCareerCoach.model.js';
import EnhancedAICareerCoachService from '../src/utils/ai/enhancedAICareerCoach.service.js';
import axios from 'axios';

// Mock the AI service if needed
const mockAIResponse = {
  analysis: {
    sentiment: 'positive',
    keyThemes: ['machine learning', 'mentoring'],
    skills: ['Python', 'TensorFlow', 'Teaching']
  },
  recommendations: [
    {
      title: 'Machine Learning Engineer',
      description: 'Based on your experience with machine learning frameworks.',
      confidence: 85
    },
    {
      title: 'Technical Mentor',
      description: 'Your mentoring experience would be valuable in this role.',
      confidence: 75
    }
  ]
};

dotenv.config();

// Test user ID (use an existing user ID from your database)
const TEST_USER_ID = '660f4e3e8f8e8e8e8e8e8e8e'; // Replace with a valid user ID
const FRONTEND_URL = 'http://localhost:5173';

// Test journal entries
const TEST_JOURNAL_ENTRIES = [
  {
    content: `Today I worked on improving our machine learning model's accuracy. I implemented a new neural network architecture using TensorFlow and PyTorch, which improved our model's performance by 15%. I'm excited about the potential this has for our product.`,
    tags: ['machine learning', 'tensorflow', 'pytorch', 'neural networks']
  },
  {
    content: `I had a great mentoring session with a junior developer today. We went over React hooks and state management. It felt rewarding to share knowledge and see their understanding grow. I'm considering taking on more mentorship opportunities.`,
    tags: ['mentoring', 'react', 'teaching', 'leadership']
  }
];

async function testJournalToRecommendations() {
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

    // Process each test journal entry
    for (const entry of TEST_JOURNAL_ENTRIES) {
      console.log('\n📝 Processing journal entry:', entry.content.substring(0, 50) + '...');
      
      // 1. Create a test journal entry
      const journalEntry = await aiService.createJournalEntry({
        userId: TEST_USER_ID,
        content: entry.content,
        entry_date: new Date(),
        tags: entry.tags
      });

      console.log('✅ Journal entry created with ID:', journalEntry._id);
      
      // 2. Process the journal entry for recommendations
      console.log('🔄 Processing entry for recommendations...');
      
      let analysis, recommendations;
      
      try {
        // Try to use the real AI service if available
        analysis = await aiService.analyzeJournalEntryWithMarketContext(
          entry.content,
          TEST_USER_ID
        );
        
        recommendations = await aiService.generateProactiveRecommendations(
          TEST_USER_ID,
          'journal-triggered'
        );
        
        console.log('✅ AI analysis complete. Using real recommendations.');
      } catch (aiError) {
        console.warn('⚠️  AI service not available, using mock data:', aiError.message);
        // Use mock data if AI service fails
        analysis = mockAIResponse.analysis;
        recommendations = mockAIResponse.recommendations;
        
        // Update the journal entry with mock analysis
        await JournalEntry.findByIdAndUpdate(journalEntry._id, {
          'ai_insights.analysis': analysis,
          'ai_insights.recommendations': recommendations,
          'ai_insights.processed_at': new Date()
        });
        
        console.log('✅ Using mock recommendations.');
      }
      
      // 3. Open the recommendations page in the browser
      const recommendationsUrl = `${FRONTEND_URL}/career-coach?tab=proactive-recommendations`;
      console.log(`\n🌐 Opening recommendations page: ${recommendationsUrl}`);
      
      // This will open the URL in the default browser
      const open = (await import('open')).default;
      await open(recommendationsUrl);
      
      // Add a small delay between entries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

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
testJournalToRecommendations();
