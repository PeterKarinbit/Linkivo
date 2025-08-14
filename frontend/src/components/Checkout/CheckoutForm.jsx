import React, { useState } from "react";

function CheckoutForm({ plan, billing, onClose }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    paymentMethod: "card", // Default payment method
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://payment.intasend.com/api/v1/checkout/", {
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
          billing: {
            address: formData.address,
            city: formData.city,
            country: formData.country,
          },
          method: formData.paymentMethod, // Specify payment method
          metadata: {
            plan_name: plan.name,
            billing_cycle: billing,
          }
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Checkout - {plan.name} Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {billing === "monthly" ? "Monthly" : "Yearly"} subscription: ${billing === "monthly" ? plan.priceMonthly : plan.priceYearly}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div
                className={`border rounded-lg p-3 flex items-center cursor-pointer transition ${formData.paymentMethod === 'card' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
              >
                <div className="mr-2 text-xl">💳</div>
                <div>
                  <div className="font-medium">Card</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Credit/Debit cards</div>
                </div>
              </div>
              <div
                className={`border rounded-lg p-3 flex items-center cursor-pointer transition ${formData.paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'mpesa' })}
              >
                <div className="mr-2 text-xl">📱</div>
                <div>
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Mobile payment</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`border rounded-lg p-3 flex items-center cursor-pointer transition ${formData.paymentMethod === 'bank-transfer' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'bank-transfer' })}
              >
                <div className="mr-2 text-xl">🏦</div>
                <div>
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Direct bank payment</div>
                </div>
              </div>
              <div
                className={`border rounded-lg p-3 flex items-center cursor-pointer transition ${formData.paymentMethod === 'mobile' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'mobile' })}
              >
                <div className="mr-2 text-xl">📲</div>
                <div>
                  <div className="font-medium">Mobile Money</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Other mobile wallets</div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </button>
        </form>

        {/* Trust Badge */}
        <div className="mt-6">
          <div className="flex justify-center items-center mb-4 space-x-4">
            <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/512/825/825454.png" alt="M-Pesa" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/512/2168/2168722.png" alt="Bank Transfer" className="h-8" />
          </div>
          <span style={{display: "block", textAlign: "center"}}>
            <a href="https://intasend.com/security" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-with-mpesa-hr-light.png" 
                width="375" 
                alt="IntaSend Secure Payments (PCI-DSS Compliant)"
              />
            </a>
            <strong>
              <a 
                style={{
                  display: "block",
                  color: "#454545",
                  textDecoration: "none",
                  fontSize: "0.8em",
                  marginTop: "0.6em"
                }} 
                href="https://intasend.com/security" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Secured by IntaSend Payments
              </a>
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;
