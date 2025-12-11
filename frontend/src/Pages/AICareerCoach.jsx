import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome, FiBookmark, FiMail, FiBook, FiTrendingUp, FiMenu } from 'react-icons/fi';

import EnhancedMemoriesJournal from '../components/AICareerCoach/EnhancedMemoriesJournal';
import AIRecommendations from '../components/AICareerCoach/AIRecommendations';
import SecureKnowledgeBase from '../components/AICareerCoach/SecureKnowledgeBase';
import MarketInsightsLanding from '../components/AICareerCoach/MarketInsightsLanding';
import IvoGuideImage from '../components/assets/media/Ivo_Guide.png';
import Tour from '../components/Tour/Tour';

/**
 * Enhanced AI Career Coach V2 with Canva-style Sidebar
 * 
 * Features:
 * - Fixed 350px sidebar with icon strip (80px) and content panel (270px)
 * - Icons with labels below (Canva-style)
 * - Click to toggle content, hover for highlight
 * - Clean, minimal design
 */

function EnhancedAICareerCoachV2() {
  const { userData } = useSelector((state) => state.auth);
  const userProfile = userData?.userProfile || {};
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState('main-dashboard');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [proactiveRecommendations, setProactiveRecommendations] = useState([]);
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, limit: 0, pct: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    journalEntries: 0,
    documents: 0,
    recommendations: 0,
    recentJournals: [],
    recentDocs: []
  });

  const navigate = useNavigate();

  // Navigation items with icons and descriptions (Canva-style)
  const navigationItems = [
    { id: 'main-dashboard', label: 'Dashboard', icon: FiHome, description: 'Overview & quick actions' },
    { id: 'memories', label: 'Memories', icon: FiBookmark, description: 'Your career journal' },
    { id: 'ai-inbox', label: 'AI Inbox', icon: FiMail, description: 'AI recommendations' },
    { id: 'knowledge-base', label: 'Knowledge', icon: FiBook, description: 'Documents & insights' },
    { id: 'market-insights', label: 'Market', icon: FiTrendingUp, description: 'Industry trends' },
  ];

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const validTabs = ['main-dashboard', 'memories', 'ai-inbox', 'knowledge-base', 'market-insights', 'skill-gap', 'goals'];
      if (validTabs.includes(tab)) {
        setCurrentStep(tab);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    loadProactiveRecommendations();
    loadUsage();
    loadDashboardMetrics();
  }, []);

  // Listen for Journal -> Knowledge Base navigation
  useEffect(() => {
    const handleKBNavigation = () => {
      setCurrentStep('knowledge-base');
    };

    window.addEventListener('navigateToKnowledgeBase', handleKBNavigation);
    return () => window.removeEventListener('navigateToKnowledgeBase', handleKBNavigation);
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      };

      // Fetch all metrics in parallel
      const [journalRes, shelfRes, recsRes] = await Promise.allSettled([
        fetch('/api/v1/enhanced-ai-career-coach/journal?limit=5', { headers }),
        fetch('/api/v1/enhanced-ai-career-coach/knowledge-base/shelf', { headers }),
        fetch('/api/v1/enhanced-ai-career-coach/recommendations?type=proactive&limit=10', { headers })
      ]);

      let journalEntries = 0;
      let recentJournals = [];
      let documents = 0;
      let recentDocs = [];
      let recommendations = 0;

      // Process journal entries
      if (journalRes.status === 'fulfilled' && journalRes.value.ok) {
        const data = await journalRes.value.json();
        journalEntries = data?.data?.total || data?.data?.items?.length || 0;
        recentJournals = data?.data?.items?.slice(0, 3) || [];
      }

      // Process knowledge base shelf
      if (shelfRes.status === 'fulfilled' && shelfRes.value.ok) {
        const data = await shelfRes.value.json();
        const decks = data?.data?.decks || [];
        // Count total documents across all decks
        documents = decks.reduce((sum, deck) => sum + (deck.items?.length || 0), 0);
        // Get recent docs
        const allDocs = decks.flatMap(deck => deck.items || []);
        recentDocs = allDocs.slice(0, 3);
      }

      // Process recommendations
      if (recsRes.status === 'fulfilled' && recsRes.value.ok) {
        const data = await recsRes.value.json();
        recommendations = data?.data?.recommendations?.length || 0;
      }

      setDashboardMetrics({
        journalEntries,
        documents,
        recommendations,
        recentJournals,
        recentDocs
      });
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    }
  };

  const loadProactiveRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        '/api/v1/enhanced-ai-career-coach/recommendations?type=proactive&limit=5',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProactiveRecommendations(data?.data?.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to load proactive recommendations:', error);
      setProactiveRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const resp = await fetch('/api/v1/subscription/usage', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        const cm = data?.data?.careerMemories;
        if (cm) {
          const pct = cm.limit === -1 ? 0 : Math.min(100, Math.round((cm.used / Math.max(1, cm.limit)) * 100));
          setMemoryUsage({ used: cm.used ?? 0, limit: cm.limit ?? 0, pct });
        }
      }
    } catch (error) {
      console.error('Failed to load subscription usage:', error);
    }
  };

  const handleNavClick = (itemId) => {
    if (currentStep === itemId && isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setCurrentStep(itemId);
      setIsPanelOpen(true);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'main-dashboard':
        return (
          <MainDashboardView
            userProfile={userProfile}
            onNavigate={handleNavClick}
            navigateTo={navigate}
            metrics={dashboardMetrics}
          />
        );
      case 'memories':
        return <EnhancedMemoriesJournal />;
      case 'ai-inbox':
        return <AIRecommendations />;
      case 'knowledge-base':
        return <SecureKnowledgeBase />;
      case 'market-insights':
        return <MarketInsightsLanding />;
      case 'skill-gap':
        return <AIRecommendations />;
      default:
        return (
          <MainDashboardView
            userProfile={userProfile}
            onNavigate={handleNavClick}
            navigateTo={navigate}
            metrics={dashboardMetrics}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Tour Component */}
      <Tour tourId="aiCoach" autoStart={false} />

      {/* Canva-Style Sidebar */}
      <div
        data-tour="ai-coach-sidebar"
        className="fixed left-0 top-20 h-[calc(100vh-5rem)] flex bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300"
        style={{ width: isPanelOpen ? '350px' : '80px' }}
      >
        {/* Icon Strip - Canva Style (80px) */}
        <div className="w-[80px] h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
          {/* Menu Toggle */}
          <div className="flex justify-center py-4 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiMenu size={24} />
            </button>
          </div>

          {/* Navigation Icons - Spaced Out */}
          <div className="flex-1 flex flex-col items-center pt-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentStep === item.id;

              return (
                <button
                  key={item.id}
                  data-tour={item.id === 'main-dashboard' ? 'ai-coach-dashboard' : item.id === 'memories' ? 'memories' : item.id === 'ai-inbox' ? 'ai-inbox' : item.id === 'knowledge-base' ? 'knowledge-base' : item.id === 'market-insights' ? 'market-insights' : null}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex flex-col items-center py-3 px-2 transition-all duration-200 relative
                    ${isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 dark:bg-emerald-400 rounded-r-full"></div>
                  )}

                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                    ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                  `}>
                    <Icon size={22} />
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel - Slides in/out (270px) */}
        <div
          className={`h-full bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out ${isPanelOpen ? 'w-[270px] opacity-100' : 'w-0 opacity-0'}`}
        >
          <div className="w-[270px] h-full flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <img src={IvoGuideImage} alt="Ivo" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {navigationItems.find(item => item.id === currentStep)?.label || 'Career Coach'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {navigationItems.find(item => item.id === currentStep)?.description || 'AI Powered'}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {currentStep === 'main-dashboard' && (
                <DashboardPanel
                  onNavigate={handleNavClick}
                  navigateTo={navigate}
                  userProfile={userProfile}
                  metrics={dashboardMetrics}
                />
              )}

              {currentStep === 'memories' && (
                <SectionPanel
                  icon={FiBookmark}
                  title="Career Memories"
                  description="Your career journal and reflections"
                  color="emerald"
                  tips={[
                    "Write about your wins today",
                    "Reflect on challenges faced",
                    "Document skills learned"
                  ]}
                />
              )}

              {currentStep === 'ai-inbox' && (
                <SectionPanel
                  icon={FiMail}
                  title="AI Career Inbox"
                  description="Personalized recommendations"
                  color="blue"
                  tips={[
                    "Check daily for new insights",
                    "Act on top recommendations",
                    "Save important advice"
                  ]}
                />
              )}

              {currentStep === 'knowledge-base' && (
                <SectionPanel
                  icon={FiBook}
                  title="Knowledge Base"
                  description="Documents & processed insights"
                  color="amber"
                  tips={[
                    "Upload your resume",
                    "Add certifications",
                    "Import learning materials"
                  ]}
                />
              )}

              {currentStep === 'market-insights' && (
                <SectionPanel
                  icon={FiTrendingUp}
                  title="Market Insights"
                  description="Industry trends & analysis"
                  color="teal"
                  tips={[
                    "Track salary trends",
                    "Monitor job demand",
                    "Discover hot skills"
                  ]}
                />
              )}
            </div>

            {/* Panel Footer - Memory Usage */}
            <div data-tour="memory-usage" className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>Memory Usage</span>
                <span>{memoryUsage.used} / {memoryUsage.limit === -1 ? '∞' : memoryUsage.limit}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(memoryUsage.pct, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - No mini navbar */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isPanelOpen ? '350px' : '80px' }}
      >
        {/* Content */}
        <div className="p-6" data-tour={`ai-coach-content-${currentStep}`}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

// Dashboard Panel - Main dashboard content
const DashboardPanel = ({ onNavigate, navigateTo, userProfile, metrics = {} }) => {
  const [currentTip, setCurrentTip] = React.useState(0);
  const tips = [
    { text: "Write a journal entry to boost your streak", action: () => onNavigate('memories'), cta: "Start Writing" },
    { text: "Check your AI inbox for personalized advice", action: () => onNavigate('ai-inbox'), cta: "View Inbox" },
    { text: "Upload a document to build your knowledge base", action: () => navigateTo('/upload'), cta: "Upload Now" },
    { text: "Explore market trends for your target role", action: () => onNavigate('market-insights'), cta: "See Trends" }
  ];

  // Auto-rotate tips
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [tips.length]);

  const firstName = userProfile?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="text-center py-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting},</p>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{firstName}!</h3>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.journalEntries || 0}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Entries</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.documents || 0}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Documents</p>
        </div>
      </div>

      {/* Tips Carousel */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
        <p className="text-[10px] uppercase tracking-wider opacity-80 mb-1">💡 Tip</p>
        <p className="text-sm font-medium mb-3 min-h-[40px]">{tips[currentTip].text}</p>
        <button
          onClick={tips[currentTip].action}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {tips[currentTip].cta} →
        </button>
        {/* Dots */}
        <div className="flex gap-1 mt-3 justify-center">
          {tips.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentTip(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentTip ? 'bg-white w-3' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Explore Sections */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-1">Explore</p>
        <div className="space-y-1.5">
          <ExploreItem
            icon={FiBookmark}
            label="Memories"
            desc="Journal entries"
            color="emerald"
            onClick={() => onNavigate('memories')}
          />
          <ExploreItem
            icon={FiMail}
            label="AI Inbox"
            desc="Recommendations"
            color="blue"
            onClick={() => onNavigate('ai-inbox')}
          />
          <ExploreItem
            icon={FiBook}
            label="Knowledge"
            desc="Your documents"
            color="amber"
            onClick={() => onNavigate('knowledge-base')}
          />
          <ExploreItem
            icon={FiTrendingUp}
            label="Market"
            desc="Industry trends"
            color="teal"
            onClick={() => onNavigate('market-insights')}
          />
        </div>
      </div>
    </div>
  );
};

// Explore Item
const ExploreItem = ({ icon: Icon, label, desc, color, onClick }) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon size={18} />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
      <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">→</span>
    </button>
  );
};

// Section Panel - For other sections
const SectionPanel = ({ icon: Icon, title, description, color, tips = [] }) => {
  const [currentTip, setCurrentTip] = React.useState(0);

  const colorClasses = {
    emerald: { bg: 'from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30', icon: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500' },
    blue: { bg: 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30', icon: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500' },
    amber: { bg: 'from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30', icon: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500' },
    teal: { bg: 'from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30', icon: 'text-teal-600 dark:text-teal-400', accent: 'bg-teal-500' },
  };

  React.useEffect(() => {
    if (tips.length > 0) {
      const timer = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [tips.length]);

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center`}>
          <Icon size={28} className={colors.icon} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className={`${colors.accent} rounded-xl p-4 text-white text-center`}>
          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-2">💡 Quick Tip</p>
          <p className="text-sm font-medium">{tips[currentTip]}</p>
          <div className="flex gap-1 mt-3 justify-center">
            {tips.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentTip ? 'bg-white w-3' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Content will appear in the main area →
        </p>
      </div>
    </div>
  );
};

