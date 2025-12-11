import React, { useState, useEffect } from 'react';

function CareerGoalsForm() {
  const [goals, setGoals] = useState({
    short_term: [],
    long_term: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    goal: '',
    timeline: '',
    type: 'short_term'
  });

  // Load existing goals
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/enhanced-ai-career-coach/goals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        // Map goals from backend format to display format
        // Backend stores: { goal, timeline, priority } (schema format)
        // Or might receive: { title, description, priority } (frontend format)
        const mapGoal = (g) => ({
          goal: g.goal || g.title || '',
          timeline: g.timeline || g.description || '',
          priority: g.priority || 5
        });

        if (data && data.career_goals) {
          setGoals({
            short_term: (data.career_goals.short_term || []).map(mapGoal),
            long_term: (data.career_goals.long_term || []).map(mapGoal)
          });
        } else if (data) {
          setGoals({
            short_term: (data.short_term || []).map(mapGoal),
            long_term: (data.long_term || []).map(mapGoal)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!formData.goal.trim()) {
      setMessage('Please enter a goal');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!formData.timeline.trim()) {
      setMessage('Please enter a timeline/duration');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newGoal = {
      goal: formData.goal.trim(),
      timeline: formData.timeline.trim(),
      priority: 5
    };

    const type = formData.type;
    setGoals(prev => ({
      ...prev,
      [type]: [...prev[type], newGoal]
    }));

    // Reset form
    setFormData({
      goal: '',
      timeline: '',
      type: 'short_term'
    });
    setShowAddForm(false);
    setMessage('Goal added. Click "Save Changes" to save.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (type, index) => {
    const goal = goals[type][index];
    setFormData({
      goal: goal.goal || '',
      timeline: goal.timeline || '',
      type: type
    });
    setEditingIndex(index);
    setEditingType(type);
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!formData.goal.trim()) {
      setMessage('Please enter a goal');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!formData.timeline.trim()) {
      setMessage('Please enter a timeline/duration');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const updatedGoal = {
      goal: formData.goal.trim(),
      timeline: formData.timeline.trim(),
      priority: goals[editingType][editingIndex].priority || 5
    };

    setGoals(prev => ({
      ...prev,
      [editingType]: prev[editingType].map((g, i) => i === editingIndex ? updatedGoal : g)
    }));

    // Reset form
    setFormData({
      goal: '',
      timeline: '',
      type: 'short_term'
    });
    setShowAddForm(false);
    setEditingIndex(null);
    setEditingType(null);
    setMessage('Goal updated. Click "Save Changes" to save.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = (type, index) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
      setMessage('Goal deleted. Click "Save Changes" to save.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate all goals have timelines
      const allGoals = [...goals.short_term, ...goals.long_term];
      const goalsWithoutTimeline = allGoals.filter(g => !g.timeline || !g.timeline.trim());
      
      if (goalsWithoutTimeline.length > 0) {
        setMessage('Please ensure all goals have a timeline/duration');
        setTimeout(() => setMessage(''), 5000);
        setSaving(false);
        return;
      }
      
      // Format goals to match backend expectations
      const formattedGoals = {
        short_term: goals.short_term.map(goal => ({
          title: goal.goal,
          description: goal.timeline,
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: goal.priority || 5
        })),
        long_term: goals.long_term.map(goal => ({
          title: goal.goal,
          description: goal.timeline,
          target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          priority: goal.priority || 5
        }))
      };

      const response = await fetch('/api/v1/enhanced-ai-career-coach/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ careerGoals: formattedGoals })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save goals');
      }

      setMessage('Goals saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setMessage(error.message || 'Failed to save goals. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setFormData({
      goal: '',
      timeline: '',
      type: 'short_term'
    });
    setShowAddForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('success') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Goals Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short-term Goals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Short-term Goals
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {goals.short_term.length} {goals.short_term.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>
          
          <div className="space-y-3">
            {goals.short_term.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No short-term goals yet
              </p>
            ) : (
              goals.short_term.map((goal, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {goal.goal}
                      </p>
                      {goal.timeline && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Timeline: {goal.timeline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => handleEdit('short_term', index)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete('short_term', index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Long-term Goals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Long-term Goals
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {goals.long_term.length} {goals.long_term.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>
          
          <div className="space-y-3">
            {goals.long_term.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No long-term goals yet
              </p>
            ) : (
              goals.long_term.map((goal, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {goal.goal}
                      </p>
                      {goal.timeline && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Timeline: {goal.timeline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => handleEdit('long_term', index)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete('long_term', index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? 'Edit Goal' : 'Add New Goal'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={editingIndex !== null}
              >
                <option value="short_term">Short-term (1-6 months)</option>
                <option value="long_term">Long-term (1+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="e.g., Learn React framework"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeline/Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="e.g., 3 months, 1 year, 6 months"
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required: Specify when you want to achieve this goal
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={editingIndex !== null ? handleUpdate : handleAdd}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingIndex !== null ? 'Update Goal' : 'Add Goal'}
              </button>
              <button
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            <i className="fa-solid fa-plus"></i>
            Add Goal
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default CareerGoalsForm;

