import React from "react";
import styles from "./JobDescription.module.css";

function JobDescription({ jobData }) {
  const { description, skills } = jobData;
  return (
    <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-3xl shadow mb-10 bg-white dark:bg-gray-800">
      <div
        className={styles.descriptionContainer}
        dangerouslySetInnerHTML={{ __html: description }}
      />

      <div className="py-2">
        <h3 className="font-bold text-gray-900 dark:text-white">Key Skills</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {skills?.map((skill, index) => (
            <span
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm font-semibold hover:scale-105 translate-x-0 transition-transform hover:cursor-pointer"
              key={index}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JobDescription;
