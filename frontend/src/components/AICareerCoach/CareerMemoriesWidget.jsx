import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../services/api';

const CareerMemoriesWidget = () => {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setIsLoading(true);
        // axios instance already prefixes /api/v1
        const response = await api.get('/enhanced-ai-career-coach/journal', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery
          }
        });

        const items = response.data?.data?.items || response.data?.data || [];
        setMemories(items);
        setTotalPages(Math.ceil((response.data?.data?.pagination?.total || response.data?.pagination?.total || items.length) / itemsPerPage));
      } catch (err) {
        console.error('Error fetching memories:', err);
        setError('Failed to load career memories');
        toast.error('Failed to load career memories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemories();
  }, [currentPage, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleMemoryAction = async (memoryId, action) => {
    try {
      // axios base handles /api/v1
      await api.post(`/enhanced-ai-career-coach/journal/${memoryId}/${action}`);
      
      // Update UI optimistically
      setMemories(prevMemories => 
        prevMemories.filter(memory => memory._id !== memoryId)
      );
      
      toast.success(`Memory ${action === 'dismiss' ? 'dismissed' : 'saved'} successfully`);
    } catch (err) {
      console.error(`Error ${action}ing memory:`, err);
      toast.error(`Failed to ${action} memory`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Career Memories</h3>
        <div className="relative">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="submit"
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : memories.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No memories found. Your career memories will appear here as you use the platform.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {memories.map((memory) => (
              <div key={memory._id || memory.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{memory.title || 'Career Memory'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {memory.createdAt ? format(new Date(memory.createdAt), 'MMM d, yyyy') : ''}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{memory.content}</p>
                    {memory.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {memory.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMemoryAction(memory._id || memory.id, 'dismiss')}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Dismiss memory"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CareerMemoriesWidget;