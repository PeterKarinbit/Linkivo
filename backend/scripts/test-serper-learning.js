import { SerperService } from '../src/services/SerperService.js';
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
 * Format search results for display
 */
function formatSearchResult(result, index) {
  return `
${index + 1}. ${result.title}
   ${'─'.repeat(result.title.length + 2)}
   ${result.snippet || 'No description available'}
   🌐 Source: ${result.source}
   🔗 URL: ${result.link}`;
}

/**
 * Main function to test the learning recommendation flow with Serper API
 */
async function testSerperLearning() {
  console.log('🚀 Testing Learning Recommendation with Serper API\n');
  
  if (!SERPER_API_KEY) {
    console.error('❌ Error: SERPER_API_KEY is not set in .env file');
    process.exit(1);
  }

  const serperService = new SerperService(SERPER_API_KEY);
  
  // Test cases
  const testCases = [
    'data science and machine learning courses',
    'full stack web development with React and Node.js',
    'Python programming for beginners',
    'deep learning and neural networks',
    'data analysis and visualization with Python'
  ];
  
  for (const query of testCases) {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log('='.repeat(80));
    
    try {
      const results = await serperService.searchLearningResources(query, {
        limit: 3,
        type: 'course'
      });
      
      if (results.length > 0) {
        console.log(`\n🎓 Found ${results.length} courses:`);
        console.log('='.repeat(80));
        
        results.forEach((result, index) => {
          console.log(formatSearchResult(result, index));
        });
      } else {
        console.log('ℹ️  No courses found for this query.');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testSerperLearning().catch(console.error);
