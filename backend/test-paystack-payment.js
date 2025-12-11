/**
 * Paystack Payment Test Script
 * 
 * This script tests the Paystack payment initialization
 * Run with: node test-paystack-payment.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Test credentials
const TEST_USER = {
  email: 'mbotipeter208@gmail.com',
  firstName: 'Peter',
  lastName: 'Karingithi',
  phone: '+254708079835'
};

const TEST_PLAN = {
  name: 'Starter',
  priceMonthly: 9.99,
  priceYearly: 99.99
};

async function testPaystackPayment() {
  console.log('🧪 Testing Paystack Payment Initialization\n');
  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Secret Key: ${PAYSTACK_SECRET_KEY ? PAYSTACK_SECRET_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(`  Currency: ${process.env.PAYSTACK_CURRENCY || 'KES'}`);
  console.log('\n');

  if (!PAYSTACK_SECRET_KEY) {
    console.error('❌ ERROR: PAYSTACK_SECRET_KEY is not set in .env file');
    process.exit(1);
  }

  // First, you need to get a JWT token by logging in
  // For this test, we'll test the direct Paystack API call
  console.log('📝 Testing Direct Paystack API Call\n');

  // Payment channels - enable all available payment methods
  const channels = ['card', 'bank', 'mobile_money', 'ussd', 'qr', 'bank_transfer'];
  
  const testData = {
    email: TEST_USER.email,
    amount: Math.round(TEST_PLAN.priceMonthly * 100), // Convert to cents (USD)
    currency: 'USD', // Use USD since plan prices are in USD and your account supports it
    reference: `TEST_${Date.now()}`,
    callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/callback`,
    channels: channels, // Enable multiple payment methods
    metadata: {
      custom_fields: [
        {
          display_name: 'First Name',
          variable_name: 'first_name',
          value: TEST_USER.firstName
        },
        {
          display_name: 'Last Name',
          variable_name: 'last_name',
          value: TEST_USER.lastName
        },
        {
          display_name: 'Phone Number',
          variable_name: 'phone',
          value: TEST_USER.phone
        },
        {
          display_name: 'Plan',
          variable_name: 'plan',
          value: TEST_PLAN.name.toLowerCase()
        }
      ]
    }
  };

  console.log('Request Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      testData,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status) {
      console.log('✅ Payment Initialization Successful!\n');
      console.log('Response:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n');
      console.log('🔗 Authorization URL:', response.data.data.authorization_url);
      console.log('📋 Reference:', response.data.data.reference);
      console.log('🔑 Access Code:', response.data.data.access_code);
    } else {
      console.error('❌ Payment Initialization Failed');
      console.error('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('\nError Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testPaystackPayment().catch(console.error);

