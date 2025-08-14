import React from 'react';

const SettingsSection = ({ title, children, onSave, saveButtonText = 'Save Changes' }) => (
  <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    <div className="space-y-4">
      {children}
      {onSave && (
        <button
          onClick={onSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {saveButtonText}
        </button>
      )}
    </div>
  </section>
);
