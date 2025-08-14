import React, { useState } from 'react';
import { FaDownload, FaEnvelope, FaEdit, FaEye, FaEyeSlash } from 'react-icons/fa';

const AnalysisResults = ({
  skillGapResults,
  refactoredResume,
  coverLetter,
  onGenerateCoverLetter,
  onRefactorResume,
  onDownloadPDF,
  onSendApplication,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showResume, setShowResume] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [applicationData, setApplicationData] = useState({
    recipientEmail: '',
    recipientName: '',
    recipientTitle: '',
    autoApply: false
  });

  const tabs = [
    { id: 'analysis', label: 'Skill Analysis', icon: '📊' },
    { id: 'resume', label: 'AI Resume', icon: '📄' },
    { id: 'cover-letter', label: 'Cover Letter', icon: '✉️' },
    { id: 'apply', label: 'Apply Now', icon: '🚀' }
  ];

  const handleSendApplication = () => {
    if (!applicationData.recipientEmail) {
      alert('Please enter recipient email');
      return;
    }
    onSendApplication(applicationData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Skill Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Skill Match</h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {skillGapResults?.skillMatchPercentage || 0}%
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200">Matching Skills</h3>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {skillGapResults?.matchingSkills?.length || 0}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Missing Skills</h3>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {skillGapResults?.missingSkills?.length || 0}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Matching Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skillGapResults?.matchingSkills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skillGapResults?.missingSkills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Improvement Suggestions</h3>
              <ul className="space-y-2">
                {skillGapResults?.improvementSuggestions?.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AI Resume Tab */}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Refactored Resume</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResume(!showResume)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {showResume ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                  {showResume ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => onDownloadPDF('resume')}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
                >
                  <FaDownload className="mr-1" />
                  Download PDF
                </button>
              </div>
            </div>

            {showResume && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">
                  {refactoredResume || 'No refactored resume available. Click "Refactor Resume" to generate one.'}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onRefactorResume}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refactoring...' : 'Refactor Resume'}
              </button>
            </div>
          </div>
        )}

        {/* Cover Letter Tab */}
        {activeTab === 'cover-letter' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Generated Cover Letter</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCoverLetter(!showCoverLetter)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {showCoverLetter ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                  {showCoverLetter ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => onDownloadPDF('cover-letter')}
                  className="flex items-center px-3 py-1 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-700"
                >
                  <FaDownload className="mr-1" />
                  Download PDF
                </button>
              </div>
            </div>

            {showCoverLetter && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">
                  {coverLetter || 'No cover letter available. Click "Generate Cover Letter" to create one.'}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onGenerateCoverLetter}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
          </div>
        )}

        {/* Apply Now Tab */}
        {activeTab === 'apply' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Application Options</h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Choose how you'd like to apply for this position. You can send an email application directly or get a link to apply manually.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Application */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                  <FaEnvelope className="mr-2 text-blue-500" />
                  Email Application
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={applicationData.recipientEmail}
                      onChange={(e) => setApplicationData({...applicationData, recipientEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="hr@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={applicationData.recipientName}
                      onChange={(e) => setApplicationData({...applicationData, recipientName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Hiring Manager"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipient Title
                    </label>
                    <input
                      type="text"
                      value={applicationData.recipientTitle}
                      onChange={(e) => setApplicationData({...applicationData, recipientTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                      placeholder="HR Manager"
                    />
                  </div>
                  
                  <button
                    onClick={handleSendApplication}
                    disabled={loading || !applicationData.recipientEmail}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Application'}
                  </button>
                </div>
              </div>

              {/* Manual Application */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                  <FaEdit className="mr-2 text-green-500" />
                  Manual Application
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Apply directly through the company's website or job portal.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => window.open(skillGapResults?.jobUrl, '_blank')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Open Job Link
                  </button>
                  
                  <button
                    onClick={() => onDownloadPDF('resume')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Download Resume PDF
                  </button>
                  
                  <button
                    onClick={() => onDownloadPDF('cover-letter')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Download Cover Letter PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults; 