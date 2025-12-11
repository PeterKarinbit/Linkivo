import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiMail, FiStar, FiClock, FiTrash2, FiArchive, 
  FiSearch, FiRefreshCw, FiMoreVertical, FiCheck, 
  FiCalendar, FiTarget, FiTrendingUp, FiAward, 
  FiBookOpen, FiUsers, FiBriefcase, FiCode, 
  FiMessageSquare, FiChevronLeft, FiMenu,
  FiFilter, FiX
} from 'react-icons/fi';

const GmailStyleRecommendations = ({ 
  recommendations = [], 
  onComplete, 
  onMarkAsRead, 
  onDelete,
  onToggleStar,
  onSnooze,
  onArchive,
  isLoading = false
}) => {
  const [selectedRec, setSelectedRec] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Set first recommendation as selected when recommendations load
  useEffect(() => {
    if (recommendations.length > 0 && !selectedRec) {
      setSelectedRec(recommendations[0]);
    } else if (recommendations.length === 0) {
      setSelectedRec(null);
    }
  }, [recommendations]);

  // Get icon based on category
  const getCategoryIcon = (category) => {
    const icons = {
      skills: <FiCode className="text-blue-500" size={18} />,
      networking: <FiUsers className="text-purple-500" size={18} />,
      portfolio: <FiBriefcase className="text-indigo-500" size={18} />,
      learning: <FiBookOpen className="text-green-500" size={18} />,
      job_search: <FiTarget className="text-red-500" size={18} />,
      career_planning: <FiAward className="text-yellow-500" size={18} />,
      interview: <FiMessageSquare className="text-pink-500" size={18} />
    };
    return icons[category] || <FiMail className="text-gray-500" size={18} />;
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter recommendations
  const filteredRecs = recommendations.filter(rec => {
    const matchesSearch = rec.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rec.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'all': return true;
        case 'unread': return rec.status === 'unread';
        case 'starred': return rec.starred;
        case 'urgent': return rec.priority === 'urgent' || rec.priority === 'high';
        default: return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  // Handle actions
  const handleMarkAsRead = (id) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleToggleStar = (id, e) => {
    e?.stopPropagation();
    if (onToggleStar) {
      onToggleStar(id);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recommendation?')) {
      if (onDelete) {
        await onDelete(id);
        if (selectedRec?.recommendation_id === id) {
          const remaining = filteredRecs.filter(r => r.recommendation_id !== id);
          setSelectedRec(remaining[0] || null);
        }
      }
    }
  };

  const handleSelectRec = (rec) => {
    setSelectedRec(rec);
    if ((rec.status === 'unread' || !rec.readAt) && onMarkAsRead) {
      handleMarkAsRead(rec.recommendation_id);
    }
  };

  const handleComplete = () => {
    if (selectedRec && onComplete) {
      onComplete(selectedRec.recommendation_id);
      // Remove from list after completion
      const remaining = filteredRecs.filter(r => r.recommendation_id !== selectedRec.recommendation_id);
      setSelectedRec(remaining[0] || null);
    }
  };

  const handleSnooze = () => {
    if (selectedRec && onSnooze) {
      onSnooze(selectedRec.recommendation_id);
    } else if (selectedRec) {
      // Fallback: show coming soon message
      alert('Coming Soon!\n\nSnooze will let you temporarily hide recommendations and have them reappear later. This helps you focus on what matters most right now.');
    }
  };

  const handleArchive = () => {
    if (selectedRec && onArchive) {
      onArchive(selectedRec.recommendation_id);
      // Remove from list after archiving
      const remaining = filteredRecs.filter(r => r.recommendation_id !== selectedRec.recommendation_id);
      setSelectedRec(remaining[0] || null);
    } else if (selectedRec) {
      // Fallback: mark as read and move to archived filter
      if (onMarkAsRead) {
        onMarkAsRead(selectedRec.recommendation_id);
      }
      alert('Coming Soon!\n\nArchive will move recommendations to a separate folder so you can focus on active items while keeping completed ones for reference.');
    }
  };

  const filters = [
    { id: 'all', label: 'All', icon: <FiMail size={16} />, count: recommendations.length },
    { id: 'unread', label: 'Unread', icon: <FiMail size={16} />, count: recommendations.filter(r => r.status === 'unread' || !r.readAt).length },
    { id: 'starred', label: 'Starred', icon: <FiStar size={16} />, count: recommendations.filter(r => r.starred).length },
    { id: 'urgent', label: 'Urgent', icon: <FiTarget size={16} />, count: recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length }
  ];

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FiTarget className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900">Career Coach</h1>
              <p className="text-xs text-gray-500">AI Recommendations</p>
            </div>
          </div>
        </div>
        
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Roadmap-based tasks • Auto-refresh off</span>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Filters */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 overflow-hidden`}>
          <div className="p-4">
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={activeFilter === filter.id ? 'text-purple-600' : 'text-gray-500'}>
                      {filter.icon}
                    </span>
                    <span>{filter.label}</span>
                  </div>
                  {filter.count > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {activeFilter === 'all' ? 'All Recommendations' : filters.find(f => f.id === activeFilter)?.label}
            </h2>
            <span className="text-xs text-gray-500">{filteredRecs.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRecs.map((rec) => (
              <div
                key={rec.recommendation_id}
                onClick={() => handleSelectRec(rec)}
                className={`px-4 py-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedRec?.recommendation_id === rec.recommendation_id
                    ? 'bg-purple-50 border-l-4 border-l-purple-600'
                    : (rec.status === 'unread' || !rec.readAt)
                    ? 'bg-blue-50 hover:bg-gray-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      {getCategoryIcon(rec.category)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`text-sm ${(rec.status === 'unread' || !rec.readAt) ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-1`}>
                        {rec.title}
                      </h3>
                      <button
                        onClick={(e) => handleToggleStar(rec.recommendation_id, e)}
                        className="flex-shrink-0 ml-2"
                      >
                        <FiStar
                          size={16}
                          className={rec.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}
                        />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {rec.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                      <span className="text-gray-500">{formatDate(rec.created_at)}</span>
                      {(rec.estimated_time || rec.estimated_time_hours) && (
                        <span className="text-gray-500">• {rec.estimated_time || `${rec.estimated_time_hours} hour${rec.estimated_time_hours !== 1 ? 's' : ''}`}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

        {filteredRecs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiMail className="text-gray-400" size={28} />
                </div>
                <p className="text-gray-500 text-sm font-medium">No recommendations found</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedRec ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      {getCategoryIcon(selectedRec.category)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">AI Career Coach</span>
                        <span className="text-xs text-gray-500">to you</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(selectedRec.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleToggleStar(selectedRec.recommendation_id, {})}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiStar 
                        size={18}
                        className={selectedRec.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                      />
                    </button>
                    <button 
                      onClick={handleArchive}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <FiArchive size={18} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedRec.recommendation_id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={18} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <FiMoreVertical size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedRec.title}
                </h1>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedRec.priority)}`}>
                    {selectedRec.priority}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {selectedRec.category}
                  </span>
                  {(selectedRec.estimated_time || selectedRec.estimated_time_hours) && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <FiClock size={12} className="mr-1" />
                      {selectedRec.estimated_time || `${selectedRec.estimated_time_hours} hour${selectedRec.estimated_time_hours !== 1 ? 's' : ''}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl">
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedRec.description}
                    </p>
                  </div>

                  {(selectedRec.action_items && selectedRec.action_items.length > 0) && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <FiCheck className="mr-2 text-purple-600" size={16} />
                        Action Items
                      </h3>
                      <ul className="space-y-3">
                        {selectedRec.action_items.map((item, idx) => {
                          const itemText = typeof item === 'string' ? item : (item.item || item.recommendation || item);
                          const itemDesc = typeof item === 'object' ? (item.description || item.desc) : null;
                          return (
                            <li key={idx} className="flex items-start">
                              <input
                                type="checkbox"
                                defaultChecked={typeof item === 'object' && item.completed}
                                className="mt-0.5 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                <span className="font-medium">{itemText}</span>
                                {itemDesc && ` — ${itemDesc}`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {selectedRec.structured?.recommendations?.actionable_recommendations && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <FiCheck className="mr-2 text-purple-600" size={16} />
                        Action Items
                      </h3>
                      <ul className="space-y-3">
                        {selectedRec.structured.recommendations.actionable_recommendations.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              <span className="font-medium">{item.recommendation || item.item || item}</span>
                              {item.description && ` — ${item.description}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-6 border-t border-gray-200">
                    {onComplete && (
                      <button 
                        onClick={handleComplete}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm flex items-center"
                      >
                        <FiCheck className="mr-2" size={16} />
                        Mark Complete
                      </button>
                    )}
                    <button 
                      onClick={handleSnooze}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center"
                    >
                      <FiClock className="mr-2" size={16} />
                      Snooze
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="text-gray-400" size={36} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No recommendation selected</h3>
                <p className="text-sm text-gray-500">Select a recommendation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailStyleRecommendations;