import axios from 'axios';

// Backend API Configuration
const API_BASE_URL = ''; // Empty because we're using relative URLs with the proxy

// Paystack Service Class - Frontend Implementation
class PaystackService {
  constructor() {
    this.apiBaseUrl = API_BASE_URL;
    this.publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  }

  /**
   * Initialize payment transaction
   * @param {Object} plan - Subscription plan
   * @param {string} billing - Billing cycle ('monthly' or 'yearly')
   * @param {Object} userDetails - User details (firstName, lastName, email, phone)
   * @param {string} currency - Currency code (USD, KES, etc.) - defaults to USD
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(plan, billing, userDetails, currency = 'USD') {
    try {
      console.log('Initializing Paystack payment:', { plan, billing, userDetails, currency });
      
      // Call backend to initialize transaction
      // Note: Using direct API path since paystack routes are registered at /api/v1/paystack
      const response = await axios.post(`/api/v1/paystack/initialize`, {
        plan,
        billing,
        userDetails,
        currency // Send selected currency to backend
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Backend response:', response.data);
      
      if (response.data.success) {
        // Store transaction reference for later verification
        localStorage.setItem('paystack_reference', response.data.reference);
        localStorage.setItem('paystack_plan', plan.name);
        localStorage.setItem('paystack_billing', billing);
        
        return {
          success: true,
          accessCode: response.data.accessCode,
          authorizationUrl: response.data.authorizationUrl,
          reference: response.data.reference
        };
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initialize payment'
      };
    }
  }

  /**
   * Verify payment transaction
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} Transaction verification result
   */
  async verifyPayment(reference) {
    try {
      const response = await axios.get(`/api/v1/paystack/verify`, {
        params: { reference }
      });
      
      if (response.data.success) {
        return {
          success: true,
          paid: response.data.paid || false,
          transaction: response.data.transaction,
          subscription: response.data.subscription,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        paid: false,
        error: error.response?.data?.message || error.message || 'Failed to verify payment'
      };
    }
  }

  /**
   * Open Paystack Popup for payment
   * @param {string} accessCode - Access code from transaction initialization
   * @returns {Promise<Object>} Payment result
   */
  async openPaystackPopup(accessCode) {
    return new Promise((resolve, reject) => {
      try {
        // Check if PaystackPop is available
        if (typeof window === 'undefined' || !window.PaystackPop) {
          reject(new Error('Paystack Popup library not loaded. Please ensure the Paystack script is included.'));
          return;
        }

        const popup = new window.PaystackPop();
        
        // Resume transaction with access code
        popup.resumeTransaction(accessCode);
        
        // Note: Paystack Popup handles the payment flow internally
        // We'll verify the payment after the callback redirect
        // This is a simplified implementation - in production, you might want to
        // listen for payment completion events if Paystack provides them
        
        resolve({
          success: true,
          message: 'Payment popup opened'
        });
      } catch (error) {
        console.error('Error opening Paystack popup:', error);
        reject(error);
      }
    });
  }

  /**
   * Clear stored payment data
   */
  clearPaymentData() {
    localStorage.removeItem('paystack_reference');
    localStorage.removeItem('paystack_plan');
    localStorage.removeItem('paystack_billing');
  }

  /**
   * Get stored payment reference
   * @returns {string|null} Transaction reference
   */
  getStoredReference() {
    return localStorage.getItem('paystack_reference');
  }
}

export default new PaystackService();

