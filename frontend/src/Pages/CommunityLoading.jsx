import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CommunityLoading({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // If user has already visited, skip loading
    if (sessionStorage.getItem("communityVisited")) {
      if (onFinish) onFinish();
      return;
    }
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          sessionStorage.setItem("communityVisited", "true");
          setTimeout(() => {
            if (onFinish) onFinish();
          }, 400);
        }
        return Math.min(prev + Math.random() * 18 + 7, 100);
      });
    }, 350);
    return () => clearInterval(interval);
  }, [onFinish]);

  // Option to skip
  const handleSkip = () => {
    sessionStorage.setItem("communityVisited", "true");
    if (onFinish) onFinish();
  };

  // Option to cancel
  const handleCancel = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      {/* Animated Icon */}
      <div className="mb-8 animate-spin-slow">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="36" stroke="#22c55e" strokeWidth="6" opacity="0.2" />
          <circle cx="40" cy="40" r="36" stroke="#22c55e" strokeWidth="6" strokeDasharray="56 100" />
        </svg>
      </div>
      {/* Onboarding Text */}
      <h1 className="text-3xl font-bold mb-2 text-green-500">Welcome to the Community</h1>
      <p className="text-lg text-gray-200 mb-6 max-w-xl text-center">
        You’re about to enter a new dimension of networking, sharing, and professional growth.<br/>
        Connect, collaborate, and discover opportunities with fellow job seekers and industry pros.
      </p>
      {/* Progress Bar */}
      <div className="w-80 max-w-xs h-4 bg-gray-800 rounded-full overflow-hidden mb-4 border border-green-700">
        <div
          className="h-4 bg-gradient-to-r from-green-500 to-white rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-green-400 text-sm mb-8">Loading your experience... {Math.round(progress)}%</span>
      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default CommunityLoading; 