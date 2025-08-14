import React, { useState } from "react";
import Dot from "../Dot";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// Modern, accessible palette of 10 distinct colors
const CARD_COLORS = [
  "bg-blue-100 dark:bg-blue-900",
  "bg-green-100 dark:bg-green-900",
  "bg-yellow-100 dark:bg-yellow-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-purple-100 dark:bg-purple-900",
  "bg-orange-100 dark:bg-orange-900",
  "bg-teal-100 dark:bg-teal-900",
  "bg-red-100 dark:bg-red-900",
  "bg-indigo-100 dark:bg-indigo-900",
  "bg-cyan-100 dark:bg-cyan-900",
];

function JobCard({ job, redirectToDetail, index, colorIndex }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdzuna = job.adzuna_url || job.redirect_url;
  const title = job.title || job.job_title || "Untitled";
  const companyName = job.employer?.userProfile?.companyName || job.company?.display_name || (job.company && job.company.display_name) || (job.company && job.company.name) || job.company || "Unknown Company";
  const companyLogo = job.employer?.userProfile?.companyLogo || job.company_logo || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
  const location = job.location?.display_name || job.location || "Unknown Location";
  const type = job.type || job.contract_type || job.contract_time || "Other";
  const salaryFrom = job.salaryRange?.from || job.salary_min || "-";
  const salaryTo = job.salaryRange?.to || job.salary_max || "-";
  const datePosted = new Date(job.datePosted || job.created || job.created_at || Date.now());
  const responsibilities = job.responsibilities || job.description?.split(". ").slice(0, 2) || [job.description || "", ""];
  const _id = job._id || job.id || job.job_id || job.redirect_url || job.adzuna_url || Math.random();

  const now = new Date();
  const diffTime = Math.abs(now - datePosted);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

  let timeAgo;
  if (diffMinutes < 60) {
    timeAgo = diffMinutes + " minutes ago";
  } else if (diffHours < 24) {
    timeAgo = diffHours + " hours ago";
  } else if (diffDays < 30) {
    timeAgo = diffDays + " days ago";
  } else {
    timeAgo = diffMonths + " months ago";
  }

  let color, bgColor;
  switch (type) {
    case "Full-time":
      color = "text-orange-500";
      bgColor = "bg-orange-100";
      break;
    case "Part-time":
      color = "text-yellow-700";
      bgColor = "bg-yellow-200";
      break;
    case "Internship":
      color = "text-purple-600";
      bgColor = "bg-purple-200";
      break;
    case "Freelance":
      color = "text-indigo-600";
      bgColor = "bg-indigo-200";
      break;
    default:
      color = "text-gray-700";
      bgColor = "bg-gray-200";
  }

  // Use colorIndex to select card color
  const cardBg = CARD_COLORS[colorIndex % CARD_COLORS.length];

  // Description logic
  const description = Array.isArray(responsibilities)
    ? responsibilities.filter(Boolean).join(". ")
    : responsibilities || "";
  const preview = description.length > 120 ? description.slice(0, 120) + "..." : description;

  return (
    <div
      className={`my-4 hover:cursor-pointer`}
      // Remove onClick from the card itself to avoid accidental navigation
    >
      <div className={`border p-3.5 shadow rounded-lg ${cardBg}`}>
        {/* Top */}
        <div className="mb-2 md:mb-5 flex flex-col md:flex-row justify-between gap-5 md:gap-1">
          {/* right */}
          <div className="flex  gap-3">
            <div className="imgdiv h-11 w-11 rounded-lg overflow-hidden flex justify-center items-center border">
              <img src={companyLogo} />
            </div>
            <div className="flex flex-col mb-2 md:mb-0">
              <div className="title">
                <a
                  href={isAdzuna ? (job.redirect_url || job.adzuna_url) : (job.application_url || '#')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700 dark:text-blue-300 hover:underline focus:underline"
                  title="View job posting"
                  onClick={e => e.stopPropagation()}
                >
                  {title}
                </a>
              </div>
              <div className="flex flex-col md:flex-row gap-2 text-[.9rem] mt-1">
                <div className="company">
                  <p className="text-gray-400 font-medium text-sm">
                    {companyName}
                  </p>
                </div>
                <div className="hidden md:flex justify-center items-center">
                  <Dot />
                </div>
                <div className="flex gap-3 items-center  md:flex-row text-xs md:text-sm">
                  <div className={`tag py-px px-2.5 rounded-xl ${bgColor}`}>
                    <span className={color}>{type}</span>
                  </div>
                  <Dot />
                  <div className="strippend">
                    <span className="text-gray-400">
                      {salaryFrom !== "-" && salaryTo !== "-" ? `₹ ${salaryFrom}-₹ ${salaryTo} INR` : "Salary not disclosed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* left */}
          <div className="">
            <div className="flex  gap-5 md:flex-col text-left md:text-right md:gap-1 text-xs md:text-base">
              <div className="flex gap-3 justify-start md:justify-center items-center">
                <i className="fa-solid fa-location-dot"></i>
                <p className="font-medium">{location}</p>
              </div>
              <div className="text-gray-500" title={`Posted ${timeAgo}`}>
                <p>Posted {timeAgo}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Description Dropdown */}
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Description:</span>
            <button
              className="text-blue-600 dark:text-blue-400 flex items-center gap-1 text-xs font-medium focus:outline-none"
              onClick={e => { e.stopPropagation(); setIsExpanded(v => !v); }}
              tabIndex={0}
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          </div>
          <div className="mt-1 text-gray-600 dark:text-gray-300 text-sm">
            {isExpanded ? description : preview}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
