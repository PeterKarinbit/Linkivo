// Simple webhook test to verify session ID works
import fetch from 'node-fetch';

async function testSimpleWebhook() {
  console.log('🧪 Testing simple webhook with session ID...\n');

  const testData = {
    sessionId: `${Date.now()}_testuser`,
    sessionToken: `${Date.now()}_testuser`,
    message: 'Hello from Linkivo!',
    timestamp: new Date().toISOString()
  };

  console.log('📤 Sending test data:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    // Test with a simple webhook service
    const response = await fetch('https://webhook.site/your-unique-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Success! Response:', result);
    } else {
      console.log('❌ Error:', response.statusText);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Instructions for testing
console.log('🎯 TO TEST YOUR N8N WEBHOOK:');
console.log('1. Go to https://webhook.site/');
console.log('2. Copy your unique URL');
console.log('3. Replace "your-unique-url" in this script');
console.log('4. Run: node test-simple-webhook.js');
console.log('5. Check webhook.site to see the data received\n');

// Uncomment the line below to run the test
// testSimpleWebhook(); 