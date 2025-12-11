import dotenv from 'dotenv';
dotenv.config();
import { testConnection } from './src/utils/ai/deepseek.service.js';

async function runTest() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ Error: DEEPSEEK_API_KEY is not set in environment variables');
    process.exit(1);
  }
  
  console.log('🔑 Using DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Found' : 'Not Found');
  
  const success = await testConnection();
  if (success) {
    console.log('✅ DeepSeek API is working correctly!');
  } else {
    console.error('❌ Failed to connect to DeepSeek API');
    process.exit(1);
  }
}

runTest();
