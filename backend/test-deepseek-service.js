import dotenv from 'dotenv';
dotenv.config();
import { getRewordedResume } from './src/utils/ai/deepseek.service.js';

async function testDeepSeek() {
  try {
    console.log('Testing DeepSeek service...');
    
    const testResume = `
    Software Developer
    - Wrote code for a web app
    - Fixed bugs in the system
    - Worked with a team
    `;
    
    console.log('Original resume:');
    console.log(testResume);
    
    console.log('\nCalling DeepSeek service...');
    const improved = await getRewordedResume(testResume);
    
    console.log('\nImproved resume:');
    console.log(improved);
    
  } catch (error) {
    console.error('Error testing DeepSeek service:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDeepSeek();
