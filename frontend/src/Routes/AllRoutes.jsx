import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../Pages/Home";
import HomeLoggedIn from "../Pages/HomeLoggedIn";
import Login from "../components/LoginSignup/Login";
import Signup from "../components/LoginSignup/Signup";
import SkillGapAnalyzer from "../Pages/JobListing";
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
import UserPublicProfile from "../Pages/UserPublicProfile";
import Settings from "../Pages/Settings";
import Upgrade from "../Pages/Upgrade";
import Upload from "../Pages/Upload";
import { useSelector } from "react-redux";
import CommunityLoading from "../Pages/CommunityLoading";
import ReferFriend from "../Pages/ReferFriend";

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
            <Navigate to="/home-logged-in" replace />
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
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/upload"
        element={
          <PrivateRoutes>
            <Upload />
          </PrivateRoutes>
        }
      />
      <Route
        path="/jobs"
        element={
          <PrivateRoutes>
            <SkillGapAnalyzer />
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
      <Route path="/user/:id" element={<UserPublicProfile />} />
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
      <Route path="/company-onboarding" element={<CompanyOnboarding />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
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
