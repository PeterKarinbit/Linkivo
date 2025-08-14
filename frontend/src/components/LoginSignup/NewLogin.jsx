import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api_url } from "../../../config";
import { useDispatch } from "react-redux";
import { login as loginAction } from "../../store/authSlice";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle } from "react-icons/fa";

// Logo placeholder - replace with your actual logo import
import logo from "../../assets/media/JobHunter.png";

const NewLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  // Add debug information
  const addDebugInfo = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const newDebugInfo = { timestamp, message, data };
    setDebugInfo(prev => [newDebugInfo, ...prev].slice(0, 50)); // Keep last 50 messages
    console.log(`[DEBUG] ${message}`, data);
  };

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      addDebugInfo("Checking server status...");
      const response = await axios.get(`${api_url}/users/ping`, { timeout: 5000 });
      addDebugInfo("Server status check successful", response.data);
    } catch (error) {
      addDebugInfo("Server status check failed", {
        message: error.message,
        code: error.code,
        config: error.config,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    addDebugInfo("Login attempt", { email: formData.email });

    try {
      // Direct axios call to isolate potential issues
      addDebugInfo("Making login request", { 
        url: `${api_url}/users/login`,
        method: "POST",
        data: formData
      });

      const response = await axios.post(
        `${api_url}/users/login`, 
        formData, 
        {
          withCredentials: true,
          timeout: 10000, // 10 second timeout
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        }
      );

      addDebugInfo("Login request successful", { 
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.data) {
        // Get user profile
        addDebugInfo("Fetching user profile");
        const userResponse = await axios.get(
          `${api_url}/users/profile`,
          {
            withCredentials: true,
            headers: {
              "Authorization": `Bearer ${response.data.data.accessToken}`
            }
          }
        );

        addDebugInfo("User profile fetch successful", userResponse.data);

        // Update Redux store
        dispatch(loginAction({ userData: userResponse.data.data }));

        // Redirect based on user role and onboarding status
        const userData = userResponse.data.data;
        if (userData.role === "jobSeeker") {
          if (userData.userProfile?.doneOnboarding) {
            navigate("/");
          } else {
            navigate("/user-onboarding");
          }
        } else if (userData.role === "employer") {
          if (userData.userProfile?.doneOnboarding) {
            navigate("/dashboard/home");
          } else {
            navigate("/company-onboarding");
          }
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      // Detailed error handling and debugging
      addDebugInfo("Login error", {
        message: error.message,
        code: error.code,
        name: error.name,
        config: error.config,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : "No response"
      });

      if (error.response) {
        // Server responded with an error
        setError(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // No response received
        setError("Could not connect to the server. Please check your internet connection and verify the server is running.");
      } else {
        // Something else happened
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center px-4 py-8 relative">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-900 opacity-10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="JobHunter Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Welcome Back</h1>
          <p className="text-gray-200 text-sm">Sign in to your account</p>
        </div>

        {/* Login form */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-2">
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
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg flex items-start">
                <FaExclamationTriangle className="flex-shrink-0 mr-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 dark:text-gray-300 hover:text-green-400 transition-colors duration-200 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg shadow-green-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
            <span className="mx-4 text-gray-400 bg-white/70 dark:bg-gray-900/70 px-2 rounded-full shadow">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
          </div>

          {/* Debug button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2 rounded-lg transition-all duration-200"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>

          {/* Debug info */}
          {showDebug && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs font-mono overflow-auto max-h-80">
              <div className="font-bold mb-2">Server URL: {api_url}</div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {debugInfo.map((info, index) => (
                  <div key={index} className="py-2">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">{info.timestamp}</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{info.message}</div>
                    {info.data && (
                      <pre className="mt-1 bg-gray-200 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(info.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-700 dark:text-gray-200 mt-6 font-medium">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 font-bold transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewLogin;
