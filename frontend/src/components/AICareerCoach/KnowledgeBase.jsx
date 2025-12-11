import React, { useState, useEffect } from 'react';
import MCPKnowledgeBase from './MCPKnowledgeBase.jsx';
import KnowledgeShelf from './KnowledgeShelf.jsx';
import KnowledgeBaseProfile from './KnowledgeBaseProfile.jsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

function KnowledgeBase() {
  const [useMCP, setUseMCP] = useState(true);
  const [viewMode, setViewMode] = useState('shelf'); // shelf, legacy, profile
  const [userId, setUserId] = useState(null);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState({});

  const categories = [
    { value: 'all', label: 'All Content', icon: 'fas fa-th' },
    { value: 'skills', label: 'Skill Development', icon: 'fas fa-code' },
    { value: 'interview', label: 'Interview Prep', icon: 'fas fa-comments' },
    { value: 'networking', label: 'Networking', icon: 'fas fa-users' },
    { value: 'salary', label: 'Salary Data', icon: 'fas fa-dollar-sign' },
    { value: 'industry', label: 'Industry Insights', icon: 'fas fa-chart-line' }
  ];

  // Get user ID and load knowledge items
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data.data?._id || data.data?.id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };

    getUserId();
  }, []);

  // Load user feedback from the knowledge base items
  const loadUserFeedbacks = async () => {
    try {
      // In the current implementation, we'll initialize an empty feedbacks object
      // since the feedback is stored with the knowledge items themselves
      const feedbacks = {};
      setUserFeedbacks(feedbacks);
    } catch (error) {
      console.error('Error initializing feedbacks:', error);
    }
  };

  // Load knowledge items from API
  useEffect(() => {
    const loadKnowledgeItems = async () => {
      if (!userId) return;
      if (viewMode === 'profile') return; // Don't load search items in profile mode

      setIsLoading(true);
      try {
        let response;

        // Load user feedbacks first
        await loadUserFeedbacks();

        if (useMCP) {
          // Use MCP knowledge base endpoint
          response = await fetch(`/api/v1/ai-career-coach/mcp/knowledge-base/contents/${userId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Transform MCP data to match the expected format
            const transformedData = data.success ? [{
              id: 'mcp-knowledge',
              title: 'Your Career Knowledge Base',
              content: JSON.stringify(data.data, null, 2),
              category: 'career',
              type: 'data',
              tags: ['career', 'profile', 'insights'],
              createdAt: new Date().toISOString(),
              feedback: userFeedbacks[`mcp-knowledge_${userId}`] || null,
              feedbackCount: data.data.feedbackCount || 0
            }] : [];
            setKnowledgeItems(transformedData);
          }
        } else {
          // Fallback to original endpoint
          response = await fetch('/api/v1/enhanced-ai-career-coach/knowledge-base', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Add feedback data and extract skills from knowledge items
            const itemsWithFeedback = (data.data?.items || data.data || []).map(item => {
              // Extract skills from KB item if available
              let extractedSkills = [];
              if (item.skills && Array.isArray(item.skills)) {
                extractedSkills = item.skills;
              } else if (item.content) {
                try {
                  const contentObj = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
                  if (contentObj.skills && Array.isArray(contentObj.skills)) {
                    extractedSkills = contentObj.skills;
                  }
                } catch (e) {
                  // Content is not JSON, skip skill extraction
                }
              }

              return {
                ...item,
                feedback: userFeedbacks[`${item.id}_${userId}`] || null,
                extractedSkills // Add extracted skills
              };
            });
            setKnowledgeItems(itemsWithFeedback);
          }
        }
      } catch (error) {
        console.error('Error loading knowledge items:', error);
        setKnowledgeItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadKnowledgeItems();
  }, [useMCP, userId, viewMode]);

  const filteredItems = knowledgeItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'article': return 'fas fa-newspaper';
      case 'course': return 'fas fa-graduation-cap';
      case 'tip': return 'fas fa-lightbulb';
      case 'data': return 'fas fa-chart-bar';
      default: return 'fas fa-file';
    }
  };

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'article': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'course': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'tip': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'data': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getRelevanceColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            <i className="fas fa-database mr-3 text-green-500"></i>
            Knowledge Base
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                className={`px-4 py-1 rounded-full text-sm font-semibold ${viewMode === 'shelf' ? 'bg-green-500 text-white shadow' : 'text-gray-600'}`}
                onClick={() => setViewMode('shelf')}
              >
                Shelf View
              </button>
              <button
                className={`px-4 py-1 rounded-full text-sm font-semibold ${viewMode === 'profile' ? 'bg-blue-500 text-white shadow' : 'text-gray-600'}`}
                onClick={() => setViewMode('profile')}
              >
                My Profile
              </button>
              <button
                className={`px-4 py-1 rounded-full text-sm font-semibold ${viewMode === 'legacy' ? 'bg-gray-800 text-white shadow' : 'text-gray-600'}`}
                onClick={() => setViewMode('legacy')}
              >
                List View
              </button>
            </div>
            {viewMode === 'legacy' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Legacy</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMCP}
                    onChange={(e) => setUseMCP(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-3 text-sm text-gray-600">AI-Powered</span>
                </label>
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          {viewMode === 'shelf'
            ? 'Explore the 3D shelf for journal insights, research pulls, and progress context.'
            : viewMode === 'profile'
              ? 'View your career preferences and knowledge base settings.'
              : useMCP
                ? 'AI-powered personalized career insights powered by Gemini'
                : 'AI-curated career resources and insights'}
        </p>
      </div>

      {viewMode === 'shelf' ? (
        <KnowledgeShelf />
      ) : viewMode === 'profile' ? (
        <KnowledgeBaseProfile />
      ) : useMCP && userId ? (
        <MCPKnowledgeBase userId={userId} />
      ) : useMCP && !userId ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 text-xl mr-2">⚠️</span>
            <div>
              <h3 className="text-yellow-800 font-medium">Loading User Data</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Please wait while we load your user information...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>

          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:border-green-500"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-green-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <i className={`${cat.icon} mr-2`}></i>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge Items */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
                <p>Loading knowledge base...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-search text-4xl mb-4"></i>
                <p>No knowledge items found. Try adjusting your search or filter.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getContentTypeColor(item.contentType)}`}>
                        <i className={`${getContentTypeIcon(item.contentType)} text-sm`}></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{item.contentType}</span>
                          <span>•</span>
                          <span>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`font-medium ${getRelevanceColor(item.relevanceScore)}`}>
                            {Math.round(item.relevanceScore * 100)}% relevant
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Quality: {Math.round(item.qualityScore * 100)}%
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                          <div
                            className="bg-green-500 h-1 rounded-full"
                            style={{ width: `${item.qualityScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {item.content}
                  </p>

                  {/* Display Skills if available */}
                  {item.extractedSkills && item.extractedSkills.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i className="fas fa-code mr-2"></i>Extracted Skills:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.extractedSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {typeof skill === 'string' ? skill : (skill.name || skill.skill || 'Unknown')}
                            {typeof skill === 'object' && skill.source && (
                              <span className="ml-2 text-xs opacity-75">({skill.source})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium flex items-center"
                      >
                        <i className="fas fa-external-link-alt mr-2"></i>
                        View Source
                      </a>

                      {/* Feedback Buttons */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
                        <button
                          onClick={() => handleFeedback(item.id, 'positive')}
                          className={`p-1 rounded-full ${item.feedback === 'positive' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'} transition-colors`}
                          title="This was helpful"
                        >
                          <i className="fas fa-thumbs-up"></i>
                          {item.feedbackCount?.positive ? (
                            <span className="ml-1 text-xs">{item.feedbackCount.positive}</span>
                          ) : null}
                        </button>
                        <button
                          onClick={() => handleFeedback(item.id, 'negative')}
                          className={`p-1 rounded-full ${item.feedback === 'negative' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                          title="This wasn't helpful"
                        >
                          <i className="fas fa-thumbs-down"></i>
                          {item.feedbackCount?.negative ? (
                            <span className="ml-1 text-xs">{item.feedbackCount.negative}</span>
                          ) : null}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        onClick={() => handleBookmark(item.id)}
                      >
                        <i className={`fas fa-bookmark ${item.isBookmarked ? 'text-yellow-400' : ''}`}></i>
                      </button>
                      <button className="text-gray-400 hover:text-green-500 transition-colors">
                        <i className="fas fa-share"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AI Insights */}
          <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
              AI Knowledge Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {knowledgeItems.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Resources
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(knowledgeItems.reduce((acc, item) => acc + item.relevanceScore, 0) / knowledgeItems.length * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Relevance
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {knowledgeItems.filter(item => item.qualityScore >= 0.9).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  High Quality Items
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Handle feedback submission using event-driven architecture
const handleFeedback = async (itemId, feedbackType) => {
  try {
    const event = {
      type: 'feedback_submitted',
      user_id: userId,
      data: {
        recommendation_id: itemId,
        feedback_type: feedbackType === 'positive' ? 'thumbs_up' : 'thumbs_down',
        timestamp: new Date().toISOString(),
        metadata: {
          page: 'knowledge_base',
          device: window.navigator.userAgent,
          source: 'knowledge_base_item'
        }
      },
      timestamp: new Date().toISOString(),
      event_id: uuidv4()
    };

    const response = await fetch('/api/v1/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    const result = await response.json();

    if (result.success) {
      // Update the knowledge items with the new feedback
      setKnowledgeItems(prevItems =>
        prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              feedback: feedbackType,
              feedbackCount: {
                ...item.feedbackCount,
                [feedbackType]: (item.feedbackCount?.[feedbackType] || 0) + 1,
                // If user is changing their feedback, decrement the other type
                ...(item.feedback && item.feedback !== feedbackType && {
                  [item.feedback]: Math.max(0, (item.feedbackCount?.[item.feedback] || 1) - 1)
                })
              }
            };
          }
          return item;
        })
      );

      // Update user feedbacks state
      setUserFeedbacks(prev => ({
        ...prev,
        [`${itemId}_${userId}`]: feedbackType
      }));

      toast.success('Thank you for your feedback!');
    } else {
      throw new Error(result.message || 'Failed to process feedback');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    toast.error(error.message || 'Failed to submit feedback');
  }
};

// Handle bookmark toggle
const handleBookmark = (itemId) => {
  setKnowledgeItems(prevItems =>
    prevItems.map(item =>
      item.id === itemId
        ? { ...item, isBookmarked: !item.isBookmarked }
        : item
    )
  );
  // Here you would typically make an API call to save the bookmark
};

export default KnowledgeBase;
