import { LearningAdvisorService } from '../src/services/LearningAdvisorService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const SERPER_API_KEY = process.env.SERPER_API_KEY || 'a092ab9abf2f4b6be4dbd776bea26ad259527be2';

/**
 * Format course for display
 */
function formatCourse(course, index) {
  return `
${index + 1}. ${course.title}
   ${'─'.repeat(course.title.length + 2)}
   ${course.description || 'No description available'}
   🌐 Source: ${course.source}
   🔗 URL: ${course.url}`;
}

/**
 * Main function to test the Learning Advisor
 */
async function testLearningAdvisor() {
  console.log('🚀 Testing Learning Advisor with Local LLM\n');
  
  if (!SERPER_API_KEY) {
    console.error('❌ Error: SERPER_API_KEY is not set in .env file');
    process.exit(1);
  }

  const learningAdvisor = new LearningAdvisorService(SERPER_API_KEY);
  
  // Test cases
  const testCases = [
    'I want to learn about AI and machine learning',
    'How can I become a full stack developer?',
    'Best way to learn Python programming',
    'I need to improve my data analysis skills',
    'Web development courses for beginners'
  ];
  
  for (const userInput of testCases) {
    console.log(`\n📝 User Input: "${userInput}"`);
    console.log('='.repeat(80));
    
    try {
      const startTime = Date.now();
      
      // Get course recommendations
      const result = await learningAdvisor.getCourseRecommendations(userInput, {
        limit: 2 // Limit to 2 courses per query for testing
      });
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (result.success && result.courses.length > 0) {
        console.log(`\n✅ Found ${result.courses.length} courses in ${elapsedTime}s`);
        console.log(`🔍 Search query: "${result.query}"`);
        console.log('='.repeat(80));
        
        result.courses.forEach((course, index) => {
          console.log(formatCourse(course, index));
        });
      } else {
        console.log(`\nℹ️  No courses found. (${elapsedTime}s)`);
        if (result.error) {
          console.error('Error:', result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testLearningAdvisor().catch(console.error);
