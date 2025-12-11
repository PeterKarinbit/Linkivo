/**
 * Currency Conversion Test Script
 * Tests USD to KES conversion
 */

import { 
  convertUSDToKES, 
  convertKESToUSD, 
  convertCurrency, 
  formatCurrency,
  getExchangeRate,
  EXCHANGE_RATES 
} from './src/utils/currencyConverter.js';

console.log('🧪 Testing Currency Conversion\n');
console.log('Exchange Rates:');
console.log(`  1 USD = ${EXCHANGE_RATES.USD_TO_KES} KES`);
console.log(`  1 KES = ${EXCHANGE_RATES.KES_TO_USD.toFixed(6)} USD\n`);

// Test plan prices
const plans = [
  { name: 'Starter', priceMonthly: 9.99, priceYearly: 109.99 },
  { name: 'Pro', priceMonthly: 24.99, priceYearly: 279.99 }
];

console.log('📊 Plan Prices Conversion:\n');

plans.forEach(plan => {
  console.log(`${plan.name} Plan:`);
  console.log(`  Monthly: ${formatCurrency(plan.priceMonthly, 'USD')} = ${formatCurrency(convertUSDToKES(plan.priceMonthly), 'KES')}`);
  console.log(`  Yearly:  ${formatCurrency(plan.priceYearly, 'USD')} = ${formatCurrency(convertUSDToKES(plan.priceYearly), 'KES')}`);
  console.log('');
});

// Test specific conversion
console.log('🔢 Specific Conversions:\n');
const testAmounts = [9.99, 24.99, 109.99, 279.99];

testAmounts.forEach(amount => {
  const kesAmount = convertUSDToKES(amount);
  console.log(`${formatCurrency(amount, 'USD')} = ${formatCurrency(kesAmount, 'KES')}`);
});

console.log('\n✅ Currency conversion test complete!');

