import React, { useState } from "react";
import EditProfile from "../components/UserProfile/EditProfile";
import UpdateResume from "../components/UserProfile/UpdateResume";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function UserProfile() {
  const { status, userData } = useSelector((store) => store.auth);

  if (userData.role === "employer") {
    return <Navigate to="/" />;
  }
  // Only show profile editing, remove resume section

  const navigate = useNavigate();

  const openPublicProfile = () => {
    navigate(`/user/${userData._id}`);
  };

  return (
    <div className="mt-20 xl:px-28 px-5 bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div>
        <div>
          <h2 className="font-medium text-4xl mb-6 text-gray-900 dark:text-gray-100">Edit your Linkivo profile</h2>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between border-b border-gray-300 dark:border-gray-700 mt-10 md:items-center pb-3 md:pb-0">
          <div className="flex gap-6 mb-3 md:mb-0 ">
            <div
              className="text-black dark:text-white border-b-2 border-gray-600 dark:border-gray-200 text-lg font-semibold pb-3 hover:text-green-500"
            >
              Profile
            </div>
          </div>
          <div
            className="text-sm font-medium text-green-600 hover:underline hover:cursor-pointer"
            onClick={openPublicProfile}
          >
            View public profile
          </div>
        </div>
      </div>
      <div className="my-5 bg-white dark:bg-gray-800 rounded-xl dark:text-gray-100 shadow-lg p-6">
        <EditProfile />
      </div>
    </div>
  );
}

export default UserProfile;
