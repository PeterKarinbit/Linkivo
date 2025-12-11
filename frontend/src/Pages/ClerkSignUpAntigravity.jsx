import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { FaGoogle, FaApple, FaChevronLeft, FaChevronRight, FaCheck, FaStar } from 'react-icons/fa';
import { HiOutlineEye, HiOutlineEyeOff, HiSparkles } from 'react-icons/hi';
import logo from '../components/assets/media/JobHunter.png';
import backgroundImage from '../components/assets/media/Linkivo_bg.jpg';

// Animated Background Orbs (for right side only)
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
    </div>
  );
}

// Floating Particles (for right side only)
function FloatingParticles() {
  return (
    <div className="particles-container">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
}

// Testimonial Data
const testimonials = [
  {
    quote: "The AI career coach transformed my job search. I landed my dream role at Google in just 3 weeks!",
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    company: "Google",
    rating: 5
  },
  {
    quote: "Linkivo's roadmap feature gave me clarity I never had. From junior to senior engineer in 18 months.",
    name: "Michael Torres",
    role: "Senior Frontend Developer",
    company: "Meta",
    rating: 5
  },
  {
    quote: "The skills gap analysis was eye-opening. I focused my learning and doubled my salary within a year.",
    name: "Priya Patel",
    role: "Full Stack Developer",
    company: "Stripe",
    rating: 5
  }
];

// Testimonial Carousel
function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  useEffect(() => {
    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [goToNext]);

  const testimonial = testimonials[currentIndex];

  return (
    <div className="testimonial-glass-card">
      <div className={`testimonial-content ${isAnimating ? 'fade-out' : 'fade-in'}`}>
        <div className="flex mb-3">
          {[...Array(testimonial.rating)].map((_, i) => (
            <FaStar key={i} className="text-yellow-400 w-4 h-4" />
          ))}
        </div>
        <p className="testimonial-quote">"{testimonial.quote}"</p>
        <div className="testimonial-author">
          <div className="author-avatar">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="author-name">{testimonial.name}</div>
            <div className="author-role">{testimonial.role} at {testimonial.company}</div>
          </div>
        </div>
      </div>
      <div className="testimonial-nav">
        <button onClick={goToPrev} className="nav-btn">
          <FaChevronLeft />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => !isAnimating && setCurrentIndex(i)}
            />
          ))}
        </div>
        <button onClick={goToNext} className="nav-btn">
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

function AntigravityAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  const isSignupRoute = location.pathname === '/signup';
  const [isLogin, setIsLogin] = useState(!isSignupRoute);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 5) return { level: 3, label: 'Good', color: '#10b981' };
    return { level: 4, label: 'Strong', color: '#059669' };
  };

  const strength = passwordStrength(formData.password);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      if (!signUpLoaded) {
        setErrorMessage("Loading...");
        setLoading(false);
        return;
      }

      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationStep(true);
      setErrorMessage("");

    } catch (error) {
      setErrorMessage(error?.errors?.[0]?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/user-onboarding");
      }
    } catch (error) {
      const errorMsg = error?.errors?.[0]?.message || "";
      if (errorMsg.includes("already verified")) {
        setIsLogin(true);
        setVerificationStep(false);
        setErrorMessage("✅ Already verified! Please sign in.");
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!signInLoaded) {
        setErrorMessage("Loading...");
        setLoading(false);
        return;
      }

      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/home-logged-in");
      }
    } catch (error) {
      setErrorMessage(error?.errors?.[0]?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleOAuth = async () => {
    try {
      if (isLogin) {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/home-logged-in"
        });
      } else {
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/user-onboarding"
        });
      }
    } catch (error) {
      setErrorMessage("Google sign-in failed. Please try again.");
    }
  };



  return (
    <>
      <BackgroundOrbs />
      <FloatingParticles />

      <div className="antigravity-auth-container">
        {/* Left Hero Panel */}
        <div className="hero-panel">
          <div className="hero-content">
            {/* Logo */}
            <div className="brand-header">
              <img src={logo} alt="Linkivo" className="brand-logo-floating" />
              <span className="brand-name-gradient">Linkivo</span>
            </div>

            {/* Stats */}
            <div className="stats-glow">
              <div className="stat-number-gradient">AI-Powered</div>
              <div className="stat-label-shine">Career Growth Platform</div>
            </div>

            {/* Features */}
            <div className="features-glass">
              {[
                "Personalized career roadmaps",
                "AI-powered skills gap analysis",
                "Real-time market insights",
                "Resume & interview coaching"
              ].map((feature, i) => (
                <div key={i} className="feature-item-glow">
                  <FaCheck className="feature-icon-pulse" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <TestimonialCarousel />
          </div>
        </div>

        {/* Right Auth Panel */}
        <div className="auth-panel">
          <div className="auth-card-floating">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title-gradient">
                {isLogin ? "Welcome back" : "Start your journey"}
                <HiSparkles className="inline-block ml-2 text-teal-400 animate-pulse" />
              </h1>
              <p className="auth-subtitle-glow">
                {isLogin
                  ? "Sign in to continue your career growth"
                  : "Take the first step towards your dream career"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={verificationStep ? handleVerifyEmail : (isLogin ? handleLogin : handleSignup)} className="auth-form">
              {/* Name Field (Sign up only) */}
              {!isLogin && !verificationStep && (
                <div className="field-group">
                  <label className="field-label-glow">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="field-input-glass"
                    placeholder="John Doe"
                  />
                </div>
              )}

              {/* Email Field */}
              {!verificationStep && (
                <div className="field-group">
                  <label className="field-label-glow">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="field-input-glass"
                    placeholder="john@example.com"
                  />
                </div>
              )}

              {/* Password Field */}
              {!verificationStep && (
                <div className="field-group">
                  <label className="field-label-glow">Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="field-input-glass pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="eye-toggle-glass"
                    >
                      {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                  {/* Password Strength (Sign up only) */}
                  {!isLogin && formData.password && (
                    <div className="strength-indicator">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="strength-bar"
                            style={{
                              backgroundColor: level <= strength.level ? strength.color : 'rgba(255,255,255,0.1)'
                            }}
                          />
                        ))}
                      </div>
                      <span className="strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (Sign up only) */}
              {!isLogin && !verificationStep && (
                <div className="field-group">
                  <label className="field-label-glow">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="field-input-glass"
                    placeholder="••••••••"
                  />
                  {formData.confirmPassword && (
                    <div className={`match-indicator ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>
              )}

              {/* Verification Code */}
              {!isLogin && verificationStep && (
                <div className="field-group">
                  <label className="field-label-glow">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="field-input-glass text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-green-300/60 mt-2 text-center">
                    Check your email for the verification code
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="error-glass">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="submit-btn-gradient"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner-glow" />
                    {isLogin ? "Signing in..." : verificationStep ? "Verifying..." : "Creating account..."}
                  </span>
                ) : (
                  isLogin ? "Sign in" : verificationStep ? "Verify Email" : "Create account"
                )}
              </button>
            </form>

            {/* Divider */}
            {!verificationStep && (
              <>
                <div className="divider-glow">
                  <span>or continue with</span>
                </div>


                {/* Social Buttons */}
                <div className="social-buttons">
                  <button
                    className="social-btn-glass social-btn-google"
                    onClick={handleGoogleOAuth}
                    type="button"
                  >
                    <FaGoogle />
                    <span>Google</span>
                  </button>
                </div>


                {/* Toggle */}
                <p className="toggle-text-glow">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrorMessage("");
                      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                    }}
                    className="toggle-link-gradient"
                  >
                    {isLogin ? "Sign up here" : "Sign in here"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ==================== ANTIGRAVITY STYLES ==================== */
        
        /* Background & Container */
        .antigravity-auth-container {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #0a0f0d 0%, #051f1a 100%);
          position: relative;
          overflow: hidden;
        }

        /* Animated Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float-orb 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #10b981 0%, transparent 70%);
          top: -200px;
          left: -200px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #14b8a6 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          animation-delay: 5s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #059669 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 10s;
        }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Floating Particles */
        .particles-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(167, 243, 208, 0.4);
          border-radius: 50%;
          animation: float-particle linear infinite;
        }

        @keyframes float-particle {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(100px);
            opacity: 0;
          }
        }

        /* Hero Panel */
        .hero-panel {
          flex: 0 0 45%;
          display: flex;
          align-items: center;
          padding: 4rem;
          position: relative;
          z-index: 10;
          background-image: url(${backgroundImage});
          background-size: cover;
          background-position: center;
        }

        .hero-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(16, 185, 129, 0.15) 0%,
            rgba(5, 150, 105, 0.25) 100%
          );
          z-index: 1;
        }

        .hero-content {
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 2;
        }

        /* Brand Header */
        .brand-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 4rem;
        }

        .brand-logo-floating {
          width: 64px;
          height: 64px;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .brand-name-gradient {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a7f3d0, #10b981, #14b8a6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Stats */
        .stats-glow {
          margin-bottom: 2rem;
        }

        .stat-number-gradient {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f0fdf4, #a7f3d0, #6ee7b7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .stat-label-shine {
          font-size: 1.25rem;
          color: #bbf7d0;
          font-weight: 500;
        }

        /* Features */
        .features-glass {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .feature-item-glow {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #d1fae5;
          font-size: 0.95rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(167, 243, 208, 0.1);
          transition: all 0.3s ease;
        }

        .feature-item-glow:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(167, 243, 208, 0.2);
          transform: translateX(5px);
        }

        .feature-icon-pulse {
          color: #6ee7b7;
          font-size: 0.85rem;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 3px #6ee7b7); }
          50% { filter: drop-shadow(0 0 8px #6ee7b7); }
        }

        /* Testimonial Glass Card */
        .testimonial-glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(167, 243, 208, 0.1) inset,
            0 0 40px rgba(16, 185, 129, 0.1);
        }

        .testimonial-content {
          min-height: 180px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .testimonial-content.fade-out {
          opacity: 0;
          transform: translateY(10px);
        }

        .testimonial-content.fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .testimonial-quote {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #f0fdf4;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #ffffff;
          border: 2px solid rgba(167, 243, 208, 0.3);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .author-name {
          font-weight: 600;
          color: #f0fdf4;
          font-size: 0.95rem;
        }

        .author-role {
          font-size: 0.85rem;
          color: #bbf7d0;
        }

        .testimonial-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #a7f3d0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          transform: scale(1.1);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dot.active {
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          width: 24px;
          border-radius: 4px;
        }

        /* Auth Panel */
        .auth-panel {
          flex: 0 0 55%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          position: relative;
          z-index: 10;
        }

        .auth-card-floating {
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(167, 243, 208, 0.1) inset,
            0 0 100px rgba(16, 185, 129, 0.15);
          animation: float-card 6s ease-in-out infinite;
          transition: all 0.4s ease;
        }

        .auth-card-floating:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 35px 70px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(167, 243, 208, 0.2) inset,
            0 0 120px rgba(16, 185, 129, 0.2);
        }

        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Auth Header */
        .auth-header {
          margin-bottom: 2.5rem;
          text-align: center;
        }

        .auth-title-gradient {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #6ee7b7, #10b981, #14b8a6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .auth-subtitle-glow {
          font-size: 0.95rem;
          color: #bbf7d0;
          line-height: 1.5;
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label-glow {
          font-size: 0.875rem;
          font-weight: 600;
          color: #d1fae5;
          letter-spacing: 0.02em;
        }

        .field-input-glass {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f0fdf4;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .field-input-glass::placeholder {
          color: rgba(167, 243, 208, 0.4);
        }

        .field-input-glass:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 0 0 3px rgba(16, 185, 129, 0.1),
            0 0 20px rgba(16, 185, 129, 0.2);
        }

        .password-wrapper {
          position: relative;
        }

        .eye-toggle-glass {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a7f3d0;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          transition: color 0.3s ease;
        }

        .eye-toggle-glass:hover {
          color: #6ee7b7;
        }

        /* Password Strength */
        .strength-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .strength-bars {
          display: flex;
          gap: 0.25rem;
          flex: 1;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          transition: background-color 0.3s ease;
        }

        .strength-label {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .match-indicator {
          font-size: 0.75rem;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .match-indicator.match {
          color: #6ee7b7;
        }

        .match-indicator.no-match {
          color: #fca5a5;
        }

        /* Submit Button */
        .submit-btn-gradient {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 10px 25px rgba(16, 185, 129, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .submit-btn-gradient:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #0d9488);
          transform: translateY(-2px);
          box-shadow: 
            0 15px 35px rgba(16, 185, 129, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset;
        }

        .submit-btn-gradient:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-glow {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Message */
        .error-glass {
          padding: 0.875rem 1rem;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.875rem;
          animation: shake 0.5s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Divider */
        .divider-glow {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0;
          color: rgba(167, 243, 208, 0.4);
          font-size: 0.875rem;
        }

        .divider-glow::before,
        .divider-glow::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(167, 243, 208, 0.2), transparent);
        }

        /* Social Buttons */
        .social-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .social-btn-glass {
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #d1fae5;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-center: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .social-btn-glass:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .social-btn-google:hover {
          border-color: #4285F4;
          background: rgba(66, 133, 244, 0.1);
          color: #4285F4;
        }

        .social-btn-github:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        /* Toggle Text */
        .toggle-text-glow {
          text-align: center;
          margin-top: 1.5rem;
          color: #bbf7d0;
          font-size: 0.9rem;
        }

        .toggle-link-gradient {
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
          cursor: pointer;
          border: none;
          padding: 0;
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-link-gradient:hover {
          filter: brightness(1.2);
        }

        .toggle-link-gradient::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          transition: width 0.3s ease;
        }

        .toggle-link-gradient:hover::after {
          width: 100%;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .antigravity-auth-container {
            flex-direction: column;
          }

          .hero-panel,
          .auth-panel {
            flex: 1;
            padding: 2rem;
          }

          .auth-card-floating {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default AntigravityAuth;