// Main Dashboard View - The actual main content area
const MainDashboardView = ({ userProfile, onNavigate, navigateTo, metrics = {} }) => {
  const [currentInsight, setCurrentInsight] = React.useState(0);

  const firstName = userProfile?.name?.split(' ')[0] || 'there';
  const targetRole = userProfile?.targetRole || 'your dream role';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const insights = [
    { title: "Skill Gap Analysis", desc: "Based on your target role, you may want to focus on these skills", icon: "🎯", color: "from-purple-500 to-indigo-600" },
    { title: "Market Demand", desc: "Your skills are in high demand in the tech industry right now", icon: "📈", color: "from-emerald-500 to-teal-600" },
    { title: "Career Path", desc: "Here's a suggested roadmap to reach your career goals", icon: "🗺️", color: "from-orange-500 to-red-600" },
    { title: "Learning Tip", desc: "Dedicate 30 minutes daily to learning a new skill", icon: "💡", color: "from-blue-500 to-cyan-600" }
  ];

  // Auto-rotate insights
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [insights.length]);

  // Use real metrics from props
  const stats = [
    {
      label: "Journal Entries",
      value: String(metrics.journalEntries || 0),
      icon: FiBookmark,
      color: "emerald",
      change: metrics.journalEntries > 0 ? `${metrics.journalEntries} total` : "Start writing"
    },
    {
      label: "Documents",
      value: String(metrics.documents || 0),
      icon: FiBook,
      color: "blue",
      change: metrics.documents > 0 ? `${metrics.documents} uploaded` : "Upload your first"
    },
    {
      label: "AI Insights",
      value: String(metrics.recommendations || 0),
      icon: FiMail,
      color: "purple",
      change: metrics.recommendations > 0 ? "New recommendations" : "Coming soon"
    },
    {
      label: "Market Trends",
      value: "5",
      icon: FiTrendingUp,
      color: "teal",
      change: "Updated today"
    }
  ];

  const quickActions = [
    { title: "Write Journal", desc: "Document your career journey", icon: FiBookmark, color: "emerald", action: () => onNavigate('memories') },
    { title: "Upload Resume", desc: "Get AI-powered insights", icon: FiBook, color: "blue", action: () => navigateTo('/upload') },
    { title: "View Recommendations", desc: "Personalized career advice", icon: FiMail, color: "purple", action: () => onNavigate('ai-inbox') },
    { title: "Explore Market", desc: "Industry trends & salaries", icon: FiTrendingUp, color: "teal", action: () => onNavigate('market-insights') }
  ];

  const colorClasses = {
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm mb-1">{greeting},</p>
          <h1 className="text-3xl font-bold mb-2">{firstName}! 👋</h1>
          <p className="text-emerald-100 max-w-xl">
            Welcome to your AI Career Coach. Let's work together to help you become <span className="font-semibold text-white">{targetRole}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('memories')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <FiBookmark size={18} /> Start Journaling
            </button>
            <button
              onClick={() => navigateTo('/upload')}
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <FiBook size={18} /> Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                  <Icon size={20} className={colors.text} />
                </div>
                <span className="text-xs text-gray-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* AI Insights Carousel */}
      <div className={`bg-gradient-to-r ${insights[currentInsight].color} rounded-2xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">{insights[currentInsight].icon}</span>
            <div className="flex gap-1.5">
              {insights.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentInsight(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentInsight ? 'bg-white w-6' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">{insights[currentInsight].title}</h3>
          <p className="text-white/80">{insights[currentInsight].desc}</p>
          <button className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Learn More →
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            const colors = colorClasses[action.color];
            return (
              <button
                key={idx}
                onClick={action.action}
                className={`bg-white dark:bg-gray-800 rounded-xl p-5 border ${colors.border} hover:shadow-lg transition-all text-left group`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={colors.text} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors text-xl">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity / Getting Started */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">1</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">Upload your resume</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get AI-powered analysis and suggestions</p>
            </div>
            <button onClick={() => navigateTo('/upload')} className="text-emerald-600 dark:text-emerald-400 font-medium text-sm hover:underline">Start →</button>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">2</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">Set your career goals</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tell us where you want to be</p>
            </div>
            <button onClick={() => navigateTo('/settings?tab=profile')} className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">Set Goals →</button>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">3</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">Write your first journal entry</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Document your career journey</p>
            </div>
            <button onClick={() => onNavigate('memories')} className="text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">Write →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAICareerCoachV2;
