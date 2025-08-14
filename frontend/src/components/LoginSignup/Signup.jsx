import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/media/JobHunter.png";
import { userService } from "../../services/userService";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const updateUser = useUpdateUserData();
  const [isJobSeeker, setIsJobSeeker] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const resetErrorMessage = () => {
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
    if (!passwordPattern.test(formData.password)) {
      setErrorMessage(
        "Password must include at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 6 characters long."
      );
      resetErrorMessage();
    } else if (formData.password !== formData.confirmPassword) {
      setErrorMessage("The passwords you entered don't match. Please check and try again.");
      resetErrorMessage();
    } else {
      postUserData(formData);
    }
  };

  const postUserData = async (data) => {
    setLoading(true);
    const { name, email, password } = data;
    const userData = {
      email,
      password,
      role: "jobSeeker",
      userProfile: { name },
    };
    try {
      const res = await userService.signup(userData);
      if (res.status === 201) {
        const res = await userService.login({ email, password });
        if (res.status === 200) {
          const userData = await userService.getCurrentUser();
          if (userData) {
            if (userData.role === "jobSeeker") {
              navigate("/user-onboarding");
            } else {
              navigate("/company-onboarding");
            }
            updateUser();
          }
        }
      }
    } catch (error) {
      setErrorMessage(error.response.data.message);
      resetErrorMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex flex-col">
      {/* Header */}
      <header className="bg-transparent px-4 py-4 lg:px-8 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center space-x-3">
          <img src={logo} className="w-10 h-10 rounded-lg" alt="JobHunter Logo" />
          <span className="text-xl font-bold text-white drop-shadow">JobHunter</span>
        </Link>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row items-center justify-center relative">
        {/* Decorative Background Shapes */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 opacity-20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-900 opacity-10 rounded-full blur-3xl animate-pulse" />
        </div>
        {/* Left Side - Hero Section */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 z-10">
          <div className="max-w-md text-center lg:text-left">
            <h1 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
              {isJobSeeker ? "Find the job made for you." : "Discover the perfect fit for your team."}
            </h1>
            <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
              {isJobSeeker ? "Browse over 130K jobs at top companies and fast-growing startups." : "Browse through a vast pool of talented job seekers."}
            </p>
          </div>
        </div>
        {/* Right Side - Form Section */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 z-10">
          <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 relative">
            {/* User Type Toggle */}
            <div className="flex space-x-2 mb-8 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg">
              <button
                onClick={() => setIsJobSeeker(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${isJobSeeker ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                I'm a Job Seeker
              </button>
              <button
                className="flex-1 py-2 rounded-r-lg text-base font-semibold transition-all duration-200 focus:outline-none bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed relative flex items-center justify-center"
                disabled
                title="Coming Soon"
              >
                <span>I'm an Employer</span>
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800 font-semibold">Coming Soon</span>
              </button>
            </div>
            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {isJobSeeker ? "Find your next opportunity!" : "Find the best talents!"}
              </p>
            </div>
            {/* Signup Form */}
            <form onSubmit={handleFormSubmission} className="space-y-5">
              {/* Name/Company Name Field */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {isJobSeeker ? "Full Name" : "Company Name"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaUser />
                  </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder={`Enter ${isJobSeeker ? "your name" : "company name"}`}
                />
                </div>
              </div>
              {/* Email Field */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope />
                  </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="user@example.com"
                />
                </div>
              </div>
              {/* Password Field */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </span>
                <input
                    type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Minimum 6 characters"
                />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              {/* Confirm Password Field */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </span>
                <input
                    type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              {/* Error Message */}
              {errorMessage && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg animate-shake shadow">
                  {errorMessage}
                </div>
              )}
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg shadow-green-500/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 font-medium transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;