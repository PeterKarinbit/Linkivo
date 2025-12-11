import React, { useState, useEffect } from 'react';

const NetworkError = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-reload if we were previously offline/errored to recover state
            if (!isOnline) window.location.reload();
        };
        const handleOffline = () => setIsOnline(false);
        const handleAppNetworkError = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('network-error', handleAppNetworkError);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('network-error', handleAppNetworkError);
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    if (isOnline) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-ping opacity-20"></div>
                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-wifi text-4xl text-gray-400 dark:text-gray-500"></i>
                    <div className="absolute w-12 h-1 bg-red-500 rotate-45 rounded-full"></div>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-display">
                No Internet Connection
            </h2>

            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                We've lost contact with the server. Please check your network connection and try again.
            </p>

            <button
                onClick={handleRetry}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
                <i className="fa-solid fa-rotate-right"></i>
                Try Again
            </button>

            <p className="mt-8 text-xs text-gray-400">
                JobHunter Career Hub
            </p>
        </div>
    );
};

export default NetworkError;
