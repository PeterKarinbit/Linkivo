import React, { useState, useEffect } from 'react';
import CareerPathTree from '../metrics/CareerPathTree';
import SkillGapSunburst from '../metrics/SkillGapSunburst';
import MissingSkillsList from '../metrics/MissingSkillsList';
import IndustryTrendsBubbles from '../metrics/IndustryTrendsBubbles';
import ProgressCompass from '../metrics/ProgressCompass';
import ResponsiveChartContainer from '../metrics/ResponsiveChartContainer';
import { apiGet } from '../../services/apiBase';

const BETA_LAUNCH_DATE = new Date('2023-11-20');
const SHOW_PROGRESS_COMPASS = true;

function MarketInsights() {
  const [activeTab, setActiveTab] = useState('career-paths');
  const [careerPaths, setCareerPaths] = useState(null);
  const [skillGaps, setSkillGaps] = useState(null);
  const [industryTrends, setIndustryTrends] = useState(null);
  const [progressCompass, setProgressCompass] = useState(null);

  const [loading, setLoading] = useState({
    careerPaths: true,
    skillGaps: true,
    industryTrends: true,
    progressCompass: false
  });
  const [errors, setErrors] = useState({});
  const [targetRole, setTargetRole] = useState(null);

  // Fetch career paths
  useEffect(() => {
    const fetchCareerPaths = async () => {
      try {
        const response = await apiGet('/enhanced-ai-career-coach/career-paths');
        if (response.success && response.data) {
          setCareerPaths(response.data);
        } else {
          setErrors(prev => ({ ...prev, careerPaths: 'Failed to load career paths' }));
        }
      } catch (error) {
        console.error('Error fetching career paths:', error);
        setErrors(prev => ({ ...prev, careerPaths: error.message || 'Failed to load career paths' }));
      } finally {
        setLoading(prev => ({ ...prev, careerPaths: false }));
      }
    };
    fetchCareerPaths();
  }, []);

  // Fetch skill gaps
  useEffect(() => {
    const fetchSkillGaps = async () => {
      try {
        const query = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
        const response = await apiGet(`/enhanced-ai-career-coach/skill-gaps${query}`);
        if (response.success && response.data) {
          setSkillGaps(response.data);
          if (!targetRole && response.data.targetRole) {
            setTargetRole(response.data.targetRole);
          }
        } else {
          setErrors(prev => ({ ...prev, skillGaps: 'Failed to load skill gaps' }));
        }
      } catch (error) {
        console.error('Error fetching skill gaps:', error);
        setErrors(prev => ({ ...prev, skillGaps: error.message || 'Failed to load skill gaps' }));
      } finally {
        setLoading(prev => ({ ...prev, skillGaps: false }));
      }
    };
    fetchSkillGaps();
  }, [targetRole]);

  // Fetch industry trends
  useEffect(() => {
    const fetchIndustryTrends = async () => {
      try {
        const response = await apiGet('/enhanced-ai-career-coach/industry-trends');
        if (response.success && response.data) {
          setIndustryTrends(response.data);
        } else {
          setErrors(prev => ({ ...prev, industryTrends: 'Failed to load industry trends' }));
        }
      } catch (error) {
        console.error('Error fetching industry trends:', error);
        setErrors(prev => ({ ...prev, industryTrends: error.message || 'Failed to load industry trends' }));
      } finally {
        setLoading(prev => ({ ...prev, industryTrends: false }));
      }
    };
    fetchIndustryTrends();
  }, []);

  // Fetch progress compass
  useEffect(() => {
    if (!SHOW_PROGRESS_COMPASS) return;
    const fetchProgressCompass = async () => {
      try {
        setLoading(prev => ({ ...prev, progressCompass: true }));
        const response = await apiGet('/enhanced-ai-career-coach/progress');
        if (response.success && response.data) {
          setProgressCompass(response.data);
        } else {
          setErrors(prev => ({ ...prev, progressCompass: 'Failed to load progress compass' }));
        }
      } catch (error) {
        console.error('Error fetching progress compass:', error);
        setErrors(prev => ({ ...prev, progressCompass: error.message || 'Failed to load progress compass' }));
      } finally {
        setLoading(prev => ({ ...prev, progressCompass: false }));
      }
    };
    fetchProgressCompass();
  }, []);

  const handleNodeClick = (node) => console.log('Node clicked:', node);
  const handleSegmentClick = (segment) => console.log('Segment clicked:', segment);
  const handleBubbleClick = (bubble) => console.log('Bubble clicked:', bubble);
  const handleRoleChange = (newRole) => setTargetRole(newRole);

  // Helper to render skeleton loader
  const renderSkeleton = () => (
    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <span className="text-gray-400 text-sm font-medium">Analyzing market data...</span>
      </div>
    </div>
  );

  // Helper to render error state
  const renderError = (message) => (
    <div className="w-full h-96 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl"></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load data</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm">{message}</p>
      <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  const tabs = [
    { id: 'career-paths', label: 'Career Paths', icon: 'fa-solid fa-route', color: 'text-blue-500' },
    { id: 'skills', label: 'Skill Analysis', icon: 'fa-solid fa-layer-group', color: 'text-purple-500' },
    { id: 'trends', label: 'Market Trends', icon: 'fa-solid fa-chart-line', color: 'text-emerald-500' },
    { id: 'compass', label: 'Progress Compass', icon: 'fa-solid fa-compass', color: 'text-amber-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-display tracking-tight">
              Market Intelligence
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl leading-relaxed">
              Real-time insights powered by Lightcast & Serper to guide your career decisions.
            </p>
          </div>

          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md transform scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <i className={`${tab.icon} ${activeTab === tab.id ? 'text-white dark:text-gray-900' : tab.color}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-fadeIn">

          {/* Career Paths Section */}
          {activeTab === 'career-paths' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <i className="fa-solid fa-route text-sm"></i>
                    </span>
                    Career Pathways
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10">Map out potential role progressions based on your profile.</p>
                </div>
              </div>
              <div className="p-6">
                {loading.careerPaths ? renderSkeleton() :
                  errors.careerPaths ? renderError(errors.careerPaths) :
                    careerPaths ? (
                      <ResponsiveChartContainer className="bg-slate-50 dark:bg-gray-900 relative group" minHeight={560} maxHeight={640} padding={20}>
                        <CareerPathTree data={careerPaths} onNodeClick={handleNodeClick} />
                        <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none">
                          Interactive Visualization
                        </div>
                      </ResponsiveChartContainer>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                        <i className="fa-regular fa-folder-open text-4xl mb-4 opacity-50"></i>
                        <p>No career path data available yet.</p>
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* Skill Gaps Section */}
          {activeTab === 'skills' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <i className="fa-solid fa-layer-group text-sm"></i>
                    </span>
                    Skill Gap Analysis
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10">Visualize your skill coverage against target roles.</p>
                </div>
              </div>
              <div className="p-6">
                {loading.skillGaps ? renderSkeleton() :
                  errors.skillGaps ? renderError(errors.skillGaps) :
                    skillGaps ? (
                      <div className="space-y-6">
                        <ResponsiveChartContainer className="bg-slate-50 dark:bg-gray-900" minHeight={560} maxHeight={640} padding={20}>
                          <SkillGapSunburst
                            data={skillGaps}
                            targetRole={targetRole}
                            onSegmentClick={handleSegmentClick}
                            onRoleChange={handleRoleChange}
                            isLoading={loading.skillGaps}
                          />
                        </ResponsiveChartContainer>
                        <div className="mt-6">
                          <MissingSkillsList
                            gapSkills={skillGaps.gapSkills || []}
                            skillCategories={skillGaps.skillCategories || {}}
                            targetRole={targetRole || skillGaps.targetRole}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                        <p>No skill data available.</p>
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* Industry Trends Section */}
          {activeTab === 'trends' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <i className="fa-solid fa-chart-line text-sm"></i>
                    </span>
                    Market Trends
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10">Explore rising skills and industry demands.</p>
                </div>
              </div>
              <div className="p-6">
                {loading.industryTrends ? renderSkeleton() :
                  errors.industryTrends ? renderError(errors.industryTrends) :
                    industryTrends ? (
                      <ResponsiveChartContainer className="bg-slate-50 dark:bg-gray-900" minHeight={560} maxHeight={640} padding={20}>
                        <IndustryTrendsBubbles data={industryTrends} onBubbleClick={handleBubbleClick} />
                      </ResponsiveChartContainer>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                        <p>No trend data available.</p>
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* Progress Compass Section */}
          {activeTab === 'compass' && (
            SHOW_PROGRESS_COMPASS ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <i className="fa-solid fa-compass text-sm"></i>
                      </span>
                      Progress Compass
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10">Track your alignment across key career dimensions.</p>
                  </div>
                </div>
                <div className="p-6">
                  {loading.progressCompass ? renderSkeleton() :
                    errors.progressCompass ? renderError(errors.progressCompass) :
                      progressCompass ? (
                        <ResponsiveChartContainer className="bg-slate-50 dark:bg-gray-900" minHeight={520} maxHeight={640} padding={20}>
                          <ProgressCompass data={progressCompass} />
                        </ResponsiveChartContainer>
                      ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                          <p>No progress data available.</p>
                        </div>
                      )}
                </div>
              </div>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl max-w-md shadow-2xl">
                  <span className="text-4xl mb-4 block">🚀</span>
                  <h2 className="text-2xl font-bold text-white mb-2 font-display">Coming Soon</h2>
                  <p className="text-indigo-200 mb-6">Our advanced Progress Compass visualization is launching next week. Get ready to visualize your career velocity like never before.</p>
                  <div className="inline-block px-4 py-2 bg-indigo-500/50 rounded-lg text-sm font-mono text-indigo-100 border border-indigo-400/30">
                    Launch: Nov 20, 2025
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketInsights;






