# PesaPal Payment Gateway Integration

This document outlines the complete PesaPal payment gateway integration for the Linkivo React application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install crypto-js uuid
```

### 2. Environment Setup
Create a `.env` file in the frontend root directory with:
```env
REACT_APP_PESAPAL_CONSUMER_KEY=IRhT60eazvQNdsqZJSgQAwW6MY7rQqwW
REACT_APP_PESAPAL_CONSUMER_SECRET=MUkeVyj8XuNQ1VHhKLZgvIJUCtw=
REACT_APP_PESAPAL_ENVIRONMENT=sandbox
REACT_APP_PESAPAL_CALLBACK_URL=http://localhost:3000/payment/callback
REACT_APP_PESAPAL_NOTIFICATION_URL=http://localhost:3000/api/payment/ipn
```

### 3. Start the Application
```bash
npm run dev
```

## 📁 Files Created/Modified

### New Files:
- `src/services/pesapalService.js` - PesaPal API integration service
- `src/components/Checkout/CheckoutForm.jsx` - Payment checkout form
- `src/pages/PaymentCallback.jsx` - Payment callback handler
- `src/config/pesapalConfig.js` - PesaPal configuration

### Modified Files:
- `package.json` - Added dependencies
- `src/Routes/AllRoutes.jsx` - Added payment callback route

## 🔧 Integration Details

### Payment Flow:
1. User clicks "Choose Plan" button on Upgrade page
2. CheckoutForm modal opens with plan details
3. User fills in personal information
4. Form submits to PesaPal API
5. User is redirected to PesaPal payment page
6. After payment, user returns to `/payment/callback`
7. Payment status is verified and appropriate UI is shown

### API Endpoints Used:
- **Authentication**: `GET /api/Auth/RequestToken`
- **Submit Order**: `POST /api/Transactions/SubmitOrderRequest`
- **Check Status**: `GET /api/Transactions/GetTransactionStatus`

### OAuth 1.0 Implementation:
- Proper timestamp and nonce generation
- HMAC-SHA1 signature creation
- Authorization header construction

## 🎨 UI Components

### CheckoutForm Features:
- Plan summary with pricing
- User details collection
- Form validation
- Loading states
- Error handling
- Responsive design

### PaymentCallback Features:
- Payment status verification
- Success/failure/pending states
- User-friendly messaging
- Navigation options
- Cleanup of localStorage

## 🔒 Security Features

- OAuth 1.0 authentication
- Secure token handling
- Input validation
- Error boundary handling
- No sensitive data in frontend

## 🧪 Testing

### Test Cards (Sandbox):
- Use any valid card details for testing
- All transactions are simulated
- No real money is charged

### Test Flow:
1. Go to `/upgrade`
2. Click "Choose Pro" or "Choose Starter"
3. Fill in test details
4. Complete payment flow
5. Verify callback handling

## 🚨 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure backend allows frontend origin
2. **Authentication Failures**: Check consumer key/secret
3. **Callback Issues**: Verify callback URL configuration
4. **Network Errors**: Check internet connection and API endpoints

### Debug Steps:
1. Check browser console for errors
2. Verify localStorage data
3. Test API endpoints directly
4. Check network tab for failed requests

## 📝 Production Deployment

### Before Going Live:
1. Update environment to `live`
2. Replace sandbox credentials with live credentials
3. Update callback URLs to production domains
4. Test thoroughly in live environment
5. Set up proper error monitoring

### Environment Variables for Production:
```env
REACT_APP_PESAPAL_ENVIRONMENT=live
REACT_APP_PESAPAL_CALLBACK_URL=https://yourdomain.com/payment/callback
REACT_APP_PESAPAL_NOTIFICATION_URL=https://yourdomain.com/api/payment/ipn
```

## 📞 Support

For issues with this integration:
1. Check PesaPal documentation
2. Review error logs
3. Test with sandbox environment first
4. Contact PesaPal support for API issues

## 🔄 Future Enhancements

- IPN (Instant Payment Notification) handling
- Payment retry mechanism
- Subscription management
- Payment history
- Refund handling
