import React from 'react';
import { FaArrowLeft, FaArrowRight, FaFileUpload, FaExternalLinkAlt } from 'react-icons/fa';
import JobCard from '../JobListing/JobCard';

const JobResults = ({ jobs, currentBatch, setCurrentBatch, BATCH_SIZE, totalBatches, setStep }) => {
  const getCurrentBatch = () => {
    const start = currentBatch * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    return jobs.slice(start, end);
  };

  return (
    <>
      {jobs.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <span className="text-2xl">😕</span>
          <div className="mt-2">No jobs found. Try changing your filters or search terms.</div>
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {currentBatch * BATCH_SIZE + 1}-{Math.min((currentBatch + 1) * BATCH_SIZE, jobs.length)} of {jobs.length} jobs
      </div>

      <div className="space-y-4 mb-6">
        {getCurrentBatch().map((job, index) => (
          <JobCard key={index} job={job} index={index} colorIndex={index} redirectToDetail={() => window.open(job.application_url || '#', '_blank')} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mb-6">
        <button 
          className="flex items-center gap-2 px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
          onClick={() => setCurrentBatch(prev => Math.max(0, prev - 1))}
          disabled={currentBatch === 0}
        >
          <FaArrowLeft /> Previous
        </button>
        <span className="text-gray-600 dark:text-gray-400">
          Page {currentBatch + 1} of {totalBatches}
        </span>
        <button 
          className="flex items-center gap-2 px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-200 disabled:opacity-50"
          onClick={() => setCurrentBatch(prev => Math.min(totalBatches - 1, prev + 1))}
          disabled={currentBatch === totalBatches - 1}
        >
          Next <FaArrowRight />
        </button>
      </div>

      <button 
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded transition-colors duration-200 flex items-center justify-center gap-2"
        onClick={() => setStep(3)}
      >
        <FaFileUpload />
        Upload Resume for Analysis
      </button>
    </>
  );
};

export default JobResults; 