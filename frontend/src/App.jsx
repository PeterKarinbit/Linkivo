import { Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AllRoutes from "./Routes/AllRoutes";
import useUpdateUserData from "./hooks/useUpdateUserData";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { DarkModeProvider } from "./context/DarkModeContext";
import { ResumeProvider } from "./context/ResumeContext";
import { TourProvider } from "./context/TourContext";
import NetworkError from "./components/NetworkError";
import ClerkAuthStateSync from "./components/ClerkAuthStateSync";
import BetaBanner from "./components/BetaBanner";

function App() {
  const { status, userData, token } = useSelector((store) => store.auth);

  const location = useLocation();
  const hideOnRoutes = ["/login", "/signup", "/user-onboarding"];
  const updateUser = useUpdateUserData();

  useEffect(() => {
    // Debounce and cache: only update if necessary
    const lastUpdate = sessionStorage.getItem('lastUserUpdate');
    const now = Date.now();
    const CACHE_DURATION = 60000; // 1 minute cache

    // Avoid calling updateUser on public auth pages
    if (hideOnRoutes.includes(location.pathname)) {
      return;
    }

    // Only update if cache is expired and we have a token (or are on a public page where we don't need one, but here we likely want to fetch user data only if logged in)
    if (token) {
      if (!lastUpdate || (now - parseInt(lastUpdate)) > CACHE_DURATION) {
        updateUser();
        sessionStorage.setItem('lastUserUpdate', now.toString());
      }
    }
  }, [location.pathname, token]);  // Re-run when token becomes available

  const searchParams = new URLSearchParams(location.search);
  const isFromOnboarding = searchParams.get("from") === "onboarding";

  // Hide navbar on public pages (login, signup, onboarding) and on homepage when not logged in
  const isPublicHomePage = location.pathname === "/" && !status;
  const showNavbar = !hideOnRoutes.includes(location.pathname) && !isFromOnboarding && !isPublicHomePage;

  return (
    <ResumeProvider>
      <DarkModeProvider>
        <TourProvider>
          <div className={`font-Poppins ${showNavbar ? "pt-20" : "pt-0"}`}>
            <ClerkAuthStateSync />
            <NetworkError />
            <BetaBanner />
            {showNavbar && <Navbar />}
            <AllRoutes />
          </div>
        </TourProvider>
      </DarkModeProvider>
    </ResumeProvider>
  );
}

export default App;
