import { Router } from 'express';
import paystackService from '../services/paystackService.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { Subscription } from '../models/subscription.model.js';
import { User } from '../models/user.model.js';
import { FeatureAccess } from '../utils/featureAccess.js';

const router = Router();

/**
 * Initialize a Paystack transaction
 * POST /api/paystack/initialize
 * Requires authentication
 */
router.post('/initialize', verifyJWT, async (req, res) => {
  try {
    const { plan, billing, userDetails, currency: requestedCurrency } = req.body;
    const user = req.user;

    // Validate required fields
    if (!plan || !billing || !userDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: plan, billing, userDetails'
      });
    }

    if (!userDetails.email || !userDetails.firstName || !userDetails.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required user details: email, firstName, lastName'
      });
    }

    // Validate plan
    if (!['starter', 'pro'].includes(plan.name?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be "starter" or "pro"'
      });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billing)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing cycle. Must be "monthly" or "yearly"'
      });
    }

    // Construct callback URL
    // Use the correct frontend URL - check if it's localhost:5173 (Vite dev) or the production URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const callbackUrl = `${frontendUrl}/payment/callback`;

    // Get currency from request, environment, or default to USD
    // Note: Paystack supports NGN, USD, GHS, ZAR, KES, etc.
    // This merchant account supports KES and USD only
    // Plan prices are stored in USD, but will be converted to KES if user selects KES
    const currency = requestedCurrency || process.env.PAYSTACK_CURRENCY || 'USD';
    
    // Validate currency is supported
    if (!['USD', 'KES'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: `Currency ${currency} is not supported. Please use USD or KES.`
      });
    }
    
    console.log(`Using currency: ${currency} (requested: ${requestedCurrency || 'default'}, plan prices are in USD, will be converted if needed)`);

    // Add userId to userDetails
    const enrichedUserDetails = {
      ...userDetails,
      userId: user._id.toString()
    };

    // Log the request for debugging
    console.log('Paystack initialization request:', {
      plan: plan.name,
      billing,
      email: userDetails.email,
      amount: billing === 'yearly' ? plan.priceYearly : plan.priceMonthly,
      currency
    });

    // Process payment
    const result = await paystackService.processPayment(
      plan,
      billing,
      enrichedUserDetails,
      callbackUrl,
      currency
    );

    if (result.success) {
      // Store transaction reference in user session or database for verification
      // You might want to create a Transaction model to track this
      console.log('Paystack payment initialized successfully:', {
        reference: result.reference,
        accessCode: result.accessCode ? 'present' : 'missing'
      });
      res.json({
        success: true,
        accessCode: result.accessCode,
        authorizationUrl: result.authorizationUrl,
        reference: result.reference
      });
    } else {
      console.error('Paystack payment initialization failed:', result.error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: result.error || 'Unknown error occurred'
      });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Verify a Paystack transaction
 * GET /api/paystack/verify?reference=xxx
 * Can be called without auth (for callback page) or with auth
 */
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required'
      });
    }

    // Verify transaction with Paystack
    const verificationResult = await paystackService.verifyTransaction(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification failed',
        error: verificationResult.error
      });
    }

    const transaction = verificationResult.data;

    // Check if transaction is successful
    if (transaction.status === 'success') {
      // Extract metadata
      const metadata = transaction.metadata || {};
      const userId = metadata.userId;
      const planName = metadata.plan;
      const billingCycle = metadata.billingCycle;

      if (!userId || !planName) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction metadata'
        });
      }

      // Get currency from transaction or default to NGN
      const currency = metadata.currency || 'NGN';
      
      // Verify amount matches expected amount
      const expectedAmount = paystackService.convertToLowestUnit(
        billingCycle === 'yearly' 
          ? (planName === 'starter' ? 109.99 : 279.99)
          : (planName === 'starter' ? 9.99 : 24.99),
        currency
      );

      if (parseInt(transaction.amount) !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: 'Transaction amount mismatch',
          paid: false
        });
      }

      // Update user subscription
      try {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        let subscription = await Subscription.findOne({ userId: user._id });

        if (!subscription) {
          subscription = new Subscription({
            userId: user._id,
            plan: planName,
            status: 'active',
            billingCycle: billingCycle,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
            ),
            cancelAtPeriodEnd: false
          });
        } else {
          subscription.plan = planName;
          subscription.status = 'active';
          subscription.billingCycle = billingCycle;
          subscription.currentPeriodStart = new Date();
          subscription.currentPeriodEnd = new Date(
            Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          );
          subscription.cancelAtPeriodEnd = false;
          subscription.lastPaymentDate = new Date();
        }

        await subscription.save();

        // Update user subscription reference
        user.subscription = subscription._id;
        await user.save();

        return res.json({
          success: true,
          paid: true,
          message: 'Payment verified and subscription upgraded successfully',
          transaction: {
            reference: transaction.reference,
            amount: transaction.amount / 100, // Convert back to major currency
            status: transaction.status,
            paidAt: transaction.paid_at
          },
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            currentPeriodEnd: subscription.currentPeriodEnd
          }
        });
      } catch (dbError) {
        console.error('Database error during subscription upgrade:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Payment verified but failed to upgrade subscription',
          error: dbError.message
        });
      }
    } else {
      // Transaction not successful
      return res.json({
        success: true,
        paid: false,
        message: 'Transaction not successful',
        transaction: {
          reference: transaction.reference,
          status: transaction.status
        }
      });
    }
  } catch (error) {
    console.error('Transaction verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: error.message
    });
  }
});

