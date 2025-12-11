/**
 * Payment Methods Utility
 * Returns available payment methods for each currency
 */

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', icon: 'fa-solid fa-dollar-sign' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES', flag: '🇰🇪', icon: 'fa-solid fa-coins' }
];

/**
 * Get available payment methods for a currency
 * @param {string} currency - Currency code (USD, KES, etc.)
 * @returns {Array<Object>} Array of payment method objects
 */
export function getPaymentMethods(currency) {
  const methods = {
    USD: [
      { id: 'card', name: 'Credit/Debit Card', icon: 'fa-solid fa-credit-card', description: 'Visa, Mastercard, Amex' },
      { id: 'bank', name: 'Bank Transfer', icon: 'fa-solid fa-building-columns', description: 'Direct bank transfer' },
      { id: 'bank_transfer', name: 'Bank Account', icon: 'fa-solid fa-landmark', description: 'Pay from your bank account' }
    ],
    KES: [
      { id: 'card', name: 'Credit/Debit Card', icon: 'fa-solid fa-credit-card', description: 'Visa, Mastercard, Amex' },
      { id: 'mobile_money', name: 'M-Pesa', icon: 'fa-solid fa-mobile-screen-button', description: 'Mobile money payment' },
      { id: 'bank', name: 'Bank Transfer', icon: 'fa-solid fa-building-columns', description: 'Direct bank transfer' },
      { id: 'ussd', name: 'USSD', icon: 'fa-solid fa-phone', description: 'Dial * code to pay' },
      { id: 'qr', name: 'QR Code', icon: 'fa-solid fa-qrcode', description: 'Scan QR code to pay' },
      { id: 'bank_transfer', name: 'Bank Account', icon: 'fa-solid fa-landmark', description: 'Pay from your bank account' }
    ]
  };

  return methods[currency] || methods.USD;
}

/**
 * Get currency info
 * @param {string} currencyCode - Currency code
 * @returns {Object} Currency information
 */
export function getCurrencyInfo(currencyCode) {
  return CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
}

export default {
  CURRENCIES,
  getPaymentMethods,
  getCurrencyInfo
};

