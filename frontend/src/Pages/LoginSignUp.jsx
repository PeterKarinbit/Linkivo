import React, { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { useSignIn, useSignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import useUpdateUserData from "../hooks/useUpdateUserData";
import logo from "../components/assets/media/JobHunter.png";

const TypewriterText = ({ words }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  // Typing logic
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, parseInt(Math.random() * 350)));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="inline-block relative">
      {`${words[index].substring(0, subIndex)}`}
      <span className={`absolute -right-1 top-0 bottom-0 w-1 bg-white ${blink ? "opacity-100" : "opacity-0"}`}></span>
    </span>
  );
};

// Left Panel Content Component
function LeftPanelContent() {
  return (
    <div className="flex flex-col justify-between h-full p-12 text-white relative z-10">
      {/* Top Branding - Linkivo Logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center p-2 shadow-lg">
          <img src={logo} alt="Linkivo" className="w-full h-full object-contain" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Linkivo</span>
      </div>

      {/* Main Hero Content */}
      <div className="space-y-6">
        <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight min-h-[3.6em]">
          Get<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-white">
            <TypewriterText words={["Everything", "The Job", "The Future", "Success"]} />
          </span><br />
          You Want
        </h1>
        <p className="text-lg font-light text-white/90 max-w-sm leading-relaxed">
          You can get everything you want if you work hard, trust the process, and stick to the plan.
        </p>
      </div>

      {/* Bottom Accent */}
      <div className="text-xs font-light tracking-widest opacity-60">
        LINKIVO © 2024
      </div>
    </div>
  );
}

