import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function PrivateRoutes({ children }) {
  const { status, userData, isLoading } = useSelector((store) => store.auth);
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center text-gray-600 h-screen">
        Loading...
      </div>
    );
  }

  // If we have a token but userData isn't loaded yet, wait instead of redirecting
  if (!userData && hasToken) {
    return (
      <div className="flex justify-center items-center text-gray-600 h-screen">
        Loading...
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoutes;
