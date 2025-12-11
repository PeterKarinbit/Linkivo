import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = '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';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'JobHunter Test'
  }
});

async function testConnection() {
  try {
    console.log('Testing OpenRouter connection...');
    
    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3.1:free',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is 2+2?' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    console.log('\n✅ Success! Response:');
    console.log(response.choices[0].message.content);
    
  } catch (error) {
    console.error('\n❌ Error testing OpenRouter:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testConnection();
