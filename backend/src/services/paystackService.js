import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { convertCurrency } from '../utils/currencyConverter.js';

// Paystack Configuration
const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  baseUrl: 'https://api.paystack.co',
  // Use test keys if secret key starts with sk_test, otherwise use live
  isTestMode: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test') || false,
};

// Paystack Service Class - Backend Implementation
class PaystackService {
  constructor() {
    this.baseUrl = PAYSTACK_CONFIG.baseUrl;
    this.secretKey = PAYSTACK_CONFIG.secretKey;
    this.publicKey = PAYSTACK_CONFIG.publicKey;
    
    // Validate that secret key is set
    if (!this.secretKey) {
      console.warn('⚠️ PAYSTACK_SECRET_KEY is not set. Payment initialization will fail.');
    }
  }

  /**
   * Get payment channels based on currency
   * @param {string} currency - Currency code (USD, KES, etc.)
   * @returns {Array<string>} Array of payment channel codes
   */
  getPaymentChannels(currency) {
    // According to Paystack docs, channels parameter enables payment methods in checkout
    // Available channels: card, bank, bank_transfer, mobile_money, ussd, qr, eft
    // Note: Not all channels work for all currencies - Paystack will filter based on account settings
    
    // For USD: Typically only card and bank_transfer are available
    // For KES: Mobile money (M-Pesa), USSD, QR codes are available
    // For NGN: USSD, QR codes, bank accounts
    // For GHS: Mobile money
    // For ZAR: QR codes, EFT
    
    if (currency === 'KES') {
      // Kenya: Enable all available channels - Paystack will show what's configured
      return ['card', 'bank', 'mobile_money', 'ussd', 'qr', 'bank_transfer'];
    } else if (currency === 'NGN') {
      // Nigeria: Bank transfer, USSD, QR
      return ['card', 'bank', 'ussd', 'qr', 'bank_transfer'];
    } else if (currency === 'GHS') {
      // Ghana: Mobile money, Bank transfer
      return ['card', 'bank', 'mobile_money', 'bank_transfer'];
    } else if (currency === 'ZAR') {
      // South Africa: QR codes, EFT
      return ['card', 'bank', 'qr', 'eft', 'bank_transfer'];
    } else if (currency === 'USD') {
      // USD: Card, Bank transfer (mobile money not typically available for USD)
      // But include all to let Paystack filter based on account configuration
      return ['card', 'bank', 'bank_transfer'];
    }
    
    // Default: Enable all common channels - Paystack will filter based on what's available
    return ['card', 'bank', 'bank_transfer'];
  }

