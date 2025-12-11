import React from 'react';
import { FaCheckCircle, FaFileContract, FaUserShield, FaGavel, FaBan } from 'react-icons/fa';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="opacity-90">Effective Date: December 2024</p>
        </div>

        <div className="p-8 space-y-8 text-gray-700 dark:text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileContract className="text-green-600" /> 1. Introduction
            </h2>
            <p className="mb-4 leading-relaxed">
              Welcome to <strong>Linkivo</strong>. We are an EdTech startup dedicated to empowering African youth with AI-driven career guidance.
              Our mission is to help students and professionals find clarity, pivot successfully in a changing job market, and build confidence through personalized coaching and skills assessment.
            </p>
            <p className="leading-relaxed">
              By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          {/* Services Provided */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" /> 2. Our Services
            </h2>
            <p className="mb-4">Linkivo provides a comprehensive suite of career development tools, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Personalized Career Coaching:</strong> Tailored guidance for students, graduates, and professionals, moving beyond generic templates.</li>
              <li><strong>Skills Development:</strong> Focused analysis and recommendations for essential skills in the AI era.</li>
              <li><strong>Real-time Adaptation:</strong> Dynamic tracking tools that adjust career plans based on your progress and challenges.</li>
              <li><strong>Strategic Navigation:</strong> Insights to help you understand your role's business value and increase visibility.</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUserShield className="text-green-600" /> 3. User Responsibilities
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="mb-3">To ensure a safe and effective learning environment, you agree to:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  Provide accurate and up-to-date information about your education and career history.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  Use the platform for lawful purposes related to career development.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  Respect the intellectual property rights of Linkivo and other content creators.
                </li>
              </ul>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaBan className="text-red-500" /> 4. Prohibited Activities
            </h2>
            <p className="mb-4">You may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Share your account credentials with others or allow unauthorized access.</li>
              <li>Use any automated means (scraping, bots) to access the platform.</li>
              <li>Upload malicious content or attempt to disrupt the service's functionality.</li>
              <li>Engage in harassment or abusive behavior towards coaches or other users.</li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaGavel className="text-gray-500" /> 5. Disclaimer & Limitation of Liability
            </h2>
            <p className="mb-4 leading-relaxed">
              While Linkivo strives to provide high-quality career guidance, we cannot guarantee specific job outcomes, employment offers, or salary levels. Career success depends on numerous factors including your personal effort, market conditions, and employer requirements.
            </p>
            <p className="leading-relaxed">
              Our AI-driven insights are advisory in nature and should be used to support, not replace, professional judgment.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
            <p>
              If you have any questions about these Terms, please contact us at: <br />
              <a href="mailto:linkivo.ai@gmail.com" className="text-green-600 hover:text-green-700 font-medium">linkivo.ai@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
