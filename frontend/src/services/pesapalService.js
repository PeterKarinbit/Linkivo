import axios from 'axios';

// Backend API Configuration - Using relative URL to go through our proxy
const API_BASE_URL = ''; // Empty because we're using relative URLs with the proxy

// PesaPal Service Class - Frontend Implementation (calls backend)
class PesaPalService {
  constructor() {
    this.apiBaseUrl = API_BASE_URL;
  }

  // Process payment through backend
  async processPayment(plan, billing, userDetails) {
    try {
      console.log('Processing payment through backend:', { plan, billing, userDetails });
      
      // Using the proxy endpoint that routes through our backend
      const response = await axios.post(`/api/v1/ai-proxy/pesapal/process-payment`, {
        plan,
        billing,
        userDetails
      });
      
      console.log('Backend response:', response.data);
      
      if (response.data.success) {
        // Store order tracking ID for later verification
        localStorage.setItem('pesapal_order_tracking_id', response.data.orderTrackingId);
        localStorage.setItem('pesapal_order_id', response.data.orderId);
        
        return {
          success: true,
          redirectUrl: response.data.redirectUrl,
          orderTrackingId: response.data.orderTrackingId,
          orderId: response.data.orderId
        };
      } else {
        throw new Error(response.data.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get transaction status through backend
  async getTransactionStatus(orderTrackingId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/pesapal/transaction-status/${orderTrackingId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get transaction status');
      }
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Test connection through backend
  async testConnection() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/pesapal/test`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }
}

// Export singleton instance
export default new PesaPalService();