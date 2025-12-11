import JournalProcessor from './src/services/ai/JournalProcessor.js';
import 'dotenv/config';

// Test scenarios
const testEntries = [
  {
    title: 'Career-focused Entry',
    content: 'Python developer looking to transition into machine learning. Experience with TensorFlow.'
  },
  {
    title: 'Personal Journal Entry',
    content: 'Had coffee with a friend. The weather was nice.'
  },
  {
    title: 'Mixed Entry',
    content: 'Frontend developer learning Node.js and cloud tech. Want to move into more technical roles.'
  }
];

async function runTests() {
  const processor = new JournalProcessor();
  
  for (const entry of testEntries) {
    console.log(`\n=== Testing: ${entry.title} ===`);
    console.log('--- Entry ---');
    console.log(entry.content);
    
    const result = await processor.processJournalEntry(entry.content);
    
    console.log('\n--- Analysis ---');
    console.log(`Used Job Taxonomy: ${result.usedTaxonomy ? '✅ Yes' : '❌ No'}`);
    
    if (result.taxonomyResults) {
      console.log('\nIdentified Skills:', result.taxonomyResults.skills.join(', '));
      console.log('\nSuggested Career Paths:');
      result.taxonomyResults.careerPaths.forEach((path, i) => {
        console.log(`  ${i+1}. ${path.title}: ${path.description.substring(0, 100)}...`);
      });
    }
    
    console.log('\n--- AI Response ---');
    console.log(result.response);
    console.log('\n' + '='.repeat(50));
  }
}

runTests().catch(console.error);
