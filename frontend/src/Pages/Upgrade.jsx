import React, { useState } from "react";
import CheckoutForm from "../components/Checkout/CheckoutForm";

const plans = [
  {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    badge: "Current Plan",
    features: [
      "3 AI resume analyses per month",
      "10 job recommendations per month",
      "Community support",
    ],
    button: null,
    isCurrent: true,
  },
  {
    name: "Test/Starter",
    priceMonthly: 9.99,
    priceMonthlyOld: 12,
    priceYearly: 109.99,
    priceYearlyOld: 144,
    badge: "For Light Users",
    features: [
      "20 AI resume analyses per month",
      "50 job recommendations per month",
      "Resume export/download",
      "Community support",
    ],
    button: "Choose Starter",
    isCurrent: false,
  },
  {
    name: "Pro",
    priceMonthly: 24.99,
    priceMonthlyOld: null,
    priceYearly: 249.99,
    priceYearlyOld: 290,
    badge: "Best Value",
    features: [
      "Unlimited AI resume analyses",
      "Unlimited job recommendations",
      "Priority email support",
      "Early access to new features",
      "Advanced analytics",
      "Resume export/download",
    ],
    button: "Choose Pro",
    isCurrent: false,
  },
];

const faqs = [
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit cards and PayPal for paid plan upgrades.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your paid plan at any time from your account settings.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely! We offer a 14-day money-back guarantee for all new paid plan subscriptions.",
  },
  {
    q: "What happens if I exceed my Free or Starter plan limits?",
    a: "You’ll be prompted to upgrade to a higher plan to continue enjoying premium features.",
  },
];

const competitorComparison = (
  <div className="bg-white border rounded-lg shadow p-6 mt-2 animate-fade-in">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b">
          <th className="py-2 px-3 font-bold">Service</th>
          <th className="py-2 px-3 font-bold">Price (Monthly)</th>
          <th className="py-2 px-3 font-bold">Key Features</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="py-2 px-3">Rezi.ai</td>
          <td className="py-2 px-3">$29</td>
          <td className="py-2 px-3">Unlimited resumes, AI feedback</td>
        </tr>
        <tr className="border-b">
          <td className="py-2 px-3">Kickresume</td>
          <td className="py-2 px-3">$19</td>
          <td className="py-2 px-3">AI resume builder, cover letter</td>
        </tr>
        <tr className="border-b">
          <td className="py-2 px-3">ResumAI by Wonsulting</td>
          <td className="py-2 px-3">$16</td>
          <td className="py-2 px-3">AI resume, cover letter, LinkedIn</td>
        </tr>
        <tr className="border-b">
          <td className="py-2 px-3">Jobscan</td>
          <td className="py-2 px-3">$49.95</td>
          <td className="py-2 px-3">Resume optimization, ATS check</td>
        </tr>
        <tr className="bg-green-50 border-b-2 border-green-600">
          <td className="py-2 px-3 font-bold text-green-700">Your App (Pro)</td>
          <td className="py-2 px-3 font-bold text-green-700">$24.999</td>
          <td className="py-2 px-3 font-bold text-green-700">Unlimited AI analysis, job matching, support</td>
        </tr>
        <tr className="bg-blue-50 border-b-2 border-blue-600">
          <td className="py-2 px-3 font-bold text-blue-700">Your App (Starter)</td>
          <td className="py-2 px-3 font-bold text-blue-700">$9.99</td>
          <td className="py-2 px-3 font-bold text-blue-700">Limited AI analysis, job matching</td>
        </tr>
      </tbody>
    </table>
    <div className="text-xs text-gray-400 mt-3">* Pricing and features as of 2024. Please check each service for the latest details.</div>
  </div>
);

