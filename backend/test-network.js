import https from 'https';

function testConnection() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Testing network connection to OpenRouter...');
    
    const req = https.get('https://openrouter.ai/api/v1', (res) => {
      console.log(`✅ Connection successful! Status Code: ${res.statusCode}`);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      res.on('data', () => {}); // Consume the data
      resolve();
    });
    
    req.on('error', (error) => {
      console.error('❌ Connection failed:');
      console.error(error);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Connection timeout after 10 seconds'));
    });
  });
}

testConnection()
  .then(() => console.log('\n✅ Network test completed successfully!'))
  .catch((error) => console.error('\n❌ Network test failed:', error.message));
