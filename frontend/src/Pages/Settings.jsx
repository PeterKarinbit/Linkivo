import React, { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { useDarkMode } from "../context/DarkModeContext";

// Enhanced Switch component with loading state and better accessibility
function Switch({ checked, onChange, id, disabled = false, loading = false }) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        disabled || loading 
          ? 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600' 
          : checked 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
      }`}
      onClick={() => !disabled && !loading && onChange(!checked)}
      aria-pressed={checked}
      aria-describedby={`${id}-description`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        } ${loading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}

// Enhanced notification component
function NotificationBanner({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' 
    ? 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800' 
    : 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
  
  const textColor = type === 'error'
    ? 'text-red-700 dark:text-red-100'
    : 'text-green-700 dark:text-green-100';

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
  // Enhanced localStorage utility with error handling
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

  // Job Search Settings
  const [jobType, setJobType] = useState(getPref("jobType", "Full-time"));
  const [jobLocation, setJobLocation] = useState(getPref("jobLocation", ""));
  const [searchRadius, setSearchRadius] = useState(getPref("searchRadius", "50"));
  const [salaryRange, setSalaryRange] = useState(getPref("salaryRange", "any"));
  
  // Application Settings
  const [jobMatchScore, setJobMatchScore] = useState(getPref("jobMatchScore", true));
  const [followUpDays, setFollowUpDays] = useState(getPref("followUpDays", "7"));
  
  // Notification Settings
  const [emailAlerts, setEmailAlerts] = useState(getPref("emailAlerts", true));
  const [appStatusUpdates, setAppStatusUpdates] = useState(getPref("appStatusUpdates", true));
  const [jobAlerts, setJobAlerts] = useState(getPref("jobAlerts", true));
  
  // Appearance Settings
  const { darkMode, setDarkMode } = useDarkMode();

  // Enhanced notification state
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState({});

  // Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordForEmail, setPasswordForEmail] = useState("");

  // Enhanced notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  // Enhanced save handlers with loading states and error handling
  const saveJobPrefs = async () => {
    setLoading(prev => ({ ...prev, jobPrefs: true }));
    try {
      const success = setPref("jobType", jobType) &&
                     setPref("jobLocation", jobLocation) &&
                     setPref("searchRadius", searchRadius) &&
                     setPref("salaryRange", salaryRange);
      
      if (success) {
        showNotification("Job preferences saved successfully!");
      } else {
        showNotification("Failed to save some preferences", "error");
      }
    } catch (error) {
      showNotification("Failed to save job preferences", "error");
    } finally {
      setLoading(prev => ({ ...prev, jobPrefs: false }));
    }
  };

  const saveApplicationSettings = async () => {
    setLoading(prev => ({ ...prev, appSettings: true }));
    try {
      const success = setPref("jobMatchScore", jobMatchScore) &&
                     setPref("followUpDays", followUpDays);
      
      if (success) {
        showNotification("Application settings saved successfully!");
      } else {
        showNotification("Failed to save application settings", "error");
      }
    } catch (error) {
      showNotification("Failed to save application settings", "error");
    } finally {
      setLoading(prev => ({ ...prev, appSettings: false }));
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

  const saveAppearance = async () => {
    setLoading(prev => ({ ...prev, appearance: true }));
    try {
      const success = setPref("darkMode", darkMode);
      if (success) {
        showNotification("Appearance settings saved successfully!");
      } else {
        showNotification("Failed to save appearance settings", "error");
      }
    } catch (error) {
      showNotification("Failed to save appearance settings", "error");
    } finally {
      setLoading(prev => ({ ...prev, appearance: false }));
    }
  };

  // Enhanced form handlers with better validation
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    
    // Enhanced validation
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
    
    // Email validation
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
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      showNotification(err.message || "Failed to delete account", "error");
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Enhanced job type handler
  const handleJobTypeChange = (type, checked) => {
    const types = jobType ? jobType.split(",").filter(Boolean) : [];
    if (checked) {
      if (!types.includes(type)) {
        setJobType([...types, type].join(","));
      }
    } else {
      setJobType(types.filter(t => t !== type).join(","));
    }
  };

  // Enhanced modal renderer with better animations and accessibility
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
          <h3 className={`text-xl font-bold mb-6 pr-8 ${
            title.toLowerCase().includes('delete') 
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

  return (
    <div className="mt-20 px-5 xl:px-28 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bold text-4xl mb-8 text-gray-900 dark:text-gray-100">Settings</h2>
        
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        )}

        <div className="space-y-8">
          {/* Application Settings */}
          <section className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-600 dark:text-green-400 text-xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Application Settings</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Job Match Score</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Display compatibility scores for job listings</p>
                </div>
                <Switch 
                  checked={jobMatchScore} 
                  onChange={setJobMatchScore} 
                  id="job-match-score"
                  loading={loading.appSettings}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Follow-up Reminder
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">How often to remind you to follow up on applications</p>
                <select
                  value={followUpDays}
                  onChange={e => setFollowUpDays(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading.appSettings}
                >
                  <option value="3">Every 3 days</option>
                  <option value="5">Every 5 days</option>
                  <option value="7">Every 7 days</option>
                  <option value="14">Every 14 days</option>
                </select>
              </div>
              <button
                onClick={saveApplicationSettings}
                disabled={loading.appSettings}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                {loading.appSettings ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Application Settings'
                )}
              </button>
            </div>
          </section>

          {/* Job Preferences Section */}
          <section className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600 dark:text-blue-400 text-xl">💼</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Job Preferences</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Preferred Job Types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Full-time', 'Part-time', 'Remote', 'Internship', 'Contract'].map((type) => (
                    <label key={type} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobType.includes(type)}
                        onChange={e => handleJobTypeChange(type, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-green-600 rounded border-gray-300 dark:border-gray-600 focus:ring-green-500"
                        disabled={loading.jobPrefs}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={jobLocation}
                  onChange={e => setJobLocation(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="e.g. Nairobi, Kenya"
                  disabled={loading.jobPrefs}
                />
              </div>
              
              <button
                onClick={saveJobPrefs}
                disabled={loading.jobPrefs}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                {loading.jobPrefs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Job Preferences'
                )}
              </button>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">🔔</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailAlerts', label: 'Email Job Alerts', desc: 'Receive new job opportunities via email', checked: emailAlerts, onChange: setEmailAlerts },
                { key: 'appStatusUpdates', label: 'Application Status Updates', desc: 'Get notified when application status changes', checked: appStatusUpdates, onChange: setAppStatusUpdates },
                { key: 'jobAlerts', label: 'Job Alerts', desc: 'Instant notifications for matching jobs', checked: jobAlerts, onChange: setJobAlerts }
              ].map(({ key, label, desc, checked, onChange }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
                  </div>
                  <Switch 
                    checked={checked} 
                    onChange={onChange} 
                    id={key}
                    loading={loading.notifications}
                  />
                </div>
              ))}
              <button
                onClick={saveNotifications}
                disabled={loading.notifications}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                {loading.notifications ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Notification Settings'
                )}
              </button>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🎨</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Toggle between light and dark themes</p>
              </div>
              <div className="flex items-center space-x-4">
                <Switch 
                  checked={darkMode} 
                  onChange={setDarkMode} 
                  id="darkMode"
                  loading={loading.appearance}
                />
                <button
                  onClick={saveAppearance}
                  disabled={loading.appearance}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  {loading.appearance ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Account Management Section */}
          <section className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-4">
                <span className="text-red-600 dark:text-red-400 text-xl">👤</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Account Management</h3>
            </div>
            <div className="space-y-4">
              <button
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                onClick={() => { setShowPasswordModal(true); clearNotification(); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-600 dark:text-green-400 font-medium text-lg">Change Password</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update your account password</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
                </div>
              </button>
              <button
                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                onClick={() => { setShowEmailModal(true); clearNotification(); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-600 dark:text-green-400 font-medium text-lg">Update Email</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Change your email address</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</span>
                </div>
              </button>
              <button
                className="w-full text-left p-4 bg-red-50 dark:bg-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors group"
                onClick={() => { setShowDeleteModal(true); clearNotification(); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-red-600 dark:text-red-400 font-medium text-lg">Delete Account</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Permanently delete your account</p>
                  </div>
                  <span className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300">→</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Enhanced Modals */}
      {renderModal(
        showPasswordModal,
        "Change Password",
        () => setShowPasswordModal(false),
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center"
              disabled={loading.password}
            >
              {loading.password ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                'Change Password'
              )}
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center"
              disabled={loading.email}
            >
              {loading.email ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Email'
              )}
            </button>
          </div>
        </form>
      )}

      {renderModal(
        showDeleteModal,
        "Delete Account",
        () => setShowDeleteModal(false),
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
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
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center"
              onClick={handleDeleteAccount}
              disabled={loading.delete}
            >
              {loading.delete ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
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