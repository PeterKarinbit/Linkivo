import React, { useState } from 'react';
import { FiArrowRight, FiArrowLeft, FiTarget, FiClock, FiTrendingUp, FiCheck, FiUser } from 'react-icons/fi';
import { apiPost } from '../../services/apiBase';

const AGE_GROUPS = [
  { value: '15-17', label: '15-17', desc: 'High school, exploring interests' },
  { value: '18-24', label: '18-24', desc: 'Early career, exploring options' },
  { value: '25-34', label: '25-34', desc: 'Building career foundation' },
  { value: '35-44', label: '35-44', desc: 'Career growth & advancement' },
  { value: '45-54', label: '45-54', desc: 'Senior roles & expertise' },
  { value: '55+', label: '55+', desc: 'Leadership & mentorship' }
];

// Age-appropriate status options
const CURRENT_STATUS_BY_AGE = {
  '15-17': [
    { value: 'high_school', label: 'High School Student', desc: 'Currently in secondary school' },
    { value: 'high_school_graduating', label: 'Graduating Soon', desc: 'Finishing high school this year' },
    { value: 'exploring', label: 'Exploring Options', desc: 'Figuring out what interests me' },
    { value: 'intern_part_time', label: 'Part-time/Intern', desc: 'Already doing some work experience' }
  ],
  '18-24': [
    { value: 'university', label: 'University Student', desc: 'Currently pursuing a degree' },
    { value: 'fresh_graduate', label: 'Fresh Graduate', desc: 'Recently finished education' },
    { value: 'entry', label: 'Entry Level', desc: 'Just starting my career (0-2 years)' },
    { value: 'career_switcher', label: 'Career Switcher', desc: 'Changing to a new field' },
    { value: 'self_taught', label: 'Self-Taught', desc: 'Learning on my own' }
  ],
  '25-34': [
    { value: 'entry', label: 'Entry Level', desc: 'Starting out (0-2 years experience)' },
    { value: 'junior', label: 'Junior', desc: 'Building experience (2-4 years)' },
    { value: 'mid', label: 'Mid-Level', desc: 'Experienced professional (4-7 years)' },
    { value: 'career_switcher', label: 'Career Switcher', desc: 'Transitioning to a new field' }
  ],
  '35-44': [
    { value: 'mid', label: 'Mid-Level', desc: 'Experienced professional (4-7 years)' },
    { value: 'senior', label: 'Senior', desc: 'Expert in your field (7+ years)' },
    { value: 'lead', label: 'Lead/Manager', desc: 'Leading teams or projects' },
    { value: 'career_switcher', label: 'Career Switcher', desc: 'Transitioning to a new field' }
  ],
  '45-54': [
    { value: 'senior', label: 'Senior', desc: 'Expert in your field (7+ years)' },
    { value: 'lead', label: 'Lead/Manager', desc: 'Leading teams or projects' },
    { value: 'executive', label: 'Executive/Director', desc: 'Senior leadership role' },
    { value: 'consultant', label: 'Consultant/Advisor', desc: 'Independent expert' },
    { value: 'career_switcher', label: 'Career Pivot', desc: 'Exploring a new direction' }
  ],
  '55+': [
    { value: 'senior', label: 'Senior Professional', desc: 'Experienced expert' },
    { value: 'executive', label: 'Executive/Leader', desc: 'Senior leadership role' },
    { value: 'consultant', label: 'Consultant/Advisor', desc: 'Independent expert' },
    { value: 'mentor', label: 'Mentor/Coach', desc: 'Guiding others' },
    { value: 'second_career', label: 'Second Career', desc: 'Starting something new' }
  ]
};

// Fallback for unspecified age
const DEFAULT_CAREER_LEVELS = [
  { value: 'entry', label: 'Entry Level', desc: 'Just starting out (0-2 years)' },
  { value: 'junior', label: 'Junior', desc: 'Some experience (2-4 years)' },
  { value: 'mid', label: 'Mid-Level', desc: 'Experienced professional (4-7 years)' },
  { value: 'senior', label: 'Senior', desc: 'Expert in your field (7+ years)' },
  { value: 'lead', label: 'Lead/Manager', desc: 'Leading teams or projects' }
];

const WHY_OPTIONS = [
  { value: 'growth', label: 'Career Growth', desc: 'Advance to the next level' },
  { value: 'salary', label: 'Higher Salary', desc: 'Increase earning potential' },
  { value: 'impact', label: 'More Impact', desc: 'Make a bigger difference' },
  { value: 'passion', label: 'Follow Passion', desc: 'Pursue what I love' },
  { value: 'stability', label: 'Job Security', desc: 'More stable opportunities' },
  { value: 'learning', label: 'Learn New Skills', desc: 'Expand my knowledge' },
  { value: 'leadership', label: 'Leadership Role', desc: 'Lead teams and projects' },
  { value: 'flexibility', label: 'Work-Life Balance', desc: 'Better work flexibility' }
];

const HOURS_OPTIONS = [
  { value: 5, label: '5 hours/week', desc: 'Light commitment' },
  { value: 10, label: '10 hours/week', desc: 'Moderate commitment' },
  { value: 15, label: '15 hours/week', desc: 'Serious commitment' },
  { value: 20, label: '20+ hours/week', desc: 'Intensive commitment' }
];

function CareerInboxOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageGroup: '',
    currentLevel: '',
    targetRole: '',
    whyReasons: [],
    hoursPerWeek: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleWhyReason = (value) => {
    setFormData(prev => ({
      ...prev,
      whyReasons: prev.whyReasons.includes(value)
        ? prev.whyReasons.filter(r => r !== value)
        : [...prev.whyReasons, value]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.ageGroup !== '';
      case 2: return formData.currentLevel !== '';
      case 3: return formData.targetRole.trim().length >= 3;
      case 4: return formData.whyReasons.length > 0;
      case 5: return formData.hoursPerWeek !== null;
      default: return false;
    }
  };

  const MAX_RETRIES = 3;

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // Step 1: save persona assessment
      const assessmentPayload = {
        ageGroup: formData.ageGroup,
        currentLevel: formData.currentLevel,
        targetRole: formData.targetRole,
        whyReasons: formData.whyReasons,
        hoursPerWeek: formData.hoursPerWeek
      };

      const assessmentResponse = await apiPost(
        '/enhanced-ai-career-coach/assessment',
        assessmentPayload,
        { timeout: 20000 }
      );

      const assessmentData = assessmentResponse?.data || assessmentResponse;
      console.log('[Onboarding] Assessment saved:', assessmentData);

      // Step 2: Trigger roadmap generation (background)
      await apiPost(
        '/enhanced-ai-career-coach/roadmap',
        {
          reason: 'initial_assessment',
          timeBudget: formData.hoursPerWeek
        }
      );

      console.log('[Onboarding] Roadmap generation trigger sent.');

      // Proceed immediately to dashboard/roadmap view
      // The parent component will handle showing a loading state or polling
      onComplete({
        roadmap: null, // Will be fetched via polling
        hasOnboarding: true,
        isGenerating: true,
        persona: assessmentData?.persona,
        profile: assessmentData?.profile || {
          currentLevel: formData.currentLevel,
          targetRole: formData.targetRole,
          whyReasons: formData.whyReasons,
          hoursPerWeek: formData.hoursPerWeek
        }
      });

    } catch (error) {
      console.error('Onboarding error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save settings. Please try again.';
      alert(errorMessage);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Step {step} of 5</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Age Group */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What's your age group?</h2>
              <p className="text-gray-600 dark:text-gray-400">This helps us tailor recommendations for your career stage</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {AGE_GROUPS.map((age) => (
                <button
                  key={age.value}
                  onClick={() => setFormData(prev => ({ ...prev, ageGroup: age.value, currentLevel: '' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${formData.ageGroup === age.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{age.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{age.desc}</p>
                    </div>
                    {formData.ageGroup === age.value && (
                      <FiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Current Level */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTarget className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What's your current status?</h2>
              <p className="text-gray-600 dark:text-gray-400">Help us understand where you are right now</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(CURRENT_STATUS_BY_AGE[formData.ageGroup] || DEFAULT_CAREER_LEVELS).map((level) => (
                <button
                  key={level.value}
                  onClick={() => setFormData(prev => ({ ...prev, currentLevel: level.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${formData.currentLevel === level.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{level.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{level.desc}</p>
                    </div>
                    {formData.currentLevel === level.value && (
                      <FiCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Target Role */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What role do you aspire to?</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us your target position or career goal</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Be specific - this helps us create a personalized roadmap
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Why */}
        {step === 4 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTarget className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Why this role?</h2>
              <p className="text-gray-600 dark:text-gray-400">Select all that apply (you can choose multiple)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {WHY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleWhyReason(option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${formData.whyReasons.includes(option.value)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{option.label}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.desc}</p>
                    </div>
                    {formData.whyReasons.includes(option.value) && (
                      <FiCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Hours */}
        {step === 5 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How much time can you commit?</h2>
              <p className="text-gray-600 dark:text-gray-400">This helps us create a realistic roadmap</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {HOURS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, hoursPerWeek: option.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${formData.hoursPerWeek === option.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{option.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.desc}</p>
                    </div>
                    {formData.hoursPerWeek === option.value && (
                      <FiCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <FiArrowRight className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Creating Roadmap...' : 'Start My Journey'}
              <FiCheck className="ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Spinning gradient ring */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 animate-spin" />
              {/* Center icon */}
              <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <FiTarget className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Please wait as we curate your roadmap...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our AI is analyzing your goals and creating a personalized career path for you.
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CareerInboxOnboarding;




