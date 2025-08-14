import React, { useState, useEffect, useMemo } from "react";
import { FaRobot, FaFileUpload, FaCog, FaChartBar, FaSearch, FaSpinner, FaArrowRight, FaArrowLeft, FaCheck, FaUpload, FaMapMarkerAlt, FaMoneyBillWave, FaExternalLinkAlt, FaBuilding, FaGlobe, FaBriefcase, FaUserTie, FaTimes, FaChevronDown, FaChevronUp, FaFilter, FaSortAmountDown } from "react-icons/fa";
import { MdWorkOutline, MdOutlineLocationOn, MdAttachMoney, MdOutlineBusinessCenter } from "react-icons/md";
import { triggerN8nWorkflow } from "../services/n8nService";
import { contentService } from "../services/contentService";
import countries from '../data/countries.json';

const STEPS = [
  { label: "Preferences", icon: <FaCog className="text-lg" /> },
  { label: "Job Results", icon: <FaSearch className="text-lg" /> },
  { label: "Resume", icon: <FaFileUpload className="text-lg" /> },
  { label: "Analysis", icon: <FaChartBar className="text-lg" /> },
];

// Mock skills data for the skills search
const mockSkills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "TypeScript", "Angular", "Vue.js",
  "HTML/CSS", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Git", "Linux",
  "Machine Learning", "Data Analysis", "Project Management", "Agile", "Scrum", "DevOps"
];

// Progress Bar Component
const ProgressBar = ({ progress, message, percentage }) => {
  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 dark:text-blue-200 font-medium">{message}</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{percentage}%</span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2">
          <div 
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <FaSpinner className="animate-spin" />
          <span className="text-sm">Processing...</span>
        </div>
      </div>
    </div>
  );
};

