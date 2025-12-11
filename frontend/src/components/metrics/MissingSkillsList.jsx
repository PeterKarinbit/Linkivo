import React, { useState } from 'react';

/**
 * MissingSkillsList - Displays all missing skills grouped by category
 * Shows skills that user needs to develop for their target role
 */
function MissingSkillsList({ gapSkills = [], skillCategories = {}, targetRole }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'name' | 'category'

  if (!gapSkills || gapSkills.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
        <i className="fa-solid fa-info-circle text-blue-500 text-2xl mb-2"></i>
        <p className="text-blue-700 dark:text-blue-300 font-semibold mb-2">
          No skill data available for {targetRole || 'your target role'}.
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-sm">
          We don't have a predefined skill set for this role yet. Please update your target role to a supported role, or contact support to add this role.
        </p>
      </div>
    );
  }

  // Group skills by category
  const skillsByCategory = {};
  gapSkills.forEach(skill => {
    const cat = skill.category || 'Other';
    if (!skillsByCategory[cat]) {
      skillsByCategory[cat] = [];
    }
    skillsByCategory[cat].push(skill);
  });

  // Sort skills within each category
  Object.keys(skillsByCategory).forEach(cat => {
    skillsByCategory[cat].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 3, high: 2, medium: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      if (sortBy === 'importance') {
        return (b.importance || 0) - (a.importance || 0);
      }
      return a.name.localeCompare(b.name);
    });
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Technical':
        return 'fa-code';
      case 'Tools':
        return 'fa-toolbox';
      case 'Soft Skills':
        return 'fa-users';
      case 'Domain':
        return 'fa-book';
      default:
        return 'fa-circle';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Missing Skills for {targetRole || 'Target Role'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {gapSkills.length} skill{gapSkills.length !== 1 ? 's' : ''} to develop
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option value="priority">Sort by Priority</option>
          <option value="importance">Sort by Importance</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Category Coverage Summary */}
      {Object.keys(skillCategories).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(skillCategories).map(([category, data]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <i className={`fa-solid ${getCategoryIcon(category)} text-xs text-gray-500`}></i>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{category}</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{data.coverage}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {data.have} / {data.needed} skills
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${data.coverage >= 70 ? 'bg-green-500' :
                      data.coverage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${data.coverage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills by Category */}
      <div className="space-y-3">
        {Object.entries(skillsByCategory).map(([category, skills]) => {
          const isExpanded = expandedCategories[category] !== false; // Default to expanded
          const categoryData = skillCategories[category] || {};

          return (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${getCategoryIcon(category)} text-gray-500 dark:text-gray-400`}></i>
                  <span className="font-semibold text-gray-900 dark:text-white">{category}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({skills.length} skill{skills.length !== 1 ? 's' : ''})
                  </span>
                  {categoryData.coverage !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryData.coverage >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        categoryData.coverage >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                      {categoryData.coverage}% coverage
                    </span>
                  )}
                </div>
                <i
                  className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'} text-gray-400 transition-transform`}
                ></i>
              </button>

              {/* Skills List */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-2 space-y-2">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(skill.priority)}`}>
                            {skill.priority}
                          </span>
                          {skill.importance && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Importance: {skill.importance}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        onClick={() => {
                          // TODO: Add to learning plan
                          console.log('Add to learning plan:', skill.name);
                        }}
                      >
                        <i className="fa-solid fa-plus mr-1"></i>
                        Add to Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-lightbulb text-blue-500 text-xl mt-0.5"></i>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Focus on Critical Skills First
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Start with skills marked as "critical" or "high" priority. These are essential for {targetRole || 'your target role'}.
              Consider taking courses, working on projects, or finding mentors to help you develop these skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissingSkillsList;














