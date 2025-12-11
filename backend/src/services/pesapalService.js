import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// PesaPal Configuration
const PESAPAL_CONFIG = {
  consumerKey: 'IRhT60eazvQNdsqZJSgQAwW6MY7rQqwW',
  consumerSecret: 'MUkeVyj8XuNQ1VHhKLZgvIJUCtw=',
  environment: 'sandbox', // 'sandbox' or 'live'
  callbackUrl: 'http://localhost:3000/payment/callback',
  notificationUrl: 'http://localhost:3000/api/payment/ipn',
  sandboxUrl: 'https://cybqa.pesapal.com/pesapalv3',
  liveUrl: 'https://pay.pesapal.com/v3'
};

// Get the appropriate base URL based on environment
const getBaseUrl = () => {
  return PESAPAL_CONFIG.environment === 'sandbox' 
    ? PESAPAL_CONFIG.sandboxUrl 
    : PESAPAL_CONFIG.liveUrl;
};

// PesaPal Service Class - Backend Implementation
class PesaPalService {
  constructor() {
    this.baseUrl = getBaseUrl();
    this.consumerKey = PESAPAL_CONFIG.consumerKey;
    this.consumerSecret = PESAPAL_CONFIG.consumerSecret;
  }

  // Get authentication token using JWT (PesaPal API v3.0)
  async getAuthToken() {
    try {
      const url = `${this.baseUrl}/api/Auth/RequestToken`;
      
      // PesaPal API v3.0 uses simple consumer key/secret authentication
      const authString = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${authString}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting PesaPal auth token:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with PesaPal: ${error.response?.data?.message || error.message}`);
    }
  }

  // Submit payment order
  async submitOrder(orderData) {
    try {
      // Get authentication token first
      const authResponse = await this.getAuthToken();
      const token = authResponse.token;

      const url = `${this.baseUrl}/api/Transactions/SubmitOrderRequest`;
      
      const response = await axios.post(url, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting PesaPal order:', error.response?.data || error.message);
      throw new Error(`Failed to submit payment order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get transaction status
  async getTransactionStatus(orderTrackingId) {
    try {
      const url = `${this.baseUrl}/api/Transactions/GetTransactionStatus`;
      
      // Get fresh token for status check
      const authResponse = await this.getAuthToken();
      const token = authResponse.token;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {
          orderTrackingId: orderTrackingId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting transaction status:', error.response?.data || error.message);
      throw new Error(`Failed to get transaction status: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create payment order data - CORRECTED FORMAT
  createOrderData(plan, billing, userDetails) {
    const orderId = `LINKIVO_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const amount = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    
    // PesaPal API v3.0 expects this specific format
    return {
      id: orderId,
      currency: 'USD',
      amount: amount,
      description: `${plan.name} Plan - ${billing === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      callback_url: PESAPAL_CONFIG.callbackUrl,
      cancellation_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/upgrade`,
      notification_id: PESAPAL_CONFIG.notificationUrl,
      billing_address: {
        phone_number: userDetails.phone || '254712345678',
        email_address: userDetails.email,
        country_code: 'KE',
        first_name: userDetails.firstName,
        middle_name: '',
        last_name: userDetails.lastName,
        line_1: '123 Main St',
        line_2: '',
        city: 'Nairobi',
        state: '',
        postal_code: '00100',
        zip_code: '00100'
      }
    };
  }

  // Process payment
  async processPayment(plan, billing, userDetails) {
    try {
      const orderData = this.createOrderData(plan, billing, userDetails);
      console.log('Submitting order data:', orderData);
      
      const response = await this.submitOrder(orderData);
      console.log('PesaPal response:', response);
      
      return {
        success: true,
        redirectUrl: response.redirect_url,
        orderTrackingId: response.order_tracking_id,
        orderId: orderData.id
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test connection to PesaPal
  async testConnection() {
    try {
      const token = await this.getAuthToken();
      return {
        success: true,
        message: 'Connection successful',
        token: token.token ? 'Token received' : 'No token'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default new PesaPalService();
