// Test script for PesaPal integration
import pesapalService from './src/services/pesapalService.js';

async function testPesaPal() {
  console.log('🧪 Testing PesaPal Integration...\n');
  
  try {
    // Test 1: Connection Test
    console.log('1️⃣ Testing PesaPal Connection...');
    const connectionResult = await pesapalService.testConnection();
    console.log('✅ Connection Result:', connectionResult);
    
    // Test 2: Sample Payment Data
    console.log('\n2️⃣ Testing Payment Processing...');
    const samplePlan = {
      name: 'Pro',
      priceMonthly: 24.99,
      priceYearly: 279.99
    };
    
    const sampleUserDetails = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '254712345678'
    };
    
    const paymentResult = await pesapalService.processPayment(samplePlan, 'monthly', sampleUserDetails);
    console.log('✅ Payment Result:', paymentResult);
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPesaPal();
