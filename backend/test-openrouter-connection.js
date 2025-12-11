import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = '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';

async function testConnection() {
  try {
    console.log('🔌 Testing OpenRouter connection...');
    
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JobHunter Test'
      }
    });

    console.log('Sending test request to OpenRouter...');
    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3.1:free',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Just say "Test successful" if you can read this.' }
      ],
      max_tokens: 10
    });

    console.log('✅ Connection successful!');
    console.log('Response:', response.choices[0]?.message?.content || 'No content');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.request) {
      console.error('No response received:', error.request);
    }
  }
}

testConnection();
