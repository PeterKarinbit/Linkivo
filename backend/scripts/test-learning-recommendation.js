/**
 * Test script for demonstrating learning recommendations with Serper API
 * Run with: node --experimental-json-modules test-learning-recommendation.js
 */

import LearningRecommendationService from '../src/services/LearningRecommendationService.js';

// Sample journal entries for testing
const journalEntries = [
  "I want to learn machine learning and data science to advance my career.",
  "I need to improve my Python programming skills for web development.",
  "I'm interested in learning about artificial intelligence and deep learning.",
  "I want to switch to a career in data analysis. What should I learn?",
  "I'm looking to enhance my skills in cloud computing and DevOps.",
  "I'm considering a career in cybersecurity. What certifications should I get?"
];

/**
 * Main function to demonstrate the learning recommendation flow
 */
async function demonstrateLearningRecommendation() {
  console.log('🚀 Learning Recommendation System with Serper API\n');
  
  for (const [index, entry] of journalEntries.entries()) {
    console.log(`📝 Journal Entry #${index + 1}:`);
    console.log(`   "${entry}"\n`);
    
    try {
      console.log("🔍 Analyzing learning needs...");
      
      // Get learning recommendations using our service
      const result = await LearningRecommendationService.getLearningRecommendations(entry, {
        maxCourses: 3
      });
      
      if (result.success) {
        console.log("✅ Analysis complete! Here are your learning recommendations:\n");
        
        console.log(`   Search Query: "${result.analysis.searchQuery}"`);
        console.log(`   Extracted Keywords: ${result.analysis.keywords.join(', ')}\n`);
        
        if (result.courses && result.courses.length > 0) {
          console.log("🎓 Recommended Learning Resources:");
          result.courses.forEach((course, i) => {
            console.log(`\n   ${i + 1}. ${course.title}`);
            console.log(`      ${course.description}`);
            if (course.salary) {
              console.log(`      💰 Salary: ${course.salary.formatted}`);
            } else if (result.salaryData?.salary?.formatted) {
              console.log(`      💰 Estimated Salary: ${result.salaryData.salary.formatted}`);
            }
            console.log(`      Source: ${course.source}`);
            console.log(`      URL: ${course.url}`);
          });
        } else {
          console.log("ℹ️  No specific courses found, but here's what you can do next:");
          console.log(`   - Try refining your search query: "${result.analysis.searchQuery}"`);
          console.log(`   - Explore more resources about: ${result.analysis.keywords.join(', ')}`);
        }
      } else {
        console.error("❌ Error getting recommendations:", result.error);
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
    
    console.log("\n" + "-".repeat(80) + "\n");
  }
}

// Run the demonstration
demonstrateLearningRecommendation().catch(console.error);
