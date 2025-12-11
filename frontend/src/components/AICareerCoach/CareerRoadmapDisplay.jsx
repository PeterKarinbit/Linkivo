import React, { useState, useEffect } from 'react';
import { FiTarget, FiBookOpen, FiTrendingUp, FiUsers, FiAward, FiClock, FiCheck, FiArrowRight, FiExternalLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { apiPost } from '../../services/apiBase';

function CareerRoadmapDisplay({ roadmap, onContinue, onAdjust }) {
  const [checkingSkills, setCheckingSkills] = useState({});
  const [skillValidation, setSkillValidation] = useState(roadmap?.skillValidation || null);
  const [enrichedPhases, setEnrichedPhases] = useState(roadmap?.phases || []);

  // Update enriched phases when roadmap prop changes
  useEffect(() => {
    if (roadmap?.phases) {
      setEnrichedPhases(roadmap.phases);
    }
  }, [roadmap]);

  const handleCheckSkills = async (phaseIndex) => {
    try {
      setCheckingSkills(prev => ({ ...prev, [phaseIndex]: true }));
      const response = await apiPost('/enhanced-ai-career-coach/roadmap/check-skills', {
        phaseIndex
      });
      
      if (response.success && response.data) {
        // Update the phase with enriched skills
        const updatedPhases = [...enrichedPhases];
        updatedPhases[phaseIndex] = response.data.phase;
        setEnrichedPhases(updatedPhases);
        
        if (response.data.skillCheck) {
          setSkillValidation(prev => ({
            ...prev,
            [`phase_${phaseIndex}`]: response.data.skillCheck
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check skills:', error);
    } finally {
      setCheckingSkills(prev => ({ ...prev, [phaseIndex]: false }));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTarget className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Roadmap is being generated...</h2>
          <p className="text-gray-600 mb-6">Your personalized career roadmap is currently being built by our AI. Please check back in a moment.</p>
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const getPhaseIcon = (phaseIndex) => {
    const icons = [
      <FiBookOpen className="w-6 h-6" />,
      <FiTrendingUp className="w-6 h-6" />,
      <FiUsers className="w-6 h-6" />,
      <FiAward className="w-6 h-6" />,
      <FiTarget className="w-6 h-6" />
    ];
    return icons[phaseIndex % icons.length] || <FiTarget className="w-6 h-6" />;
  };

  const getPhaseColor = (phaseIndex) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-indigo-500 to-indigo-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600'
    ];
    return colors[phaseIndex % colors.length] || 'from-gray-500 to-gray-600';
  };

  const getPhaseBgColor = (phaseIndex) => {
    const colors = [
      'bg-purple-50 border-purple-200',
      'bg-blue-50 border-blue-200',
      'bg-indigo-50 border-indigo-200',
      'bg-green-50 border-green-200',
      'bg-orange-50 border-orange-200'
    ];
    return colors[phaseIndex % colors.length] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiTarget className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {roadmap.targetRole ? `Your Roadmap to ${roadmap.targetRole}` : 'Your Personalized Career Roadmap'}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              A {roadmap.phases.length}-phase plan tailored to your profile
            </p>
            {roadmap.summary && (
              <div className="bg-purple-50 rounded-xl p-4 max-w-2xl mx-auto border border-purple-100">
                <p className="text-gray-700 italic">"{roadmap.summary}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Roadmap Phases */}
        <div className="space-y-6 mb-8">
          {enrichedPhases.map((phase, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg border-2 ${getPhaseBgColor(index)} overflow-hidden transition-all hover:shadow-xl`}
            >
              {/* Phase Header */}
              <div className={`bg-gradient-to-r ${getPhaseColor(index)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      {getPhaseIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Phase {index + 1}</span>
                        {phase.weeks && (
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center">
                            <FiClock className="mr-1" size={12} />
                            {phase.weeks} Weeks
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold mt-1">{phase.title || `Phase ${index + 1}`}</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase Content */}
              <div className="p-6">
                {phase.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed border-l-4 border-purple-200 pl-4">
                    {phase.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Goals */}
                  {phase.goals && phase.goals.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wide">
                        <FiTarget className="mr-2 text-purple-600" size={16} />
                        Key Objectives
                      </h3>
                      <ul className="space-y-2">
                        {phase.goals.map((goal, goalIndex) => (
                          <li key={goalIndex} className="flex items-start">
                            <FiCheck className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {typeof goal === 'string' ? goal : (goal.title || goal.description || goal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {phase.skills && phase.skills.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-wide">
                        <FiTrendingUp className="mr-2 text-blue-600" size={16} />
                        Skills to Master
                      </h3>
                        <button
                          onClick={() => handleCheckSkills(index)}
                          disabled={checkingSkills[index]}
                          className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1"
                        >
                          {checkingSkills[index] ? (
                            <>Checking...</>
                          ) : (
                            <>
                              <FiCheckCircle size={12} />
                              Validate Skills
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(phase.enrichedSkills || phase.skills).map((skill, skillIndex) => {
                          const skillName = typeof skill === 'string' ? skill : (skill.name || skill);
                          const skillData = typeof skill === 'object' ? skill : null;
                          const priority = skillData?.priority || 'medium';
                          const validated = skillData?.validated;
                          const hasResources = skillData?.learningResources && skillData.learningResources.length > 0;

                          return (
                            <div key={skillIndex} className="relative group">
                          <span
                                className={`px-3 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(priority)} flex items-center gap-1`}
                              >
                                {validated !== undefined && (
                                  validated ? (
                                    <FiCheckCircle size={12} className="text-green-600" />
                                  ) : (
                                    <FiAlertCircle size={12} className="text-gray-400" />
                                  )
                                )}
                                {skillName}
                                {skillData?.estimatedHours && (
                                  <span className="text-xs opacity-75">({skillData.estimatedHours}h)</span>
                                )}
                          </span>
                              {hasResources && (
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
                                  <div className="text-xs font-semibold mb-1 text-gray-700">Learning Resources:</div>
                                  {skillData.learningResources.slice(0, 3).map((resource, idx) => (
                                    <a
                                      key={idx}
                                      href={resource.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-blue-600 hover:text-blue-800 mb-1 flex items-center gap-1"
                                    >
                                      <FiExternalLink size={10} />
                                      {resource.title || resource.snippet?.substring(0, 40)}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {skillValidation && skillValidation[`phase_${index}`] && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">
                              {skillValidation[`phase_${index}`].summary.validated}/
                              {skillValidation[`phase_${index}`].summary.total}
                            </span>
                            {' '}skills validated via Lightcast
                            {skillValidation[`phase_${index}`].summary.learningResources > 0 && (
                              <span className="ml-2">
                                • {skillValidation[`phase_${index}`].summary.learningResources} learning resources found
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Evidence/Rationale */}
                {phase.evidence && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 flex items-center">
                      <FiBookOpen className="mr-2" />
                      <span className="italic">Why this matters: {phase.evidence}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Review & Commit Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-purple-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Journey</h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Does this timeline work for you? You can accept it as is, or ask our AI to adjust the pace.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Adjust Options */}
            {onAdjust && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAdjust('extend')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-sm font-medium transition-colors"
                >
                  ⏱️ Timeline too compressed
                </button>
                <button
                  onClick={() => onAdjust('intensify')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-sm font-medium transition-colors"
                >
                  🚀 I want a challenge
                </button>
              </div>
            )}

            {/* Commit Button */}
            {onContinue && (
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-bold text-lg flex items-center shadow-md"
              >
                Accept & Start Roadmap
                <FiArrowRight className="ml-2" size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CareerRoadmapDisplay;























