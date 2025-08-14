// Debug script to see exactly what data is being sent to n8n
import fetch from 'node-fetch';

async function debugN8nData() {
  console.log('🔍 Debugging n8n data flow...\n');

  // Simulate the exact data being sent from your app
  const testData = {
    resume: 'PETER M.KARINGITHI\n📧 petermbotikaringithi@gmail.com...',
    userId: 'anonymous',
    skills: 'JavaScript,Node.js,MongoDB',
    experience: '2'
  };

  // Generate session token
  const sessionToken = `${Date.now()}_${testData.userId}`;
  
  // Create the exact payload being sent
  const payload = {
    sessionId: sessionToken,
    sessionToken: sessionToken,
    timestamp: new Date().toISOString(),
    ...testData
  };

  console.log('📤 PAYLOAD BEING SENT TO N8N:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n📋 PAYLOAD KEYS:');
  console.log(Object.keys(payload));
  console.log('\n🔑 SESSION ID VALUE:');
  console.log('sessionId:', payload.sessionId);
  console.log('sessionToken:', payload.sessionToken);

  try {
    console.log('\n🚀 SENDING TO N8N...');
    
    const response = await fetch('https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 N8N RESPONSE STATUS:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ N8N RESPONSE:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ N8N ERROR:', errorText);
    }

  } catch (error) {
    console.error('💥 FETCH ERROR:', error.message);
  }
}

// Run the debug
debugN8nData(); 