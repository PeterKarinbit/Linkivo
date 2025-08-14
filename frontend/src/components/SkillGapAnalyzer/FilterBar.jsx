import React from 'react';

const FilterBar = ({
  remoteFilter,
  setRemoteFilter,
  sortBy,
  setSortBy,
  clearAllFilters
}) => (
  <div className="flex flex-wrap gap-2 mb-4 items-center">
    <button
      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
      onClick={clearAllFilters}
      type="button"
    >
      Clear All
    </button>
    <span className="ml-2 text-sm font-medium">Remote:</span>
    <button
      className={`px-2 py-1 rounded text-xs ${remoteFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setRemoteFilter('all')}
      type="button"
    >All</button>
    <button
      className={`px-2 py-1 rounded text-xs ${remoteFilter === 'remote' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setRemoteFilter('remote')}
      type="button"
    >Remote</button>
    <button
      className={`px-2 py-1 rounded text-xs ${remoteFilter === 'onsite' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setRemoteFilter('onsite')}
      type="button"
    >On-site</button>
    <span className="ml-2 text-sm font-medium">Sort by:</span>
    <select
      className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
      value={sortBy}
      onChange={e => setSortBy(e.target.value)}
    >
      <option value="relevance">Relevance</option>
      <option value="date">Date</option>
      <option value="salary">Salary</option>
    </select>
  </div>
);

export default FilterBar; 