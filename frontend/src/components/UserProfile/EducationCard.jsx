import React from "react";

function EducationCard({ setShowAddEducation, setEducationFormData, edu }) {
  const { institution, degree, fieldOfStudy, startYear, endYear } = edu;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    // Handle YYYY-MM
    const parts = dateString.toString().split("-");
    if (parts.length >= 2) {
      const d = new Date(parts[0], parseInt(parts[1]) - 1);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
        }).format(d);
      }
    }
    // Handle just Year or other formats
    return dateString;
  };

  const formattedStart = formatDate(startYear);
  const formattedEnd = formatDate(endYear);

  const openEditForm = () => {
    setShowAddEducation(true);
    setEducationFormData(edu);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <i className="fa-solid fa-graduation-cap text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
              {institution}
            </h4>
            <div className="text-gray-600 dark:text-gray-300 font-medium">
              {degree} {fieldOfStudy && <span>• {fieldOfStudy}</span>}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <i className="fa-regular fa-calendar text-xs"></i>
              <span>{formattedStart} – {formattedEnd}</span>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={openEditForm}
          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Edit Education"
        >
          <i className="fa-solid fa-pen-to-square"></i>
        </button>
      </div>
    </div>
  );
}

export default EducationCard;