function LoginSignUp() {
  const [isLogin, setIsLogin] = useState(window.location.pathname !== "/signup");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [isLoginVerification, setIsLoginVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showDevPopup, setShowDevPopup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password Strength Logic
  const getPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length === 0) return 0;
    if (pass.length >= 8) strength += 10;
    if (pass.length >= 10) strength += 10;
    if (pass.length >= 12) strength += 20; // Bonus for length
    if (/[A-Z]/.test(pass)) strength += 10;
    if (/[a-z]/.test(pass)) strength += 10;
    if (/[0-9]/.test(pass)) strength += 20;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
    return Math.min(100, strength);
  };

  const strength = getPasswordStrength(formData.password);

  const getStrengthColor = (s) => {
    if (s <= 20) return "bg-red-500";
    if (s <= 40) return "bg-orange-500";
    if (s <= 60) return "bg-yellow-500";
    if (s <= 80) return "bg-lime-500";
    return "bg-green-600";
  };

  const getStrengthLabel = (s) => {
    if (s <= 20) return "Too Weak";
    if (s <= 40) return "Weak";
    if (s <= 60) return "Fair";
    if (s <= 80) return "Strong";
    return "Excellent";
  };

  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();
  const navigate = useNavigate();
  const updateUser = useUpdateUserData();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setIsLogin(window.location.pathname !== "/signup");
  }, [window.location.pathname]);

  // Ensure clean slate on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!isLoaded) return;
      // If signed in AND NOT verifying email (to prevent race condition with handleVerifyEmail)
      if (isSignedIn && !verificationStep) {
        console.log("User already signed in, redirecting to home...");
        navigate("/home-logged-in");
      }
    };
    checkSession();
  }, [isLoaded, isSignedIn, verificationStep]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (verificationStep) {
      handleVerifyEmail();
    } else if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const handleLogin = async () => {
    if (!signInLoaded) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });

        let retries = 3;
        let token = null;
        while (retries > 0 && !token) {
          token = await getToken();
          if (!token) await new Promise(r => setTimeout(r, 500));
          retries--;
        }

        if (token) {
          localStorage.setItem("accessToken", token);
          await updateUser();
          navigate("/");
        } else {
          navigate("/");
        }
      } else {
        console.error("Login Incomplete Result:", result);

        // Handle Email Verification required during Login
        if (result.status === "needs_first_factor") {
          const emailFactor = result.supportedFirstFactors?.find(
            (factor) => factor.strategy === "email_code"
          );

          if (emailFactor) {
            // Trigger the email code
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });

            setIsLoginVerification(true);
            setVerificationStep(true);
            setErrorMessage(""); // Clear error
            return;
          }
        }

        setErrorMessage(`Login incomplete. Status: ${result.status}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.errors?.[0]?.message || "Invalid email or password";
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setErrorMessage("Incorrect password");
      } else if (err.errors?.[0]?.code === "form_identifier_not_found") {
        setErrorMessage("Account not found. Please Sign Up.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signUpLoaded) return;
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      setTimeout(() => {
        setLoading((current) => {
          if (current) console.warn("Signup taking too long, resetting state.");
          return false;
        });
      }, 60000); // Increased to 60s to avoid premature reset

      const baseName = formData.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const username = `${baseName}${Math.floor(Math.random() * 10000)}`;

      const signUpResult = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        username: username,
        firstName: formData.name.split(" ")[0],
        lastName: formData.name.split(" ").slice(1).join(" ") || "",
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationStep(true);
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage(err.errors?.[0]?.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    setErrorMessage("");

    try {
      let completeSignUp;
      if (isLoginVerification) {
        // Handle Login Verification (First Factor)
        completeSignUp = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: verificationCode,
        });
      } else {
        // Handle Signup Verification
        completeSignUp = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });
      }

      if (completeSignUp.status === "complete") {
        await (isLoginVerification ? setActiveSignIn : setActiveSignUp)({
          session: completeSignUp.createdSessionId
        });

        let retries = 3;
        let token = null;
        while (retries > 0 && !token) {
          token = await getToken();
          if (!token) await new Promise(r => setTimeout(r, 500));
          retries--;
        }

        if (token) {
          localStorage.setItem("accessToken", token);
          await updateUser();
          localStorage.removeItem('ivo-onboarding-step');
          navigate("/user-onboarding");
        } else {
          localStorage.removeItem('ivo-onboarding-step');
          navigate("/user-onboarding");
        }
      } else if (completeSignUp.status === "missing_requirements") {
        setErrorMessage(`Registration incomplete. Missing requirements: ${completeSignUp.missingFields.join(", ")}`);
      } else {
        setErrorMessage("Verification incomplete.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setErrorMessage(err.errors?.[0]?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (strategy) => {
    if (strategy === 'oauth_google') {
      setShowDevPopup(true);
      return;
    }

    if (!signInLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error("Error signing in", err);
      setErrorMessage("Error signing in with Google");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (isLogin) {
      navigate("/signup");
    } else {
      navigate("/login");
    }
    setErrorMessage("");
    setVerificationStep(false);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-white overflow-y-auto lg:overflow-hidden">
      {/* LEFT SIDE - Gradient Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-600 to-blue-900">
        {/* Decorative flowing waves overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 0.3 }} />
                <stop offset="50%" style={{ stopColor: '#ef4444', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <path d="M0,300 Q250,200 500,300 T1000,300 L1000,0 L0,0 Z" fill="url(#wave-gradient)" />
            <path d="M0,500 Q250,400 500,500 T1000,500 L1000,0 L0,0 Z" fill="url(#wave-gradient)" opacity="0.5" />
            <path d="M0,700 Q250,600 500,700 T1000,700 L1000,0 L0,0 Z" fill="url(#wave-gradient)" opacity="0.3" />
          </svg>
        </div>

        <LeftPanelContent />
      </div>

      {/* RIGHT SIDE - Clean White Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[440px] space-y-8">

          {/* Logo/Brand */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <img src={logo} alt="Linkivo Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-xl font-bold tracking-tight text-gray-900">Linkivo</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
              {isLogin ? "Welcome Back" : verificationStep ? "Verify Email" : "Start Your Journey"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin
                ? "Enter your email and password to access your account"
                : verificationStep
                  ? "Enter the verification code sent to your email"
                  : "Take the first step towards your dream career"}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">

            {/* Name Field (Signup only) */}
            {!isLogin && !verificationStep && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
            )}

            {/* Email Field */}
            {!verificationStep && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  placeholder="john@example.com"
                />
              </div>
            )}

            {/* Password Field */}
            {!verificationStep && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                  </button>
                </div>
                {/* Strength Bar - Only on Signup */}
                {!isLogin && formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">{getStrengthLabel(strength)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password */}
            {!isLogin && !verificationStep && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                  </button>
                </div>
                {/* Match Indicator */}
                {formData.confirmPassword && (
                  <p className={`text-xs mt-1 font-medium ${formData.password === formData.confirmPassword ? "text-green-600" : "text-red-500"}`}>
                    {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            {/* Verification Code Input */}
            {!isLogin && verificationStep && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-center text-2xl tracking-[0.5em] font-mono text-gray-900"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-center text-gray-500 mt-2">
                  Check your email for the verification code
                </p>
              </div>
            )}

            {/* Remember me (Login only) */}
            {isLogin && !verificationStep && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white rounded-lg py-3.5 font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? "Sign In" : verificationStep ? "Verify Email" : "Create Account"
              )}
            </button>
          </div>

          {/* Divider */}
          {!verificationStep && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or continue with</span>
              </div>
            </div>
          )}

          {/* Social Login */}
          {!verificationStep && (
            <button
              type="button"
              onClick={() => handleSocialAuth('oauth_google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            >
              <FaGoogle className="text-gray-700" size={18} />
              <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
            </button>
          )}


          {/* Toggle Login/Signup */}
          {!verificationStep && (
            <p className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-gray-900 hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Development Popup Modal */}
      {showDevPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Under Development</h3>
            <p className="text-gray-500 text-center mb-6">
              Google Sign-In is currently being updated to improve your experience. Please use email and password to sign up.
            </p>
            <button
              onClick={() => setShowDevPopup(false)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginSignUp;