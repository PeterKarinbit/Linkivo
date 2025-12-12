import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../services/apiBase';

function TermsConsent({ onComplete }) {
  const { getToken } = useAuth();
  const [consent, setConsent] = useState({
    enabled: true,
    scopes: {
      resume: true,
      journals: true,
      goals: true,
      tasks: true,
      applications: true,
      knowledgeBase: true
    },
    schedule: {
      cadence: 'weekly',
      windowLocalTime: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
  });
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      alert('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    try {
      setIsLoading(true);

      // Save AI Coach consent
      await api.put('/enhanced-ai-career-coach/consent', consent);

      // If we got here without error, consent was saved
      onComplete({ consent, acceptedTerms: true });
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Failed to save consent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Almost There! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Review your AI Coach settings and accept our terms to get started
          </p>
        </div>

        {/* AI Coach Consent */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 md:p-10 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            AI Coach Consent
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Allow the AI Coach to use your data to personalize insights. You can change this later in Settings.
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-base font-medium text-gray-900 dark:text-white">Enable AI Coach</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent.enabled}
                  onChange={(e) => setConsent(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {consent.enabled && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Access Permissions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(consent.scopes).map(key => (
                  <label key={key} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <input
                      type="checkbox"
                      checked={!!consent.scopes[key]}
                      onChange={(e) => setConsent(prev => ({
                        ...prev,
                        scopes: { ...prev.scopes, [key]: e.target.checked }
                      }))}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Terms and Privacy */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 md:p-10 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Terms & Privacy
          </h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsRead}
                  onChange={(e) => setTermsRead(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I have read and understood the{' '}
                    <a
                      href="/legal/terms"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setTermsRead(true)}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline font-medium"
                    >
                      Terms of Service
                    </a>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={privacyRead}
                  onChange={(e) => setPrivacyRead(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I have read and understood the{' '}
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setPrivacyRead(true)}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline font-medium"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    if (termsRead && privacyRead) {
                      setAcceptedTerms(e.target.checked);
                    } else {
                      alert('Please read and check both Terms of Service and Privacy Policy first.');
                    }
                  }}
                  disabled={!termsRead || !privacyRead}
                  className="mt-1 w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className={`text-sm ${termsRead && privacyRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    I agree to the Terms of Service and Privacy Policy. I understand that my data will be used to provide personalized career coaching and recommendations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !acceptedTerms}
            className={`px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${isLoading || !acceptedTerms
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              'Complete Setup & Start Coaching'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsConsent;


