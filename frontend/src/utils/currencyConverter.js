/**
 * Currency Converter Utility (Frontend)
 * Converts between USD and KES based on current exchange rates
 */

// Exchange rates (update periodically or fetch from API)
const EXCHANGE_RATES = {
  USD_TO_KES: 129.29, // 1 USD = 129.29 KES (as of Dec 9, 2024)
  KES_TO_USD: 1 / 129.29, // 1 KES = 0.0077 USD
};

/**
 * Convert USD amount to KES
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Amount in KES
 */
export function convertUSDToKES(usdAmount) {
  return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_KES * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert KES amount to USD
 * @param {number} kesAmount - Amount in KES
 * @returns {number} Amount in USD
 */
export function convertKESToUSD(kesAmount) {
  return Math.round(kesAmount * EXCHANGE_RATES.KES_TO_USD * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert amount based on target currency
 * @param {number} amount - Original amount
 * @param {string} fromCurrency - Source currency (USD or KES)
 * @param {string} toCurrency - Target currency (USD or KES)
 * @returns {number} Converted amount
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'KES') {
    return convertUSDToKES(amount);
  }

  if (fromCurrency === 'KES' && toCurrency === 'USD') {
    return convertKESToUSD(amount);
  }

  // If currencies are not USD or KES, return original amount
  return amount;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, KES, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  const symbol = currency === 'USD' ? '$' : currency === 'KES' ? 'KES ' : '';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get exchange rate
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {number} Exchange rate
 */
export function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === 'USD' && toCurrency === 'KES') {
    return EXCHANGE_RATES.USD_TO_KES;
  }
  if (fromCurrency === 'KES' && toCurrency === 'USD') {
    return EXCHANGE_RATES.KES_TO_USD;
  }
  return 1;
}

export { EXCHANGE_RATES };

export default {
  convertUSDToKES,
  convertKESToUSD,
  convertCurrency,
  formatCurrency,
  getExchangeRate,
  EXCHANGE_RATES
};

