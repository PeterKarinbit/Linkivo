import React, { useState } from "react";

function WorkExperienceCard({
  exp,
  setShowAddWorkExperience,
  setWorkExperienceFormData,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { jobTitle, company, startMonth, description, endMonth, currentJob } = exp;

  // Helper to format Date string (ISO or YYYY-MM) to "Month Year"
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    // Check if valid date
    if (isNaN(date.getTime())) {
      // Try fallback for YYYY-MM if standard parsing fails (though new Date usually handles it)
      const parts = dateString.split("-");
      if (parts.length >= 2) {
        const d = new Date(parts[0], parseInt(parts[1]) - 1);
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
          }).format(d);
        }
      }
      return dateString; // Return original if all parsing fails
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
    }).format(date);
  };

  const formattedStart = formatDate(startMonth) || "N/A";
  const formattedEnd = currentJob ? "Present" : (formatDate(endMonth) || "Present");

  const openEditForm = () => {
    setShowAddWorkExperience(true);
    setWorkExperienceFormData(exp);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          {/* Company Logo / Fallback Icon */}
          <div className="flex-shrink-0">
            {company.logoUrl ? (
              <div className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <i className="fa-solid fa-building text-gray-400"></i>
                </div>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <i className="fa-solid fa-building text-gray-400 text-lg"></i>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
              {jobTitle}
            </h4>
            <div className="text-gray-600 dark:text-gray-300 font-medium">
              {company.name}
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
          title="Edit Experience"
        >
          <i className="fa-solid fa-pen-to-square"></i>
        </button>
      </div>

      {/* Description */}
      {description && (
        <div className="mt-4 pl-[4rem]">
          <div className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
            {description.split("\n").map((line, i) => (
              <p key={i} className="mb-1 last:mb-0">{line}</p>
            ))}
          </div>

          {description.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-green-600 hover:text-green-700 mt-1 focus:outline-none"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkExperienceCard;
