import React from "react";
import UserOnboarding from "../components/LoginSignup/UserOnboarding";

function UserOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Container */}
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"></div>
        </div>
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Complete Your Profile
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Help us personalize your experience
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 text-sm font-medium">
                  2
                </div>
                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 text-sm font-medium">
                  3
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Content Container */}
            <div className="p-6 sm:p-8 dark:text-gray-100">
              <UserOnboarding />
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              Need help? Check out our 
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1 underline">
                onboarding guide
              </a>
            </p>
            
            {/* Skip Option */}
            <button className="text-sm text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 underline">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserOnboarding;