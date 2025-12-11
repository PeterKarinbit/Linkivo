import 'dotenv/config';
import LearningRecommendationService from '../src/services/LearningRecommendationService.js';

// Test cases with different learning scenarios
const testScenarios = [
  {
    title: 'Data Science Learning Path',
    description: 'I want to learn data science from scratch',
    expectedKeywords: ['data', 'science', 'learn']
  },
  {
    title: 'Web Development Skills',
    description: 'How can I become a full-stack web developer?',
    expectedKeywords: ['web', 'development', 'full', 'stack']
  },
  {
    title: 'Machine Learning Basics',
    description: 'Looking for introductory courses on machine learning and AI',
    expectedKeywords: ['machine', 'learning', 'ai', 'introductory']
  }
];

/**
 * Format course information for display
 */
function formatCourse(course, index) {
  return `
${index + 1}. ${course.name}
   ${'─'.repeat(course.name.length + 2)}
   ${course.description ? course.description.substring(0, 120) + '...' : 'No description available'}
   ${course.workload ? `⏱️  Workload: ${course.workload}` : ''}
   ${course.primaryLanguages?.length ? `🌐 Languages: ${course.primaryLanguages.join(', ')}` : ''}
   🔗 URL: https://www.coursera.org/learn/${course.slug || 'course'}`;
}

/**
 * Run all test scenarios
 */
async function runTests() {
  console.log('🚀 Testing Learning Recommendation Service\n');
  
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Scenario: ${scenario.title}`);
    console.log('='.repeat(80));
    console.log(`📝 Entry: "${scenario.description}"`);
    
    try {
      const startTime = Date.now();
      
      // Get learning recommendations
      const result = await LearningRecommendationService.getLearningRecommendations(
        scenario.description,
        { maxCourses: 2 }
      );
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (result.success) {
        console.log(`✅ Analysis completed in ${processingTime}s`);
        console.log('🔑 Extracted Keywords:', result.analysis.keywords.join(', '));
        
        if (result.courses.length > 0) {
          console.log('\n🎓 Recommended Courses:');
          console.log('='.repeat(80));
          
          // Display each recommended course
          result.courses.forEach((course, index) => {
            console.log(formatCourse(course, index));
            console.log(''); // Add space between courses
          });
        } else {
          console.log('ℹ️  No courses found for this entry.');
        }
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error(`❌ Test failed for "${scenario.title}":`, error.message);
    }
  }
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unhandled error in test:', error);
  process.exit(1);
});
