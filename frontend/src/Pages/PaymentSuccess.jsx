import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  useEffect(() => {
    // You could add analytics tracking here
    console.log('Payment completed', { transactionId, status });
  }, [transactionId, status]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Payment Successful!</h2>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for upgrading your subscription. Your payment has been processed successfully and your account has been upgraded.
        </p>

        {transactionId && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Transaction ID:</span> {transactionId}
            </p>
            {status && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-medium">Status:</span> {status}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Link to="/dashboard" className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
            Go to Dashboard
          </Link>
          <Link to="/account" className="block w-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            View Subscription Details
          </Link>
        </div>
      </div>
    </div>
  );
}
