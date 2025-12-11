import { getLocalEmbedding } from './src/utils/ai/localEmbedding.service.js';

async function testLocalEmbeddings() {
  try {
    // Test with a simple sentence
    const text = "This is a test sentence for generating embeddings";
    
    console.log('Testing local embeddings...');
    console.log('Text:', text);
    
    // Get the embedding
    console.log('Generating embedding...');
    const embedding = await getLocalEmbedding(text);
    
    // Show basic info about the embedding
    console.log('\n✅ Embedding generated successfully!');
    console.log(`- Dimensions: ${embedding.length}`);
    console.log(`- First 5 values: [${embedding.slice(0, 5).join(', ')}]`);
    console.log(`- Last 5 values: [${embedding.slice(-5).join(', ')}]`);
    
  } catch (error) {
    console.error('\n❌ Error in test:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the test
testLocalEmbeddings();
