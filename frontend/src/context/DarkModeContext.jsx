import React, { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const getPref = () => {
    const val = localStorage.getItem("darkMode");
    if (val === null) return false;
    return val === "true";
  };
  const [darkMode, setDarkMode] = useState(getPref());

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-bg");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark-bg");
    }
  }, [darkMode]);

  // Inject dark mode CSS globally
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'custom-darkmode-style';
    style.innerHTML = `
      .dark, .dark-bg {
        background-color: #18181b !important;
        color: #f3f4f6 !important;
      }
      .dark .bg-white, .dark-bg .bg-white {
        background-color: #23232a !important;
        color: #f3f4f6 !important;
      }
      .dark .text-gray-700, .dark-bg .text-gray-700 {
        color: #e5e7eb !important;
      }
      .dark .border, .dark-bg .border {
        border-color: #333646 !important;
      }
      .dark input, .dark-bg input, .dark select, .dark-bg select {
        background-color: #23232a !important;
        color: #f3f4f6 !important;
        border-color: #333646 !important;
      }
      .dark .bg-green-600, .dark-bg .bg-green-600 {
        background-color: #22c55e !important;
      }
    `;
    if (!document.getElementById('custom-darkmode-style')) {
      document.head.appendChild(style);
    }
    return () => {
      if (document.getElementById('custom-darkmode-style')) {
        document.getElementById('custom-darkmode-style').remove();
      }
    };
  }, []);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
} 