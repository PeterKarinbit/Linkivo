import React, { useState } from "react";
import Login from "../components/LoginSignup/Login";
import Signup from "../components/LoginSignup/Signup";
import logo from "../components/assets/media/JobHunter.png";

const slides = [
  {
    title: "AI-Powered Job Matching",
    desc: "Get personalized job recommendations based on your skills and interests.",
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-bounce">
        <circle cx="60" cy="60" r="50" fill="#22c55e" fillOpacity="0.15" />
        <rect x="35" y="50" width="50" height="20" rx="6" fill="#22c55e" />
        <rect x="45" y="60" width="30" height="8" rx="4" fill="#16a34a" />
      </svg>
    ),
  },
  {
    title: "Showcase Your Portfolio",
    desc: "Upload your resume, CV, and portfolio to stand out to employers.",
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-pulse">
        <rect x="25" y="30" width="70" height="60" rx="10" fill="#3b82f6" fillOpacity="0.12" />
        <rect x="35" y="40" width="50" height="40" rx="6" fill="#3b82f6" />
        <rect x="45" y="60" width="30" height="8" rx="4" fill="#2563eb" />
      </svg>
    ),
  },
  {
    title: "Track Your Progress",
    desc: "Monitor your applications and connect with top companies.",
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-spin-slow">
        <circle cx="60" cy="60" r="50" fill="#f59e42" fillOpacity="0.10" />
        <rect x="40" y="50" width="40" height="20" rx="6" fill="#f59e42" />
        <rect x="50" y="60" width="20" height="8" rx="4" fill="#ea580c" />
      </svg>
    ),
  },
];

function OnboardingCarousel() {
  const [idx, setIdx] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(timer);
  }, []);
  const slide = slides[idx];
  return (
    <div className="w-full max-w-xs md:max-w-sm flex flex-col items-center text-center mb-8 md:mb-0 md:mr-12 animate-fade-in">
      {slide.svg}
      <h3 className="text-xl font-bold text-white mt-6 mb-2 drop-shadow-lg">{slide.title}</h3>
      <p className="text-gray-200 text-base mb-2 drop-shadow">{slide.desc}</p>
      <div className="flex gap-2 justify-center mt-2">
        {slides.map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-green-400' : 'bg-gray-500'} transition-all`}></span>
        ))}
      </div>
    </div>
  );
}

function LoginSignUp() {
  const [loginSelected, setLoginSelected] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-2 py-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 animate-fade-in">
        {/* Onboarding Carousel (left on desktop, top on mobile) */}
        <OnboardingCarousel />
        {/* Auth Card */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo and Welcome */}
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="JobHunter Logo" className="w-16 h-16 mb-2 rounded-lg shadow-lg animate-fade-in" />
            <h1 className="text-3xl font-bold text-white mb-1 drop-shadow animate-fade-in">JobHunter</h1>
            <p className="text-gray-400 text-base mb-4 animate-fade-in">
              {loginSelected ? "Sign in to your account" : "Create a new account"}
            </p>
            {/* Toggle Buttons with Sliding Green Border */}
            <div className="relative w-full max-w-xs animate-fade-in">
              <div className="flex bg-gray-800 rounded-lg shadow-sm p-1">
                <button
                  onClick={() => setLoginSelected(true)}
                  className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all duration-200 focus:outline-none z-10 ${
                    loginSelected ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                  aria-pressed={loginSelected}
                  aria-label="Sign In Tab"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setLoginSelected(false)}
                  className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all duration-200 focus:outline-none z-10 ${
                    !loginSelected ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                  aria-pressed={!loginSelected}
                  aria-label="Sign Up Tab"
                >
                  Sign Up
                </button>
              </div>
              {/* Sliding Green Border */}
              <span
                className="absolute bottom-0 left-0 h-1 rounded transition-all duration-300"
                style={{
                  width: "50%",
                  background: "linear-gradient(to right, #22c55e, #16a34a)",
                  transform: loginSelected ? "translateX(0%)" : "translateX(100%)",
                }}
              />
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="transition-all duration-300">
              {loginSelected ? (
                <Login hideHeader onSwitchToSignup={() => setLoginSelected(false)} />
              ) : (
                <Signup hideHeader onSwitchToLogin={() => setLoginSelected(true)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSignUp;