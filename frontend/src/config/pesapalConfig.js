// PesaPal Configuration
// Note: In production, these should be moved to environment variables
export const PESAPAL_CONFIG = {
  consumerKey: 'IRhT60eazvQNdsqZJSgQAwW6MY7rQqwW',
  consumerSecret: 'MUkeVyj8XuNQ1VHhKLZgvIJUCtw=',
  environment: 'sandbox', // 'sandbox' or 'live'
  callbackUrl: 'http://localhost:3000/payment/callback',
  notificationUrl: 'http://localhost:3000/api/payment/ipn',
  sandboxUrl: 'https://cybqa.pesapal.com/pesapalv3',
  liveUrl: 'https://pay.pesapal.com/v3'
};

// Environment-specific URLs
export const getPesaPalBaseUrl = () => {
  return PESAPAL_CONFIG.environment === 'sandbox' 
    ? PESAPAL_CONFIG.sandboxUrl 
    : PESAPAL_CONFIG.liveUrl;
};
