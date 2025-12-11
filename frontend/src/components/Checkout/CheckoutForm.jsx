import React, { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import paystackService from '../../services/paystackService';
import { countryPhoneCodesSorted } from '../../data/countryPhoneCodes';
import { CURRENCIES, getPaymentMethods, getCurrencyInfo } from '../../utils/paymentMethods';
import { convertCurrency, formatCurrency } from '../../utils/currencyConverter';

const CheckoutForm = ({ plan, billing, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '' // This will now typically be constructed from countryCode + localNumber
  });

  // Phone handling
  const [countryCode, setCountryCode] = useState('+254');
  const [localNumber, setLocalNumber] = useState('');

  // Currency selection
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(getPaymentMethods('USD'));

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('form'); // 'form', 'processing', 'redirecting'

  /* Update formData.phone whenever components change */
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, phone: `${countryCode}${localNumber}` }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  }, [countryCode, localNumber]);

  /* Update payment methods when currency changes */
  React.useEffect(() => {
    setAvailablePaymentMethods(getPaymentMethods(selectedCurrency));
  }, [selectedCurrency]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!localNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]+$/.test(localNumber.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (digits only)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setStep('processing');

    try {
      // Initialize payment with Paystack (include currency)
      const result = await paystackService.initializePayment(plan, billing, formData, selectedCurrency);

      if (result.success && result.accessCode) {
        // Store payment details for callback page
        localStorage.setItem('payment_details', JSON.stringify({
          plan: plan.name,
          billing,
          amount: billing === 'yearly' ? plan.priceYearly : plan.priceMonthly,
          userDetails: formData,
          reference: result.reference,
          timestamp: new Date().toISOString()
        }));

        // Check if Paystack Popup is available
        if (typeof window !== 'undefined' && window.PaystackPop) {
          setStep('redirecting');
          
          // Store reference for cancellation detection
          const paymentReference = result.reference;
          let popupCheckInterval = null;
          let hasRedirected = false;
          
          // Listen for page visibility changes (user might close popup and come back)
          const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && !hasRedirected) {
              // User came back to the page - check if payment was completed
              setTimeout(async () => {
                // Only check if we're still on the checkout page (not redirected)
                if (window.location.pathname !== '/payment/callback') {
                  try {
                    const verifyResult = await paystackService.verifyPayment(paymentReference);
                    
                    if (verifyResult.success && verifyResult.paid) {
                          // Payment was completed - redirect to callback
                          hasRedirected = true;
                          window.location.href = `/payment/callback?reference=${paymentReference}`;
                        } else {
                          // Payment was cancelled or not completed
                          setStep('form');
                          setIsLoading(false);
                          setErrors({
                            submit: 'Payment was cancelled. No charges were made. You can try again when ready.'
                          });
                          // Clean up
                          if (popupCheckInterval) clearInterval(popupCheckInterval);
                          document.removeEventListener('visibilitychange', handleVisibilityChange);
                        }
                  } catch (verifyError) {
                    // Payment was cancelled or error occurred
                    setStep('form');
                    setIsLoading(false);
                    setErrors({
                      submit: 'Payment was cancelled. No charges were made. You can try again when ready.'
                    });
                    // Clean up
                    if (popupCheckInterval) clearInterval(popupCheckInterval);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                  }
                }
              }, 2000);
            }
          };
          
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // Open Paystack Popup
          setTimeout(() => {
            try {
              const popup = new window.PaystackPop();
              popup.resumeTransaction(result.accessCode);
              
              // Set up periodic check for popup status (fallback)
              popupCheckInterval = setInterval(async () => {
                // Check if we've been redirected to callback
                if (window.location.pathname === '/payment/callback') {
                  hasRedirected = true;
                  clearInterval(popupCheckInterval);
                  document.removeEventListener('visibilitychange', handleVisibilityChange);
                  return;
                }
                
                // Check payment status periodically (every 5 seconds)
                try {
                  const verifyResult = await paystackService.verifyPayment(paymentReference);
                  
                  if (verifyResult.success && verifyResult.paid) {
                    // Payment completed - redirect
                    hasRedirected = true;
                    clearInterval(popupCheckInterval);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.location.href = `/payment/callback?reference=${paymentReference}`;
                  }
                } catch (error) {
                  // Ignore errors during periodic check
                }
              }, 5000);
              
              // Clean up after 5 minutes (timeout)
              setTimeout(() => {
                if (popupCheckInterval) {
                  clearInterval(popupCheckInterval);
                  document.removeEventListener('visibilitychange', handleVisibilityChange);
                }
              }, 5 * 60 * 1000);
              
              // Note: Paystack Popup will handle the payment flow
              // After payment, user will be redirected to callback URL
              // We'll verify the payment on the callback page
            } catch (popupError) {
              console.error('Error opening Paystack popup:', popupError);
              // Clean up listeners
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              if (popupCheckInterval) clearInterval(popupCheckInterval);
              
              // Fallback to redirect if popup fails
              if (result.authorizationUrl) {
                window.location.href = result.authorizationUrl;
              } else {
                throw new Error('Failed to open payment popup');
              }
            }
          }, 1000);
        } else if (result.authorizationUrl) {
          // Fallback to redirect if popup is not available
          setStep('redirecting');
          setTimeout(() => {
            window.location.href = result.authorizationUrl;
          }, 2000);
        } else {
          throw new Error('Payment initialization failed - no access code or authorization URL');
        }
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({
        submit: error.message || 'An error occurred while processing your payment. Please try again.'
      });
      setStep('form');
      setIsLoading(false);
    }
  };

  const getAmount = () => {
    const baseAmount = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    // Convert to selected currency if needed (plans are stored in USD)
    if (selectedCurrency === 'KES') {
      return convertCurrency(baseAmount, 'USD', 'KES');
    }
    return baseAmount;
  };

  const getSavings = () => {
    if (billing === 'yearly' && plan.priceMonthly > 0) {
      const monthlyTotal = plan.priceMonthly * 12;
      const savings = monthlyTotal - plan.priceYearly;
      // Convert to selected currency if needed
      if (selectedCurrency === 'KES') {
        return convertCurrency(savings, 'USD', 'KES');
      }
      return savings.toFixed(2);
    }
    return 0;
  };

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  const renderForm = () => (
    <div className="space-y-8">
      {/* Plan Summary Card - Premium Look */}
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C1FF72]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#C1FF72]/20 dark:bg-[#C1FF72]/30 flex items-center justify-center text-[#3fb337] dark:text-[#C1FF72] text-sm">
            <i className="fa-solid fa-receipt"></i>
          </span>
          Order Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{plan.name} Plan</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{billing} Billing</p>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">
              {formatCurrency(getAmount(), selectedCurrency)}
            </span>
          </div>

          {billing === 'yearly' && getSavings() > 0 && (
            <div className="flex justify-between items-center text-[#3fb337] dark:text-[#C1FF72] px-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <i className="fa-solid fa-tag"></i> Annual Savings
              </span>
              <span className="text-sm font-bold">-{formatCurrency(getSavings(), selectedCurrency)}</span>
            </div>
          )}

          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-[#3fb337] to-[#C1FF72]">
                {formatCurrency(getAmount(), selectedCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          <i className="fa-solid fa-coins mr-2 text-[#3fb337]"></i>
          Payment Currency
        </label>
        <div className="flex gap-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => setSelectedCurrency(currency.code)}
              className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                selectedCurrency === currency.code
                  ? 'border-[#C1FF72] bg-[#C1FF72]/10 dark:bg-[#C1FF72]/20 shadow-lg shadow-[#C1FF72]/10'
                  : 'border-transparent bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className={`${currency.icon} text-xl text-[#3fb337] dark:text-[#C1FF72]`}></i>
                <div className="text-left">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{currency.code}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Available Payment Methods */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Available Payment Methods
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availablePaymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <i className={`${method.icon} text-lg text-[#3fb337] dark:text-[#C1FF72]`}></i>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {method.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {method.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Details Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Billing Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="group">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-focus-within:text-[#3fb337] transition-colors">
              First Name <span className="text-[#3fb337]">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none ${errors.firstName
                ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                : 'border-transparent bg-gray-100 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#C1FF72] focus:shadow-[#C1FF72]/10 focus:shadow-lg'
                } text-gray-900 dark:text-white placeholder-gray-400`}
              placeholder="Ex: John"
            />
            {errors.firstName && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.firstName}</p>}
          </div>

          <div className="group">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-focus-within:text-[#3fb337] transition-colors">
              Last Name <span className="text-[#3fb337]">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none ${errors.lastName
                ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                : 'border-transparent bg-gray-100 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#C1FF72] focus:shadow-[#C1FF72]/10 focus:shadow-lg'
                } text-gray-900 dark:text-white placeholder-gray-400`}
              placeholder="Ex: Doe"
            />
            {errors.lastName && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="group">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-focus-within:text-[#3fb337] transition-colors">
            Email Address <span className="text-[#3fb337]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="fa-regular fa-envelope"></i>
            </span>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none ${errors.email
                ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                : 'border-transparent bg-gray-100 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#C1FF72] focus:shadow-[#C1FF72]/10 focus:shadow-lg'
                } text-gray-900 dark:text-white placeholder-gray-400`}
              placeholder="john@example.com"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
        </div>

        <div className="group">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-focus-within:text-[#3fb337] transition-colors">
            Phone Number <span className="text-[#3fb337]">*</span>
          </label>
          <div className="flex gap-3">
            {/* Country Code Selector */}
            <div className={`relative min-w-[180px] rounded-xl border-2 transition-all duration-200 ${errors.phone
              ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
              : 'border-transparent bg-gray-100 dark:bg-gray-700/50 focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:border-[#C1FF72] focus-within:shadow-lg'
              }`}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full h-full appearance-none bg-transparent px-4 py-3.5 pr-8 outline-none text-gray-900 dark:text-white cursor-pointer z-10 relative font-medium text-sm"
              >
                {countryPhoneCodesSorted.map((country) => (
                  <option key={country.code} value={country.code} className="text-gray-900 bg-white dark:bg-gray-800">
                    {country.flag} {country.code} {country.country}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>

            {/* Local Number Input */}
            <div className="relative flex-1">
              <input
                type="tel"
                id="phone"
                value={localNumber}
                onChange={(e) => setLocalNumber(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 outline-none ${errors.phone
                  ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                  : 'border-transparent bg-gray-100 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#C1FF72] focus:shadow-[#C1FF72]/10 focus:shadow-lg'
                  } text-gray-900 dark:text-white placeholder-gray-400`}
                placeholder="712 345 678"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Selected: <span className="font-mono text-[#3fb337] dark:text-[#C1FF72]">{countryCode} {localNumber}</span>
          </p>
          {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>}
        </div>

        {errors.submit && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            errors.submit.toLowerCase().includes('cancelled') 
              ? 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            <i className={`mt-0.5 ${
              errors.submit.toLowerCase().includes('cancelled')
                ? 'fa-solid fa-circle-xmark text-orange-600 dark:text-orange-400'
                : 'fa-solid fa-circle-exclamation text-red-600 dark:text-red-400'
            }`}></i>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                errors.submit.toLowerCase().includes('cancelled')
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {errors.submit}
              </p>
              {errors.submit.toLowerCase().includes('cancelled') && (
                <p className="text-xs text-orange-500 dark:text-orange-500 mt-2">
                  💡 No charges were made to your account. You can try again anytime.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 border-2 border-transparent text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] px-6 py-4 bg-gradient-to-r from-[#3fb337] to-[#C1FF72] hover:from-[#35a02e] hover:to-[#b0e65f] text-gray-900 rounded-xl font-semibold text-base shadow-lg shadow-[#C1FF72]/25 hover:shadow-xl hover:shadow-[#C1FF72]/30 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-8 py-10">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-[#C1FF72]/20 rounded-full animate-ping"></div>
        <div className="absolute inset-2 bg-[#C1FF72]/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#C1FF72] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Processing Payment
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Please wait while we secure your transaction and prepare your upgrade...
        </p>
      </div>
    </div>
  );

  const renderRedirecting = () => (
    <div className="text-center space-y-8 py-10">
      <div className="w-24 h-24 mx-auto bg-[#C1FF72]/20 dark:bg-[#C1FF72]/30 rounded-full flex items-center justify-center animate-bounce-slow">
        <CheckIcon className="w-12 h-12 text-[#3fb337]" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Opening Payment Gateway
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
          You are being redirected to complete your payment securely with Paystack.
        </p>
        <div className="inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 text-sm text-blue-600 dark:text-blue-400">
          <i className="fa-solid fa-circle-info mr-2"></i>
          Do not close this window
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex-none flex items-center justify-between p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Complete Purchase
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upgrade your career journey today</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {step === 'form' && renderForm()}
          {step === 'processing' && renderProcessing()}
          {step === 'redirecting' && renderRedirecting()}
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;