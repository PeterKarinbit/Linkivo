import React, { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { useDarkMode } from "../context/DarkModeContext";
import { useClerk } from "@clerk/clerk-react";

// Enhanced Switch component
function Switch({ checked, onChange, id, disabled = false, loading = false }) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${disabled || loading
        ? 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600'
        : checked
          ? 'bg-emerald-600 hover:bg-emerald-700'
          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
        }`}
      onClick={() => !disabled && !loading && onChange(!checked)}
      aria-pressed={checked}
      aria-describedby={`${id}-description`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-1'
          } ${loading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}

// Notification Banner
function NotificationBanner({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error'
    ? 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800'
    : 'bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800';

  const textColor = type === 'error'
    ? 'text-red-700 dark:text-red-100'
    : 'text-emerald-700 dark:text-emerald-100';

  return (
    <div className={`mb-6 p-4 rounded-lg border ${bgColor} ${textColor} flex items-center justify-between shadow-sm`}>
      <span className="flex items-center">
        <span className="mr-2">
          {type === 'error' ? '⚠️' : '✅'}
        </span>
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-4 text-lg font-bold hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

function Settings() {
  const { signOut } = useClerk();
  const getPref = (key, defaultValue) => {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return defaultValue;
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    } catch (error) {
      console.warn(`Failed to read preference ${key}:`, error);
      return defaultValue;
    }
  };

  const setPref = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to save preference ${key}:`, error);
      return false;
    }
  };

  // --- State ---
  const [activeTab, setActiveTab] = useState("account");

  // AI & Privacy Settings
  const [aiConsent, setAiConsent] = useState(getPref("aiConsent", true));
  const [personalization, setPersonalization] = useState(getPref("personalization", true));
  const [aiScopes, setAiScopes] = useState({
    resume: getPref("scope_resume", true),
    journals: getPref("scope_journals", true),
    goals: getPref("scope_goals", true),
    tasks: getPref("scope_tasks", true),
    applications: getPref("scope_applications", true),
    knowledgeBase: getPref("scope_knowledge", true)
  });

  // Initialize from localStorage if backend hasn't loaded yet
  useEffect(() => {
    if (aiScopes.resume === undefined) {
      setAiScopes({
        resume: getPref("scope_resume", true),
        journals: getPref("scope_journals", true),
        goals: getPref("scope_goals", true),
        tasks: getPref("scope_tasks", true),
        applications: getPref("scope_applications", true),
        knowledgeBase: getPref("scope_knowledge", true)
      });
    }
  }, []);

  // Notification Settings
  const [emailAlerts, setEmailAlerts] = useState(getPref("emailAlerts", true));
  const [appStatusUpdates, setAppStatusUpdates] = useState(getPref("appStatusUpdates", true));
  const [jobAlerts, setJobAlerts] = useState(getPref("jobAlerts", true));

  // Display & Preferences Settings
  const { darkMode, setDarkMode } = useDarkMode();
  const [timeFormat, setTimeFormat] = useState(getPref("timeFormat", "12h"));
  const [profileVisibility, setProfileVisibility] = useState(getPref("profileVisibility", "public"));

  // UI State
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState({});

  // Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordForEmail, setPasswordForEmail] = useState("");

  // --- Load AI Consent from Backend ---
  useEffect(() => {
    const loadAIConsent = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const baseOrigin = import.meta?.env?.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseOrigin}/api/v1/enhanced-ai-career-coach/consent`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            const consent = data.data;
            setAiConsent(consent.enabled !== undefined ? consent.enabled : true);
            if (consent.scopes) {
              setAiScopes(prev => ({
                resume: consent.scopes.resume !== undefined ? consent.scopes.resume : prev.resume,
                journals: consent.scopes.journals !== undefined ? consent.scopes.journals : prev.journals,
                goals: consent.scopes.goals !== undefined ? consent.scopes.goals : prev.goals,
                tasks: consent.scopes.tasks !== undefined ? consent.scopes.tasks : prev.tasks,
                applications: consent.scopes.applications !== undefined ? consent.scopes.applications : prev.applications,
                knowledgeBase: consent.scopes.knowledgeBase !== undefined ? consent.scopes.knowledgeBase : prev.knowledgeBase
              }));

              // Also update localStorage
              setPref("scope_resume", consent.scopes.resume !== undefined ? consent.scopes.resume : true);
              setPref("scope_journals", consent.scopes.journals !== undefined ? consent.scopes.journals : true);
              setPref("scope_goals", consent.scopes.goals !== undefined ? consent.scopes.goals : true);
              setPref("scope_tasks", consent.scopes.tasks !== undefined ? consent.scopes.tasks : true);
              setPref("scope_applications", consent.scopes.applications !== undefined ? consent.scopes.applications : true);
              setPref("scope_knowledge", consent.scopes.knowledgeBase !== undefined ? consent.scopes.knowledgeBase : true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading AI consent:', error);
      }
    };

    loadAIConsent();
  }, []);

  // --- Helpers ---

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // --- Save Handlers ---

  const saveAiSettings = async () => {
    setLoading(prev => ({ ...prev, aiSettings: true }));
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showNotification("Please log in to save settings", "error");
        return;
      }

      // Save to backend API
      const baseOrigin = import.meta?.env?.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseOrigin}/api/v1/enhanced-ai-career-coach/consent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: aiConsent,
          scopes: {
            resume: aiScopes.resume,
            journals: aiScopes.journals,
            goals: aiScopes.goals,
            tasks: aiScopes.tasks,
            applications: aiScopes.applications,
            knowledgeBase: aiScopes.knowledgeBase
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save AI settings');
      }

      // Also save to localStorage for quick access
      setPref("aiConsent", aiConsent);
      setPref("personalization", personalization);
      setPref("scope_resume", aiScopes.resume);
      setPref("scope_journals", aiScopes.journals);
      setPref("scope_goals", aiScopes.goals);
      setPref("scope_tasks", aiScopes.tasks);
      setPref("scope_applications", aiScopes.applications);
      setPref("scope_knowledge", aiScopes.knowledgeBase);

      showNotification("AI & Privacy settings saved successfully!");
    } catch (error) {
      console.error('Error saving AI settings:', error);
      showNotification(error.message || "Failed to save AI settings", "error");
    } finally {
      setLoading(prev => ({ ...prev, aiSettings: false }));
    }
  };

  const saveNotifications = async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const success = setPref("emailAlerts", emailAlerts) &&
        setPref("appStatusUpdates", appStatusUpdates) &&
        setPref("jobAlerts", jobAlerts);

      if (success) {
        showNotification("Notification preferences saved successfully!");
      } else {
        showNotification("Failed to save notification preferences", "error");
      }
    } catch (error) {
      showNotification("Failed to save notification preferences", "error");
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const saveDisplayPreferences = async () => {
    setLoading(prev => ({ ...prev, display: true }));
    try {
      // Save time format preference
      const timeFormatSuccess = setPref("timeFormat", timeFormat);
      const profileVisibilitySuccess = setPref("profileVisibility", profileVisibility);

      // Dark mode is handled by DarkModeContext automatically
      // But we can also save it for consistency
      setPref("darkMode", darkMode);

      if (timeFormatSuccess && profileVisibilitySuccess) {
        showNotification("Display preferences saved successfully!");
      } else {
        showNotification("Failed to save display preferences", "error");
      }
    } catch (error) {
      console.error('Error saving display preferences:', error);
      showNotification("Failed to save display preferences", "error");
    } finally {
      setLoading(prev => ({ ...prev, display: false }));
    }
  };

  const handleExportData = async () => {
    setLoading(prev => ({ ...prev, export: true }));
    try {
      // Get user profile data
      const userData = await userService.getCurrentUser();

      // Create export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: userData.data,
        preferences: {
          darkMode,
          timeFormat,
          profileVisibility,
          aiConsent,
          personalization,
          emailAlerts,
          appStatusUpdates,
          jobAlerts
        }
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobhunter-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification("Data exported successfully!");
    } catch (error) {
      showNotification("Failed to export data", "error");
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  // --- Account Handlers ---

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    if (newPassword.length < 6) {
      showNotification("New password must be at least 6 characters long", "error");
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match", "error");
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }
    try {
      await userService.changePassword({ currentPassword, newPassword });
      showNotification("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      showNotification(err.message || "Failed to change password", "error");
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, email: true }));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Please enter a valid email address", "error");
      setLoading(prev => ({ ...prev, email: false }));
      return;
    }
    try {
      await userService.updateEmail({ email, password: passwordForEmail });
      showNotification("Email updated successfully!");
      setEmail("");
      setPasswordForEmail("");
      setTimeout(() => setShowEmailModal(false), 1500);
    } catch (err) {
      showNotification(err.message || "Failed to update email", "error");
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      await userService.deleteAccount();
      showNotification("Account deleted. Logging out...");

      // Sign out from Clerk to prevent auto-login
      await signOut();

      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err) {
      showNotification(err.message || "Failed to delete account", "error");
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // --- Modal Renderer ---
  const renderModal = (isOpen, title, onClose, children) => {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 w-full max-w-md shadow-2xl relative border dark:border-gray-700 transform animate-slideUp max-h-[90vh] overflow-y-auto">
          <button
            className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
          <h3 className={`text-xl font-bold mb-6 pr-8 ${title.toLowerCase().includes('delete')
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-900 dark:text-gray-100'
            }`}>
            {title}
          </h3>
          {children}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'ai', label: 'AI & Privacy', icon: 'fa-robot' },
    { id: 'display', label: 'Display & Preferences', icon: 'fa-sliders' },
    { id: 'account', label: 'Account Security', icon: 'fa-user-shield' },
  ];

  return (
    <div className="mt-20 px-6 bg-gray-50 dark:bg-gray-900 min-h-screen pb-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h2 className="font-bold text-3xl text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account, privacy, and preferences.</p>
        </div>

        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
              <div className="flex flex-col">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors text-left border-l-4 ${activeTab === tab.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-info-circle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                          Notification Settings Coming Soon
                        </h4>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                          Email and push notification preferences will be available in a future update. For now, all notifications are enabled by default.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 opacity-60">
                    {[
                      { key: 'emailAlerts', label: 'Email Job Alerts', desc: 'Get new opportunities via email', checked: true, onChange: () => { } },
                      { key: 'appStatusUpdates', label: 'Application Updates', desc: 'Status changes on your applications', checked: true, onChange: () => { } },
                      { key: 'jobAlerts', label: 'Instant Job Alerts', desc: 'Real-time notifications for matches', checked: true, onChange: () => { } }
                    ].map(({ key, label, desc, checked, onChange }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                        </div>
                        <Switch checked={checked} onChange={onChange} id={key} disabled={true} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30 mb-6">
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      <i className="fa-solid fa-shield-halved mr-2"></i>
                      Control exactly what data your AI Coach can access to personalize your experience.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      General Permissions
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">AI Data Usage</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Allow AI to use data for basic personalization</p>
                      </div>
                      <Switch checked={aiConsent} onChange={setAiConsent} id="aiConsent" loading={loading.aiSettings} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Personalized Insights</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive tailored career recommendations</p>
                      </div>
                      <Switch checked={personalization} onChange={setPersonalization} id="personalization" loading={loading.aiSettings} />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Data Access Scopes
                    </h4>
                    {[
                      { id: 'resume', label: 'Resume & CV', desc: 'Allow analysis of your resume for job matching' },
                      { id: 'journals', label: 'Career Journals', desc: 'Learn from your reflections and notes' },
                      { id: 'goals', label: 'Goals & Targets', desc: 'Align recommendations with your set goals' },
                      { id: 'tasks', label: 'Tasks & To-dos', desc: 'Access your task list for better planning' },
                      { id: 'applications', label: 'Job Applications', desc: 'Track and optimize your application history' },
                      { id: 'knowledgeBase', label: 'Knowledge Base', desc: 'Reference your uploaded documents' }
                    ].map(scope => (
                      <div key={scope.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{scope.label}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{scope.desc}</p>
                        </div>
                        <Switch
                          checked={aiScopes[scope.id] || false}
                          onChange={(val) => setAiScopes(prev => ({ ...prev, [scope.id]: val }))}
                          id={scope.id}
                          loading={loading.aiSettings}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveAiSettings}
                    disabled={loading.aiSettings}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
                  >
                    {loading.aiSettings ? 'Saving...' : 'Save AI & Privacy Settings'}
                  </button>
                </div>
              )}

              {activeTab === 'display' && (
                <div className="space-y-6">
                  {/* Theme Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Theme
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Toggle light/dark theme</p>
                      </div>
                      <Switch checked={darkMode} onChange={setDarkMode} id="darkMode" loading={loading.display} />
                    </div>
                  </div>

                  {/* Time Format */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Time Display
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Format</label>
                      <select
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        disabled={loading.display}
                      >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose how time is displayed throughout the application
                      </p>
                    </div>
                  </div>

                  {/* Profile Settings */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Profile Visibility
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who can see your profile</label>
                      <select
                        value={profileVisibility}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        disabled={loading.display}
                      >
                        <option value="public">Public - Everyone can see</option>
                        <option value="registered">Registered Users Only</option>
                        <option value="private">Private - Only You</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {profileVisibility === 'public' && 'Your profile is visible to all users and employers'}
                        {profileVisibility === 'registered' && 'Only registered users can view your profile'}
                        {profileVisibility === 'private' && 'Your profile is hidden from everyone'}
                      </p>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                      Data Management
                    </h4>
                    <button
                      onClick={handleExportData}
                      disabled={loading.export}
                      className="w-full text-left p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group border border-blue-100 dark:border-blue-900/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                            <i className="fa-solid fa-download"></i>
                            Export My Data
                          </span>
                          <p className="text-xs text-blue-500/70 dark:text-blue-400/70 mt-1">
                            Download all your data as JSON file
                          </p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-blue-400 group-hover:text-blue-600"></i>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={saveDisplayPreferences}
                    disabled={loading.display}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
                  >
                    {loading.display ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-4">
                  <button
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group border border-gray-100 dark:border-gray-600"
                    onClick={() => { setShowPasswordModal(true); clearNotification(); }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-900 dark:text-white font-medium">Change Password</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update your login password</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-emerald-500"></i>
                    </div>
                  </button>
                  <button
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group border border-gray-100 dark:border-gray-600"
                    onClick={() => { setShowEmailModal(true); clearNotification(); }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-900 dark:text-white font-medium">Update Email</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Change your registered email</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-emerald-500"></i>
                    </div>
                  </button>
                  <button
                    className="w-full text-left p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group border border-red-100 dark:border-red-900/30"
                    onClick={() => { setShowDeleteModal(true); clearNotification(); }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-red-600 dark:text-red-400 font-medium">Delete Account</span>
                        <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-1">Permanently remove your data</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-red-400 group-hover:text-red-600"></i>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderModal(
        showPasswordModal,
        "Change Password",
        () => setShowPasswordModal(false),
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg px-6 py-3 font-medium transition-colors"
              disabled={loading.password}
            >
              {loading.password ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}

      {renderModal(
        showEmailModal,
        "Update Email",
        () => setShowEmailModal(false),
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Email Address</label>
            <input
              type="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter new email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter current password"
              value={passwordForEmail}
              onChange={e => setPasswordForEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowEmailModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg px-6 py-3 font-medium transition-colors"
              disabled={loading.email}
            >
              {loading.email ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </form>
      )}

      {renderModal(
        showDeleteModal,
        "Delete Account",
        () => setShowDeleteModal(false),
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-600 dark:text-red-400 text-xl mr-3">⚠️</span>
              <div>
                <h4 className="text-red-800 dark:text-red-200 font-medium">This action cannot be undone</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                  Deleting your account will permanently remove all your data, including job applications, preferences, and profile information.
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Are you absolutely sure you want to delete your account?
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <button
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg px-6 py-3 font-medium transition-colors"
              onClick={handleDeleteAccount}
              disabled={loading.delete}
            >
              {loading.delete ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Settings;