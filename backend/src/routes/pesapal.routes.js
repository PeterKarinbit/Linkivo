import express from 'express';
import pesapalService from '../services/pesapalService.js';

const router = express.Router();

// Test PesaPal connection
router.get('/test', async (req, res) => {
  try {
    const result = await pesapalService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test PesaPal connection',
      error: error.message
    });
  }
});

// Process payment
router.post('/process-payment', async (req, res) => {
  try {
    const { plan, billing, userDetails } = req.body;
    
    // Validate required fields
    if (!plan || !billing || !userDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: plan, billing, userDetails'
      });
    }

    if (!userDetails.firstName || !userDetails.lastName || !userDetails.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required user details: firstName, lastName, email'
      });
    }

    const result = await pesapalService.processPayment(plan, billing, userDetails);
    res.json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
});

// Get transaction status
router.get('/transaction-status/:orderTrackingId', async (req, res) => {
  try {
    const { orderTrackingId } = req.params;
    
    if (!orderTrackingId) {
      return res.status(400).json({
        success: false,
        message: 'Order tracking ID is required'
      });
    }

    const result = await pesapalService.getTransactionStatus(orderTrackingId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction status',
      error: error.message
    });
  }
});

// Handle IPN (Instant Payment Notification)
router.post('/ipn', async (req, res) => {
  try {
    const { order_tracking_id, payment_status } = req.body;
    
    console.log('IPN received:', { order_tracking_id, payment_status });
    
    // Here you would typically:
    // 1. Verify the IPN with PesaPal
    // 2. Update your database
    // 3. Send confirmation emails
    // 4. Update user subscription status
    
    // For now, just log and acknowledge
    res.status(200).json({
      success: true,
      message: 'IPN received successfully'
    });
  } catch (error) {
    console.error('IPN handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle IPN',
      error: error.message
    });
  }
});

export default router;
