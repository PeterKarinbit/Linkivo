# Paystack Payment Methods

## Overview

The Paystack integration now supports **multiple payment methods** beyond just card payments. Users can choose from:

- 💳 **Card Payments** - Credit/Debit cards (Visa, Mastercard, etc.)
- 🏦 **Bank Transfer** - Direct bank transfers
- 📱 **Mobile Money** - M-Pesa (Kenya), MTN Mobile Money (Ghana)
- 📞 **USSD** - Dial a code on mobile phone
- 📷 **QR Codes** - Scan to pay (South Africa)

## How It Works

When a user initiates a payment, Paystack's checkout page will automatically show all available payment methods based on:

1. **Currency** - Different currencies support different payment methods
2. **Account Configuration** - Your Paystack account settings
3. **Regional Availability** - Payment methods vary by country

## Payment Channels by Currency

### USD (US Dollars)
- ✅ Card
- ✅ Bank Transfer
- ✅ Bank Account

### KES (Kenyan Shillings)
- ✅ Card
- ✅ Bank Transfer
- ✅ Mobile Money (M-Pesa)
- ✅ USSD
- ✅ QR Codes

### NGN (Nigerian Naira)
- ✅ Card
- ✅ Bank Transfer
- ✅ USSD
- ✅ QR Codes

### GHS (Ghana Cedis)
- ✅ Card
- ✅ Bank Transfer
- ✅ Mobile Money

### ZAR (South African Rand)
- ✅ Card
- ✅ Bank Transfer
- ✅ QR Codes

## Implementation

The payment channels are automatically enabled based on the currency:

```javascript
// In paystackService.js
getPaymentChannels(currency) {
  if (currency === 'KES') {
    return ['card', 'bank', 'mobile_money', 'ussd', 'qr', 'bank_transfer'];
  } else if (currency === 'USD') {
    return ['card', 'bank', 'bank_transfer'];
  }
  // ... other currencies
}
```

## User Experience

1. User clicks "Proceed to Payment"
2. Paystack checkout page opens
3. User sees all available payment methods for their currency
4. User selects their preferred payment method
5. Payment is processed through the selected method
6. User is redirected back to your app

## Testing

To test different payment methods:

1. **Card Payment**: Use test card numbers from Paystack dashboard
2. **Mobile Money**: Use a real mobile money number (M-Pesa, etc.)
3. **Bank Transfer**: Follow Paystack's bank transfer instructions
4. **USSD**: Dial the USSD code provided by Paystack

## Notes

- Payment methods are automatically determined by Paystack based on currency and account settings
- Not all payment methods are available in all regions
- Some payment methods may require additional verification
- Mobile money and USSD are typically faster than bank transfers

## Support

For questions about payment methods:
- Check Paystack Dashboard → Settings → Payment Methods
- Review [Paystack Payment Channels Documentation](https://paystack.com/docs/payments/payment-channels/)
- Contact Paystack Support for account-specific questions

