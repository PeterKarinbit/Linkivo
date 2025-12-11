import dotenv from 'dotenv';
dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY is not set in .env file');
  process.exit(1);
}

async function testDeepSeek() {
  try {
    console.log('Testing DeepSeek API...');
    
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Tell me a short joke about programming' }
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
    console.error('\n❌ Error testing DeepSeek API:');
    console.error(error.message);
  }
}

testDeepSeek();
