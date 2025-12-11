import React, { useState, useEffect } from "react";
import {
    FiBriefcase,
    FiX,
    FiCheck,
    FiClock,
    FiXCircle,
    FiMessageSquare,
    FiChevronRight
} from "react-icons/fi";

function ApplicationStatusPopup({ applications = [], onUpdateStatus, onDismiss }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Filter applications that might need status updates (applied more than 7 days ago)
    const applicationsNeedingUpdate = applications.filter(app => {
        if (app.needsStatusUpdate === false) return false;

        const appliedDate = new Date(app.appliedAt || app.createdAt);
        const daysSinceApplied = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));

        // Only show for applications older than 7 days and still "applied" status
        return daysSinceApplied >= 7 && app.status === "applied";
    });

    const currentApp = applicationsNeedingUpdate[currentIndex];

    useEffect(() => {
        if (applicationsNeedingUpdate.length > 0) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [applicationsNeedingUpdate.length]);

    const handleStatusUpdate = async (status) => {
        if (currentApp && onUpdateStatus) {
            await onUpdateStatus(currentApp._id, status);

            if (currentIndex < applicationsNeedingUpdate.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setIsVisible(false);
            }
        }
    };

    const handleDismiss = () => {
        if (currentApp && onDismiss) {
            onDismiss(currentApp._id);
        }

        if (currentIndex < applicationsNeedingUpdate.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsVisible(false);
        }
    };

    const handleSkip = () => {
        if (currentIndex < applicationsNeedingUpdate.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsVisible(false);
        }
    };

    if (!isVisible || !currentApp) return null;

    const statusOptions = [
        {
            id: 'interviewing',
            label: 'Got Interview!',
            icon: FiMessageSquare,
            color: 'bg-blue-500 hover:bg-blue-600',
            emoji: '🎉'
        },
        {
            id: 'offered',
            label: 'Got Offer!',
            icon: FiCheck,
            color: 'bg-emerald-500 hover:bg-emerald-600',
            emoji: '🎊'
        },
        {
            id: 'rejected',
            label: 'Rejected',
            icon: FiXCircle,
            color: 'bg-gray-500 hover:bg-gray-600',
            emoji: '😔'
        },
        {
            id: 'no_response',
            label: 'No Response',
            icon: FiClock,
            color: 'bg-yellow-500 hover:bg-yellow-600',
            emoji: '🤷'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FiX className="text-xl" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <FiBriefcase className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Application Update</p>
                            <h3 className="text-lg font-bold">{currentApp.jobTitle || currentApp.title}</h3>
                            <p className="text-blue-100 text-sm">{currentApp.company}</p>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    {applicationsNeedingUpdate.length > 1 && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-300"
                                    style={{ width: `${((currentIndex + 1) / applicationsNeedingUpdate.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm text-blue-100">
                                {currentIndex + 1} of {applicationsNeedingUpdate.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                        Any updates on this application?
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {statusOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleStatusUpdate(option.id)}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-[1.02] ${option.color}`}
                            >
                                <span className="text-lg">{option.emoji}</span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSkip}
                        className="w-full mt-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                        Skip for now
                        <FiChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ApplicationStatusPopup;
