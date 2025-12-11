import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ivo from './CATDevChat';

import ProgressCompass from '../metrics/ProgressCompass';

const TypingEffect = ({ text, speed = 50, className }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText(''); // Reset first
        let index = 0;

        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.substring(0, index + 1));
                index++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return <span className={className}>{displayedText}</span>;
};

const DashboardView = ({ navigateToStep, proactiveRecommendations, memoryUsage }) => {
    const chatSectionRef = useRef(null);
    const [progressData, setProgressData] = useState({
        goalCompletionRate: 0,
        goalsCompleted: 0,
        totalGoals: 0,
        trend: '+0%',
        raw: null
    });
    const [recentJournals, setRecentJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCompass, setShowCompass] = useState(false);

    useEffect(() => {
        const fetchData = async () => {


            try {
                const headers = {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                };

                const [progressResp, journalResp] = await Promise.all([
                    fetch('/api/v1/enhanced-ai-career-coach/progress', { headers }),
                    fetch('/api/v1/enhanced-ai-career-coach/journal?limit=3', { headers })
                ]);

                if (progressResp.ok) {
                    const res = await progressResp.json();
                    const data = res.data || {};

                    let computedScore = 0;
                    if (data.dimensions && Array.isArray(data.dimensions)) {
                        const total = data.dimensions.reduce((acc, dim) => acc + (dim.current || 0), 0);
                        computedScore = Math.round(total / data.dimensions.length);
                    }

                    // Only set progress data if we have valid data, otherwise keep default (0)
                    const validScore = data.overall_progress || computedScore;
                    if (validScore && validScore > 0) {
                        setProgressData({
                            goalCompletionRate: validScore,
                            goalsCompleted: data.milestones_completed || 0,
                            totalGoals: 0,
                            trend: data.trend || '+0%',
                            raw: data
                        });
                    }
                }

                if (journalResp.ok) {
                    const res = await journalResp.json();
                    if (res.data && Array.isArray(res.data.items)) {
                        setRecentJournals(res.data.items);
                    }
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleScrollToChat = () => {
        chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-transparent"
        >
            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-200 mb-3 tracking-tight font-display">
                            Career Command Center
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-light">
                            <span className="font-medium text-gray-800 dark:text-white">{getGreeting()}. </span>
                            <TypingEffect text="Ready to accelerate your career growth?" speed={40} />
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateToStep('career-journal')}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 font-semibold text-sm flex items-center gap-2 hover:shadow-emerald-500/40 transition-shadow"
                        >
                            <i className="fa-solid fa-pen-nib"></i>
                            <span>New Entry</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateToStep('resume-upload')}
                            className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm font-medium text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>Upload Resume</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Main Progress Card */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white p-8 shadow-2xl shadow-gray-900/20 group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-all duration-700"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                    <i className={`fa-solid ${showCompass ? 'fa-compass' : 'fa-bullseye'} text-2xl text-emerald-400`}></i>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCompass(!showCompass)}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                                    >
                                        <i className={`fa-solid ${showCompass ? 'fa-chart-bar' : 'fa-chart-pie'}`}></i>
                                        {showCompass ? 'Simple' : 'Detailed'}
                                    </button>
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                                        On Track
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                {showCompass ? (
                                    <div className="w-full h-64 flex items-center justify-center">
                                        {/* Pass raw data (with dimensions) to Compass with proper sizing */}
                                        <ProgressCompass data={progressData.raw || {}} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-2 mb-2">
                                            <h3 className="text-5xl font-bold tracking-tighter">{Math.round(progressData.goalCompletionRate)}%</h3>
                                            <p className="text-emerald-400 mb-2 font-medium icon-bounce text-sm">{progressData.trend} vs last week</p>
                                        </div>
                                        <p className="text-gray-400 font-medium">Career Readiness Score</p>

                                        <div className="w-full bg-gray-700/50 h-3 rounded-full mt-6 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressData.goalCompletionRate}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                            ></motion.div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Stat Card 1: Memories */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        onClick={() => navigateToStep('memories')}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-none cursor-pointer group hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                <i className="fa-solid fa-brain text-2xl"></i>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                <i className="fa-solid fa-arrow-right text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 text-sm"></i>
                            </div>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {memoryUsage?.used || 0}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Career Memories</p>
                        <p className="text-xs text-indigo-500 mt-3 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Synced & Encrypted
                        </p>
                    </motion.div>

                    {/* Stat Card 2: Active Insights */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        onClick={() => navigateToStep('career-inbox')}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-none cursor-pointer group hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
                                <i className="fa-solid fa-bolt text-2xl"></i>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30 transition-colors">
                                <i className="fa-solid fa-arrow-right text-gray-400 dark:text-gray-500 group-hover:text-rose-500 text-sm"></i>
                            </div>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {proactiveRecommendations?.length || 0}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Active Insights</p>
                        <p className="text-xs text-rose-500 mt-3 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            Action Required
                        </p>
                    </motion.div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Chat & Recommendations */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* AI Assistant Section */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 blur-sm animate-pulse"></div>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">AI Career Assistant</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold uppercase tracking-wide">Beta</span>
                                </div>
                            </div>
                            <div className="p-0">
                                <Ivo embedded={true} />
                            </div>
                        </motion.div>

                        {/* Recommendations Grid */}
                        <AnimatePresence>
                            {proactiveRecommendations.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                >
                                    <div className="flex justify-between items-center mb-5 px-1">
                                        <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                            <i className="fa-regular fa-star text-amber-500"></i>
                                            Recommended for You
                                        </h3>
                                        <button onClick={() => navigateToStep('career-inbox')} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                                            View All <i className="fa-solid fa-arrow-right text-xs"></i>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {proactiveRecommendations.slice(0, 4).map((rec, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.02, translateY: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all cursor-pointer relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-full group-hover:w-1.5 transition-all"></div>
                                                <div className="pl-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${rec.priority === 'High'
                                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                                            : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                            }`}>
                                                            {rec.priority || 'Medium'} Priority
                                                        </span>
                                                        <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{rec.title}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{rec.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Storage & Quick Links */}
                    <div className="space-y-8">
                        {/* Storage Widget */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50 p-6 relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>

                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 relative z-10">Memory Storage</h3>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="relative w-40 h-40 mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-700/50" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="transparent"
                                            strokeDasharray={439.82}
                                            strokeDashoffset={439.82 - (439.82 * (memoryUsage?.pct || 0)) / 100}
                                            strokeLinecap="round"
                                            className="text-emerald-500 transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tighter">{memoryUsage?.pct || 0}%</span>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Used</span>
                                    </div>
                                </div>

                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                                    You've used <span className="font-semibold text-gray-800 dark:text-gray-200">{memoryUsage?.used || 0}</span> memory slots. Upgrade for unlimited access.
                                </p>

                                <button className="w-full py-3.5 text-sm font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-lg shadow-gray-900/10 dark:shadow-none flex items-center justify-center gap-2 group">
                                    <i className="fa-solid fa-crown text-amber-400 group-hover:scale-110 transition-transform"></i>
                                    Upgrade Plan
                                </button>
                            </div>
                        </motion.div>

                        {/* Quick Access */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50 p-6"
                        >
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                <i className="fa-solid fa-bolt text-emerald-500"></i>
                                Quick Access
                            </h3>
                            <div className="space-y-3">
                                {[
                                    {
                                        label: 'Market Insights',
                                        icon: 'fa-chart-line',
                                        step: 'market-insights',
                                        color: 'text-blue-500',
                                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                                        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
                                        description: 'Live salary & demand data'
                                    },
                                    {
                                        label: 'Knowledge Base',
                                        icon: 'fa-book-open',
                                        step: 'knowledge-base',
                                        color: 'text-amber-500',
                                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                                        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
                                        description: 'Your secure document vault'
                                    },
                                    {
                                        label: 'Career Inbox',
                                        icon: 'fa-inbox',
                                        step: 'career-inbox',
                                        color: 'text-purple-500',
                                        bg: 'bg-purple-50 dark:bg-purple-900/20',
                                        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
                                        description: 'AI-powered recommendations'
                                    }
                                ].map((item, i) => (
                                    <motion.button
                                        key={i}
                                        onClick={() => navigateToStep(item.step)}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full text-left p-4 rounded-2xl ${item.hoverBg} transition-all duration-300 flex items-center justify-between group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 hover:shadow-lg`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                                                <i className={`fa-solid ${item.icon} text-lg`}></i>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors block mb-0.5">{item.label}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{item.description}</span>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-arrow-right text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"></i>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>


                        {/* Recent Activity */}
                        {recentJournals.length > 0 && (
                            <motion.div
                                variants={itemVariants}
                                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50 p-6"
                            >
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    {recentJournals.map((entry, idx) => (
                                        <div key={idx} className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 p-2 rounded-xl transition-colors" onClick={() => navigateToStep('career-journal')}>
                                            <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <i className="fa-solid fa-feather text-xs"></i>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {(entry.metadata?.title && !entry.metadata.title.includes('<'))
                                                        ? entry.metadata.title
                                                        : (entry.content || '').replace(/<[^>]*>?/gm, '').substring(0, 40) + '...'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(entry.metadata?.date || entry.createdAt).toLocaleDateString()} • {entry.metadata?.word_count || 0} words
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => navigateToStep('career-journal')} className="w-full mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                                        View All Entries
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            variants={itemVariants}
                            className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
                            <h4 className="font-bold text-lg mb-2 relative z-10">Need specific help?</h4>
                            <p className="text-indigo-100 text-sm mb-4 relative z-10 opacity-90">Our AI agents are ready to assist with resume tailoring and mock interviews.</p>
                            <button
                                onClick={handleScrollToChat}
                                className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors flex items-center gap-2">
                                Ask AI Agents <i className="fa-solid fa-robot"></i>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardView;
