import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter with DeepSeek model...');
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JobHunter Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is 2+2?' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }

    console.log('\n✅ Success! Response:');
    console.log(data.choices[0].message.content);
    
  } catch (error) {
    console.error('\n❌ Error testing OpenRouter API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testOpenRouter();
