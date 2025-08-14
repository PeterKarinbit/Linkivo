// Test script for n8n session handling
// Run this to test if your n8n workflow receives the session token correctly

import n8nSessionHandler from './src/utils/n8nSessionHandler.js';

async function testN8nSession() {
  console.log('🧪 Testing n8n Session Handler...\n');

  try {
    // Test data
    const testData = {
      userId: 'test_user_123',
      resume: 'Test resume content...',
      skills: 'JavaScript,React,Node.js',
      experience: '3'
    };

    console.log('📤 Sending test data to n8n...');
    console.log('Data:', testData);

    // Send to your n8n webhook (replace with your actual URL)
    const result = await n8nSessionHandler.sendToN8n(
      'https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1',
      testData
    );

    console.log('\n✅ SUCCESS! n8n responded with:');
    console.log(result);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your n8n webhook URL is correct');
    console.log('2. Make sure your n8n workflow is active');
    console.log('3. Check n8n logs for any errors');
  }
}

// Run the test
testN8nSession(); 