  /**
   * Initialize a transaction
   * @param {Object} transactionData - Transaction details
   * @param {string} transactionData.email - Customer email
   * @param {number} transactionData.amount - Amount in kobo (lowest currency unit)
   * @param {string} transactionData.reference - Unique transaction reference
   * @param {string} transactionData.callback_url - Callback URL after payment
   * @param {Object} transactionData.metadata - Additional metadata
   * @returns {Promise<Object>} Transaction initialization response
   */
  async initializeTransaction(transactionData) {
    try {
      // Check if secret key is configured
      if (!this.secretKey) {
        throw new Error('Paystack secret key is not configured. Please set PAYSTACK_SECRET_KEY environment variable.');
      }
      
      const url = `${this.baseUrl}/transaction/initialize`;
      
      // Get payment channels based on currency
      const currency = transactionData.currency || 'USD';
      const channels = this.getPaymentChannels(currency);
      
      console.log(`💳 Payment channels enabled for ${currency}:`, channels);
      console.log(`📝 Note: Paystack will filter channels based on account configuration and currency support`);
      
      const payload = {
        email: transactionData.email,
        amount: transactionData.amount, // Amount in kobo/cents (lowest currency unit)
        currency: currency,
        reference: transactionData.reference || `REF_${Date.now()}_${uuidv4().substring(0, 8)}`,
        callback_url: transactionData.callback_url,
        channels: channels, // Enable multiple payment methods (card, bank, mobile_money, ussd, qr, etc.)
        // Note: Paystack will automatically show only the payment methods that are:
        // 1. Enabled in your Paystack dashboard
        // 2. Available for the currency (e.g., mobile_money only works with KES, not USD)
        // 3. Supported in your region
        metadata: {
          ...transactionData.metadata,
          custom_fields: [
            {
              display_name: 'First Name',
              variable_name: 'first_name',
              value: transactionData.metadata?.firstName || ''
            },
            {
              display_name: 'Last Name',
              variable_name: 'last_name',
              value: transactionData.metadata?.lastName || ''
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone',
              value: transactionData.metadata?.phone || ''
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: transactionData.metadata?.plan || ''
            },
            {
              display_name: 'Billing Cycle',
              variable_name: 'billing_cycle',
              value: transactionData.metadata?.billingCycle || ''
            }
          ]
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Failed to initialize transaction');
      }
    } catch (error) {
      console.error('Error initializing Paystack transaction:', error.response?.data || error.message);
      console.error('Full error:', error);
      
      // Provide more helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid Paystack API key. Please check your PAYSTACK_SECRET_KEY environment variable.');
      } else if (error.response?.status === 400) {
        throw new Error(`Paystack API error: ${error.response?.data?.message || 'Invalid request parameters'}`);
      } else if (!error.response) {
        throw new Error('Unable to connect to Paystack. Please check your internet connection and try again.');
      }
      
      throw new Error(`Failed to initialize transaction: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify a transaction
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Transaction verification response
   */
  async verifyTransaction(reference) {
    try {
      const url = `${this.baseUrl}/transaction/verify/${reference}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Failed to verify transaction');
      }
    } catch (error) {
      console.error('Error verifying Paystack transaction:', error.response?.data || error.message);
      throw new Error(`Failed to verify transaction: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature from Paystack
   * @param {Object} body - Request body
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(signature, body) {
    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(body))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Convert amount to lowest currency unit (kobo for NGN, cents for USD, etc.)
   * @param {number} amount - Amount in major currency unit (e.g., dollars)
   * @param {string} currency - Currency code (NGN, USD, GHS, ZAR, etc.)
   * @returns {number} Amount in lowest currency unit
   */
  convertToLowestUnit(amount, currency = 'USD') {
    // For KES (Kenyan Shillings), 1 KES = 100 cents
    // For USD, 1 USD = 100 cents
    // For NGN (Naira), 1 NGN = 100 kobo
    // For GHS (Ghana Cedis), 1 GHS = 100 pesewas
    // For ZAR (South African Rand), 1 ZAR = 100 cents
    // Most currencies use 100 as the multiplier
    return Math.round(amount * 100);
  }

  /**
   * Create transaction data for payment processing
   * @param {Object} plan - Subscription plan
   * @param {string} billing - Billing cycle ('monthly' or 'yearly')
   * @param {Object} userDetails - User details
   * @param {string} callbackUrl - Callback URL
   * @returns {Object} Transaction data
   */
  createTransactionData(plan, billing, userDetails, callbackUrl, currency = 'USD') {
    // Plan prices are stored in USD, convert if needed
    const usdAmount = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    
    // Convert to target currency if different from USD
    const amount = currency === 'USD' 
      ? usdAmount 
      : convertCurrency(usdAmount, 'USD', currency);
    
    const reference = `JOBHUNTER_${Date.now()}_${uuidv4().substring(0, 8).toUpperCase()}`;
    
    return {
      email: userDetails.email,
      amount: this.convertToLowestUnit(amount, currency), // Convert to lowest currency unit
      currency: currency,
      reference: reference,
      callback_url: callbackUrl,
      metadata: {
        userId: userDetails.userId || '',
        plan: plan.name.toLowerCase(),
        billingCycle: billing,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        phone: userDetails.phone,
        amount: amount.toString(),
        originalAmountUSD: usdAmount.toString(), // Store original USD amount
        currency: currency
      }
    };
  }

  /**
   * Process payment - Initialize transaction
   * @param {Object} plan - Subscription plan
   * @param {string} billing - Billing cycle
   * @param {Object} userDetails - User details
   * @param {string} callbackUrl - Callback URL
   * @param {string} currency - Currency code (default: 'NGN')
   * @returns {Promise<Object>} Payment processing result
   */
  async processPayment(plan, billing, userDetails, callbackUrl, currency = 'USD') {
    try {
      console.log('Processing payment with Paystack:', {
        plan: plan.name,
        billing,
        email: userDetails.email,
        phone: userDetails.phone,
        currency,
        hasSecretKey: !!this.secretKey
      });
      
      const transactionData = this.createTransactionData(plan, billing, userDetails, callbackUrl, currency);
      console.log('Transaction data created:', {
        amount: transactionData.amount,
        currency: transactionData.currency,
        reference: transactionData.reference,
        callback_url: transactionData.callback_url
      });
      
      const result = await this.initializeTransaction(transactionData);
      
      if (!result.data) {
        throw new Error('Paystack API returned invalid response');
      }
      
      return {
        success: true,
        accessCode: result.data.access_code,
        authorizationUrl: result.data.authorization_url,
        reference: transactionData.reference
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new PaystackService();

