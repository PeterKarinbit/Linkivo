import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import illustration from "../assets/media/JobHunter.png";
import { userService } from "../../services/userService";
import useUpdateUserData from "../../hooks/useUpdateUserData";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { login as loginAction } from "../../store/authSlice";
import { useDispatch } from "react-redux";

function Login() {
  const navigate = useNavigate();
  const updateUser = useUpdateUserData();
  const dispatch = useDispatch();
  console.log('[Login.jsx] Rendered.');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetErrorMessage = () => {
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmission = (e) => {
    e.preventDefault();
    makeLoginRequest(formData);
  };

  const makeLoginRequest = async (userData) => {
    setLoading(true);
    console.log('[Login.jsx] makeLoginRequest called with:', userData);
    
    try {
      // Step 1: Login request
      const res = await userService.login(userData);
      console.log('[Login.jsx] userService.login response:', res);
      
      if (res.status === 200) {
        console.log('[Login.jsx] Login successful, fetching current user...');
        
        // Step 2: Get current user
        try {
          const userResponse = await userService.getCurrentUser();
          console.log('[Login.jsx] userService.getCurrentUser response:', userResponse);
          
          // The user data is now in userResponse.data (backend response structure)
          const userData = userResponse.data || userResponse;
          console.log('[Login.jsx] Extracted userData:', userData);

          if (userData && userData.role && userData.userProfile) {
            dispatch(loginAction({ userData }));
            console.log('[Login.jsx] Dispatched loginAction with:', userData);
            
            try {
              await updateUser();
              console.log('[Login.jsx] updateUser called successfully.');
            } catch (updateError) {
              console.error('[Login.jsx] updateUser failed:', updateError);
              // Don't fail the login just because updateUser failed
            }

            // Navigation logic
            if (userData.role === "jobSeeker") {
              if (userData.userProfile.doneOnboarding) {
                console.log('[Login.jsx] Navigating to /home-logged-in');
                navigate("/home-logged-in");
              } else {
                console.log('[Login.jsx] Navigating to /user-onboarding');
                navigate("/user-onboarding");
              }
            } else if (userData.role === "employer") {
              if (userData.userProfile.doneOnboarding) {
                console.log('[Login.jsx] Navigating to /dashboard/home');
                navigate("/dashboard/home");
              } else {
                console.log('[Login.jsx] Navigating to /company-onboarding');
                navigate("/company-onboarding");
              }
            } else {
              console.log('[Login.jsx] Unknown role, navigating to default page.');
              navigate("/");
            }
          } else {
            console.error('[Login.jsx] getCurrentUser returned invalid data:', userData);
            setErrorMessage('Invalid user data received. Please try again.');
            resetErrorMessage();
          }
        } catch (getCurrentUserError) {
          console.error('[Login.jsx] getCurrentUser failed:', getCurrentUserError);
          setErrorMessage('Failed to fetch user profile. Please try again.');
          resetErrorMessage();
        }
      } else {
        console.log('[Login.jsx] Login response status not 200:', res.status);
        setErrorMessage('Login failed. Please check your credentials and try again.');
        resetErrorMessage();
      }
    } catch (error) {
      console.error('[Login.jsx] Login error:', error);
      
      if (error && error.response && error.response.data) {
        setErrorMessage(error.response.data.message || 'An error occurred during login');
      } else if (error && error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Network error - Please check your connection and ensure the server is running');
      }
      resetErrorMessage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center px-4 py-8 relative">
      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-900 opacity-10 rounded-full blur-3xl animate-pulse" />
      </div>
      <div className="w-full max-w-md z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={illustration}
              alt="JobHunter Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Welcome Back</h1>
          <p className="text-gray-200 text-sm">Sign in to your account</p>
        </div>
        {/* Login Form */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
          <form onSubmit={handleFormSubmission} className="space-y-5">
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
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
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
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
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
            {/* Error Message and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {errorMessage && (
                  <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg animate-shake shadow">
                    {errorMessage}
                  </p>
                )}
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
            {/* Login Button */}
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
          {/* Google Sign In */}
          <button className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-3 shadow border border-gray-200 dark:border-gray-700">
            <FaGoogle className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 font-medium transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;