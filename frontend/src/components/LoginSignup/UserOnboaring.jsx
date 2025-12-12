import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WelcomeSequence from '../AICareerCoach/WelcomeSequence';
import CareerJournal from '../AICareerCoach/CareerJournal';
import EnhancedGoalSetting from '../AICareerCoach/EnhancedGoalSetting';
import KnowledgeBaseQuestions from '../AICareerCoach/KnowledgeBaseQuestions';
import TermsConsent from '../AICareerCoach/TermsConsent';
import { FaFileUpload, FaArrowRight } from 'react-icons/fa';
import { userService } from '../../services/userService';

function UserOnboaring() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState('welcome');

  // Initialize step from URL or localStorage
  useEffect(() => {
    const stepFromUrl = searchParams.get('step');
    if (stepFromUrl) {
      setCurrentStep(stepFromUrl);
    } else {
      const savedStep = localStorage.getItem('ivo-onboarding-step');
      if (savedStep) {
        setCurrentStep(savedStep);
      }
    }
  }, [searchParams]);

  // Update URL and localStorage when step changes
  const handleStepChange = (step) => {
    setCurrentStep(step);
    localStorage.setItem('ivo-onboarding-step', step);
    setSearchParams({ step });
  };

  const handleWelcomeComplete = (data) => {
    // Data is already saved by WelcomeSequence
    handleStepChange('resume');
  };

  const handleResumeChoice = (choice) => {
    if (choice === 'upload') {
      // Redirect to upload page with return URL pointing back to journal step
      window.location.href = '/upload?type=resume&from=onboarding&returnTo=/user-onboarding?step=journal';
    } else {
      handleStepChange('journal');
    }
  };

  const handleJournalComplete = (data) => {
    handleStepChange('goals');
  };

  const handleGoalsComplete = (data) => {
    handleStepChange('questions');
  };

  const handleQuestionsComplete = (data) => {
    handleStepChange('consent');
  };

  const handleConsentComplete = async (data) => {
    try {
      // Save doneOnboarding flag to backend so it persists across logins
      await userService.updateUserProfile({ doneOnboarding: true });
      console.log('[UserOnboarding] Marked onboarding as complete in backend');
    } catch (error) {
      console.error('[UserOnboarding] Failed to save onboarding status to backend:', error);
      // Continue anyway - don't block completion
    }

    // Clear onboarding state
    localStorage.removeItem('ivo-onboarding-step');
    localStorage.removeItem('ivo-onboarding-name');
    localStorage.removeItem('ivo-onboarding-phase');
    localStorage.removeItem('ivo-onboarding-archetype');

    // Mark as fully onboarded in localStorage (for EnhancedAICareerCoach check)
    localStorage.setItem('ai-career-coach-onboarding', 'true');
    // Trigger post-onboarding tour on dashboard/home
    localStorage.setItem('firstLogin', 'true');
    if (!localStorage.getItem('userCreatedAt')) {
      localStorage.setItem('userCreatedAt', String(Date.now()));
    }

    // Navigate to home/dashboard where the tour runs
    navigate('/home-logged-in');
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeSequence onComplete={handleWelcomeComplete} />;

      case 'resume':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FaFileUpload className="text-3xl text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Upload Your Resume?
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Uploading your resume helps Ivo personalize your career insights immediately.
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">Important Heads Up</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Please upload a <strong>structured resume</strong> (PDF or DOCX). Simple text files or images might not be analyzed correctly. A well-structured resume ensures a smooth experience in the Career Hub.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleResumeChoice('skip')}
                  className="px-8 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Skip for now
                </button>

                <button
                  onClick={() => handleResumeChoice('upload')}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <FaFileUpload />
                  Upload Resume
                </button>
              </div>
            </div>
          </div>
        );

      case 'journal':
        return <CareerJournal onComplete={handleJournalComplete} />;

      case 'goals':
        return <EnhancedGoalSetting onComplete={handleGoalsComplete} />;

      case 'questions':
        return <KnowledgeBaseQuestions onComplete={handleQuestionsComplete} />;

      case 'consent':
        return <TermsConsent onComplete={handleConsentComplete} />;

      default:
        return <WelcomeSequence onComplete={handleWelcomeComplete} />;
    }
  };

  return (
    <div className="user-onboarding-flow">
      {renderStep()}
    </div>
  );
}

export default UserOnboaring;
