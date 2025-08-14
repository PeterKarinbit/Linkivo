import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('PENDING');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get invoice ID from URL params or localStorage
  const invoiceId = searchParams.get('invoice_id') || localStorage.getItem('paymentInvoiceId');
  const planData = JSON.parse(localStorage.getItem('paymentPlan') || '{}');

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const checkPaymentStatus = async () => {
      if (!invoiceId) {
        setError('No payment information found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://sandbox.intasend.com/api/v1/payment/status/${invoiceId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ISSecretKey_live_8e39e27f-8680-4fac-bf9e-f4c75607ae5d`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payment status');
        }

        const data = await response.json();

        if (isMounted) {
          setInvoice(data.invoice);
          setStatus(data.invoice.state);
          setLoading(false);

          // If payment is complete or failed, stop polling
          if (data.invoice.state !== 'PENDING') {
            clearInterval(intervalId);

            // Clear localStorage if payment is complete or failed
            if (data.invoice.state === 'COMPLETE') {
              // You might want to update user subscription in your database here
              // before clearing localStorage
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Error checking payment status');
          setLoading(false);
          clearInterval(intervalId);
        }
      }
    };

    // Check immediately and then every 5 seconds
    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [invoiceId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETE':
        return 'text-green-600 dark:text-green-400';
      case 'FAILED':
        return 'text-red-600 dark:text-red-400';
      case 'PENDING':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">Payment Status</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Checking payment status...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg mb-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
            <Link to="/upgrade" className="inline-block bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Back to Upgrade Page
            </Link>
          </div>
        ) : (
          <div>
            {planData.name && (
              <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {planData.name} Plan - {planData.billing === 'monthly' ? 'Monthly' : 'Yearly'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  ${planData.price}
                </p>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className={`font-bold ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>

              {invoice && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Invoice ID:</span>
                    <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                      {invoice.invoice_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Amount:</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {invoice.value} {invoice.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Payment Method:</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {invoice.provider || 'N/A'}
                    </span>
                  </div>

                  {invoice.failed_reason && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <span className="font-semibold">Failed Reason:</span> {invoice.failed_reason}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {status === 'PENDING' && (
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Your payment is being processed. This page will automatically update when complete.
                </p>
                <div className="animate-pulse bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-500">
                    Please do not close this page until the payment is complete.
                  </p>
                </div>
              </div>
            )}

            {status === 'COMPLETE' && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Your payment was successful and your account has been upgraded!
                </p>
              </div>
            )}

            {status === 'FAILED' && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Your payment could not be processed. Please try again.
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              {status === 'COMPLETE' && (
                <Link to="/dashboard" className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-center">
                  Go to Dashboard
                </Link>
              )}

              {status === 'FAILED' && (
                <Link to="/upgrade" className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-center">
                  Try Again
                </Link>
              )}

              <Link to="/" className="w-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
