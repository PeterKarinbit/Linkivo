import React from 'react';
import { FaShieldAlt, FaUserCheck, FaLock, FaDatabase, FaExchangeAlt } from 'react-icons/fa';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="opacity-90">Effective Date: December 2024</p>
        </div>

        <div className="p-8 space-y-8 text-gray-700 dark:text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-blue-600" /> 1. Commitment to Privacy
            </h2>
            <p className="mb-4 leading-relaxed">
              At <strong>Linkivo</strong>, we are committed to empowering African youth to take control of their careers ("squiggly" or straight) through strategic guidance. To provide our AI-driven personalized coaching, we need to handle some of your personal data.
            </p>
            <p className="leading-relaxed">
              This Privacy Policy details how we collect, use, and protect your information as we help you navigate the changing job market.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaDatabase className="text-blue-600" /> 2. Information We Collect
            </h2>
            <p className="mb-4">We collect data necessary to provide effective career guidance:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Profile Information:</strong> Name, contact details, educational background, and current career status.</li>
              <li><strong>Career Materials:</strong> CVs/Resumes, portfolios, and cover letters you upload for analysis.</li>
              <li><strong>Assessment Data:</strong> Responses to skills assessments, personality quizzes, and career preference surveys.</li>
              <li><strong>Interaction Data:</strong> Insights from your interactions with our AI Coach to refine recommendations over time.</li>
            </ul>
          </section>

          {/* Usage */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUserCheck className="text-blue-600" /> 3. How We Use Your Data
            </h2>
            <p className="mb-4">Your data fuels the core Linkivo experience:</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalization</h3>
                <p className="text-sm">To tailor career paths and coaching advice specifically to your strengths and local market context.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Adaptation</h3>
                <p className="text-sm">To track your progress and adjust milestones when you face challenges.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Service Improvement</h3>
                <p className="text-sm">To train our models (anonymously) to better understand the African job market landscape.</p>
              </div>
            </div>
          </section>

          {/* Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaExchangeAlt className="text-blue-600" /> 4. Data Sharing
            </h2>
            <p className="mb-4">We strictly limit how your data is shared:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We <strong>do not sell</strong> your personal data to third parties.</li>
              <li>We may share data with trusted service providers (e.g., cloud hosting, AI processing) solely to operate Linkivo.</li>
              <li>If you explicitly consent, we may connect you with potential employers or mentors.</li>
            </ul>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaLock className="text-blue-600" /> 5. Data Security
            </h2>
            <p className="leading-relaxed">
              We employ robust security measures to protect your information from unauthorized access, alteration, or disclosure. This includes encryption in transit and at rest, along with strict access controls for our internal team.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h3 className="text-xl font-semibold mb-2">Privacy Concerns?</h3>
            <p>
              If you have questions about your data or wish to exercise your rights, please reach out: <br />
              <a href="mailto:linkivo.ai@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">linkivo.ai@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
