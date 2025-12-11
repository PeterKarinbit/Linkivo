import React, { useState } from 'react';
import { FiX, FiLock, FiClock, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

const AUTO_LOCK_OPTIONS = [
  { value: '5', label: '5 minutes', desc: 'Lock after 5 minutes of inactivity' },
  { value: '15', label: '15 minutes', desc: 'Lock after 15 minutes of inactivity' },
  { value: '30', label: '30 minutes', desc: 'Lock after 30 minutes of inactivity' },
  { value: '60', label: '1 hour', desc: 'Lock after 1 hour of inactivity' },
  { value: 'never', label: 'Never', desc: 'Stay unlocked (less secure)' }
];

function SecuritySettings({ initialAutolock = '15', onSave, onClose }) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [autolock, setAutolock] = useState(initialAutolock);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasExistingPin = () => {
    return !!localStorage.getItem('linkivo.aiCoach.v1.pin.hash') && 
           !!localStorage.getItem('linkivo.aiCoach.v1.pin.salt');
  };

  const handleSave = async () => {
    setPinError('');

    // Validate PIN if provided
    if (newPin) {
      if (newPin.length < 4) {
        setPinError('PIN must be at least 4 digits');
        return;
      }
      if (newPin.length > 6) {
        setPinError('PIN must be 4-6 digits');
        return;
      }
      if (!/^\d+$/.test(newPin)) {
        setPinError('PIN must contain only numbers');
        return;
      }
      if (newPin !== confirmPin) {
        setPinError('PINs do not match');
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({ 
        newPin: newPin || undefined, 
        autolock 
      });
      // Reset form on success
      setNewPin('');
      setConfirmPin('');
      setPinError('');
    } catch (error) {
      setPinError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Security Settings</h2>
              <p className="text-xs opacity-90">Manage your AI Career Coach security</p>
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
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* PIN Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <FiLock className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PIN Protection</h3>
            </div>
            
            {hasExistingPin() && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✓ PIN is currently set. Enter a new PIN below to change it.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {hasExistingPin() ? 'New PIN (4-6 digits)' : 'Set PIN (4-6 digits)'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setNewPin(val);
                    setPinError('');
                  }}
                  placeholder={hasExistingPin() ? 'Enter new PIN' : 'Enter PIN'}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use a 4-6 digit PIN for quick access
              </p>
            </div>

            {newPin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm PIN
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmPin(val);
                      setPinError('');
                    }}
                    placeholder="Confirm PIN"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{pinError}</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Auto-Lock Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <FiClock className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Lock</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically lock your AI Career Coach after a period of inactivity for added security.
            </p>

            <div className="space-y-2">
              {AUTO_LOCK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAutolock(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    autolock === option.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.desc}</div>
                    </div>
                    {autolock === option.value && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
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
            disabled={isSaving || (newPin && (!confirmPin || newPin !== confirmPin))}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettings;




































