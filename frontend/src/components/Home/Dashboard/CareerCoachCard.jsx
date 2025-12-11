import React, { useEffect, useState } from 'react';
import { FiTarget, FiArrowRight, FiClock } from 'react-icons/fi';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

function CareerCoachCard() {
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/v1/enhanced-ai-career-coach/roadmap');
        const roadmapData = res?.data?.data?.roadmap || res?.data?.roadmap;
        if (roadmapData && roadmapData.phases && roadmapData.phases.length > 0) {
          setRoadmap(roadmapData);
        } else {
          setRoadmap(null);
        }
      } catch (e) {
        // Silent for now – card can just show "Start your roadmap"
        setRoadmap(null);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const goToCoach = () => {
    navigate('/career-coach?tab=career-inbox');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-3 w-52 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-4" />
      </div>
    );
  }

  const hasRoadmap = !!roadmap;
  const nextPhase = hasRoadmap ? roadmap.phases[0] : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
            <FiTarget size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {hasRoadmap ? 'Your AI Career Roadmap' : 'Get Your AI Career Roadmap'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hasRoadmap
                ? `Next focus: ${nextPhase?.title || 'stay consistent'}`
                : 'Take a 2-minute assessment to map what to learn next.'}
            </p>
          </div>
        </div>
      </div>

      {hasRoadmap && (
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-3 text-xs space-y-1">
          {roadmap.targetRole && (
            <p className="text-purple-800 dark:text-purple-200 font-medium">
              Target: <span className="font-semibold">{roadmap.targetRole}</span>
            </p>
          )}
          <p className="text-purple-900/80 dark:text-purple-100 flex items-center gap-1">
            <FiClock className="inline-block" size={12} />
            {roadmap.horizon_weeks || 6}-week plan • {roadmap.weekly_hours_budget || 6}h / week
          </p>
        </div>
      )}

      <button
        onClick={goToCoach}
        className="mt-2 inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        {hasRoadmap ? 'Continue with AI Career Coach' : 'Start AI Career Coach'}
        <FiArrowRight className="ml-2" size={14} />
      </button>

      {error && (
        <p className="mt-1 text-[11px] text-red-400">
          We couldn’t load your roadmap right now. You can still open the Career Coach.
        </p>
      )}
    </div>
  );
}

export default CareerCoachCard;




























