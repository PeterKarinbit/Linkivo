import React, { useState, useEffect } from 'react';
import api from '../services/apiBase';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import WelcomeSequence from '../components/AICareerCoach/WelcomeSequence';
import ResumeUpload from '../components/AICareerCoach/ResumeUpload';
import CareerJournal from '../components/AICareerCoach/CareerJournal';
import EnhancedGoalSetting from '../components/AICareerCoach/EnhancedGoalSetting';
import TermsConsent from '../components/AICareerCoach/TermsConsent';
import CareerMemoriesWidget from '../components/AICareerCoach/CareerMemoriesWidget';
import Ivo from '../components/AICareerCoach/CATDevChat';
import CanvaSidebar from '../components/AICareerCoach/CanvaSidebar';

// Missing Imports
import EnhancedMemoriesJournal from '../components/AICareerCoach/EnhancedMemoriesJournal';
import SecureKnowledgeBase from '../components/AICareerCoach/SecureKnowledgeBase';
import MarketInsights from '../components/AICareerCoach/MarketInsights';
import ProactiveRecommendations from '../components/AICareerCoach/ProactiveRecommendations';
import DashboardView from '../components/AICareerCoach/DashboardView';

// MCP services
import { internalMCPServer } from '../services/internalMCPServer';
import { CareerAssessmentAgent } from '../services/aiAgents/CareerAssessmentAgent';
import { RecommendationAgent } from '../services/aiAgents/RecommendationAgent';

