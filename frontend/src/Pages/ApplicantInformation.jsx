import React from "react";
import ApplicantInfoUi from "../components/ApplicantInfo/ApplicantInfoUi";

function ApplicantInformation() {
  return (
    <div className="px-20 bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen py-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <ApplicantInfoUi />
      </div>
    </div>
  );
}

export default ApplicantInformation;
