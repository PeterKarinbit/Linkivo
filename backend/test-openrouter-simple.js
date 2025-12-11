import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY is not set in .env file');
  process.exit(1);
}

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter API...');
    
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'JobHunter Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
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
    console.error('\n❌ Error testing OpenRouter API:');
    console.error(error.message);
  }
}

testOpenRouter();
