import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiClock, FiShield, FiDatabase, FiCalendar } from 'react-icons/fi';

const SCOPE_LABELS = {
  resume: 'Resume & Documents',
  journals: 'Career Journals',
  goals: 'Career Goals',
  tasks: 'Tasks & Milestones',
  applications: 'Job Applications',
  knowledgeBase: 'Knowledge Base'
};

const SCOPE_DESCRIPTIONS = {
  resume: 'Analyze your resume and documents for insights',
  journals: 'Process your journal entries for sentiment and themes',
  goals: 'Track progress toward your career goals',
  tasks: 'Monitor task completion and milestones',
  applications: 'Analyze job applications and outcomes',
  knowledgeBase: 'Access your saved knowledge and insights'
};

const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Daily', desc: 'Generate recommendations every day' },
  { value: 'weekly', label: 'Weekly', desc: 'Generate recommendations once per week' },
  { value: 'monthly', label: 'Monthly', desc: 'Generate recommendations once per month' },
  { value: 'quarterly', label: 'Quarterly', desc: 'Generate recommendations every 3 months' },
  { value: 'off', label: 'Off', desc: 'Disable automatic recommendations' }
];

function ConsentSettings({ onClose }) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Load existing consent settings
  useEffect(() => {
    const loadConsent = async () => {
      try {
        const baseOrigin = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseOrigin}/api/v1/enhanced-ai-career-coach/consent`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const consentData = data?.data || data;
          if (consentData) {
            setConsent(prev => ({
              enabled: consentData.enabled !== undefined ? consentData.enabled : prev.enabled,
              scopes: {
                resume: consentData.scopes?.resume !== undefined ? consentData.scopes.resume : prev.scopes.resume,
                journals: consentData.scopes?.journals !== undefined ? consentData.scopes.journals : prev.scopes.journals,
                goals: consentData.scopes?.goals !== undefined ? consentData.scopes.goals : prev.scopes.goals,
                tasks: consentData.scopes?.tasks !== undefined ? consentData.scopes.tasks : prev.scopes.tasks,
                applications: consentData.scopes?.applications !== undefined ? consentData.scopes.applications : prev.scopes.applications,
                knowledgeBase: consentData.scopes?.knowledgeBase !== undefined ? consentData.scopes.knowledgeBase : prev.scopes.knowledgeBase
              },
              schedule: {
                cadence: consentData.schedule?.cadence || prev.schedule.cadence,
                windowLocalTime: consentData.schedule?.windowLocalTime || prev.schedule.windowLocalTime,
                timezone: consentData.schedule?.timezone || prev.schedule.timezone
              }
            }));
          }
        }
      } catch (err) {
        console.error('Error loading consent:', err);
        // Continue with defaults if load fails
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const baseOrigin = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseOrigin}/api/v1/enhanced-ai-career-coach/consent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: consent.enabled,
          scopes: consent.scopes,
          schedule: consent.schedule
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save consent settings');
      }

      // Success - close the modal
      onClose();
    } catch (err) {
      console.error('Error saving consent:', err);
      setError(err.message || 'Failed to save consent settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScope = (scopeKey) => {
    setConsent(prev => ({
      ...prev,
      scopes: {
        ...prev.scopes,
        [scopeKey]: !prev.scopes[scopeKey]
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div 
          className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading consent settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Coach Consent Settings</h2>
              <p className="text-xs opacity-90">Manage your data permissions and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Enable/Disable Toggle */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <FiShield className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enable AI Coach</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Allow AI Coach to process your data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  When enabled, the AI Coach can analyze your data to provide personalized recommendations
                </p>
              </div>
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

          {/* Data Access Permissions */}
          {consent.enabled && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <FiDatabase className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Access Permissions</h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select which data the AI Coach can access to provide personalized recommendations
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleScope(key)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        consent.scopes[key]
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {consent.scopes[key] && (
                              <FiCheck className="w-4 h-4 text-green-600" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {SCOPE_DESCRIPTIONS[key]}
                          </p>
                        </div>
                        <div className={`ml-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          consent.scopes[key]
                            ? 'border-green-600 bg-green-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {consent.scopes[key] && (
                            <FiCheck className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Schedule Settings */}
          {consent.enabled && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <FiClock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommendation Schedule</h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose how often the AI Coach generates proactive recommendations
                </p>

                <div className="space-y-2">
                  {CADENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConsent(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, cadence: option.value }
                      }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        consent.schedule.cadence === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
                        </div>
                        {consent.schedule.cadence === option.value && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {consent.schedule.cadence !== 'off' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time (Local)
                    </label>
                    <input
                      type="time"
                      value={consent.schedule.windowLocalTime}
                      onChange={(e) => setConsent(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, windowLocalTime: e.target.value }
                      }))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Timezone: {consent.schedule.timezone}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConsentSettings;





































