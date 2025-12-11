import React, { useState } from 'react';
import IvoGuide from '../assets/media/Ivo_Guide.png';

const CanvaSidebar = ({
    navigationItems,
    activeTab,
    onTabChange,
    isOpen,
    setIsOpen,
    onNavigate
}) => {
    const [hoveredItem, setHoveredItem] = useState(null);

    const handleIconClick = (itemId) => {
        if (activeTab === itemId) {
            setIsOpen(!isOpen);
        } else {
            onTabChange(itemId);
            setIsOpen(true);
        }
    };

    const handleSubNavigate = (tab) => {
        if (onNavigate) {
            onNavigate(tab);
            if (window.innerWidth < 1024) setIsOpen(false); // Close on mobile navigation
        }
    };

    const activeItem = navigationItems.find(item => item.id === activeTab);

    // Summary section component
    const SummarySection = ({ title, description, icon, color = 'emerald' }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const colorClasses = {
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30',
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/30',
            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30',
        };
        const iconColorClasses = {
            emerald: 'text-emerald-600 dark:text-emerald-400',
            blue: 'text-blue-600 dark:text-blue-400',
            purple: 'text-purple-600 dark:text-purple-400',
            amber: 'text-amber-600 dark:text-amber-400',
        };

        return (
            <div className={`rounded-xl border ${colorClasses[color]} p-4 mb-6 transition-all duration-300`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center ${iconColorClasses[color]}`}>
                            <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:underline">
                                {title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                What is this page?
                            </p>
                        </div>
                    </div>
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 group-hover:text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}></i>
                </button>
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {description}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Define panel content for each tab
    const renderPanelContent = () => {
        switch (activeTab) {
            case 'main-dashboard':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <SummarySection
                            title="Dashboard"
                            description="Your central command center for career acceleration. Track your progress, view personalized recommendations, and access quick actions to advance your career journey."
                            icon="fa-gauge-high"
                            color="emerald"
                        />

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Quick Actions
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleSubNavigate('goal-setting')}
                                    className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-bullseye"></i>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Set Goals</span>
                                </button>
                                <button
                                    onClick={() => handleSubNavigate('resume-upload')}
                                    className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-file-upload"></i>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upload CV</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Profile Status
                            </h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Completion</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">85%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full" style={{ width: '85%' }}></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 text-center">
                                    Complete your <button onClick={() => handleSubNavigate('goal-setting')} className="text-emerald-600 font-medium hover:underline">goals</button> to reach 100%
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'memories':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <SummarySection
                            title="Memories"
                            description="Your professional journey, archived and searchable. Store achievements, feedback, reflections, and key moments from your career. Use this as your personal career journal to track growth and reference past experiences."
                            icon="fa-book-open"
                            color="blue"
                        />

                        <div className="relative group">
                            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                            <input
                                type="text"
                                placeholder="Search memories..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Collections
                            </h4>
                            <ul className="space-y-2">
                                {['All Memories', 'Achievements', 'Feedback', 'Reflections'].map((item, i) => (
                                    <li
                                        key={i}
                                        onClick={() => handleSubNavigate('memories')}
                                        className="group flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-sm text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                <i className={`fa-regular ${i === 0 ? 'fa-folder-open' : 'fa-folder'}`}></i>
                                            </span>
                                            <span className="font-medium">{item}</span>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            case 'career-inbox':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <SummarySection
                            title="Career Inbox"
                            description="Smart recommendations tailored to your profile. Receive personalized career advice, skill development suggestions, and actionable insights based on your goals, skills, and market trends. Prioritize high-impact actions for maximum career growth."
                            icon="fa-inbox"
                            color="purple"
                        />

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Top Filters
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {['High Priority', 'Quick Wins', 'Long Term', 'Skills'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleSubNavigate('career-inbox')}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Focus Areas
                            </h4>
                            <div className="space-y-3">
                                <div
                                    onClick={() => handleSubNavigate('career-inbox')}
                                    className="group flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 cursor-pointer hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Critical Skills Gap</span>
                                    </div>
                                    <i className="fa-solid fa-arrow-right text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
                                </div>
                                <div
                                    onClick={() => handleSubNavigate('career-inbox')}
                                    className="group flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 cursor-pointer hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Resume Optimization</span>
                                    </div>
                                    <i className="fa-solid fa-arrow-right text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'knowledge-base':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <SummarySection
                            title="Knowledge Base"
                            description="Your intelligent document vault with AI-powered organization. Upload resumes, cover letters, certificates, and portfolios. Our system automatically analyzes documents, extracts key skills and achievements, identifies gaps, and provides actionable feedback. All data is encrypted and organized into smart categories: Processed Insights (analyzed documents), Research (market intelligence), Progress (milestones), and Signals (trending topics). Think of it as your personal career library with a built-in AI librarian."
                            icon="fa-database"
                            color="amber"
                        />

                        <button
                            onClick={() => handleSubNavigate('resume-upload')}
                            className="group w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                        >
                            <i className="fa-solid fa-cloud-arrow-up group-hover:animate-bounce"></i>
                            Upload Document
                        </button>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Categories
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {['Resumes', 'Cover Letters', 'Certificates', 'Portfolios'].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSubNavigate('knowledge-base')}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                <i className="fa-regular fa-file-lines"></i>
                                            </span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{item}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'market-insights':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <SummarySection
                            title="Market Insights"
                            description="Live intelligence on salary, trends, and demand. Explore career pathways, analyze skill gaps, and discover market trends powered by Lightcast and Serper APIs. Make data-driven career decisions with real-time labor market intelligence."
                            icon="fa-chart-line"
                            color="emerald"
                        />

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                Trending Now
                            </h4>
                            <div className="space-y-3">
                                <div
                                    onClick={() => handleSubNavigate('market-insights')}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 hover:shadow-md cursor-pointer transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">AI Engineering</p>
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">+15%</span>
                                    </div>
                                    <p className="text-xs text-slate-500">High demand in Tech sector</p>
                                </div>
                                <div
                                    onClick={() => handleSubNavigate('market-insights')}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 hover:shadow-md cursor-pointer transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Data Science</p>
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">+8%</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Steady growth globally</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
                        <i className="fa-solid fa-layer-group text-3xl mb-3"></i>
                        <p className="text-sm">Select an option</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full z-40 relative font-sans">
            {/* 1. Icon Strip (Fixed Width: 80px for better spacing) */}
            <div className="w-[80px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 z-20 relative h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xl ring-2 ring-slate-100 dark:ring-slate-800">
                        <img src={IvoGuide} alt="Ivo Guide" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>

                <div className="flex flex-col w-full gap-6 mt-4">
                    {navigationItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <div key={item.id} className="relative group w-full px-3">
                                <button
                                    onClick={() => handleIconClick(item.id)}
                                    onMouseEnter={() => setHoveredItem(item.id)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`w-full flex flex-col items-center justify-center py-3.5 rounded-xl transition-all duration-300 relative ${isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full"></div>
                                    )}

                                    <span className={`text-xl mb-1.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                </button>

                                {/* Modern Tooltip */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-700">
                                    {item.label}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Content Panel (Slide out: 300px) */}
            <div
                className={`absolute left-[80px] top-0 h-full w-[300px] bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-10 flex flex-col ${isOpen ? 'translate-x-0 shadow-[8px_0_30px_rgba(0,0,0,0.04)]' : '-translate-x-full opacity-0'
                    }`}
            >
                {/* Panel Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest truncate">
                            {activeItem?.label || 'Menu'}
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Panel Content (Scrollable with custom scrollbar) */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {renderPanelContent()}
                </div>

                {/* Panel Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={() => handleSubNavigate('main-dashboard')}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 group"
                    >
                        <span>Manage Preferences</span>
                        <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvaSidebar;
