import React, { useEffect, useState } from "react";
import { FiX, FiZap, FiShield, FiAlertTriangle } from "react-icons/fi";

// Main Streak Celebration Component
function StreakCelebration({ streak, tier, bestStreak, onClose }) {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const getTierInfo = (tier) => {
        switch (tier) {
            case 'legend':
                return {
                    emoji: '🏆',
                    title: 'LEGENDARY!',
                    subtitle: '30+ Day Streak',
                    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
                    message: 'You are absolutely unstoppable! Your dedication is inspiring.'
                };
            case 'champion':
                return {
                    emoji: '🥇',
                    title: 'CHAMPION!',
                    subtitle: '14+ Day Streak',
                    gradient: 'from-purple-400 via-purple-500 to-indigo-600',
                    message: 'You\'re a career champion! Keep this momentum going!'
                };
            case 'dedicated':
                return {
                    emoji: '🔥',
                    title: 'ON FIRE!',
                    subtitle: '7+ Day Streak',
                    gradient: 'from-orange-400 via-red-500 to-rose-600',
                    message: 'One week strong! You\'re building amazing habits.'
                };
            case 'consistent':
                return {
                    emoji: '⭐',
                    title: 'CONSISTENT!',
                    subtitle: '3+ Day Streak',
                    gradient: 'from-blue-400 via-blue-500 to-cyan-600',
                    message: 'Great consistency! The habit is forming.'
                };
            default:
                return {
                    emoji: '🌱',
                    title: 'GREAT START!',
                    subtitle: 'Building Your Streak',
                    gradient: 'from-green-400 via-emerald-500 to-teal-600',
                    message: 'You\'ve started your journey! Keep coming back daily.'
                };
        }
    };

    const tierInfo = getTierInfo(tier);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            {/* Confetti Effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-bounceIn">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                    <FiX className="text-xl" />
                </button>

                {/* Header with gradient */}
                <div className={`bg-gradient-to-br ${tierInfo.gradient} p-8 text-center text-white`}>
                    <div className="text-7xl mb-4 animate-bounce">{tierInfo.emoji}</div>
                    <h2 className="text-3xl font-black mb-2">{tierInfo.title}</h2>
                    <p className="text-lg opacity-90">{tierInfo.subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <FiZap className="text-2xl text-yellow-500" />
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{streak}</span>
                        <span className="text-xl font-medium text-gray-500 dark:text-gray-400">day streak!</span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {tierInfo.message}
                    </p>

                    {bestStreak && bestStreak > streak && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                            Your best: {bestStreak} days 🏅
                        </p>
                    )}

                    {bestStreak && streak >= bestStreak && (
                        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl p-3 mb-4">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                🎊 New Personal Best!
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${tierInfo.gradient} hover:opacity-90 transition-opacity`}
                    >
                        Keep Going! 💪
                    </button>
                </div>
            </div>
        </div>
    );
}

// Streak Lost Modal
export function StreakLostModal({ lostStreak, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <FiX className="text-xl text-gray-500" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-8 text-center text-white">
                    <div className="text-6xl mb-4">😢</div>
                    <h2 className="text-2xl font-bold mb-2">Streak Lost</h2>
                    <p className="text-gray-300">Your {lostStreak} day streak has ended</p>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FiAlertTriangle className="text-3xl text-gray-400" />
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Don't worry! Every expert was once a beginner. Start fresh and build an even longer streak! 🚀
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            💡 <strong>Pro tip:</strong> Earn streak freezes by staying active to protect your future streaks!
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-opacity"
                    >
                        Start Fresh! 💪
                    </button>
                </div>
            </div>
        </div>
    );
}

// Streak Freeze Used Modal
export function StreakFreezeModal({ currentStreak, freezesLeft, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <FiX className="text-xl text-gray-500" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center text-white">
                    <div className="text-6xl mb-4">🛡️</div>
                    <h2 className="text-2xl font-bold mb-2">Streak Protected!</h2>
                    <p className="text-blue-100">Freeze shield activated</p>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FiShield className="text-3xl text-blue-500" />
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Your <strong>{currentStreak} day streak</strong> was saved by a freeze!
                    </p>

                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-gray-500 dark:text-gray-400">Freezes remaining:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{freezesLeft} 🛡️</span>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            ⚠️ Try to log in daily to avoid using your freezes!
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-opacity"
                    >
                        Got It! 👍
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StreakCelebration;
