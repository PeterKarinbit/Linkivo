import React from 'react';

const StepperTabs = ({ steps, currentStep, onStepChange }) => {
  return (
    <div className="flex justify-center items-center gap-2 mb-6">
      {steps.map((stepName, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        return (
          <button
            key={stepName}
            className={`px-4 py-2 rounded-md font-bold transition-all duration-200 transform hover:scale-105
              ${isActive 
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200 dark:border-gray-600'
              }
            `}
            onClick={() => onStepChange(stepNum)}
            disabled={isActive}
          >
            {stepName}
          </button>
        );
      })}
    </div>
  );
};

export default StepperTabs; 