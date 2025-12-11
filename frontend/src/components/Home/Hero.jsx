import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import welcomeGif from "../../components/assets/media/Welcome.gif";

const TYPING_SPEED = 40; // ms per character
const DELAY_BETWEEN_TEXTS = 2000; // ms
const DELETE_SPEED = 60; // ms per character when deleting

const TEXTS_TO_TYPE = [
  "Find your dream Job",
  "Gaps in your skills",
  "A successful Career path"
];

const socialIcons = [
  { name: 'linkedin', color: 'text-blue-600', top: '15%', left: '-60px' },
  { name: 'twitter', color: 'text-blue-400', top: '35%', right: '-70px' },
  { name: 'github', color: 'text-gray-800', top: '55%', left: '-50px' },
  { name: 'dribbble', color: 'text-pink-500', top: '75%', right: '-55px' },
];

function Hero() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingPaused, setTypingPaused] = useState(false);

  useEffect(() => {
    let timeout;
    const currentText = TEXTS_TO_TYPE[currentIndex];
    
    if (typingPaused) {
      timeout = setTimeout(() => {
        setTypingPaused(false);
        setIsDeleting(true);
      }, DELAY_BETWEEN_TEXTS);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(prev => prev.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        // Move to next text when done deleting
        setCurrentIndex((currentIndex + 1) % TEXTS_TO_TYPE.length);
        setIsDeleting(false);
      }
    } else {
      // Typing
      if (displayText.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Pause at the end of typing
        setTypingPaused(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, typingPaused]);
  useEffect(() => {
    // Add animation class to social icons
    const icons = document.querySelectorAll('.social-icon');
    icons.forEach((icon, i) => {
      icon.style.animation = `float 3s ease-in-out ${i * 0.3}s infinite`;
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-900 overflow-hidden">
      {/* Left Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 md:py-16 lg:py-20 px-8 md:px-12 lg:px-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4 md:space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-1 md:mb-2"
            >
              <p className="text-emerald-600 dark:text-emerald-400 text-sm md:text-base font-medium tracking-wide">
                Accelerate your Career Growth with
              </p>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white leading-[1.1] mb-4 md:mb-6"
            >
              Linkivo
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-2"
            >
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                We'll help you find{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {displayText}
                  <span className={`inline-block w-1 h-6 bg-emerald-500 ml-1 ${!typingPaused ? 'animate-pulse' : ''}`}></span>
                </span>
              </p>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400">
                Receive your top new job matches directly in your inbox.
              </p>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <i className="fas fa-arrow-right ml-2"></i>
                </motion.button>
              </Link>
              
              <Link to="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-white dark:bg-gray-800 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-medium py-3 px-8 rounded-lg transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-gray-700"
                >
                  Learn More
                </motion.button>
              </Link>
            </div>
            
            <div className="flex items-center mt-12 space-x-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-white dark:border-gray-800"></div>
                ))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-900 dark:text-white">1.4 Million+</p>
                <p>Active Candidates</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Content */}
      <div className="relative w-full md:w-1/2 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-8 md:p-12">
        <div className="relative z-10 max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <img 
              src={welcomeGif} 
              alt="Welcome to Linkivo" 
              className="w-full h-auto rounded-xl shadow-2xl"
            />
            
            {/* Animated Social Icons - Better Positioning */}
            {socialIcons.map((icon, index) => (
              <motion.div
                key={icon.name}
                className={`absolute text-3xl social-icon ${icon.color} z-20`}
                style={{
                  top: icon.top,
                  left: icon.left || 'auto',
                  right: icon.right || 'auto',
                }}
                animate={{
                  y: [0, -25, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.5,
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: 15,
                }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <i className={`fab fa-${icon.name}`}></i>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Decorative Elements */}
          <motion.div 
            className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-200 dark:bg-emerald-900 opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Additional floating elements */}
          <motion.div 
            className="absolute -top-5 -left-5 w-20 h-20 rounded-full bg-emerald-300 dark:bg-emerald-800 opacity-10"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>
      
      {/* Global Animation Styles */}
      <style jsx global>{`
        @keyframes float {
          0% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-20px) rotate(2deg); 
          }
          66% { 
            transform: translateY(-10px) rotate(-2deg); 
          }
          100% { 
            transform: translateY(0px) rotate(0deg); 
          }
        }
      `}</style>
    </div>
  );
}

export default Hero;