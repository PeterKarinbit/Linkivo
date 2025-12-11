# Paystack Setup Instructions

## Quick Setup

### 1. Add Paystack Keys to Backend `.env`

Add these lines to your `backend/.env` file:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXX
PAYSTACK_PUBLIC_KEY=pk_live_XXXXXXXXXXXXXXXXXXXX
PAYSTACK_CURRENCY=USD  # Your account supports KES and USD. Using USD since plan prices are in USD.
FRONTEND_URL=http://localhost:5173
```

**Important:** Your Paystack account only supports **KES** (Kenyan Shillings) and **USD**. The default currency is set to **USD** since plan prices are in USD.

### 2. Restart Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

### 3. Test Payment

#### Option A: Test via Backend Script

Run the test script to verify Paystack integration:

```bash
cd backend
node test-paystack-payment.js
```

This will test the direct Paystack API call with your credentials.

#### Option B: Test via Frontend

1. Go to the Upgrade page
2. Select a plan (Starter or Pro)
3. Fill in the checkout form:
   - Email: mbotipeter208@gmail.com
   - Phone: +254708079835
4. Click "Proceed to Payment"
5. Complete payment on Paystack

**Note:** Amounts will be in USD (US Dollars). For example, $9.99 = 999 cents (9.99 * 100 cents).

## Troubleshooting

### If you get a 500 error:

1. **Check backend logs** - Look for error messages about Paystack
2. **Verify environment variables** - Make sure `PAYSTACK_SECRET_KEY` is set
3. **Check backend is running** - Ensure backend is running on port 3000
4. **Check network** - Ensure backend can reach `https://api.paystack.co`

### Common Issues:

- **"Paystack secret key is not configured"** → Add `PAYSTACK_SECRET_KEY` to backend `.env`
- **"Invalid Paystack API key"** → Check that your secret key is correct
- **"Unable to connect to Paystack"** → Check internet connection and firewall

## Test Payment Details

For testing with your number (+254708079835), the payment will be processed through Paystack's live environment. Make sure you're using the correct test/live keys.

## Security Note

⚠️ **Never commit your `.env` file to git!** The keys shown above are for reference only. Keep them secure.

