import React from "react";
import EditProfile from "../components/UserProfile/EditProfile";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function UserProfile() {
  const { userData } = useSelector((store) => store.auth);

  if (userData.role === "employer") {
    return <Navigate to="/" />;
  }

  return (
    <div className="mt-20 px-6 bg-gray-50 dark:bg-gray-900 min-h-screen pb-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h2 className="font-bold text-3xl text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your profile and career preferences.</p>
        </div>
        <EditProfile />
      </div>
    </div>
  );
}

export default UserProfile;