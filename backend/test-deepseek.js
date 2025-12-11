import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

// Debug: Show which API key is being used
console.log('Using DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Found' : 'Not Found');

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY not found in environment variables');
  process.exit(1);
}

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

async function testDeepSeek() {
  try {
    console.log('\n=== Testing DeepSeek API Connection ===');
    
    // Test 1: List available models (if supported)
    try {
      console.log('\nFetching available models...');
      const models = await openai.models.list();
      console.log(`Found ${models.data.length} models`);
      console.log('Available models:');
      models.data.slice(0, 5).forEach((model, i) => {
        console.log(`${i + 1}. ${model.id}`);
      });
    } catch (error) {
      console.log('Note: Could not list models, but this might be expected. Continuing with test...');
    }
    
    // Test 2: Simple completion
    console.log('\nTesting completion with DeepSeek...');
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me a short joke about programming' }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    console.log('\nResponse:');
    console.log(completion.choices[0].message.content);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error testing DeepSeek API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Check your network connection.');
    }
  }
}

testDeepSeek();