export default function Upgrade() {
  const [billing, setBilling] = useState("monthly");
  const [showComparisonFAQ, setShowComparisonFAQ] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [faqs, setFaqs] = useState([
    {
      q: "What payment methods are accepted?",
      a: "We accept multiple payment methods through InstaSend including credit/debit cards (Visa, Mastercard), M-Pesa, bank transfers, and other mobile money options to make payments convenient for all our users.",
      isOpen: false,
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes, you can cancel your paid plan at any time from your account settings.",
      isOpen: false,
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Absolutely! We offer a 14-day money-back guarantee for all new paid plan subscriptions.",
      isOpen: false,
    },
    {
      q: "What happens if I exceed my Free or Starter plan limits?",
      a: "You'll be prompted to upgrade to a higher plan to continue enjoying premium features.",
      isOpen: false,
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-0">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 md:px-24 sm:px-8 px-4 border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">Upgrade Plan</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 text-lg">Unlock the full power of our platform with advanced AI resume analysis, job recommendations, and more.</p>
        <div className="flex justify-center mb-10">
          <button
            className={`px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none ${billing === "monthly" ? "bg-green-600 text-white" : "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-100"}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg border-t border-b border-r border-gray-300 focus:outline-none ${billing === "yearly" ? "bg-green-600 text-white" : "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-100"}`}
            onClick={() => setBilling("yearly")}
          >
            Yearly <span className="ml-1 text-xs text-green-700 font-semibold">(Save 17%)</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col border rounded-lg p-8 bg-gray-50 dark:bg-gray-900 ${plan.badge === "Best Value" ? "border-green-600 shadow-lg" : "border-gray-200 dark:border-gray-700"} dark:text-white`}
            >
              {plan.badge && (
                <span className={`absolute top-4 right-4 px-2 py-1 text-xs rounded font-semibold ${plan.badge === "Best Value" ? "bg-green-100 text-green-700" : plan.isCurrent ? "bg-gray-300 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{plan.name}</h3>
              <div className="mb-4 flex items-end">
                {billing === "monthly" ? (
                  <>
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">${plan.priceMonthly}</span>
                    {plan.priceMonthlyOld && (
                      <span className="ml-2 text-xl text-gray-400 line-through">${plan.priceMonthlyOld}</span>
                    )}
                    <span className="ml-1 text-gray-500 dark:text-gray-300">/mo</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">${plan.priceYearly}</span>
                    {plan.priceYearlyOld && (
                      <span className="ml-2 text-xl text-gray-400 line-through">${plan.priceYearlyOld}</span>
                    )}
                    <span className="ml-1 text-gray-500 dark:text-gray-300">/yr</span>
                  </>
                )}
              </div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-700 dark:text-gray-200">
                    <span className="mr-2 text-green-500">✔</span> {feature}
                  </li>
                ))}
              </ul>
              {plan.button && !plan.isCurrent && (
                <button 
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold transition dark:bg-green-600 dark:hover:bg-green-700"
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.button}
                </button>
              )}
              {plan.isCurrent && (
                <span className="w-full block text-center bg-gray-200 text-gray-500 py-2 rounded font-semibold cursor-not-allowed dark:bg-gray-700 dark:text-gray-300">
                  Current Plan
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 mb-12 text-center text-gray-700 dark:text-gray-200 text-base max-w-3xl mx-auto">
          <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Why Upgrade?</h4>
          <ul className="mb-4 space-y-1">
            <li>• Get access to advanced AI resume analysis and job matching tools.</li>
            <li>• Enjoy priority support and early access to new features as we grow (Pro plan).</li>
            <li>• Boost your job search or recruitment process with smarter, faster tools.</li>
            <li>• Cancel anytime, no questions asked.</li>
          </ul>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-8 max-w-3xl mx-auto mb-8 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold mb-4 text-green-700 dark:text-green-400">Frequently Asked Questions</h4>
          <ul className="space-y-4">
            {faqs.map((faq, idx) => (
              <li key={idx}>
                <button
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-800 dark:text-gray-100 focus:outline-none p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => {
                    const newFaqs = [...faqs];
                    newFaqs[idx].isOpen = !newFaqs[idx].isOpen;
                    setFaqs(newFaqs);
                  }}
                  aria-expanded={faq.isOpen}
                >
                  <span>Q: {faq.q}</span>
                  <span className="ml-2 text-gray-500">{faq.isOpen ? "▲" : "▼"}</span>
                </button>
                {faq.isOpen && (
                  <div className="mt-2 pl-6 text-gray-600 dark:text-gray-300 animate-fade-in">
                    <span>A: {faq.a}</span>
                  </div>
                )}
              </li>
            ))}
            {/* Competitor Comparison FAQ Dropdown */}
            <li>
              <button
                className="flex items-center justify-between w-full text-left font-semibold text-gray-800 dark:text-gray-100 focus:outline-none p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setShowComparisonFAQ((v) => !v)}
                aria-expanded={showComparisonFAQ}
              >
                <span>How does your pricing compare to other AI resume analyzers?</span>
                <span className="ml-2 text-gray-500">{showComparisonFAQ ? "▲" : "▼"}</span>
              </button>
              {showComparisonFAQ && (
                <div className="mt-3">{competitorComparison}</div>
              )}
            </li>
          </ul>
        </div>
        <div className="text-center mt-8">
          <span className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-lg hover:bg-green-700 transition cursor-pointer">
            Ready to unlock your full potential? Upgrade now!
          </span>
        </div>
      </div>
      {selectedPlan && (
        <CheckoutForm
          plan={selectedPlan}
          billing={billing}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}