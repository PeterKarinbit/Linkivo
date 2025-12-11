import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1/ai';
const TEST_USER_ID = process.env.TEST_USER_ID || '68d576b57b028e4769552d6e'; // Replace with a valid user ID
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Make sure to set this

async function testJournalEntry() {
  const testCases = [
    {
      name: 'Valid entry',
      data: {
        content: 'Today I learned about React hooks and practiced building a custom hook for form validation. I also reviewed some advanced TypeScript patterns that will help with type safety in our application.'
      },
      expectedStatus: 201
    },
    {
      name: 'Entry with tags',
      data: {
        content: 'Attended a workshop on cloud architecture. Learned about microservices and serverless functions.',
        tags: ['learning', 'cloud', 'workshop']
      },
      expectedStatus: 201
    },
    {
      name: 'Empty content',
      data: { content: '' },
      expectedStatus: 400,
      expectError: true
    },
    {
      name: 'Content too long',
      data: { content: 'a'.repeat(5001) },
      expectedStatus: 400,
      expectError: true
    },
    {
      name: 'Invalid tags format',
      data: { 
        content: 'Test entry',
        tags: [123, true] // Invalid tags
      },
      expectedStatus: 400,
      expectError: true
    }
  ];

  console.log('Starting journal entry tests...\n');
  
  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log('Input:', JSON.stringify(test.data, null, 2));
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/journal`,
        test.data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'X-Feature-Flags': 'careerMemories=true'
          }
        }
      );

      console.log('✅ Success');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2), '\n');
      
      if (test.expectError) {
        console.error('❌ Test failed: Expected error but got success');
        process.exit(1);
      }
    } catch (error) {
      if (test.expectError) {
        console.log('✅ Expected error occurred');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.message || error.message, '\n');
      } else {
        console.error('❌ Test failed with unexpected error:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.message || error.message);
        process.exit(1);
      }
    }
  }
  
  console.log('All tests completed successfully!');
  process.exit(0);
}

testJournalEntry().catch(console.error);
