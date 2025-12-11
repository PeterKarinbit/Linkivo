import LearningRecommendationService from '../src/services/LearningRecommendationService.js';

// Sample journal entries for testing
const journalEntries = [
  "I want to learn machine learning and data science to advance my career.",
  "I need to improve my Python programming skills for web development.",
  "I'm interested in learning about artificial intelligence and deep learning.",
  "I want to switch to a career in data analysis. What should I learn?"
];

async function testLearningRecommendation() {
  console.log("🚀 Testing Learning Recommendation System\n");
  
  for (const [index, entry] of journalEntries.entries()) {
    console.log(`📝 Journal Entry #${index + 1}:`);
    console.log(`   "${entry}"\n`);
    
    try {
      console.log("🔍 Analyzing learning needs...");
      const result = await LearningRecommendationService.getLearningRecommendations(entry);
      
      if (result.success) {
        console.log("✅ Analysis complete! Here are your learning recommendations:\n");
        
        console.log(`   Search Query: "${result.analysis.searchQuery}"`);
        console.log(`   Extracted Keywords: ${result.analysis.keywords.join(', ')}\n`);
        
        console.log("🎓 Recommended Courses:");
        result.courses.forEach((course, i) => {
          console.log(`\n   ${i + 1}. ${course.title}`);
          console.log(`      ${course.description}`);
          console.log(`      Source: ${course.source}`);
          console.log(`      URL: ${course.url}`);
        });
      } else {
        console.error("❌ Error getting recommendations:", result.error);
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
    
    console.log("\n" + "-".repeat(80) + "\n");
  }
}

// Run the test
testLearningRecommendation().catch(console.error);
