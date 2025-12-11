import React, { useEffect, useState } from "react";

function PaymentSuccess() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get("invoice_id") || localStorage.getItem("paymentInvoiceId");
    async function verify() {
      try {
        const res = await fetch(`/api/payments/intasend/verify?invoice_id=${invoiceId}`);
        const data = await res.json();
        if (data.paid) {
          setStatus("paid");
          setMessage("Payment confirmed. Your plan has been upgraded.");
        } else {
          setStatus("pending");
          setMessage("Payment pending. We'll update your account once it's confirmed.");
        }
      } catch (e) {
        setStatus("error");
        setMessage("Could not verify payment. Please contact support at linkivo.ai@gmail.com");
      }
    }
    if (invoiceId) verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Payment Status</h1>
        <p className="text-gray-600 dark:text-gray-300">{message || "Verifying your payment..."}</p>
        {status === "paid" && (
          <a href="/home-logged-in" className="inline-block mt-6 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700">Go to Dashboard</a>
        )}
        {status !== "paid" && (
          <a href="/upgrade" className="inline-block mt-6 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">Back to Upgrade</a>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
