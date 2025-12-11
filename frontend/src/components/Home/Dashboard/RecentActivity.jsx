import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FiActivity,
    FiFileText,
    FiMessageSquare,
    FiStar,
    FiArrowRight,
    FiClock,
    FiBookOpen
} from "react-icons/fi";

function RecentActivity({ activities = [] }) {
    const navigate = useNavigate();

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "Recently";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'journal':
                return <FiBookOpen className="text-blue-500" />;
            case 'application':
                return <FiSend className="text-emerald-500" />;
            case 'milestone':
                return <FiStar className="text-yellow-500" />;
            case 'message':
                return <FiMessageSquare className="text-purple-500" />;
            default:
                return <FiActivity className="text-gray-500" />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'journal':
                return 'bg-blue-100 dark:bg-blue-900/30';
            case 'application':
                return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'milestone':
                return 'bg-yellow-100 dark:bg-yellow-900/30';
            default:
                return 'bg-gray-100 dark:bg-gray-700';
        }
    };

    // Backend now provides formatted activities, but we keep safety checks
    const transformedActivities = activities.map(activity => {
        // Strip HTML tags as a safety net
        const cleanText = (text) => {
            if (!text) return '';
            return String(text)
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        return {
            id: activity.id || activity._id,
            type: activity.type || 'journal',
            title: cleanText(activity.title).substring(0, 60),
            description: cleanText(activity.description).substring(0, 100) + (activity.description?.length > 100 ? '...' : ''),
            timestamp: activity.timestamp || activity.createdAt,
            mood: activity.mood
        };
    });

    if (transformedActivities.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
                        <FiActivity className="text-white text-lg" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>

                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FiClock className="text-3xl text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">No recent activity</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Start journaling or apply to jobs to see your activity here.
                    </p>
                    <button
                        onClick={() => navigate("/career-coach")}
                        className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                        Start Career Coaching <FiArrowRight />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
                        <FiActivity className="text-white text-lg" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                {transformedActivities.slice(0, 5).map((activity, index) => (
                    <div
                        key={activity.id || index}
                        className="flex items-start gap-3 group"
                    >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                            {getActivityIcon(activity.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {activity.title}
                                </h4>
                                {activity.mood && (
                                    <span className="text-sm">{activity.mood}</span>
                                )}
                            </div>
                            {activity.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {activity.description}...
                                </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTimeAgo(activity.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All */}
            {transformedActivities.length > 5 && (
                <button
                    onClick={() => navigate("/career-coach")}
                    className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 flex items-center justify-center gap-1 transition-colors"
                >
                    View All Activity <FiArrowRight />
                </button>
            )}
        </div>
    );
}

export default RecentActivity;
