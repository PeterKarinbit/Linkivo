/**
 * Learning Recommendation System Test
 * 
 * This script demonstrates the learning recommendation system by:
 * 1. Analyzing journal entries for learning needs using LLM
 * 2. Fetching relevant courses from Coursera
 * 3. Displaying personalized learning recommendations
 */

import LearningRecommendationService from './LearningRecommendationService.js';
import config from './config.js';

// Initialize the service
const service = new LearningRecommendationService();

/**
 * Format and display the results
 */
function displayResults(entry, result) {
  console.log('\n' + '='.repeat(80));
  console.log(`📝 Journal Entry: "${entry}"`);
  console.log('='.repeat(80));
  
  if (result.error) {
    console.log('❌ Error:', result.error);
    if (result.details) console.log('Details:', result.details);
    return;
  }
  
  // Display analysis
  const { analysis, courses } = result;
  console.log('\n📊 Analysis:');
  console.log('-'.repeat(40));
  console.log(`🔍 Needs Learning Resources: ${analysis.needsLearningResources ? '✅ Yes' : '❌ No'}`);
  console.log(`🏷️  Identified Topics: ${analysis.topics.join(', ')}`);
  console.log(`🎯 Confidence: ${Math.round(analysis.confidence * 100)}%`);
  console.log(`💡 Reason: ${analysis.reason}`);
  
  // Display recommendations
  if (courses && courses.length > 0) {
    console.log('\n🎓 Recommended Courses:');
    console.log('-'.repeat(40));
    
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.name}`);
      console.log('   ' + '─'.repeat(course.name.length + 2));
      console.log(`   🔹 Type: ${course.courseType || 'N/A'}`);
      if (course.workload) console.log(`   ⏱️  Workload: ${course.workload}`);
      if (course.primaryLanguages?.length) {
        console.log(`   🌐 Languages: ${course.primaryLanguages.join(', ')}`);
      }
      if (course.description) {
        console.log(`   📝 ${course.description.substring(0, 150)}${course.description.length > 150 ? '...' : ''}`);
      }
      if (course.slug) {
        console.log(`   🔗 URL: https://www.coursera.org/learn/${course.slug}`);
      }
    });
  } else if (analysis.needsLearningResources) {
    console.log('\nℹ️  No courses found for the identified topics.');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main function to run the test
 */
async function runTest() {
  console.log('🚀 Starting Learning Recommendation System Test\n');
  console.log('🔧 Configuration:');
  console.log('-'.repeat(40));
  console.log(`📡 Coursera API: ${config.api.coursera.baseUrl}`);
  console.log(`🤖 LLM Model: ${config.api.openrouter.model}`);
  console.log(`📅 Test Entries: ${config.test.journalEntries.length}`);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Process each journal entry
  for (const entry of config.test.journalEntries) {
    try {
      console.log(`\n🔄 Processing entry: "${entry.substring(0, 60)}${entry.length > 60 ? '...' : ''}"`);
      const startTime = Date.now();
      
      // Get recommendations
      const result = await service.getLearningRecommendations(entry);
      
      // Calculate processing time
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Processed in ${processingTime}s`);
      
      // Display results
      displayResults(entry, result);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('❌ Error processing entry:', error);
      console.log('\n' + '='.repeat(80) + '\n');
    }
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