/**
 * Handle Paystack webhook
 * POST /api/paystack/webhook
 * No authentication required (Paystack will call this)
 */
router.post('/webhook', async (req, res) => {
  try {
    // Get signature from headers
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature
    const isValid = paystackService.verifyWebhookSignature(signature, req.body);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body;

    // Handle different event types
    if (event.event === 'charge.success') {
      const transaction = event.data;

      // Verify transaction again with Paystack API (double verification)
      const verificationResult = await paystackService.verifyTransaction(transaction.reference);

      if (!verificationResult.success || verificationResult.data.status !== 'success') {
        console.error('Transaction verification failed in webhook');
        return res.status(400).json({
          success: false,
          message: 'Transaction verification failed'
        });
      }

      const verifiedTransaction = verificationResult.data;
      const metadata = verifiedTransaction.metadata || {};
      const userId = metadata.userId;
      const planName = metadata.plan;
      const billingCycle = metadata.billingCycle;

      if (!userId || !planName) {
        console.error('Invalid transaction metadata in webhook');
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction metadata'
        });
      }

      // Update user subscription
      try {
        const user = await User.findById(userId);
        if (!user) {
          console.error('User not found in webhook:', userId);
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        let subscription = await Subscription.findOne({ userId: user._id });

        if (!subscription) {
          subscription = new Subscription({
            userId: user._id,
            plan: planName,
            status: 'active',
            billingCycle: billingCycle,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
            ),
            cancelAtPeriodEnd: false
          });
        } else {
          subscription.plan = planName;
          subscription.status = 'active';
          subscription.billingCycle = billingCycle;
          subscription.currentPeriodStart = new Date();
          subscription.currentPeriodEnd = new Date(
            Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          );
          subscription.cancelAtPeriodEnd = false;
          subscription.lastPaymentDate = new Date();
        }

        await subscription.save();

        // Update user subscription reference
        user.subscription = subscription._id;
        await user.save();

        console.log(`Subscription upgraded successfully for user ${userId} via webhook`);

        return res.json({
          success: true,
          message: 'Webhook processed successfully'
        });
      } catch (dbError) {
        console.error('Database error during webhook processing:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process webhook',
          error: dbError.message
        });
      }
    } else if (event.event === 'charge.failed' || event.event === 'charge.abandoned') {
      // Handle failed or abandoned payments
      const transaction = event.data;
      const metadata = transaction.metadata || {};
      const userId = metadata.userId;
      
      console.log(`Payment ${event.event} for user ${userId}, reference: ${transaction.reference}`);
      
      // Log for analytics - no subscription changes needed
      // User subscription remains unchanged (no charges made)
      
      return res.status(200).json({ 
        success: true,
        received: true,
        message: `Payment ${event.event} logged`
      });
    } else {
      // Handle other event types if needed
      console.log('Unhandled webhook event:', event.event);
      return res.json({
        success: true,
        message: 'Webhook received but event not handled'
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

export default router;

