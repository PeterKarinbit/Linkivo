import React, { useState } from "react";
import Searchbar from "./Searchbar";
import SideBarFilter from "./SideBarFilter";
import JobCard from "./JobCard";
import { useEffect, useRef } from "react";
import { contentService } from "../../services/contentService";
import { useNavigate } from "react-router-dom";
import { getAdzunaJobs } from '../../services/contentService';

function MainJobSection() {
  const [filters, setFilters] = useState({
    datePosted: "",
    jobTypes: [],
    experience: 30,
    salaryRange: {
      from: 0,
      to: 10000000000,
    },
    workMode: [],
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [jobSource, setJobSource] = useState('adzuna'); // Force Adzuna jobs only
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getJobs = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      if (jobSource === 'adzuna') {
        // Map filters to Adzuna API params
        const adzunaParams = {
          what: filters.search || '',
          where: filters.location || '',
          page: filters.page || 1,
          country: 'ke',
          results_per_page: 20,
          sort_by: 'salary',
        };
        // Map salary range
        if (filters.salaryRange?.from) adzunaParams.salary_min = filters.salaryRange.from;
        if (filters.salaryRange?.to && filters.salaryRange.to < 10000000000) adzunaParams.salary_max = filters.salaryRange.to;
        // Map job type
        if (filters.jobTypes && filters.jobTypes.includes('Full-time')) adzunaParams.full_time = 1;
        if (filters.jobTypes && filters.jobTypes.includes('Part-time')) adzunaParams.full_time = 0;
        // Map contract type
        if (filters.jobTypes && filters.jobTypes.includes('Permanent')) adzunaParams.permanent = 1;
        if (filters.jobTypes && filters.jobTypes.includes('Internship')) adzunaParams.permanent = 0;
        // Experience is not directly supported by Adzuna, so skip
        const res = await getAdzunaJobs(adzunaParams);
        if (res && res.results) {
          setJobs(res.results);
        } else {
          setJobs([]);
          setError("No jobs found from Adzuna.");
        }
      } else {
      const res = await contentService.getJobs(filters);
        if (res && res.jobs) {
        setJobs(res.jobs);
        } else {
          setJobs([]);
          setError("No jobs found.");
        }
      }
    } catch (error) {
      setError("Failed to load jobs. Please try again later.");
      setJobs([]);
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log(selectedLocation);
    const debounceTimer = setTimeout(() => {
      getJobs({ ...filters, search, location: selectedLocation });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters, search, selectedLocation]);

  const redirectToDetail = (id) => {
    navigate(`/job/${id}`);
  };

  return (
    <div className="flex flex-col px-5 md:px-14 lg:px-5 gap-5 lg:flex-row relative">
      {/* Sidebar Toggle Button (visible on all screens, fixed top left on mobile) */}
      <button
        className="lg:hidden fixed top-20 left-4 z-30 bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-full shadow-lg focus:outline-none"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Show filters"
      >
        ☰ Filters
      </button>
      {/* Sliding Sidebar */}
      {!sidebarCollapsed && (
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-2xl transform transition-transform duration-300 lg:static lg:transform-none lg:w-[30%] lg:block border rounded-xl mlg:sticky top-0 lg:h-screen mb-3 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ maxWidth: 320 }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b lg:hidden">
          <span className="font-bold text-lg">Filters</span>
          <button
            className="text-gray-500 hover:text-black text-2xl font-bold focus:outline-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>
          <SideBarFilter filters={filters} setFilters={setFilters} setSidebarCollapsed={setSidebarCollapsed} />
      </div>
      )}
      {sidebarCollapsed && (
        <button
          className="fixed top-24 left-2 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg px-3 py-2 cursor-pointer"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Expand filters"
        >
          &#9776; Filters
        </button>
      )}
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      {/* Right */}
      <div className="rounded-xl w-full lg:w-[70%] overflow-auto ml-0 lg:ml-0 relative">
        {/* Loading Progress Bar */}
        {loading && (
          <div className="absolute top-0 left-0 w-full h-1 z-50">
            <div className="h-1 bg-green-500 animate-pulse w-full" />
          </div>
        )}
        <div>
          <div className={`${sidebarCollapsed ? 'pl-20' : ''}`}>
          <Searchbar
            setSearch={setSearch}
            search={search}
            setSelectedLocation={setSelectedLocation}
          />
        </div>
        </div>
        <div>
          <div className="text-gray-500 font-medium my-3 ml-1.5">
            <span>{jobs.length} Jobs results</span>
          </div>
          <div>
            {error ? (
              <div className={`text-red-500 font-semibold text-center my-8 ${sidebarCollapsed ? 'pl-20' : ''}`}>{error}</div>
            ) : jobs.length === 0 && !loading ? (
              <div className="text-gray-400 text-center my-8">No jobs available at the moment.</div>
            ) : (
              jobs.map((job) => (
              <JobCard
                key={job.job_id || job._id}
                job={job}
                redirectToDetail={redirectToDetail}
              />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainJobSection;