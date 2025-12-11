# Payment Flow Documentation

## Overview

This document explains the complete payment flow, including what happens when users complete payments, cancel transactions, and how subscription verification works.

## Payment Flow States

### 1. Payment Initialization
- User selects plan and fills checkout form
- Frontend calls `/api/v1/paystack/initialize`
- Backend creates transaction with Paystack
- Returns `accessCode` and `authorizationUrl`
- User is redirected to Paystack checkout

### 2. Payment Completion States

#### ✅ Success
- User completes payment on Paystack
- Paystack redirects to `/payment/callback?reference=xxx`
- Frontend verifies payment via `/api/v1/paystack/verify`
- Backend:
  - Verifies transaction with Paystack API
  - Checks transaction status is `success`
  - Validates amount matches expected amount
  - Updates user subscription in database
  - Sets subscription status to `active`
  - Sets `currentPeriodEnd` based on billing cycle
- User sees success message
- Subscription is immediately active

#### ❌ Failed
- Payment attempt failed (insufficient funds, declined card, etc.)
- Transaction status is `failed`
- No charges made
- User subscription remains unchanged
- User can retry payment

#### ⏳ Pending
- Payment is being processed (common for bank transfers, mobile money)
- Transaction status is `pending`
- User subscription remains unchanged until payment completes
- Webhook will update subscription when payment completes
- User can check status later

#### 🚫 Cancelled
- User closes payment popup/window
- User clicks cancel/back button
- No transaction reference in URL
- No charges made
- User subscription remains unchanged
- User can try again

#### ⚠️ Error
- Network error
- Paystack API error
- Invalid transaction reference
- User subscription remains unchanged
- User should contact support

## Subscription Verification

### How It Works

1. **Frontend Verification** (PaymentCallback page)
   - Gets transaction reference from URL or localStorage
   - Calls `/api/v1/paystack/verify?reference=xxx`
   - Displays appropriate status to user

2. **Backend Verification** (`/api/v1/paystack/verify`)
   - Verifies transaction with Paystack API
   - Checks transaction status
   - Validates amount matches expected amount
   - Updates subscription if payment successful
   - Returns payment status

3. **Webhook Verification** (`/api/v1/paystack/webhook`)
   - Paystack sends webhook when payment status changes
   - Verifies webhook signature (security)
   - Double-verifies transaction with Paystack API
   - Updates subscription if payment successful
   - Handles edge cases (user closes browser, network issues)

### Subscription Update Process

When payment is verified as successful:

```javascript
// 1. Find or create subscription
let subscription = await Subscription.findOne({ userId: user._id });

// 2. Update subscription
if (!subscription) {
  // Create new subscription
  subscription = new Subscription({
    userId: user._id,
    plan: planName, // 'starter' or 'pro'
    status: 'active',
    billingCycle: billingCycle, // 'monthly' or 'yearly'
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(
      Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
    ),
    cancelAtPeriodEnd: false
  });
} else {
  // Update existing subscription
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

// 3. Save subscription
await subscription.save();

// 4. Update user reference
user.subscription = subscription._id;
await user.save();
```

## Subscription Checker

### Middleware

The system uses middleware to check subscription status:

1. **`getSubscriptionStatus`** - Gets user's subscription status
   - Finds or creates subscription
   - Resets monthly usage if needed
   - Returns subscription data

2. **`requireFeatureAccess`** - Checks if user can access a feature
   - Gets user's subscription
   - Checks feature limits based on plan
   - Returns 403 if access denied

3. **`requireActiveSubscription`** - Ensures user has active subscription
   - Checks if subscription exists and is active
   - Returns 403 if no active subscription

### Subscription Status Check

```javascript
// Check if subscription is active
subscription.isActive() // Returns true if:
  - status === 'active'
  - currentPeriodEnd > new Date()
  - cancelAtPeriodEnd === false
```

### Feature Access Check

```javascript
// Check if user can access a feature
FeatureAccess.canAccessFeature(subscription, featureName)

// Returns true if:
  - Subscription is active
  - Feature is available in plan
  - Usage limits not exceeded (if applicable)
```

## Cancellation Handling

### When User Cancels Payment

1. **User closes popup/window**
   - No redirect to callback URL
   - No transaction reference
   - PaymentCallback detects no reference
   - Shows "Payment Cancelled" message

2. **User clicks cancel/back**
   - Paystack may redirect with cancelled status
   - Transaction status is `cancelled` or `abandoned`
   - PaymentCallback detects cancelled status
   - Shows "Payment Cancelled" message

3. **No charges made**
   - User's payment method is not charged
   - Subscription remains unchanged
   - User can try again

### Frontend Cancellation Detection

```javascript
// In PaymentCallback.jsx
if (!reference && !paymentData) {
  // User likely closed the popup or cancelled
  setPaymentStatus('cancelled');
  return;
}

// Check transaction status
if (transactionStatus === 'cancelled' || transactionStatus === 'reversed') {
  setPaymentStatus('cancelled');
}
```

## Webhook Events

### Supported Events

1. **`charge.success`**
   - Payment completed successfully
   - Updates subscription to active
   - Sets plan and billing cycle

2. **`charge.failed`** (Future)
   - Payment failed
   - Logs failure for analytics

3. **`charge.abandoned`** (Future)
   - User abandoned payment
   - Logs abandonment for analytics

### Webhook Security

- Verifies webhook signature using HMAC SHA512
- Double-verifies transaction with Paystack API
- Only processes verified events

## User Experience Flow

### Successful Payment
1. User completes payment → Redirected to callback
2. Payment verified → Subscription activated
3. Success message shown → User can access features

### Cancelled Payment
1. User closes popup → Redirected to callback (or stays on page)
2. No reference found → Cancelled status detected
3. Cancelled message shown → User can try again

### Failed Payment
1. Payment fails → Redirected to callback
2. Transaction status `failed` → Failed status shown
3. Error message shown → User can retry

### Pending Payment
1. Payment initiated → Redirected to callback
2. Transaction status `pending` → Pending status shown
3. Instructions shown → User can check later
4. Webhook updates subscription when payment completes

## Subscription Status Endpoints

### Get Subscription Status
```
GET /api/v1/subscription/status
Authorization: Bearer <token>
```

Returns:
```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "status": "active",
    "isActive": true,
    "currentPeriodStart": "2024-12-09T...",
    "currentPeriodEnd": "2025-01-09T...",
    "billingCycle": "monthly",
    "cancelAtPeriodEnd": false,
    "usage": {...},
    "features": [...]
  }
}
```

## Best Practices

1. **Always verify payments** - Don't trust frontend-only verification
2. **Use webhooks** - Handle edge cases where user closes browser
3. **Check subscription status** - Before granting access to features
4. **Handle cancellations gracefully** - Don't penalize users for cancelling
5. **Log all payment events** - For debugging and analytics
6. **Validate amounts** - Ensure payment amount matches expected amount
7. **Double-verify webhooks** - Always verify with Paystack API

## Troubleshooting

### Payment verified but subscription not updated
- Check webhook is configured correctly
- Check webhook signature verification
- Check database connection
- Check user ID in transaction metadata

### User sees "cancelled" but didn't cancel
- Check if popup was closed accidentally
- Check network connectivity
- Check Paystack redirect URL configuration

### Subscription not active after payment
- Check payment verification endpoint
- Check subscription update logic
- Check currentPeriodEnd date
- Check subscription status field

