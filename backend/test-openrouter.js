import OpenAI from 'openai';

// Use the same configuration as in the application
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
let baseURL = process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

if (!process.env.OPENAI_BASE_URL && process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_BASE_URL) {
  baseURL = "https://openrouter.ai/api/v1";
}

const defaultHeaders = {};
if (baseURL.includes('openrouter.ai')) {
  if (process.env.OPENROUTER_SITE_URL) defaultHeaders['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_APP_NAME) defaultHeaders['X-Title'] = process.env.OPENROUTER_APP_NAME;
}

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey,
  baseURL,
  defaultHeaders
});

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter connection...');
    
    // List available models (should work without authentication)
    const models = await openai.models.list();
    console.log('Available models:', models.data.map(m => m.id).join('\n'));
    
    // Test a simple completion
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
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing OpenRouter:');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenRouter();
