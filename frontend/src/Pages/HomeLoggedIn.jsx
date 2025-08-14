import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

// Mock data for demonstrations
const mockRecentApplications = [
  {
    id: 1,
    title: "Senior React Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    appliedDate: "2024-08-09",
    status: "under_review",
    salary: "$120k - $150k"
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "Remote",
    appliedDate: "2024-08-07",
    status: "interview_scheduled",
    salary: "$100k - $130k"
  },
  {
    id: 3,
    title: "Frontend Developer",
    company: "Digital Agency",
    location: "New York, NY",
    appliedDate: "2024-08-05",
    status: "rejected",
    salary: "$80k - $100k"
  }
];

const mockRecommendedJobs = [
  {
    id: 4,
    title: "React Native Developer",
    company: "MobileFirst Co.",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$90k - $120k",
    posted: "2 days ago"
  },
  {
    id: 5,
    title: "UI/UX Developer",
    company: "DesignStudio",
    location: "Los Angeles, CA",
    type: "Contract",
    salary: "$85k - $110k",
    posted: "1 day ago"
  },
  {
    id: 6,
    title: "JavaScript Developer",
    company: "WebSolutions",
    location: "Remote",
    type: "Full-time",
    salary: "$75k - $95k",
    posted: "3 days ago"
  }
];

// --- ProfileCard ---
function ProfileCard({ userProfile, profileComplete, onCompleteProfile }) {
  const name = userProfile.name || userProfile.companyName || "there";
  const profilePicture = userProfile.profilePicture || userProfile.companyLogo || "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
  
  return (
    <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl p-6 border border-green-200 dark:border-gray-600 flex flex-col items-center text-center transform transition-all hover:scale-105">
      <div className="relative">
        <img
          src={profilePicture}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-green-400 shadow-lg object-cover mb-4"
        />
        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
          {profileComplete}%
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Hello, <span className="text-green-600 dark:text-green-400">{name}</span>! 👋
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">Welcome back to Linkivo!</p>
      
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <span className="text-gray-700 dark:text-gray-200">Resume Status</span>
          <span className={`font-semibold ${userProfile.resume ? 'text-green-600' : 'text-orange-500'}`}>
            {userProfile.resume ? "✓ Uploaded" : "⚠ Missing"}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${profileComplete}%` }}
          />
        </div>
      </div>

      {profileComplete < 100 && (
        <button
          className="mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={onCompleteProfile}
        >
          Complete Profile ⚡
        </button>
      )}
      <a href="/profile" className="mt-3 inline-block text-green-600 hover:underline font-medium transition-colors">
        View Full Profile →
      </a>
    </div>
  );
}

// --- ApplicationTracker ---
function ApplicationTracker({ applications }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'under_review':
        return <span className="text-yellow-500 text-lg">⏰</span>;
      case 'interview_scheduled':
        return <span className="text-green-500 text-lg">✅</span>;
      case 'rejected':
        return <span className="text-red-500 text-lg">❌</span>;
      default:
        return <span className="text-gray-500 text-lg">⏳</span>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'under_review':
        return 'Under Review';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'interview_scheduled':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Application Status
        </h3>
        <a href="/applications" className="text-green-600 hover:underline font-medium">
          View All →
        </a>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {app.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {app.company} • {app.location}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                  <span>{app.salary}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(app.status)}
                    {getStatusText(app.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {applications.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-3 opacity-50">💼</div>
          <p>No applications yet. Start applying to track your progress!</p>
          <a href="/jobs" className="inline-block mt-3 text-green-600 hover:underline font-medium">
            Browse Jobs →
          </a>
        </div>
      )}
    </div>
  );
}

// --- RecommendedJobs ---
function RecommendedJobs({ jobs, loading }) {
  if (loading) return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p className="text-gray-400">Finding your perfect matches...</p>
    </div>
  );

  if (!jobs.length) return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <div className="text-6xl mb-4 opacity-50">👥</div>
      <p className="text-lg mb-2">No recommendations yet</p>
      <p className="text-sm">Complete your profile to get personalized job matches!</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <div key={job.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                {job.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {job.company} • {job.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>{job.type}</span>
            <span>{job.posted}</span>
          </div>
          
          <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
            {job.salary}
          </div>
          
          <div className="flex gap-2">
            <a 
              href={`/job/${job.id}`} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View Details
            </a>
            <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-gray-500 dark:text-gray-400">🔖</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Component ---
function HomeLoggedIn() {
  const { userData } = useSelector((store) => store.auth);
  const userProfile = userData?.userProfile || {};
  
  // State for recommended jobs
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    setLoadingJobs(true);
    setTimeout(() => {
      setRecommendedJobs(mockRecommendedJobs);
      setLoadingJobs(false);
    }, 1500);
  }, []);

  // Calculate profile completion
  const fields = [
    userProfile.name, 
    userProfile.location, 
    userProfile.primaryRole, 
    userProfile.resume, 
    userProfile.skills && userProfile.skills.length > 0
  ];
  const profileComplete = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const handleCompleteProfile = () => {
    window.location.href = "/profile";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 md:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <ProfileCard 
              userProfile={userProfile} 
              profileComplete={profileComplete} 
              onCompleteProfile={handleCompleteProfile} 
            />
          </div>
          
          {/* Application Tracker moved to top right */}
          <div className="lg:col-span-1">
            <ApplicationTracker applications={mockRecentApplications} />
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">💼</span>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/jobs" className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-lg font-semibold mb-1">Browse Jobs</div>
              <div className="text-sm opacity-90">Find your next opportunity</div>
            </a>
            
            <a href="/profile" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-lg font-semibold mb-1">Update Profile</div>
              <div className="text-sm opacity-90">Stand out to employers</div>
            </a>
            
            <a href="/resume" className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-lg font-semibold mb-1">Resume Builder</div>
              <div className="text-sm opacity-90">Create winning resume</div>
            </a>
            
            <a href="/networking" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-lg font-semibold mb-1">Network</div>
              <div className="text-sm opacity-90">Connect with professionals</div>
            </a>
          </div>
        </div>
      </div>

      {/* Recommended Jobs Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="text-yellow-500 text-4xl">⭐</span>
              Jobs Picked For You
            </h2>
            <a href="/jobs" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105">
              See All Jobs
            </a>
          </div>
          <div className="relative">
            <div className="blur-md">
              <RecommendedJobs jobs={mockRecommendedJobs} loading={loadingJobs} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-2xl">
              <a href="/upgrade" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-110">
                Upgrade to Unlock
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeLoggedIn;