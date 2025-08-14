import React, { useEffect, useState } from "react";
import CompanyCard from "../components/CompaniesPage/CompanyCard";
import { contentService } from "../services/contentService";
// import DisclaimerBanner from "../components/Common/DisclaimerBanner";

function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  // Filter state
  const [filters, setFilters] = useState({
    location: "",
    size: "",
    industry: "",
    currentlyHiring: false,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await contentService.getCompanies();
      if (res && Object.keys(res).length === 1 && res.status === 200) {
        setCompanies([]);
      } else if (res.status === 200) {
        const companies = Object.keys(res)
          .filter(key => key !== 'status')
          .map(key => res[key]);
          setCompanies(companies);
      } else {
        console.error("Error fetching applications, unexpected status:", res.status);
        setCompanies([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Placeholder filter sidebar UI
  return (
    <div className="mt-16 px-10 flex gap-6 bg-gradient-to-br from-green-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      {/* Filter Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative">
          <button
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg px-2 py-1 cursor-pointer"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse filters"
            title="Collapse filters"
          >
            &lt;
          </button>
          <div className="font-bold text-xl mb-4 text-gray-900 dark:text-gray-100">Filter Companies</div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Location</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
              placeholder="e.g. United States"
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Company Size</label>
            <select
              className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
              value={filters.size}
              onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}
            >
              <option value="">Any</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="500+">500+</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Industry</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600"
              placeholder="e.g. Technology, Finance"
              value={filters.industry}
              onChange={e => setFilters(f => ({ ...f, industry: e.target.value }))}
            />
          </div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="currentlyHiring"
              checked={filters.currentlyHiring}
              onChange={e => setFilters(f => ({ ...f, currentlyHiring: e.target.checked }))}
            />
            <label htmlFor="currentlyHiring" className="text-sm font-medium text-gray-800 dark:text-gray-200">Currently Hiring</label>
          </div>
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
      {/* Companies List */}
      <div className="flex-1">
        <div className="flex gap-5 items-center mb-5">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Top companies hiring now</h2>
          <div className="rounded-3xl border shadow-sm py-1 px-3 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200">
            {companies.length}
          </div>
        </div>
        { companies.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-200">No companies available right now.</p>
        ) : (
        <div className="grid grid-cols-2 gap-5">
          {companies?.map((company) => (
            <CompanyCard key={company._id} company={company.userProfile} />
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

export default CompaniesPage;
