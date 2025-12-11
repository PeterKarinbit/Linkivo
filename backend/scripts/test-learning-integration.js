import dotenv from 'dotenv';
import LearningRecommendationService from '../src/services/LearningRecommendationService.js';

dotenv.config();

// Test journal entries
const testEntries = [
  "I want to learn machine learning and Python for data analysis.",
  "I need to study data science to advance my career.",
  "Looking for courses on web development.",
  "I'm interested in artificial intelligence and neural networks.",
  "How can I get started with cloud computing?"
];

async function runTests() {
  console.log('🚀 Starting Learning Recommendation Integration Test\n');
  
  // Check if RapidAPI key is set
  if (!process.env.RAPIDAPI_KEY) {
    console.error('❌ Error: RAPIDAPI_KEY is not set in .env file');
    console.log('💡 Get your API key from: https://rapidapi.com/letscoursera-letscoursera-default/api/coursera-courses-ranking/');
    process.exit(1);
  }
  
  console.log('🔍 Using RapidAPI Coursera integration');
  const learningService = LearningRecommendationService;
  
  for (const [index, entry] of testEntries.entries()) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 Test ${index + 1}: "${entry}"`);
    console.log('='.repeat(80));
    
    try {
      console.log('🔍 Analyzing learning needs...');
      const startTime = Date.now();
      
      // Get recommendations
      const result = await learningService.getLearningRecommendations(entry, {
        maxCourses: 3
      });
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (result.success) {
        console.log(`✅ Analysis completed in ${processingTime}s`);
        console.log('🔑 Keywords:', result.analysis.keywords.join(', '));
        
        if (result.courses.length > 0) {
          console.log('\n🎓 Recommended Courses:');
          console.log('='.repeat(80));
          
          result.courses.forEach((course, i) => {
            console.log(`\n${i + 1}. ${course.name}`);
            console.log('   ' + '─'.repeat(course.name.length + 2));
            
            if (course.description) {
              console.log(`\n   ${course.description.substring(0, 150)}${course.description.length > 150 ? '...' : ''}`);
            }
            
            if (course.rating !== undefined) {
              const stars = '★'.repeat(Math.round(course.rating)) + '☆'.repeat(5 - Math.round(course.rating));
              console.log(`\n   ${stars} (${course.rating.toFixed(1)}${course.ratingCount ? ` from ${course.ratingCount} reviews` : ''})`);
            }
            
            if (course.workload) {
              console.log(`   ⏱️  Workload: ${course.workload}`);
            }
            
            if (course.primaryLanguages?.length) {
              console.log(`   🌐 Languages: ${course.primaryLanguages.join(', ')}`);
            }
            
            if (course.url) {
              console.log(`\n   🔗 Enroll: ${course.url}`);
            }
          });
        } else {
          console.log('ℹ️  No courses found for this entry.');
        }
      } else {
        console.error('❌ Error:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
