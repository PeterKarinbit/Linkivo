import React, { useState, useEffect } from 'react';
import api from '../../services/apiBase';
import { FaBullseye, FaRocket, FaChartBar, FaHandshake, FaLightbulb, FaUsers, FaClock, FaCheckCircle, FaExclamationTriangle, FaEdit } from 'react-icons/fa';
import { useAuth } from '@clerk/clerk-react';

function EnhancedGoalSetting({ onComplete }) {
  const { getToken } = useAuth();
  const [careerGoals, setCareerGoals] = useState({
    short_term: [],
    long_term: [],
    priority_areas: [],
    timeline: '1-year'
  });
  const [marketData, setMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGoal, setCurrentGoal] = useState({
    type: 'short_term',
    goal: '',
    timeline: '',
    priority: 5,
    specific_actions: [],
    market_relevance: 'medium'
  });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Load market data and existing goals on component mount
  useEffect(() => {
    loadMarketData();
    loadExistingGoals();
  }, []);

  const loadExistingGoals = async () => {
    try {
      const response = await api.get('/enhanced-ai-career-coach/goals');

      if (response && response.success) {
        const responseData = response;
        const data = responseData.data;

        if (data) {
          const mapGoal = (g) => ({
            id: g._id || Date.now() + Math.random(),
            goal: g.title,
            timeline: g.description, // Mapping description back to timeline as stored
            priority: g.priority,
            specific_actions: g.specific_actions || [],
            market_relevance: g.market_relevance || 'medium'
          });

          setCareerGoals({
            short_term: (data.short_term || []).map(mapGoal),
            long_term: (data.long_term || []).map(mapGoal),
            priority_areas: data.priority_areas || [],
            timeline: data.timeline || '1-year'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load existing goals:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/enhanced-ai-career-coach/market-insights?category=skills&limit=10');

      if (response && response.success) {
        setMarketData(response.data);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = () => {
    if (!currentGoal.goal.trim()) return;

    if (editingGoalId) {
      setCareerGoals(prev => {
        const newShort = prev.short_term.filter(g => g.id !== editingGoalId);
        const newLong = prev.long_term.filter(g => g.id !== editingGoalId);

        const updatedGoal = {
          id: editingGoalId,
          goal: currentGoal.goal,
          timeline: currentGoal.timeline,
          priority: currentGoal.priority,
          specific_actions: currentGoal.specific_actions,
          market_relevance: currentGoal.market_relevance,
          created_at: new Date().toISOString()
        };

        return {
          ...prev,
          short_term: currentGoal.type === 'short_term' ? [...newShort, updatedGoal] : newShort,
          long_term: currentGoal.type === 'long_term' ? [...newLong, updatedGoal] : newLong
        };
      });
      setEditingGoalId(null);
    } else {
      const newGoal = {
        id: Date.now(),
        goal: currentGoal.goal,
        timeline: currentGoal.timeline,
        priority: currentGoal.priority,
        specific_actions: currentGoal.specific_actions,
        market_relevance: currentGoal.market_relevance,
        created_at: new Date().toISOString()
      };

      setCareerGoals(prev => ({
        ...prev,
        [currentGoal.type]: [...prev[currentGoal.type], newGoal]
      }));
    }

    setCurrentGoal({
      type: 'short_term',
      goal: '',
      timeline: '',
      priority: 5,
      specific_actions: [],
      market_relevance: 'medium'
    });
    setShowGoalForm(false);
  };

  const editGoal = (type, goal) => {
    setCurrentGoal({
      type: type,
      goal: goal.goal,
      timeline: goal.timeline,
      priority: goal.priority,
      specific_actions: goal.specific_actions,
      market_relevance: goal.market_relevance
    });
    setEditingGoalId(goal.id);
    setShowGoalForm(true);
  };

  const removeGoal = (type, goalId) => {
    setCareerGoals(prev => ({
      ...prev,
      [type]: prev[type].filter(goal => goal.id !== goalId)
    }));
  };

  const addActionItem = () => {
    setCurrentGoal(prev => ({
      ...prev,
      specific_actions: [...prev.specific_actions, '']
    }));
  };

  const updateActionItem = (index, value) => {
    setCurrentGoal(prev => ({
      ...prev,
      specific_actions: prev.specific_actions.map((action, i) => i === index ? value : action)
    }));
  };

  const removeActionItem = (index) => {
    setCurrentGoal(prev => ({
      ...prev,
      specific_actions: prev.specific_actions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (careerGoals.short_term.length === 0 && careerGoals.long_term.length === 0) {
      alert('Please add at least one career goal');
      return;
    }

    try {
      setIsLoading(true);

      // Format goals to match backend expectations
      const formattedGoals = {
        short_term: careerGoals.short_term.map(goal => ({
          title: goal.goal,
          description: goal.timeline || 'No description provided',
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          priority: goal.priority || 5,
          specific_actions: goal.specific_actions || [],
          market_relevance: goal.market_relevance || 'medium'
        })),
        long_term: careerGoals.long_term.map(goal => ({
          title: goal.goal,
          description: goal.timeline || 'Long-term career goal',
          target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          priority: goal.priority || 5,
          specific_actions: goal.specific_actions || [],
          market_relevance: goal.market_relevance || 'medium'
        })),
        priority_areas: careerGoals.priority_areas,
        timeline: careerGoals.timeline
      };

      // Send goals to enhanced API
      // Send goals to enhanced API
      const response = await api.post('/enhanced-ai-career-coach/goals', {
        careerGoals: formattedGoals
      });

      if (!response.success && !response.data) {
        throw new Error(response.message || 'Failed to save goals');
      }

      const responseData = response; // apiBase returns { ..., data: ... } structure directly

      if (onComplete) {
        onComplete({ careerGoals: responseData.data });
      } else {
        alert('Goals saved successfully!');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert(error.message || 'Failed to save goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (priority >= 6) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:bg-green-900/20';
  };

  const getMarketRelevanceColor = (relevance) => {
    switch (relevance) {
      case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Set Your Career Goals
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Define your professional aspirations with market-aligned, specific goals
          </p>
        </div>



        {/* Goals Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Short-term Goals */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaBullseye className="text-green-600" /> Short-term Goals
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {careerGoals.short_term.length} goals
              </span>
            </div>
            <div className="space-y-3">
              {careerGoals.short_term.map((goal) => (
                <div key={goal.id} className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.goal}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Timeline: {goal.timeline}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                          Priority: {goal.priority}/10
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getMarketRelevanceColor(goal.market_relevance)}`}>
                          Urgency: {goal.market_relevance}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => editGoal('short_term', goal)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => removeGoal('short_term', goal.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long-term Goals */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaRocket className="text-purple-600" /> Long-term Goals
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {careerGoals.long_term.length} goals
              </span>
            </div>
            <div className="space-y-3">
              {careerGoals.long_term.map((goal) => (
                <div key={goal.id} className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.goal}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Timeline: {goal.timeline}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                          Priority: {goal.priority}/10
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getMarketRelevanceColor(goal.market_relevance)}`}>
                          Urgency: {goal.market_relevance}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => editGoal('long_term', goal)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => removeGoal('long_term', goal.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Goal Form */}
        {showGoalForm && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingGoalId ? 'Edit Goal' : 'Add New Goal'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Type
                </label>
                <select
                  value={currentGoal.type}
                  onChange={(e) => setCurrentGoal(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="short_term">Short-term (1-6 months)</option>
                  <option value="long_term">Long-term (1-5 years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeline
                </label>
                <select
                  value={currentGoal.timeline}
                  onChange={(e) => setCurrentGoal(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  {currentGoal.type === 'short_term' ? (
                    <>
                      <option value="">Select timeline</option>
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="3 months">3 months</option>
                      <option value="4 months">4 months</option>
                      <option value="5 months">5 months</option>
                      <option value="6 months">6 months</option>
                    </>
                  ) : (
                    <>
                      <option value="">Select timeline</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                      <option value="3 years">3 years</option>
                      <option value="4 years">4 years</option>
                      <option value="5 years">5 years</option>
                      <option value="6+ years">6+ years</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Description
              </label>
              <textarea
                value={currentGoal.goal}
                onChange={(e) => setCurrentGoal(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="Describe your career goal in detail..."
                rows={3}
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentGoal.priority}
                  onChange={(e) => setCurrentGoal(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {currentGoal.priority}/10
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgency
                </label>
                <select
                  value={currentGoal.market_relevance}
                  onChange={(e) => setCurrentGoal(prev => ({ ...prev, market_relevance: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="high">High - In high demand</option>
                  <option value="medium">Medium - Moderate demand</option>
                  <option value="low">Low - Limited demand</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specific Action Items
              </label>
              <div className="space-y-2">
                {currentGoal.specific_actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => updateActionItem(index, e.target.value)}
                      placeholder="Enter specific action item..."
                      className="flex-1 px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                    <button
                      onClick={() => removeActionItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addActionItem}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Action Item
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowGoalForm(false);
                  setEditingGoalId(null);
                  setCurrentGoal({
                    type: 'short_term',
                    goal: '',
                    timeline: '',
                    priority: 5,
                    specific_actions: [],
                    market_relevance: 'medium'
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                {editingGoalId ? 'Update Goal' : 'Add Goal'}
              </button>
            </div>
          </div>
        )}

        {/* Add Goal Button */}
        {!showGoalForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowGoalForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
            >
              + Add New Goal
            </button>
          </div>
        )}

        {/* Areas of Improvement */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <FaBullseye className="text-red-500" /> Areas of Improvement
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Select the areas you want to focus on most in your career development
          </p>

          {/* Core Areas */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Core Development Areas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Technical Skills', 'Communication', 'Industry Knowledge',
                'Project Management', 'Mentoring', 'Problem Solving',
                'Strategic Thinking', 'Emotional Intelligence', 'Data Analysis', 'Public Speaking'
              ].map((area) => (
                <label key={area} className="flex items-center space-x-2 cursor-pointer p-3 bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={careerGoals.priority_areas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCareerGoals(prev => ({
                          ...prev,
                          priority_areas: [...prev.priority_areas, area]
                        }));
                      } else {
                        setCareerGoals(prev => ({
                          ...prev,
                          priority_areas: prev.priority_areas.filter(a => a !== area)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Areas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Advanced Growth Areas</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Networking', icon: <FaHandshake />, desc: 'Build professional relationships' },
                { name: 'Innovation', icon: <FaLightbulb />, desc: 'Creative problem-solving' },
                { name: 'Leadership', icon: <FaUsers />, desc: 'Team management & vision' }
              ].map((area) => (
                <label key={area.name} className="flex flex-col p-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 backdrop-blur-sm rounded-lg hover:from-gray-100/50 hover:to-gray-200/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 transition-all cursor-pointer border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={careerGoals.priority_areas.includes(area.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCareerGoals(prev => ({
                            ...prev,
                            priority_areas: [...prev.priority_areas, area.name]
                          }));
                        } else {
                          setCareerGoals(prev => ({
                            ...prev,
                            priority_areas: prev.priority_areas.filter(a => a !== area.name)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                    />
                    <span className="text-lg text-blue-600 dark:text-blue-400">{area.icon}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{area.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">{area.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Selection */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaClock className="text-orange-500" /> Overall Career Timeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '6-months', label: '6 Months' },
              { value: '1-year', label: '1 Year' },
              { value: '2-years', label: '2 Years' },
              { value: '5-years', label: '5 Years' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeline"
                  value={option.value}
                  checked={careerGoals.timeline === option.value}
                  onChange={(e) => setCareerGoals(prev => ({ ...prev, timeline: e.target.value }))}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (careerGoals.short_term.length === 0 && careerGoals.long_term.length === 0)}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving Goals...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedGoalSetting;
