# Paystack Payment Gateway Integration

This document outlines the complete Paystack payment gateway integration for the JobHunter application.

## Overview

The application uses Paystack to accept payments for subscription plan upgrades. The integration follows Paystack's best practices:

- **Backend handles all secret key operations** - Never expose secret keys in the frontend
- **Transaction verification** - All transactions are verified before upgrading subscriptions
- **Webhook support** - Handles payment confirmations even if users close the browser
- **Popup integration** - Uses Paystack Popup for seamless payment experience

## Architecture

### Frontend Flow
1. User selects a plan on the Upgrade page
2. CheckoutForm collects customer details
3. Frontend calls backend `/api/v1/ai-proxy/paystack/initialize` to initialize transaction
4. Backend returns `access_code` and `authorization_url`
5. Frontend opens Paystack Popup using the `access_code`
6. User completes payment in Paystack Popup
7. Paystack redirects to `/payment-callback?reference=xxx`
8. PaymentCallback page verifies payment via `/api/v1/ai-proxy/paystack/verify`
9. Subscription is upgraded on successful verification

### Backend Flow
1. **Initialize Transaction** (`POST /api/v1/paystack/initialize`)
   - Validates user and plan details
   - Creates transaction with Paystack API
   - Returns access_code and authorization_url
   - Stores transaction reference

2. **Verify Transaction** (`GET /api/v1/paystack/verify?reference=xxx`)
   - Verifies transaction status with Paystack
   - Checks transaction amount matches expected amount
   - Updates user subscription if payment successful
   - Returns payment status

3. **Webhook Handler** (`POST /api/v1/paystack/webhook`)
   - Receives payment events from Paystack
   - Verifies webhook signature
   - Double-verifies transaction with Paystack API
   - Updates subscription automatically

## Environment Variables

### Backend (.env)
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your Paystack secret key (starts with sk_test_ for test, sk_live_ for live)
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx   # Your Paystack public key (optional, for reference)
FRONTEND_URL=http://localhost:3000          # Frontend URL for callback
```

### Frontend (.env)
```bash
# Paystack Configuration (Optional - public key is not required for backend-only integration)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx  # Your Paystack public key (optional)
```

## Setup Instructions

### 1. Get Paystack API Keys

1. Sign up at [https://paystack.com](https://paystack.com)
2. Go to Settings > API Keys & Webhooks
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Copy your **Test Public Key** (starts with `pk_test_`)
5. For production, use **Live Keys** (starts with `sk_live_` and `pk_live_`)

### 2. Configure Backend

1. Add Paystack keys to your backend `.env` file:
```bash
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
FRONTEND_URL=http://localhost:3000
```

2. The backend service will automatically detect test vs live mode based on the key prefix.

### 3. Configure Webhook URL

1. In Paystack Dashboard, go to Settings > API Keys & Webhooks
2. Add a webhook URL: `https://yourdomain.com/api/v1/paystack/webhook`
3. For local development, use a service like [ngrok](https://ngrok.com) to expose your local server:
   ```bash
   ngrok http 5000
   # Then use the ngrok URL: https://xxxxx.ngrok.io/api/v1/paystack/webhook
   ```

### 4. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the Upgrade page and select a plan
4. Fill in the checkout form
5. Complete payment using Paystack test cards:
   - **Card Number**: 4084084084084081
   - **CVV**: 408
   - **Expiry**: Any future date
   - **PIN**: 0000 (for bank transfer)

## API Endpoints

### Initialize Transaction
**POST** `/api/v1/paystack/initialize`
- **Auth**: Required (JWT)
- **Body**:
  ```json
  {
    "plan": { "name": "starter" },
    "billing": "monthly",
    "userDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+2348123456789"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "accessCode": "xxxxx",
    "authorizationUrl": "https://checkout.paystack.com/xxxxx",
    "reference": "JOBHUNTER_xxxxx"
  }
  ```

### Verify Transaction
**GET** `/api/v1/paystack/verify?reference=xxx`
- **Auth**: Optional
- **Response**:
  ```json
  {
    "success": true,
    "paid": true,
    "transaction": {
      "reference": "xxx",
      "amount": 999,
      "status": "success"
    },
    "subscription": {
      "plan": "starter",
      "status": "active",
      "billingCycle": "monthly"
    }
  }
  ```

### Webhook
**POST** `/api/v1/paystack/webhook`
- **Auth**: Not required (Paystack calls this)
- **Headers**: `x-paystack-signature` (verified automatically)
- **Body**: Paystack webhook event

## Security Features

1. **Secret Key Protection**: Secret keys are never exposed to the frontend
2. **Webhook Signature Verification**: All webhooks are verified using HMAC SHA512
3. **Double Verification**: Transactions are verified both on callback and webhook
4. **Amount Verification**: Transaction amounts are verified before upgrading subscriptions
5. **User Validation**: User identity is validated before processing payments

## Currency Configuration

By default, the integration uses **NGN (Nigerian Naira)**. To change the currency:

1. Update `paystackService.js` in the `createTransactionData` method
2. Change the `currency` field in metadata
3. Adjust the `convertToKobo` method if needed (for currencies with different subunit values)

## Testing

### Test Cards (Paystack Test Mode)

- **Card Number**: 4084084084084081
- **CVV**: 408
- **Expiry**: Any future date
- **PIN**: 0000

### Test Scenarios

1. **Successful Payment**: Use test card above
2. **Failed Payment**: Use card number 5060666666666666666
3. **Pending Payment**: Use card number 5060666666666666667

## Troubleshooting

### Payment Popup Not Opening
- Check that Paystack script is loaded in `index.html`
- Verify `window.PaystackPop` is available
- Check browser console for errors

### Transaction Verification Fails
- Verify Paystack secret key is correct
- Check that transaction reference is valid
- Ensure webhook URL is configured correctly

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check webhook URL in Paystack dashboard
- Use ngrok for local development
- Check backend logs for webhook requests

## Files Modified/Created

### Backend
- `backend/src/services/paystackService.js` - Paystack API service
- `backend/src/routes/paystack.routes.js` - API routes
- `backend/src/app.js` - Route registration

### Frontend
- `frontend/src/services/paystackService.js` - Frontend Paystack service
- `frontend/src/components/Checkout/CheckoutForm.jsx` - Updated to use Paystack
- `frontend/src/Pages/PaymentCallback.jsx` - Updated for Paystack verification
- `frontend/index.html` - Added Paystack script

## Migration from PesaPal

If you were previously using PesaPal:
1. The PesaPal integration remains available at `/api/pesapal`
2. The frontend now uses Paystack by default
3. You can switch back by updating `CheckoutForm.jsx` imports

## Support

For Paystack-specific issues:
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Support](https://paystack.com/contact)

For integration issues:
- Check backend logs for detailed error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed

