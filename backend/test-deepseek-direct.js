import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ Error: DEEPSEEK_API_KEY is not set in environment variables');
  process.exit(1);
}

async function testDeepSeek() {
  try {
    console.log('Testing DeepSeek API...');
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, World!"' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('\n✅ Success! Response:');
    console.log(data.choices[0].message.content);
    
  } catch (error) {
    console.error('\n❌ Error testing DeepSeek API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDeepSeek();
