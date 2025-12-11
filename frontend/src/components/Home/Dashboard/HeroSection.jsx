import React from "react";
import { useNavigate } from "react-router-dom";
import { FiTarget, FiTrendingUp, FiArrowRight, FiStar } from "react-icons/fi";

function HeroSection({ userProfile, careerGoal, progress }) {
    const navigate = useNavigate();
    const firstName = userProfile?.name?.split(" ")[0] || "there";
    const greeting = getGreeting();

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }

    return (
        <div className="relative overflow-hidden rounded-3xl p-8 mb-8 group">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black transition-all duration-500"></div>

            {/* Animated Glow Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:bg-blue-500/30 transition-all duration-700"></div>

            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] rounded-3xl border border-white/10"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Welcome Text */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                                {greeting}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{firstName}</span>
                        </h1>

                        {careerGoal?.title ? (
                            <div className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl p-4 max-w-lg transition-colors group/goal">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover/goal:scale-110 transition-transform">
                                    <FiTarget className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Current Focus</p>
                                    <p className="text-white font-semibold text-lg">{careerGoal.title}</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate("/career-coach")}
                                className="flex items-center gap-3 bg-white text-gray-900 hover:bg-gray-100 px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-white/10 transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="p-1 bg-yellow-100 rounded-full text-yellow-700"><FiStar className="text-sm" /></span>
                                <span>Set your career goal</span>
                                <FiArrowRight className="text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 group/ring">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(progress / 100) * 351.86} 351.86`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{progress}%</div>
                                <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">Profile</div>
                            </div>
                        </div>

                        {progress < 100 && (
                            <button
                                onClick={() => navigate("/profile")}
                                className="hidden md:flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <FiTrendingUp />
                                Complete Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroSection;
