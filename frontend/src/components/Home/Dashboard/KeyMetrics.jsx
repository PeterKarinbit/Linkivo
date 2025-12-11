import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUser,

    FiCalendar,
    FiZap,
    FiTrendingUp,
    FiArrowRight,
    FiShield
} from "react-icons/fi";

function KeyMetrics({ metrics }) {
    const navigate = useNavigate();

    const { profileStrength, streak } = metrics || {};

    const getStreakColor = (tier) => {
        switch (tier) {
            case 'legend': return 'from-yellow-400 to-amber-600';
            case 'champion': return 'from-purple-400 to-purple-600';
            case 'dedicated': return 'from-orange-400 to-red-500';
            case 'consistent': return 'from-blue-400 to-blue-600';
            case 'starter': return 'from-green-400 to-emerald-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getStreakEmoji = (tier) => {
        switch (tier) {
            case 'legend': return '🏆';
            case 'champion': return '🥇';
            case 'dedicated': return '🔥';
            case 'consistent': return '⭐';
            case 'starter': return '🌱';
            default: return '💪';
        }
    };

    const metricCards = [
        {
            title: "Profile Strength",
            value: `${profileStrength?.score || 0}%`,
            subtitle: profileStrength?.change || "Complete your profile",
            icon: FiUser,
            color: "bg-gradient-to-br from-blue-500 to-indigo-600",
            onClick: () => navigate("/profile"),
            progress: profileStrength?.score || 0
        },

        {
            title: "Login Streak",
            value: `${streak?.days || 0} days`,
            subtitle: streak?.message || "Start your streak!",
            icon: FiZap,
            color: `bg-gradient-to-br ${getStreakColor(streak?.tier)}`,
            emoji: getStreakEmoji(streak?.tier),
            extra: streak?.freezes > 0 ? `${streak?.freezes} 🛡️` : null
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {metricCards.map((card, index) => (
                <div
                    key={index}
                    onClick={card.onClick}
                    className="relative group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                    {/* Hover Gradient Background */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${card.color}`}></div>

                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${card.color}`}></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-none text-white transition-transform group-hover:scale-110 duration-300`}>
                                {card.emoji ? (
                                    <span className="text-2xl">{card.emoji}</span>
                                ) : (
                                    <card.icon className="text-2xl" />
                                )}
                            </div>
                            {card.badge && (
                                <span className={`px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold`}>
                                    {card.badge} New
                                </span>
                            )}
                            {card.extra && (
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                    {card.extra}
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">{card.title}</h3>
                            <div className="flex items-end gap-3 mb-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
                            </div>

                            {/* Actionable Missing Fields for Profile Strength */}
                            {card.title === "Profile Strength" && profileStrength?.missingFields?.length > 0 && typeof profileStrength.missingFields[0] === 'object' ? (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {profileStrength.missingFields.slice(0, 3).map((field, idx) => (
                                        <span
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(field.link);
                                            }}
                                            className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded border border-red-100 dark:border-red-900/50 hover:bg-red-100 transition-colors cursor-pointer"
                                        >
                                            + {field.label}
                                        </span>
                                    ))}
                                    {profileStrength.missingFields.length > 3 && (
                                        <span className="text-xs text-gray-400 self-center">+{profileStrength.missingFields.length - 3} more</span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                    {card.subtitle}
                                    {card.onClick && <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />}
                                </p>
                            )}
                        </div>

                        {/* Progress bar for profile strength */}
                        {card.progress !== undefined && (
                            <div className="mt-5 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${card.color} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${card.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default KeyMetrics;
