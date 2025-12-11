import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiX, FiPlayCircle, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';
import { useTour } from '../../context/TourContext';
import { getAllTours } from '../../config/tourConfig';

// Map tour IDs to their corresponding routes
const TOUR_ROUTES = {
    dashboard: '/',
    aiCoach: '/career-coach',
    upload: '/upload',
    community: '/community',
    settings: '/settings',
    profile: '/profile',
};

const HelpMenu = () => {
    const navigate = useNavigate();
    const { showHelpMenu, setShowHelpMenu, startTour, isTourCompleted, resetAllTours } = useTour();
    const tours = getAllTours();

    const handleStartTour = (tourId) => {
        const route = TOUR_ROUTES[tourId];
        if (route) {
            // Navigate to the page first
            navigate(route);
            // Close help menu
            setShowHelpMenu(false);
            // Start tour after a brief delay to ensure page is loaded
            setTimeout(() => {
                startTour(tourId);
            }, 500);
        } else {
            // Fallback for unknown routes
            setShowHelpMenu(false);
            startTour(tourId);
        }
    };

    if (!showHelpMenu) {
        return (
            <button
                data-tour="help-menu"
                onClick={() => setShowHelpMenu(true)}
                className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
                aria-label="Help & Tours"
            >
                <FiHelpCircle className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ?
                </span>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={() => setShowHelpMenu(false)}
            />

            {/* Help Menu Panel */}
            <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 w-96 max-h-[600px] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <FiHelpCircle className="w-6 h-6" />
                        <h3 className="text-lg font-semibold">Help & Guided Tours</h3>
                    </div>
                    <button
                        onClick={() => setShowHelpMenu(false)}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        aria-label="Close help menu"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Take a guided tour to learn how to use Linkivo features.
                    </p>

                    {/* Tour List */}
                    {tours.map((tour) => {
                        const completed = isTourCompleted(tour.id);
                        return (
                            <div
                                key={tour.id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {tour.title}
                                        </h4>
                                        {completed && (
                                            <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {tour.description}
                                </p>
                                <button
                                    onClick={() => handleStartTour(tour.id)}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full justify-center"
                                >
                                    <FiPlayCircle className="w-4 h-4" />
                                    {completed ? 'Replay Tour' : 'Start Tour'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <button
                        onClick={() => {
                            if (confirm('Reset all tour progress? You can retake all tours from the beginning.')) {
                                resetAllTours();
                            }
                        }}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium w-full justify-center py-2"
                    >
                        <FiRotateCcw className="w-4 h-4" />
                        Reset All Tours
                    </button>
                </div>
            </div>
        </>
    );
};

export default HelpMenu;
