import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FiTarget,
    FiTrendingUp,
    FiCheckCircle,
    FiCircle,
    FiArrowRight,
    FiCalendar,
    FiBriefcase
} from "react-icons/fi";

function CareerProgress({ goal, targetDate, progressData, applications }) {
    const navigate = useNavigate();

    const milestones = [
        {
            id: 1,
            title: "Set Career Goal",
            completed: !!goal,
            action: () => navigate("/ai-career-coach")
        },
        {
            id: 2,
            title: "Complete Profile",
            completed: progressData?.profileComplete || false,
            action: () => navigate("/profile")
        },
        {
            id: 3,
            title: "Upload Resume",
            completed: progressData?.hasResume || false,
            action: () => navigate("/upload")
        },
        {
            id: 4,
            title: "Apply to Jobs",
            completed: (applications?.applied || 0) >= 5,
            action: () => navigate("/jobs")
        },
        {
            id: 5,
            title: "Get Interviews",
            completed: (applications?.interviews || 0) >= 1,
            action: () => navigate("/applications")
        }
    ];

    const completedCount = milestones.filter(m => m.completed).length;
    const progressPercent = (completedCount / milestones.length) * 100;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <FiTarget className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Career Progress</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {goal ? `Path to ${goal}` : "Set your career goal to track progress"}
                        </p>
                    </div>
                </div>
                {targetDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                        <FiCalendar className="text-emerald-500" />
                        <span>Target: {targetDate}</span>
                    </div>
                )}
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                    <span className="text-sm font-bold text-emerald-600">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="space-y-3">
                {milestones.map((milestone, index) => (
                    <div
                        key={milestone.id}
                        onClick={!milestone.completed ? milestone.action : undefined}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${milestone.completed
                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                            }`}
                    >
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${milestone.completed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                            }`}>
                            {milestone.completed ? (
                                <FiCheckCircle className="text-lg" />
                            ) : (
                                <span className="text-sm font-medium">{milestone.id}</span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <p className={`font-medium ${milestone.completed
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {milestone.title}
                            </p>
                        </div>

                        {/* Action Arrow */}
                        {!milestone.completed && (
                            <FiArrowRight className="text-gray-400" />
                        )}
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <FiBriefcase className="mx-auto text-xl text-blue-500 mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications?.applied || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Applications Sent</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <FiCalendar className="mx-auto text-xl text-purple-500 mb-1" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications?.interviews || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Interviews</p>
                </div>
            </div>
        </div>
    );
}

export default CareerProgress;
