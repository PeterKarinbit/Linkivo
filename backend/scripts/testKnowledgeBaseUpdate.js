import dotenv from 'dotenv';
import mcpKnowledgeBaseService from '../src/services/mcpKnowledgeBaseService.js';

// Get the current directory
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Debug log to verify environment
console.log('Environment loaded from:', envPath);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

async function testKnowledgeBaseUpdate() {
  try {
    console.log('🚀 Starting knowledge base update test...');
    
    // Initialize the service
    console.log('🔄 Initializing MCP Knowledge Base Service...');
    await mcpKnowledgeBaseService.initialize();
    
    const testUserId = 'test-user-' + Date.now();
    console.log(`\n🧪 Test User ID: ${testUserId}`);
    
    // Create test data with research
    const testData = {
      name: 'Test User',
      role: 'Software Engineer',
      skills: ['JavaScript', 'Node.js'],
      goals: [
        {
          goal: 'Learn AI/ML',
          priority: 'high',
          targetDate: '2024-12-31'
        }
      ],
      researchData: [
        {
          title: 'AI in Software Development',
          source: 'Tech Trends 2024',
          summary: 'AI is being integrated into all aspects of software development',
          relevance: 'high',
          date: new Date().toISOString(),
          impact: 'High demand for AI skills in software roles',
          actionItems: [
            'Take an AI/ML course',
            'Build a project with AI components'
          ]
        }
      ]
    };

    // Test creating a new knowledge base
    console.log('\n🆕 Testing knowledge base creation...');
    const newKb = await mcpKnowledgeBaseService.updateKnowledgeBase(
      testUserId,
      testData,
      'full'
    );
    
    console.log('✅ Created knowledge base:', {
      userId: newKb.userId,
      version: newKb.version,
      sections: Object.keys(newKb.data).join(', ')
    });
    
    // Test updating the knowledge base
    console.log('\n🔄 Testing knowledge base update...');
    const updatedKb = await mcpKnowledgeBaseService.updateKnowledgeBase(
      testUserId,
      {
        researchData: [
          {
            title: 'Remote Work Trends',
            source: 'Remote Work Report 2024',
            summary: 'Hybrid work is becoming the new standard',
            relevance: 'medium',
            date: new Date().toISOString(),
            impact: 'More companies offering flexible work arrangements',
            actionItems: [
              'Improve remote collaboration skills',
              'Set up a productive home office'
            ]
          }
        ]
      },
      'incremental'
    );
    
    console.log('✅ Updated knowledge base:', {
      version: updatedKb.version,
      lastUpdated: updatedKb.lastUpdated,
      changes: updatedKb.updateHistory?.[0]?.changes?.length || 0
    });
    
    // Test getting knowledge base contents
    console.log('\n📚 Testing knowledge base retrieval...');
    const kbContents = await mcpKnowledgeBaseService.getKnowledgeContents(testUserId);
    console.log('✅ Retrieved knowledge base with sections:', Object.keys(kbContents.data).join(', '));
    
    // Test asking a question
    console.log('\n❓ Testing question answering...');
    const question = 'What are the latest market trends?';
    const answer = await mcpKnowledgeBaseService.askQuestion(testUserId, question);
    console.log(`Q: ${question}`);
    console.log(`A: ${answer.answer.substring(0, 100)}...`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testKnowledgeBaseUpdate();
