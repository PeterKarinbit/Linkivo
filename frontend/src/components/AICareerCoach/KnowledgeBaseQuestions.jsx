import React, { useState } from 'react';

function KnowledgeBaseQuestions({ onComplete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showExplanation, setShowExplanation] = useState({});
  const [answers, setAnswers] = useState({
    // Page 1 Questions
    q1: 50, // How important is work-life balance to you?
    q2: 50, // How comfortable are you with taking on leadership roles?
    q3: 50, // How much do you value continuous learning and skill development?
    q4: 50, // How important is salary/compensation in your career decisions?
    q5: 50, // How much do you enjoy working in a team vs. independently?
    
    // Page 2 Questions
    q6: 50, // How important is company culture and values alignment?
    q7: 50, // How comfortable are you with job changes and career pivots?
    q8: 50, // How much do you value mentorship and professional guidance?
    q9: 50, // How important is remote work flexibility to you?
    q10: 50, // How much do you prioritize career growth over job stability?
  });

  const questions = {
    page1: [
      {
        id: 'q1',
        question: 'How important is work-life balance to you?',
        labels: { left: 'Not Important', right: 'Very Important' },
        explanation: 'Work-life balance means having enough time for both your job and personal life. This helps us understand if you prefer flexible schedules or are okay with longer work hours.'
      },
      {
        id: 'q2',
        question: 'How comfortable are you with taking on leadership roles?',
        labels: { left: 'Not Comfortable', right: 'Very Comfortable' },
        explanation: 'Leadership roles involve managing teams, making decisions, and guiding others. This helps us understand if you want to move into management positions or prefer individual contributor roles.'
      },
      {
        id: 'q3',
        question: 'How much do you value continuous learning and skill development?',
        labels: { left: 'Low Value', right: 'High Value' },
        explanation: 'Continuous learning means regularly learning new skills, taking courses, or staying updated with industry trends. This helps us recommend learning opportunities that match your interests.'
      },
      {
        id: 'q4',
        question: 'How important is salary/compensation in your career decisions?',
        labels: { left: 'Not Important', right: 'Very Important' },
        explanation: 'This measures how much salary and benefits matter when choosing jobs. Some people prioritize pay, while others value other factors like work culture or growth opportunities more.'
      },
      {
        id: 'q5',
        question: 'How much do you enjoy working in a team vs. independently?',
        labels: { left: 'Prefer Independent', right: 'Prefer Team' },
        explanation: 'Team work means collaborating with others on projects, while independent work means doing tasks on your own. This helps us understand your preferred work style.'
      }
    ],
    page2: [
      {
        id: 'q6',
        question: 'How important is company culture and values alignment?',
        labels: { left: 'Not Important', right: 'Very Important' },
        explanation: 'Company culture includes the work environment, values, and how employees are treated. This helps us find companies that match your values and work style preferences.'
      },
      {
        id: 'q7',
        question: 'How comfortable are you with job changes and career pivots?',
        labels: { left: 'Not Comfortable', right: 'Very Comfortable' },
        explanation: 'Career pivots mean switching to different roles, industries, or career paths. This helps us understand if you prefer stability in one role or are open to exploring new opportunities.'
      },
      {
        id: 'q8',
        question: 'How much do you value mentorship and professional guidance?',
        labels: { left: 'Low Value', right: 'High Value' },
        explanation: 'Mentorship means having experienced professionals guide and advise you in your career. This helps us recommend mentorship programs or networking opportunities.'
      },
      {
        id: 'q9',
        question: 'How important is remote work flexibility to you?',
        labels: { left: 'Not Important', right: 'Very Important' },
        explanation: 'Remote work means working from home or anywhere outside the office. This helps us find job opportunities that offer the flexibility you need.'
      },
      {
        id: 'q10',
        question: 'How much do you prioritize career growth over job stability?',
        labels: { left: 'Prefer Stability', right: 'Prefer Growth' },
        explanation: 'Career growth means advancing to higher positions and taking on more challenges. Job stability means staying in a secure position. This helps us balance opportunities with security.'
      }
    ]
  };

  const handleSliderChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const getSliderColor = (value) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSliderLabel = (value) => {
    if (value >= 80) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 40) return 'Neutral';
    if (value >= 20) return 'Low';
    return 'Very Low';
  };

  const handleSubmit = async () => {
    try {
      // Format answers for backend
      const formattedAnswers = Object.keys(answers).map((key, index) => ({
        questionId: key,
        questionNumber: index + 1,
        question: questions.page1.find(q => q.id === key)?.question || 
                  questions.page2.find(q => q.id === key)?.question || '',
        answer: answers[key],
        answerLabel: getSliderLabel(answers[key])
      }));

      // Send to backend to build knowledge base
      const baseOrigin = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseOrigin}/api/v1/enhanced-ai-career-coach/knowledge-base/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      if (!response.ok) {
        throw new Error('Failed to save answers');
      }

      onComplete({ knowledgeBaseAnswers: formattedAnswers });
    } catch (error) {
      console.error('Error saving knowledge base answers:', error);
      alert('Failed to save answers. Please try again.');
    }
  };

  const currentQuestions = currentPage === 1 ? questions.page1 : questions.page2;
  const allAnswered = currentQuestions.every(q => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Help Us Understand You Better
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            These questions help build your personalized knowledge base
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-2 w-12 rounded-full ${currentPage === 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className={`h-2 w-12 rounded-full ${currentPage === 2 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Page {currentPage} of 2
          </p>
        </div>

        {/* Questions */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 md:p-10 mb-8">
          <div className="space-y-8">
            {currentQuestions.map((q, index) => (
              <div key={q.id} className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-lg font-semibold text-gray-900 dark:text-white">
                        {index + 1 + (currentPage - 1) * 5}. {q.question}
                      </label>
                      {q.explanation && (
                        <button
                          type="button"
                          onClick={() => setShowExplanation(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="More information"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {showExplanation[q.id] && q.explanation && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full whitespace-nowrap">
                    {answers[q.id]}%
                  </span>
                </div>
                
                {/* Slider */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={answers[q.id]}
                      onChange={(e) => handleSliderChange(q.id, e.target.value)}
                      className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, ${getSliderColor(answers[q.id])} 0%, ${getSliderColor(answers[q.id])} ${answers[q.id]}%, #e5e7eb ${answers[q.id]}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Labels */}
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{q.labels.left}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {getSliderLabel(answers[q.id])}
                    </span>
                    <span>{q.labels.right}</span>
                  </div>
                  
                  {/* Degree Bar Visualization */}
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i * 10 < answers[q.id]
                            ? getSliderColor(answers[q.id])
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentPage === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            Previous
          </button>
          
          {currentPage === 1 ? (
            <button
              onClick={() => setCurrentPage(2)}
              disabled={!allAnswered}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !allAnswered
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              Next Page
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-8 py-3 rounded-lg font-medium transition-all ${
                !allAnswered
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

export default KnowledgeBaseQuestions;

