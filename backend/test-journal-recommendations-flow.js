/**
 * Test script to verify the complete journal processing flow:
 * Journal Entry → Lightcast Processing → AI Recommendations
 */

import EnhancedAICareerCoachService from './src/utils/ai/enhancedAICareerCoach.service.js';

async function testJournalRecommendationsFlow() {
  console.log('🧪 Testing Journal → Lightcast → Recommendations Flow...\n');

  // Test journal content (similar to your YC description)
  const testJournalContent = `
    I'm a mechanical engineer with experience in predictive modeling and corporate finance. 
    I've been working with Python for data analysis and have used TinkerCAD and AutoCAD for engineering design.
    I'm interested in transitioning into more technical roles, possibly in data science or machine learning.
    I've been learning about business strategies and entrepreneurship, and I'm looking to combine my technical skills with business acumen.
    My goal is to move into a role where I can apply my engineering background to solve complex problems using data-driven approaches.
  `;

  const testUserId = 'test_user_' + Date.now();

  try {
    console.log('1. 📝 Creating journal entry...');
    const journalEntry = await EnhancedAICareerCoachService.createJournalEntry({
      userId: testUserId,
      content: testJournalContent,
      entry_date: new Date(),
      tags: ['career', 'skills', 'transition']
    });
    console.log('✅ Journal entry created:', journalEntry.entry_id);

    console.log('\n2. 🔍 Analyzing journal entry with Lightcast integration...');
    const analysis = await EnhancedAICareerCoachService.analyzeJournalEntryWithMarketContext(
      testJournalContent,
      testUserId
    );
    console.log('✅ Analysis completed');
    console.log('   - Skills mentioned:', analysis.SKILLS_MENTIONED?.length || 0);
    console.log('   - Career aspirations:', analysis.CAREER_ASPIRATIONS?.length || 0);
    console.log('   - Lightcast processed:', analysis.SUMMARY?.lightcast_processed || false);

    console.log('\n3. 🎯 Generating recommendations...');
    const recommendations = await EnhancedAICareerCoachService.generateProactiveRecommendations(
      testUserId,
      'journal-triggered'
    );
    console.log('✅ Recommendations generated');
    console.log('   - Count:', recommendations.count || 0);
    console.log('   - Success:', recommendations.success || false);

    console.log('\n4. 📊 Summary of results:');
    console.log('   - Journal Entry ID:', journalEntry.entry_id);
    console.log('   - Analysis Status:', analysis.SUMMARY?.analysis_status);
    console.log('   - Recommendations Count:', recommendations.count);
    console.log('   - Market Context Used:', recommendations.market_context);

    console.log('\n✅ End-to-end flow test completed successfully!');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    // Note: In a real scenario, you'd want to clean up the test user data
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testJournalRecommendationsFlow().catch(console.error);