function EnhancedAICareerCoach() {
  const [currentStep, setCurrentStep] = useState(() => {
    const completed = localStorage.getItem('ai-career-coach-onboarding');
    return completed === 'true' ? 'main-dashboard' : 'checking'; // Default to Dashboard
  });
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState({
    resumeData: null,
    journalEntry: '',
    careerGoals: null,
    hasCompletedOnboarding: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveRecommendations, setProactiveRecommendations] = useState([]);
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, limit: 0, pct: 0 });

  // AI collaboration state
  const [mcpServer] = useState(() => internalMCPServer);
  const [aiAgents, setAiAgents] = useState({});
  const [aiCollaborationEnabled, setAiCollaborationEnabled] = useState(true);

  useEffect(() => {
    const initializeAIAgents = async () => {
      try {
        const careerAgent = new CareerAssessmentAgent();
        const recommendationAgent = new RecommendationAgent();
        careerAgent.initialize(mcpServer);
        recommendationAgent.initialize(mcpServer);
        setAiAgents({ career: careerAgent, recommendation: recommendationAgent });
      } catch (error) {
        console.error('Failed to initialize AI agents:', error);
        setAiCollaborationEnabled(false);
      }
    };

    if (aiCollaborationEnabled) {
      initializeAIAgents();
    }
  }, [aiCollaborationEnabled, mcpServer]);

  useEffect(() => {
    const completed = localStorage.getItem('ai-career-coach-onboarding');
    if (completed === 'true') {
      if (currentStep === 'checking') {
        setCurrentStep('main-dashboard');
      }
      setIsCheckingOnboarding(false);
    } else {
      navigate('/user-onboarding');
    }
  }, [navigate, currentStep]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const hasOnboarded = localStorage.getItem('ai-career-coach-onboarding') === 'true';
    const onboardingSteps = new Set(['welcome', 'resume-upload', 'career-journal', 'goal-setting', 'terms-consent']);
    const validSteps = new Set(['memories', 'journal', 'main-dashboard', 'knowledge-base', 'market-insights', 'career-inbox', 'welcome', 'resume-upload', 'career-journal', 'goal-setting', 'terms-consent']);

    if (hasOnboarded && tab && onboardingSteps.has(tab)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', 'career-inbox');
      setSearchParams(newParams, { replace: true });
      setCurrentStep('career-inbox');
      return;
    }

    if (tab && tab !== currentStep && validSteps.has(tab)) {
      setCurrentStep(tab);
    } else if (!tab && currentStep !== 'checking') {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', currentStep);
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, currentStep, setSearchParams]);

  useEffect(() => {
    if (isAuthenticated && currentStep === 'main-dashboard') {
      loadProactiveRecommendations();
      loadUsage();
    }
  }, [isAuthenticated, currentStep]);

  const navigateToStep = (step) => {
    const validSteps = new Set([
      'memories', 'journal', 'main-dashboard', 'knowledge-base',
      'career-inbox', 'welcome', 'resume-upload',
      'career-journal', 'goal-setting', 'terms-consent',
      'market-insights'
    ]);

    if (validSteps.has(step) && step !== currentStep) {
      setCurrentStep(step);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', step);
      setSearchParams(newParams, { replace: true });
    }
  };

  const loadProactiveRecommendations = async () => {
    try {
      setIsLoading(true);
      // Try to fetch from API first
      const resp = await api.get('/enhanced-ai-career-coach/recommendations');

      if (resp.success && resp.data?.recommendations) {
        setProactiveRecommendations(resp.data.recommendations);
        return;
      }

      // Fallback: Try AI agents if enabled
      if (aiCollaborationEnabled && aiAgents.career && aiAgents.recommendation) {
        // AI agents would generate recommendations here
        // For now, set empty array if no API data
        setProactiveRecommendations([]);
      } else {
        setProactiveRecommendations([]);
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
      const resp = await api.get('/subscription/usage');
      if (resp.success && resp.data) {
        const cm = resp.data.careerMemories;
        if (cm) {
          const pct = cm.limit === -1 ? 0 : Math.min(100, Math.round((cm.used / Math.max(1, cm.limit)) * 100));
          setMemoryUsage({ used: cm.used ?? 0, limit: cm.limit ?? 0, pct });
        }
      }
    } catch (_) { }
  };

  const handleStepComplete = (stepData) => {
    setUserData(prev => ({ ...prev, ...stepData }));
    switch (currentStep) {
      case 'welcome': setCurrentStep('resume-upload'); break;
      case 'resume-upload': setCurrentStep('career-journal'); break;
      case 'career-journal': setCurrentStep('goal-setting'); break;
      case 'goal-setting': setCurrentStep('terms-consent'); break;
      case 'terms-consent':
        localStorage.setItem('ai-career-coach-onboarding', 'true');
        setCurrentStep('main-dashboard');
        break;
      default: break;
    }
  };

  // Reordered: Dashboard First, then Inbox
  const navigationItems = [
    { id: 'main-dashboard', label: 'Dashboard', icon: <i className="fa-solid fa-house"></i> },
    { id: 'career-inbox', label: 'Inbox', icon: <i className="fa-solid fa-inbox"></i> },
    { id: 'memories', label: 'Career Memories', icon: <i className="fa-solid fa-brain"></i> },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: <i className="fa-solid fa-book"></i> },
    { id: 'market-insights', label: 'Market Insights', icon: <i className="fa-solid fa-chart-line"></i> }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome': return <WelcomeSequence onComplete={handleStepComplete} />;
      case 'resume-upload': return <ResumeUpload onComplete={handleStepComplete} />;
      case 'career-journal': return <CareerJournal onComplete={handleStepComplete} />;
      case 'goal-setting': return <EnhancedGoalSetting onComplete={handleStepComplete} />;
      case 'terms-consent': return <TermsConsent onComplete={handleStepComplete} />;

      case 'memories': return <EnhancedMemoriesJournal />;
      case 'knowledge-base': return <SecureKnowledgeBase />;
      case 'market-insights': return <MarketInsights />;
      case 'career-inbox': return <ProactiveRecommendations />; // Inbox renders Recommendations

      case 'main-dashboard':
        return (
          <DashboardView
            navigateToStep={navigateToStep}
            proactiveRecommendations={proactiveRecommendations}
            memoryUsage={memoryUsage}
          />
        );
      default: return null;
    }
  };

  const renderCurrentStep = () => {
    if (currentStep === 'checking' || isCheckingOnboarding) return null;

    if (['welcome', 'resume-upload', 'career-journal', 'goal-setting', 'terms-consent'].includes(currentStep)) {
      return renderStepContent();
    }

    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <div className="fixed left-0 top-0 h-full z-50">
          <CanvaSidebar
            navigationItems={navigationItems}
            activeTab={currentStep}
            onTabChange={navigateToStep}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            onNavigate={navigateToStep}
          />
        </div>
        <div
          className={`flex-1 overflow-y-auto h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-[352px]' : 'ml-[72px]'
            }`}
        >
          <div className="p-0">
            {renderStepContent()}
          </div>
        </div>
      </div>
    );
  };

  return renderCurrentStep();
}

export default EnhancedAICareerCoach;
