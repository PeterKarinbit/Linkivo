import React, { useMemo, useState } from "react";
import { useFeatureAccess } from "../hooks/useFeatureAccess";
import CheckoutForm from "../components/Checkout/CheckoutForm";

const basePlans = [
  {
    planKey: "beta",
    name: "Member",
    priceMonthly: 0,
    priceYearly: 0,
    badge: "Beta Access",
    features: [
      "✨ Unlimited Resume Scoring Cards",
      "✨ Unlimited Job Recommendations",
      "✨ Unlimited Career Memories",
      "✨ Unlimited Autonomous Applications",
      "🎯 Industry Trends Analysis",
      "🎯 Career Path Analysis",
      "Advanced Analytics & Export",
      "Resume Export/Download",
      "Priority Support",
      "Community Access",
    ],
    button: "Current Plan",
    isCurrent: true,
  }
];


export default function Upgrade() {
  const { currentPlan, isLoading } = useFeatureAccess();
  const [billing, setBilling] = useState("monthly");
  const [showComparisonFAQ, setShowComparisonFAQ] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [faqs, setFaqs] = useState([
    {
      q: "What payment methods are accepted?",
      a: "We accept multiple payment methods through Paystack including credit/debit cards (Visa, Mastercard), bank transfers, and mobile money options to make payments convenient for all our users.",
      isOpen: false,
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes, you can cancel your paid plan at any time from your account settings. No questions asked, no cancellation fees.",
      isOpen: false,
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Absolutely! We offer a 14-day money-back guarantee for all new paid plan subscriptions. If you're not satisfied, we'll refund your payment in full.",
      isOpen: false,
    },
    {
      q: "What happens if I exceed my Free or Starter plan limits?",
      a: "You'll receive a friendly notification when approaching your limits, and be prompted to upgrade to a higher plan to continue enjoying premium features without interruption.",
      isOpen: false,
    },
  ]);

  const plans = useMemo(() => {
    return basePlans.map((p) => ({
      ...p,
      isCurrent: true, // Force all plans (there is only one) to be "Current"
      badge: "Beta Access",
    }));
  }, []);

  const competitorComparison = (
    <div className="space-y-4">
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        Our pricing is designed to be competitive while offering superior value. Here's how we compare:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Other Platforms</h5>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• $15-30/month for basic features</li>
            <li>• Limited AI analysis</li>
            <li>• No autonomous applications</li>
            <li>• Basic support only</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2">JobHunter Pro</h5>
          <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
            <li>• $24.99/month for unlimited features</li>
            <li>• Advanced AI-powered analysis</li>
            <li>• Autonomous job applications</li>
            <li>• Priority support included</li>
          </ul>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
        We focus on providing comprehensive career tools rather than just resume analysis, making us a better long-term investment for your career growth.
      </p>
    </div>
  );

  const toggleFaq = (index) => {
    setFaqs(faqs.map((faq, i) =>
      i === index ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  const getSavingsPercentage = (monthly, yearly) => {
    if (!monthly || !yearly) return 0;
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-tiers');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium mb-4">
            ✨ Unlock Your Career Potential
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Perfect Plan</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Upgrade to unlock premium AI coaching: a personalized opportunity map, future industry demand alignment, and competitive benchmarking against peers.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${billing === "monthly"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${billing === "yearly"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              onClick={() => setBilling("yearly")}
            >
              Yearly
              <span className="absolute -top-2 -right-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div id="pricing-tiers" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${plan.badge === "Best Value"
                ? "border-2 border-green-500 shadow-2xl shadow-green-500/20"
                : "border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl"
                }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold ${plan.badge === "Best Value"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : plan.isCurrent
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  }`}>
                  {plan.badge}
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>

                {/* Pricing */}
                <div className="flex items-end justify-center gap-1 mb-4">
                  {billing === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.priceMonthly}</span>
                      {plan.priceMonthlyOld && (
                        <span className="text-xl text-gray-400 line-through">${plan.priceMonthlyOld}</span>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">/mo</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.priceYearly}</span>
                      {plan.priceYearlyOld && (
                        <span className="text-xl text-gray-400 line-through">${plan.priceYearlyOld}</span>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">/yr</span>
                    </>
                  )}
                </div>

                {/* Yearly savings indicator */}
                {billing === "yearly" && plan.priceMonthly > 0 && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Save ${(plan.priceMonthly * 12 - plan.priceYearly).toFixed(2)} per year
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {plan.button && !plan.isCurrent && (
                <button
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${plan.badge === "Best Value"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    }`}
                  onClick={() => {
                    // Use the unified checkout for ALL tiers to collect customer details
                    setSelectedPlan(plan);
                  }}
                >
                  {plan.button}
                </button>
              )}

              {plan.isCurrent && (
                <div className="w-full py-4 text-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold">
                  Current Plan
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Why Upgrade Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Why Upgrade Your Career Game?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🎯", title: "Smart AI Analysis", desc: "Get personalized insights on your resume and career path" },
              { icon: "🚀", title: "Priority Support", desc: "Skip the queue with dedicated customer success team" },
              { icon: "⚡", title: "Advanced Tools", desc: "Access cutting-edge features as we roll them out" },
              { icon: "💼", title: "Career Growth", desc: "Land better opportunities faster with our proven system" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={faq.isOpen}
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${faq.isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {faq.isOpen && (
                  <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Competitor Comparison FAQ */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowComparisonFAQ(!showComparisonFAQ)}
                aria-expanded={showComparisonFAQ}
              >
                <span className="font-semibold text-gray-900 dark:text-white pr-4">
                  How does your pricing compare to other AI resume analyzers?
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showComparisonFAQ ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showComparisonFAQ && (
                <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  {competitorComparison}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Career?</h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who have accelerated their career growth with our AI-powered platform.
            </p>
            <button
              onClick={scrollToPricing}
              className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
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