import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Terms from "../Pages/Legal/Terms";
import Privacy from "../Pages/Legal/Privacy";
import Home from "../Pages/Home";
import HomeLoggedIn from "../Pages/HomeLoggedIn";
import LoginSignUp from "../Pages/LoginSignUp";
import AICareerCoach from "../Pages/AICareerCoach";
import EnhancedAICareerCoach from "../Pages/EnhancedAICareerCoach";
import JobDetails from "../Pages/JobDetails";
import Community from "../Pages/Community";
import CompanyDashboard from "../Pages/CompanyDashboard";
import UserProfile from "../Pages/UserProfile";
import JobPosting from "../Pages/JobPosting";
import ApplicantInformation from "../Pages/ApplicantInformation";
import UserOnboaring from "../components/LoginSignup/UserOnboaring";
import CompanyOnboarding from "../components/LoginSignup/CompanyOnboarding";
import NotFound from "../components/NotFound";
import PrivateRoutes from "./PrivateRoutes";
import SavedJobs from "../Pages/SavedJobs";

import Settings from "../Pages/Settings";
import Upgrade from "../Pages/Upgrade";
import Upload from "../Pages/Upload";
import { useSelector } from "react-redux";
import CommunityLoading from "../Pages/CommunityLoading";
import ReferFriend from "../Pages/ReferFriend";
import PaymentSuccess from "../Pages/PaymentSuccess";
import PaymentStatus from "../Pages/PaymentStatus";
import PaymentCallback from "../Pages/PaymentCallback";
import Contact from "../Pages/Contact";
import CareerInsightsPage from "../pages/CareerInsightsPage";
import CareerMemoriesTestPage from "../pages/test/CareerMemoriesTestPage";
import AntigravityAuth from "../Pages/ClerkSignUpAntigravity";
import ClerkSignIn from "../Pages/ClerkSignIn";
import ClerkSignUp from "../Pages/ClerkSignUp";
import SSOCallback from "../Pages/SSOCallback";
import Careers from "../Pages/Careers";

function AllRoutes() {
  const { userData } = useSelector((store) => store.auth);
  // Community loading logic
  const [showCommunityLoading, setShowCommunityLoading] = useState(false);
  useEffect(() => {
    if (window.location.pathname === "/companies" && !sessionStorage.getItem("communityVisited")) {
      setShowCommunityLoading(true);
    }
  }, []);
  return (
    <Routes>
      <Route
        path="/"
        element={
          userData ? (
            <PrivateRoutes>
              <HomeLoggedIn />
            </PrivateRoutes>
          ) : (
            <Home />
          )
        }
      />
      <Route
        path="/home-logged-in"
        element={
          <PrivateRoutes>
            <HomeLoggedIn />
          </PrivateRoutes>
        }
      />
      <Route path="/login" element={<LoginSignUp />} />
      <Route path="/signup" element={<LoginSignUp />} />
      {/* Clerk Auth Routes - New users */}
      <Route path="/clerk-sign-in/*" element={<ClerkSignIn />} />
      <Route path="/clerk-sign-up/*" element={<ClerkSignUp />} />
      <Route path="/sso-callback" element={<SSOCallback />} />
      <Route path="/careers" element={<Careers />} />
      <Route
        path="/upload"
        element={
          <PrivateRoutes>
            <Upload />
          </PrivateRoutes>
        }
      />
      <Route
        path="/career-coach"
        element={
          <PrivateRoutes>
            <EnhancedAICareerCoach />
          </PrivateRoutes>
        }
      />
      <Route
        path="/career-coach/insights"
        element={
          <PrivateRoutes>
            <CareerInsightsPage />
          </PrivateRoutes>
        }
      />
      <Route
        path="/career-coach-legacy"
        element={
          <PrivateRoutes>
            <AICareerCoach />
          </PrivateRoutes>
        }
      />
      <Route path="/job/:id" element={<JobDetails />} />
      <Route
        path="/companies"
        element={
          <PrivateRoutes>
            <Community />
          </PrivateRoutes>
        }
      />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/upgrade"
        element={
          <PrivateRoutes>
            <Upgrade />
          </PrivateRoutes>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <PrivateRoutes>
            <CompanyDashboard />
          </PrivateRoutes>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoutes>
            <UserProfile />
          </PrivateRoutes>
        }
      />
      <Route
        path="/post-new-job"
        element={
          <PrivateRoutes>
            <JobPosting />
          </PrivateRoutes>
        }
      />
      <Route
        path="/applicant"
        element={
          <PrivateRoutes>
            <ApplicantInformation />
          </PrivateRoutes>
        }
      />
      <Route path="/user-onboarding" element={<UserOnboaring />} />
      <Route path="/legal/terms" element={<Terms />} />
      <Route path="/legal/privacy" element={<Privacy />} />
      <Route path="/company-onboarding" element={<CompanyOnboarding />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-status" element={<PaymentStatus />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/test/career-memories" element={<CareerMemoriesTestPage />} />
      <Route
        path="/refer-friend"
        element={
          <PrivateRoutes>
            <ReferFriend />
          </PrivateRoutes>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AllRoutes;
