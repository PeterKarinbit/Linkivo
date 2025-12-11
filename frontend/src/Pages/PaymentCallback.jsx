import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import paystackService from '../services/paystackService';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading'); // 'loading', 'success', 'failed', 'pending', 'cancelled', 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      // Get transaction reference from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || paystackService.getStoredReference();
      const paymentData = localStorage.getItem('payment_details');

      // Check if user cancelled (no reference and no payment data)
      if (!reference && !paymentData) {
        // User likely closed the popup or cancelled
        setPaymentStatus('cancelled');
        return;
      }

      if (!reference) {
        // No reference but has payment data - might be cancelled
        setPaymentStatus('cancelled');
        return;
      }

      // Parse payment details
      if (paymentData) {
        setPaymentDetails(JSON.parse(paymentData));
      }

      // Verify transaction with Paystack
      const verificationResult = await paystackService.verifyPayment(reference);
      
      setTransactionDetails(verificationResult);
      
      // Determine payment status based on response
      if (verificationResult.success && verificationResult.paid) {
        setPaymentStatus('success');
        // Clean up localStorage after successful payment
        paystackService.clearPaymentData();
        localStorage.removeItem('payment_details');
      } else if (verificationResult.success && !verificationResult.paid) {
        // Transaction exists but not paid
        const transactionStatus = verificationResult.transaction?.status;
        if (transactionStatus === 'failed' || transactionStatus === 'abandoned') {
          setPaymentStatus('failed');
        } else if (transactionStatus === 'pending') {
          setPaymentStatus('pending');
        } else if (transactionStatus === 'cancelled' || transactionStatus === 'reversed') {
          setPaymentStatus('cancelled');
        } else {
          setPaymentStatus('failed');
        }
      } else {
        // Check if it's a cancellation error
        if (verificationResult.error?.toLowerCase().includes('cancelled') || 
            verificationResult.error?.toLowerCase().includes('abandoned')) {
          setPaymentStatus('cancelled');
        } else {
          setPaymentStatus('error');
          setError(verificationResult.error || 'Unknown payment status received');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Failed to verify payment status. Please contact support.');
      setPaymentStatus('error');
    }
  };

  const handleRetryPayment = () => {
    navigate('/upgrade');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const renderLoading = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifying Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we verify your payment status...
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <CheckCircleIcon className="w-8 h-8 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your subscription has been activated successfully.
        </p>
      </div>

      {paymentDetails && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-6 text-left">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4">
            Subscription Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-400">Plan:</span>
              <span className="text-green-800 dark:text-green-300 font-medium">
                {paymentDetails.plan}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-400">Billing:</span>
              <span className="text-green-800 dark:text-green-300 font-medium">
                {paymentDetails.billing === 'yearly' ? 'Annual' : 'Monthly'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-400">Amount:</span>
              <span className="text-green-800 dark:text-green-300 font-medium">
                ${paymentDetails.amount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 dark:text-green-400">Email:</span>
              <span className="text-green-800 dark:text-green-300 font-medium">
                {paymentDetails.userDetails.email}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleGoToDashboard}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          Go to Dashboard
          <ArrowRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <HomeIcon className="w-5 h-5" />
          Go Home
        </button>
      </div>
    </div>
  );

  const renderFailed = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <XCircleIcon className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Failed
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Unfortunately, your payment could not be processed.
        </p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
          What you can do:
        </h3>
        <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 text-left">
          <li>• Check your payment method and try again</li>
          <li>• Ensure you have sufficient funds</li>
          <li>• Contact your bank if the issue persists</li>
          <li>• Contact our support team for assistance</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleRetryPayment}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  const renderPending = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
        <ClockIcon className="w-8 h-8 text-yellow-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Pending
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your payment is being processed. This may take a few minutes.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
          What happens next:
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 text-left">
          <li>• Your payment is being verified</li>
          <li>• You'll receive an email confirmation once processed</li>
          <li>• Your subscription will be activated automatically</li>
          <li>• You can check back here in a few minutes</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
        >
          Check Again
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  const renderCancelled = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
        <XCircleIcon className="w-8 h-8 text-orange-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Cancelled
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You cancelled the payment process. No charges were made to your account.
        </p>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
        <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
          What happened?
        </h3>
        <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1 text-left">
          <li>• Your payment was cancelled before completion</li>
          <li>• No charges were made to your payment method</li>
          <li>• You can try again anytime</li>
          <li>• Your subscription remains unchanged</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleRetryPayment}
          className="px-6 py-3 bg-gradient-to-r from-[#3fb337] to-[#C1FF72] text-gray-900 rounded-xl font-semibold hover:from-[#35a02e] hover:to-[#b0e65f] transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          Try Again
          <ArrowRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <HomeIcon className="w-5 h-5" />
          Go Home
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Something Went Wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error || 'An unexpected error occurred while processing your payment.'}
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">
          Need help?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If you're experiencing issues, please contact our support team with your order details.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleRetryPayment}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          {paymentStatus === 'loading' && renderLoading()}
          {paymentStatus === 'success' && renderSuccess()}
          {paymentStatus === 'failed' && renderFailed()}
          {paymentStatus === 'pending' && renderPending()}
          {paymentStatus === 'cancelled' && renderCancelled()}
          {paymentStatus === 'error' && renderError()}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