// Skills Search Component
const SkillsSearch = ({ selectedSkills, onSkillsChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSkills = mockSkills.filter(skill => 
    skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !Array.from(selectedSkills.keys()).includes(skill)
  );

  const addSkill = (skill) => {
    const newSkills = new Map(selectedSkills);
    newSkills.set(skill, { level: 'intermediate', years: 2 });
    onSkillsChange(newSkills);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removeSkill = (skill) => {
    const newSkills = new Map(selectedSkills);
    newSkills.delete(skill);
    onSkillsChange(newSkills);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search and add skills..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-medium"
        />
      </div>
      
      {showDropdown && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSkills.slice(0, 5).map(skill => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 font-medium"
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      {/* Selected Skills */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from(selectedSkills.keys()).map(skill => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold"
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="hover:text-red-600 ml-1"
            >
              <FaTimes className="text-xs" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// Job Card Component
const JobCard = ({ job, index }) => {
  const [showDescription, setShowDescription] = useState(false);
  
  const colors = [
    'bg-gradient-to-r from-blue-500 to-purple-600',
    'bg-gradient-to-r from-green-500 to-teal-600',
    'bg-gradient-to-r from-pink-500 to-rose-600',
    'bg-gradient-to-r from-orange-500 to-red-600',
    'bg-gradient-to-r from-indigo-500 to-blue-600',
    'bg-gradient-to-r from-purple-500 to-pink-600',
    'bg-gradient-to-r from-teal-500 to-green-600',
    'bg-gradient-to-r from-yellow-500 to-orange-600',
    'bg-gradient-to-r from-red-500 to-pink-600',
    'bg-gradient-to-r from-cyan-500 to-blue-600'
  ];

  const cardColor = colors[index % colors.length];

  const clean = (val) => {
    if (!val || val === 'nan' || val === 'null' || val === null) return '';
    return val;
  };

  const formatSalary = (min, max, interval) => {
    if (!min && !max) return '';
    const minFormatted = min ? `$${Number(min).toLocaleString()}` : '';
    const maxFormatted = max ? `$${Number(max).toLocaleString()}` : '';
    const range = minFormatted && maxFormatted ? `${minFormatted} - ${maxFormatted}` : minFormatted || maxFormatted;
    return interval && interval !== 'nan' ? `${range} ${interval}` : range;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Header with gradient */}
      <div className={`${cardColor} p-4 text-white`}>
        <h3 className="text-xl font-bold mb-2">
          {((job.job_url_direct || job.application_url) ? (
            <a
              href={job.job_url_direct || job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-white"
            >
              {clean(job.title)}
            </a>
          ) : clean(job.title))}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <FaBuilding className="text-sm" />
          <span className="font-medium">{clean(job.company)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt />
            <span>{clean(job.location)}</span>
          </div>
          {job.is_remote && (
            <div className="flex items-center gap-1">
              <FaGlobe />
              <span>Remote</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Removed job source badge */}
            {job.job_type && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                {clean(job.job_type)}
              </span>
            )}
            {job.job_level && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-full">
                {clean(job.job_level)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently'}
          </div>
        </div>

        {(job.salary_display || formatSalary(job.min_amount, job.max_amount, job.currency)) && (
          <div className="flex items-center gap-1 mb-3 text-green-600 dark:text-green-400">
            <FaMoneyBillWave className="text-sm" />
            <span className="font-medium">{job.salary_display || formatSalary(job.min_amount, job.max_amount, job.currency)}</span>
              </div>
            )}

        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
            {clean(job.description)}
          </p>
          {Array.isArray(job.emails) && job.emails.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Contact:</span> {job.emails[0]}
          </div>
          )}
        </div>

        <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDescription(!showDescription)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        >
            {showDescription ? 'Show Less' : 'Show More'}
          {showDescription ? <FaChevronUp /> : <FaChevronDown />}
        </button>

          {job.application_url && (
        <a
              href={job.application_url}
          target="_blank"
          rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          Apply Now
              <FaExternalLinkAlt className="text-xs" />
            </a>
          )}
        </div>

        {showDescription && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {clean(job.description)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function SkillGapAnalyzer() {
  const [step, setStep] = useState(1);
  const [countryOptions] = useState(countries);
  const [preferences, setPreferences] = useState({
    roles: "",
    locations: [], // now an array
    salary: "",
    remote: false,
    onsite: false,
    experience: "0",
    jobType: "fulltime",
    skills: []
  });
  const [selectedSkills, setSelectedSkills] = useState(new Map());
  const [resume, setResume] = useState(null);
  const [scrapedJobs, setScrapedJobs] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [skillGapResults, setSkillGapResults] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [scrapingError, setScrapingError] = useState(null);
  
  const BATCH_SIZE = 10;

  // Filter states
  const [remoteFilter, setRemoteFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // In SkillGapAnalyzer, country search/filter state
  const [countrySearch, setCountrySearch] = useState("");
  // In SkillGapAnalyzer, add state for country selection warning and no-results countries
  const [countryWarning, setCountryWarning] = useState("");
  const [noJobsCountries, setNoJobsCountries] = useState([]);

  // Update preferences when skills change
  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      skills: Array.from(selectedSkills.keys())
    }));
  }, [selectedSkills]);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allCountryCodes = useMemo(() => countries.map(c => c.code), []);

  // Add the missing country handling functions
  const handleCountryChange = (countryCode) => {
    if (preferences.locations.includes(countryCode)) {
      setPreferences(prev => ({
        ...prev,
        locations: prev.locations.filter(code => code !== countryCode)
      }));
      setCountryWarning("");
    } else {
      if (preferences.locations.length >= 4) {
        setCountryWarning("You can select up to 4 countries per search.");
        return;
      }
      setPreferences(prev => ({
        ...prev,
        locations: [...prev.locations, countryCode]
      }));
      setCountryWarning("");
    }
  };

  const handleSelectAllCountries = (selectAll) => {
    if (selectAll) {
      setPreferences(prev => ({
        ...prev,
        locations: countryOptions.slice(0, 4).map(c => c.code)
      }));
      setCountryWarning("You can select up to 4 countries per search.");
    } else {
      setPreferences(prev => ({
        ...prev,
        locations: []
      }));
      setCountryWarning("");
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPreferences({
      roles: "",
      locations: [],
      salary: "",
      remote: false,
      onsite: false,
      experience: "0",
      jobType: "fulltime",
      skills: []
    });
    setSelectedSkills(new Map());
    setRemoteFilter('all');
    setSortBy('relevance');
    setCountrySearch(""); // Clear country search input
    setCountryWarning("");
    setNoJobsCountries([]);
  };

  // Real job scraping function
  const startJobScraping = async () => {
    if (!preferences.roles && selectedSkills.size === 0) {
      alert("Please fill in your desired roles or add at least one skill");
      return;
    }
    if (!preferences.locations || preferences.locations.length === 0) {
      alert("Please select at least one country");
      return;
    }

    setLoading(true);
    setProgressPercentage(0);
    setScrapingProgress("Initializing job search...");
    setScrapingError(null);
    setNoJobsCountries([]);
    
    try {
      // Simulate progress updates
      setProgressPercentage(10);
      setScrapingProgress("Preparing search parameters...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressPercentage(25);
      setScrapingProgress("Connecting to job databases...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProgressPercentage(50);
      setScrapingProgress("Searching for matching positions...");
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setProgressPercentage(75);
      setScrapingProgress("Analyzing job requirements...");
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Combine roles and skills for a more relevant search term
      const combinedSearchTerm = [preferences.roles, ...Array.from(selectedSkills.keys())]
        .filter(Boolean)
        .join(" ");

      // If 'ALL' is selected, send an empty array or special value
      const locationsToSend = preferences.locations.includes('ALL') ? [] : preferences.locations;

      // Prepare search parameters
      const searchParams = {
        skills: combinedSearchTerm, // Use combined roles and skills as search term
        locations: locationsToSend, // now an array
        results_wanted: 50, // Adjust as needed
        sites: ["linkedin", "indeed"] // Scrape from both sites
      };

      // Call the real job scraping API
      const response = await contentService.scrapeJobs(searchParams);
      
      if (response.success && response.jobs) {
        // Group jobs by country
        const jobsByCountry = {};
        (response.jobs || []).forEach(job => {
          const country = job.location && typeof job.location === 'string' ? job.location : '';
          if (!jobsByCountry[country]) jobsByCountry[country] = [];
          jobsByCountry[country].push(job);
        });
        // Find which selected countries had no jobs
        const noJobs = preferences.locations.filter(code => {
          const countryObj = countryOptions.find(c => c.code === code);
          if (!countryObj) return false;
          return !Object.keys(jobsByCountry).some(loc => loc.toLowerCase().includes(countryObj.name.toLowerCase()));
        });
        setNoJobsCountries(noJobs);
        // Transform the API response to match our expected format
        const transformedJobs = (response.jobs || []).map((job, index) => ({
          id: index + 1,
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          is_remote: job.is_remote || false,
          description: job.description || '',
          job_type: job.job_type || '',
          job_level: job.job_level || '',
          posted_date: job.posted_date || '',
          application_url: job.application_url || '',
          job_url_direct: job.job_url_direct || '',
          source: job.source || '',
          min_amount: job.min_amount || '',
          max_amount: job.max_amount || '',
          currency: job.currency || '',
          interval: job.interval || '',
          salary_display: job.salary_display || '',
          emails: job.emails || [],
          scraped_at: job.scraped_at || new Date().toISOString()
        }));
        
        setProgressPercentage(100);
        setScrapingProgress(`Successfully found ${transformedJobs.length} matching positions!`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setScrapedJobs(transformedJobs);
      setStep(2);
      } else {
        setScrapingError(response.error || "No jobs found.");
        setScrapedJobs([]);
        setNoJobsCountries(preferences.locations);
      }
    } catch (error) {
      console.error("Error scraping jobs:", error);
      setScrapingError("Failed to fetch real jobs. Displaying mock data as fallback.");
      const mockJobs = generateMockJobs();
      setScrapedJobs(mockJobs);
      setStep(2);
    } finally {
      setLoading(false);
      setProgressPercentage(0);
    }
  };

  // Fallback mock job generator (kept for error handling)
  const generateMockJobs = () => {
    return [
      { id: 'mock1', title: "Mock Software Developer", company: "MockCorp", location: "New York, NY", description: "This is a mock job description for a software developer.", min_amount: 70000, max_amount: 120000, currency: 'USD', date_posted: '2023-10-27T10:00:00Z' },
      { id: 'mock2', title: "Mock Frontend Developer", company: "MockLabs", location: "San Francisco, CA", description: "This is a mock job description for a frontend developer.", min_amount: 75000, max_amount: 130000, currency: 'USD', date_posted: '2023-10-26T12:00:00Z' },
    ];
  };

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        setResumeText(event.target.result);
      };

      reader.readAsText(file);
      setResume(file);
    }
  };

  const handleResumeUploadAndAnalysis = async () => {
    if (!resume) {
      alert("Please upload a resume to proceed.");
      return;
    }

    setLoading(true);
    setScrapingProgress("Analyzing your resume and job matches...");
    
    try {
      const analysisData = {
        userId: "guest", // Replace with actual user ID if available
        resume: resumeText,
        skills: Array.from(selectedSkills.keys()),
        experience: preferences.experience,
        preferences,
        scrapedJobs,
        autoRefactor: false,
      };

      const result = await triggerN8nWorkflow(analysisData);
      console.log("n8n workflow result:", result);

      setSkillGapResults(result);
      setScrapingProgress("Skill gap analysis complete!");
      setAnalysisComplete(true);
      setStep(4);
    } catch (error) {
      console.error("Error in analysis:", error);
      setScrapingProgress("Error during analysis: " + error.message);
    } finally {
      setLoading(false);
      setProgressPercentage(0);
    }
  };

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let jobs = [...scrapedJobs];
    
    // Remote filter
    if (remoteFilter === 'remote') {
      jobs = jobs.filter(job => job.is_remote);
    } else if (remoteFilter === 'onsite') {
      jobs = jobs.filter(job => !job.is_remote);
    }
    
    // Sort
    if (sortBy === 'date') {
      jobs = jobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    } else if (sortBy === 'salary') {
      jobs = jobs.sort((a, b) => (b.max_amount || 0) - (a.max_amount || 0));
    }
    
    return jobs;
  }, [scrapedJobs, remoteFilter, sortBy]);

  const getCurrentBatch = () => {
    const start = currentBatch * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    return filteredJobs.slice(start, end);
  };

  const totalPages = Math.ceil(filteredJobs.length / BATCH_SIZE);
        
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-sm font-bold mb-4">
            <FaRobot className="mr-2" />
            AI-Powered Job Search
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Job Matcher</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find your perfect job match with AI-powered analysis of your preferences.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((stepItem, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  step > idx + 1 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step === idx + 1 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {step > idx + 1 ? <FaCheck /> : stepItem.icon}
                </div>
                  {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                    step > idx + 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  )}
          </div>
            ))}
          </div>
          <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white mb-2">
            {STEPS[step - 1].label}
          </h2>
        </div>

        {/* Step Content */}
          {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Tell us about your job preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Desired Roles/Positions
                  </label>
                  <input
                    type="text"
                    value={preferences.roles}
                  onChange={(e) => setPreferences({...preferences, roles: e.target.value})}
                  placeholder="e.g., React Developer, Data Scientist"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Locations (Countries)
                  </label>
                {/* Country search and buttons */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search countries..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCountrySearch("")}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountrySearch(countrySearch)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {/* Select All/Clear All buttons */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllCountries(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCountries(false)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
                {countryWarning && (
                  <div className="text-red-600 text-sm font-medium mb-2">{countryWarning}</div>
                )}
                <div className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                  Tip: The more countries you select, the slower the fetching of results.
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-700">
                  {countryOptions.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                    <label key={country.code} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                        type="checkbox"
                        checked={preferences.locations.includes(country.code)}
                        onChange={() => handleCountryChange(country.code)}
                        className="accent-blue-600 h-4 w-4 rounded"
                      />
                      <span className="text-gray-800 dark:text-gray-200 text-sm">{country.name}</span>
                    </label>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Select one or more countries for job search. Select all for a global search.
                </div>
                </div>
              </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Skills
                </label>
              <SkillsSearch selectedSkills={selectedSkills} onSkillsChange={setSelectedSkills} />
              </div>

            <div className="flex justify-between items-center">
                <button
                  onClick={clearAllFilters}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Clear All
                </button>
            
                <button
                  onClick={startJobScraping}
                disabled={loading || !preferences.roles || !preferences.locations || preferences.locations.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch />
                    Find Jobs
                  </>
                )}
                </button>
              </div>

              {scrapingProgress && (
              <ProgressBar 
                progress={scrapingProgress}
                message={scrapingProgress}
                percentage={progressPercentage}
              />
              )}
            </div>
          )}

          {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Job Results ({filteredJobs.length})
              </h3>
              
              <div className="flex items-center gap-4">
                <select
                  value={remoteFilter}
                  onChange={(e) => setRemoteFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Work Types</option>
                  <option value="remote">Remote Only</option>
                  <option value="onsite">On-site Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date Posted</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
              </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <FaSearch className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {getCurrentBatch().map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentBatch(Math.max(0, currentBatch - 1))}
                    disabled={currentBatch === 0}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                  <FaArrowLeft />
                  Previous
                  </button>
                  
                <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  Page {currentBatch + 1} of {totalPages}
                  </span>
                  
                  <button
                  onClick={() => setCurrentBatch(Math.min(totalPages - 1, currentBatch + 1))}
                  disabled={currentBatch === totalPages - 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                  Next
                  <FaArrowRight />
                  </button>
                </div>
              )}

            {noJobsCountries.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                No jobs found for: {noJobsCountries.map(code => {
                  const c = countryOptions.find(c => c.code === code);
                  return c ? c.name : code;
                }).join(", ")}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-2"
                >
                <FaArrowLeft />
                Back to Preferences
                </button>
            
                <button
                  onClick={() => setStep(3)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                Continue to Resume Upload
                <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Upload your resume for skill gap analysis
            </h3>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <FaFileUpload className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Upload your resume to get personalized skill gap analysis
                  </p>
                  <input
                    type="file"
                accept={allowedTypes.join(',')}
                    onChange={handleResumeChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
                  >
                Choose File
                  </label>
                </div>

                {resume && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaCheck className="text-green-600" />
                  <span className="text-green-800 dark:text-green-200">
                    Resume uploaded: {resume.name}
                  </span>
                    </div>
                  </div>
                )}

            <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setStep(2)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-2"
                >
                <FaArrowLeft />
                Back to Results
                </button>
            
                <button
                  onClick={handleResumeUploadAndAnalysis}
                  disabled={!resume || loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaChartBar />
                    Analyze Skills
                  </>
                )}
                </button>
              </div>

              {scrapingProgress && (
              <ProgressBar 
                progress={scrapingProgress}
                message={scrapingProgress}
                percentage={progressPercentage}
              />
              )}
            </div>
          )}

        {step === 4 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Skill Gap Analysis Results
            </h3>
            
            {analysisComplete && skillGapResults ? (
              <div className="space-y-6">
                <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                    Analysis Complete!
                  </h4>
                  <p className="text-green-700 dark:text-green-300">
                    Your skill gap analysis has been completed. Check your email for detailed results and recommendations.
                  </p>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                      Skills Analysis
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Skills Matched:</span>
                        <span className="font-semibold text-blue-800 dark:text-blue-200">
                          {selectedSkills.size}
                      </span>
                  </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Jobs Analyzed:</span>
                        <span className="font-semibold text-blue-800 dark:text-blue-200">
                          {scrapedJobs.length}
                      </span>
                  </div>
                </div>
              </div>

                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">
                      Recommendations
                    </h4>
                    <ul className="space-y-2 text-purple-700 dark:text-purple-300">
                      <li>• Review your skill gaps</li>
                      <li>• Focus on high-demand skills</li>
                      <li>• Update your resume</li>
                      <li>• Apply to matching jobs</li>
                </ul>
              </div>
                      </div>
                    </div>
            ) : (
              <div className="text-center py-12">
                <FaChartBar className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Analysis in Progress</h3>
                <p className="text-gray-500 dark:text-gray-400">Please wait while we analyze your skills...</p>
                </div>
            )}

            <div className="flex justify-center mt-8">
                <button
                onClick={() => {
                  setStep(1);
                  clearAllFilters();
                  setScrapedJobs([]);
                  setSkillGapResults(null);
                  setAnalysisComplete(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                Start New Analysis
                  </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default SkillGapAnalyzer;