// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

// Debug: Log which API key is being used
console.log('Using API Key:', 
  process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 
  process.env.OPENAI_API_KEY ? 'OpenAI' : 
  process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'No API Key Found');

// Initialize with the same configuration as your app
const apiKey = process.env.OPENROUTER_API_KEY || 
               process.env.OPENAI_API_KEY || 
               process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error('Error: No API key found in environment variables');
  console.error('Please set one of: OPENROUTER_API_KEY, OPENAI_API_KEY, or DEEPSEEK_API_KEY');
  process.exit(1);
}

let baseURL = process.env.OPENROUTER_BASE_URL || 
              process.env.OPENAI_BASE_URL || 
              'https://api.openai.com/v1';

// Auto-detect OpenRouter if using their key
if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_BASE_URL) {
  baseURL = 'https://openrouter.ai/api/v1';
}

const defaultHeaders = {};
if (baseURL.includes('openrouter.ai')) {
  defaultHeaders['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL || 'http://localhost:3000';
  defaultHeaders['X-Title'] = process.env.OPENROUTER_APP_NAME || 'JobHunter Test';
}

console.log('Using base URL:', baseURL);

const openai = new OpenAI({
  apiKey,
  baseURL,
  defaultHeaders,
});

async function testConnection() {
  try {
    console.log('\n=== Testing API Connection ===');
    
    // Test 1: List available models
    console.log('\nFetching available models...');
    const models = await openai.models.list();
    console.log(`Found ${models.data.length} models`);
    
    // Show first 5 models as examples
    console.log('Example models:');
    models.data.slice(0, 5).forEach((model, i) => {
      console.log(`${i + 1}. ${model.id}`);
    });
    
    // Test 2: Simple completion
    console.log('\nTesting completion...');
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
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
    console.error('\n❌ Error testing API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Check your network connection.');
    }
  }
}

testConnection();
