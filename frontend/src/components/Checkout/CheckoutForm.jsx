import React, { useState } from "react";
import logo from "../assets/media/JobHunter.png";
import { useDarkMode } from "../../context/DarkModeContext";

function CheckoutForm({ plan, billing, onClose }) {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    method: "", // Empty to show all payment methods
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the Checkout Link API endpoint
      const response = await fetch("https://sandbox.intasend.com/api/v1/checkout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ISSecretKey_live_8e39e27f-8680-4fac-bf9e-f4c75607ae5d`
        },
        body: JSON.stringify({
          public_key: import.meta.env.VITE_INTASEND_PUBLIC_KEY || "ISPubKey_live_d2fcb32e-60de-465d-be1b-7aeb7b2f7781",
          amount: billing === "monthly" ? plan.priceMonthly : plan.priceYearly,
          currency: "USD",
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          method: formData.method, // Empty shows all payment methods
          api_ref: `${plan.name}-${billing}-${Date.now()}`,
          card_tarrif: "BUSINESS-PAYS",
          mobile_tarrif: "BUSINESS-PAYS",
          redirect_url: window.location.origin + "/payment-success",
          metadata: {
            plan_name: plan.name,
            billing_cycle: billing,
          }
        })
      });

      const data = await response.json();
      const apiRef = `${plan.name}-${billing}-${Date.now()}`;

      if (data.url) {
        // For checkout link - store invoice ID if available
        if (data.invoice_id) {
          localStorage.setItem('paymentInvoiceId', data.invoice_id);
          localStorage.setItem('paymentApiRef', apiRef);
          localStorage.setItem('paymentPlan', JSON.stringify({
            name: plan.name,
            billing: billing,
            price: billing === "monthly" ? plan.priceMonthly : plan.priceYearly
          }));
        }
        window.location.href = data.url;
      } else if (data.invoice) {
        // For direct MPesa push - store invoice ID
        localStorage.setItem('paymentInvoiceId', data.invoice.invoice_id);
        localStorage.setItem('paymentApiRef', apiRef);
        localStorage.setItem('paymentPlan', JSON.stringify({
          name: plan.name,
          billing: billing,
          price: billing === "monthly" ? plan.priceMonthly : plan.priceYearly
        }));

        // For MPesa, show instruction modal or redirect to status page
        window.location.href = `${window.location.origin}/payment-status?invoice_id=${data.invoice.invoice_id}`;
      } else {
        setError("Payment initialization failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full p-0 relative max-h-[90vh] overflow-hidden flex flex-row">
        {/* Left side - Brand and Plan Info */}
        <div className="bg-gradient-to-br from-green-600 to-blue-700 text-white p-8 w-1/3 flex flex-col justify-between">
          <div>
            {/* Company Logo */}
            <div className="mb-8 flex justify-center">
              <div className="flex items-center">
              <img 
                  src={logo} 
                  alt="Linkivo Logo" 
                  className="h-12 w-auto rounded-lg mr-3" 
              />
                <span className="text-2xl font-bold text-white">Linkivo</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-3">{plan.name} Plan</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">${billing === "monthly" ? plan.priceMonthly : plan.priceYearly}</span>
              <span className="text-sm ml-1">/{billing === "monthly" ? "mo" : "yr"}</span>
            </div>

            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Plan Includes:</h4>
              <ul className="space-y-2 text-sm">
                {plan.features?.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="h-5 w-5 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-sm text-white/80">
            Secure checkout powered by IntaSend
          </div>
        </div>

        {/* Right side - Form */}
        <div className="p-8 w-2/3 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Complete Your Purchase
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <h3 className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mt-8 mb-4">Billing Address</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                placeholder="123 Main Street, Apt 4B"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition"
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="mt-8 mb-2">
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You'll be redirected to our secure payment page to complete your purchase.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-2 mr-3">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">IntaSend</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Secure Payments</div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium text-base shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                {loading ? "Processing..." : "Continue to Payment"}
              </button>
            </div>
          </form>

          {/* IntaSend Trust Badge */}
          <div className="mt-8 text-center">
            <div className="block text-center">
              <a href="https://intasend.com/security" target="_blank" rel="noopener noreferrer">
                <img 
                  src={darkMode 
                    ? "https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-no-mpesa-hr-dark.png"
                    : "https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-no-mpesa-hr-light.png"
                  } 
                  width="375px" 
                alt="IntaSend Secure Payments (PCI-DSS Compliant)"
                  className="mx-auto"
              />
            </a>
              <strong>
                <a 
                  className={`block text-decoration-none text-sm mt-2 transition-colors ${
                    darkMode 
                      ? 'text-gray-200 hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  href="https://intasend.com/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Secured by IntaSend Payments
                </a>
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;