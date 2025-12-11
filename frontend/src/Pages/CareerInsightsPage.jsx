import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import journalService from '../services/journalService';
import { FaLightbulb, FaArrowRight, FaSearch, FaFilter } from 'react-icons/fa';

function CareerInsightsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    source: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await journalService.getAllSuggestions({
        sort: '-metadata.generatedAt',
        includeContent: true
      });
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching career insights:', error);
      toast.error('Failed to load career insights');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    // Filter by search term
    const matchesSearch = 
      suggestion.content?.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.content?.skills?.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      suggestion.content?.suggestions?.some(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filter by type
    const matchesType = 
      filters.type === 'all' || 
      suggestion.type === filters.type;

    // Filter by source
    const matchesSource = 
      filters.source === 'all' || 
      suggestion.source === filters.source;

    // Filter by date range (example implementation)
    const matchesDateRange = true; // Implement date range filtering if needed

    return matchesSearch && matchesType && matchesSource && matchesDateRange;
  });

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.source === 'journal' && suggestion.sourceId) {
      navigate(`/journals/${suggestion.sourceId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Insights</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered career suggestions based on your journal entries
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search insights..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaFilter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="career_suggestion">Career Suggestions</option>
                  <option value="skill_development">Skill Development</option>
                  <option value="job_opportunity">Job Opportunities</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                >
                  <option value="all">All Sources</option>
                  <option value="journal">Journal Entries</option>
                  <option value="profile">Profile</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {filteredSuggestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <FaLightbulb className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No career insights found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {suggestions.length === 0 
                ? "Start journaling to receive AI-powered career insights." 
                : "No insights match your current filters."}
            </p>
            {suggestions.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/journals/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Write Your First Journal Entry
                  <FaArrowRight className="ml-2 -mr-1 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSuggestions.map((suggestion) => (
              <div 
                key={suggestion._id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {suggestion.type.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(suggestion.metadata?.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                        {suggestion.content?.summary || 'Career Suggestion'}
                      </h3>
                      
                      {suggestion.content?.skills?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {suggestion.content.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {suggestion.content.skills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              +{suggestion.content.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <FaLightbulb className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                  
                  {suggestion.content?.suggestions?.[0] && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {suggestion.content.suggestions[0].title}
                      </p>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        {suggestion.content.suggestions[0].reason}
                      </p>
                    </div>
                  )}
                  
                  {suggestion.source === 'journal' && suggestion.sourceId && (
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      From journal entry on {new Date(suggestion.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerInsightsPage;
