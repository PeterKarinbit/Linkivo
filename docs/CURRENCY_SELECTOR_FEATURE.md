# Currency Selector Feature

## Overview

Users can now choose their preferred payment currency in the checkout form, and the system will automatically:
- Display available payment methods based on the selected currency
- Convert prices to the selected currency
- Show payment method options (e.g., M-Pesa for KES, Card for USD)

## Features

### 1. Currency Selection
- **USD (US Dollar)** - Default currency
- **KES (Kenyan Shilling)** - For Kenyan users who want to use M-Pesa

### 2. Dynamic Payment Methods Display

When a user selects a currency, they see all available payment methods for that currency:

**USD Payment Methods:**
- 💳 Credit/Debit Card
- 🏦 Bank Transfer
- 🏛️ Bank Account

**KES Payment Methods:**
- 💳 Credit/Debit Card
- 📱 M-Pesa (Mobile Money)
- 🏦 Bank Transfer
- 📞 USSD
- 📷 QR Code
- 🏛️ Bank Account

### 3. Automatic Price Conversion

- Plan prices are stored in USD
- When KES is selected, prices are automatically converted using current exchange rates
- Exchange rate: 1 USD = 129.29 KES (as of Dec 9, 2024)

### 4. Real-time Updates

- Payment methods update instantly when currency changes
- Prices update automatically with currency conversion
- Order summary reflects the selected currency

## User Experience

1. **User opens checkout form**
   - Default currency: USD
   - Shows USD payment methods

2. **User selects KES**
   - Payment methods update to show M-Pesa, USSD, QR codes
   - Prices convert from USD to KES
   - Order summary shows KES amounts

3. **User proceeds to payment**
   - Selected currency is sent to backend
   - Paystack checkout shows appropriate payment methods
   - Payment processes in selected currency

## Technical Implementation

### Frontend Changes

**New Files:**
- `frontend/src/utils/paymentMethods.js` - Payment methods configuration
- `frontend/src/utils/currencyConverter.js` - Currency conversion utilities

**Updated Files:**
- `frontend/src/components/Checkout/CheckoutForm.jsx` - Added currency selector UI
- `frontend/src/services/paystackService.js` - Accepts currency parameter

### Backend Changes

**Updated Files:**
- `backend/src/routes/paystack.routes.js` - Accepts currency from request
- `backend/src/services/paystackService.js` - Already configured to handle different currencies

## Currency Conversion

The system uses a fixed exchange rate that can be updated:

```javascript
USD_TO_KES: 129.29  // 1 USD = 129.29 KES
```

To update the exchange rate:
1. Edit `frontend/src/utils/currencyConverter.js`
2. Edit `backend/src/utils/currencyConverter.js`
3. Update the `EXCHANGE_RATES` constant

## Example Flow

### USD Payment
1. User selects USD
2. Sees: Card, Bank Transfer, Bank Account
3. Price: $9.99
4. Proceeds to Paystack checkout
5. Paystack shows: Card, Bank Transfer options

### KES Payment
1. User selects KES
2. Sees: Card, M-Pesa, Bank Transfer, USSD, QR Code, Bank Account
3. Price: KES 1,291.51 (converted from $9.99)
4. Proceeds to Paystack checkout
5. Paystack shows: Card, M-Pesa, Bank Transfer, USSD, QR Code options

## Benefits

1. **Better User Experience**
   - Users can pay in their local currency
   - See payment methods relevant to their region

2. **Increased Conversion**
   - Kenyan users can use M-Pesa (very popular in Kenya)
   - No need to have a card to pay

3. **Transparency**
   - Users see exactly what payment methods are available
   - Clear currency conversion

4. **Flexibility**
   - Easy to add more currencies in the future
   - Payment methods automatically configured per currency

## Future Enhancements

1. **Auto-detect Currency**
   - Detect user's location and suggest currency
   - Pre-select currency based on phone number country code

2. **More Currencies**
   - Add NGN (Nigerian Naira)
   - Add GHS (Ghanaian Cedis)
   - Add ZAR (South African Rand)

3. **Dynamic Exchange Rates**
   - Fetch exchange rates from API
   - Update rates periodically

4. **Payment Method Icons**
   - Better visual representation
   - Icons for each payment method

## Testing

To test the feature:

1. **USD Payment:**
   - Select USD in checkout
   - Verify payment methods shown (Card, Bank Transfer)
   - Verify price in USD
   - Complete payment

2. **KES Payment:**
   - Select KES in checkout
   - Verify payment methods shown (Card, M-Pesa, USSD, QR, etc.)
   - Verify price converted to KES
   - Complete payment with M-Pesa

## Notes

- Exchange rates are fixed and should be updated periodically
- Paystack will filter payment methods based on account configuration
- Not all payment methods may be available even if shown (depends on Paystack account settings)
- Currency conversion happens on the frontend for display, backend handles actual payment currency

