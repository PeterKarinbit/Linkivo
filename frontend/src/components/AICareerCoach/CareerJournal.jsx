import React, { useState, useRef } from 'react';
import { aiCoachService } from '../../services/aiCoachService';

function CareerJournal({ onComplete, onSkip }) {
  const [journalEntry, setJournalEntry] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const textareaRef = useRef(null);

  const minWords = 5;
  const maxWords = 2000;
  const wordCount = journalEntry.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleTextChange = (e) => {
    setJournalEntry(e.target.value);
    setIsDraft(true);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('career-journal-draft', journalEntry);
    setIsDraft(false);
    // Show a brief confirmation
    const button = document.querySelector('.save-draft-btn');
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.classList.add('text-green-500');
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('text-green-500');
    }, 2000);
  };

  const handleContinue = async () => {
    if (wordCount === 0) {
      onComplete({ skipped: true });
      return;
    }

    if (wordCount >= minWords) {
      try {
        console.log('Saving journal entry...');
        // Mark as onboarding source for proper extraction and storage
        const entry = await aiCoachService.createJournalEntry(
          journalEntry,
          new Date(),
          ['onboarding'] // Tags to indicate this is from onboarding
        );
        console.log('Journal entry saved:', entry);
        localStorage.removeItem('career-journal-draft');
        onComplete({ journalEntry: entry });
      } catch (e) {
        console.error('Failed to save journal entry:', e);
        // If 401, it might be auth, but we can't easily fix that from here without re-login.
        // Fallback: Skip saving if it really fails, so user doesn't get stuck?
        // No, show error.
        alert('Failed to save entry. Please ensure you are logged in or try again.');
      }
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('career-journal-draft');
    if (draft) {
      setJournalEntry(draft);
      setIsDraft(false);
    }
  };

  // Load draft on component mount
  React.useEffect(() => {
    loadDraft();
    // Debounced autosave every 1s of inactivity
    let timerId;
    const onChange = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        try { localStorage.setItem('career-journal-draft', journalEntry); } catch (_) { }
      }, 1000);
    };
    const beforeUnload = () => {
      try { localStorage.setItem('career-journal-draft', journalEntry); } catch (_) { }
    };
    window.addEventListener('beforeunload', beforeUnload);
    const unsubscribe = () => {
      clearTimeout(timerId);
      window.removeEventListener('beforeunload', beforeUnload);
    };
    return unsubscribe;
  }, []);

  // Track online/offline status
  React.useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const isWordCountValid = wordCount >= minWords && wordCount <= maxWords;
  const isOverLimit = wordCount > maxWords;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-journal-whills text-2xl text-white"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Mind telling me how your experience has been in the job search?
          </h2>
          <p className="text-gray-600">
            Share your frustrations, wins, challenges, and career journey so far
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Journal Entry Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold text-gray-800">
                Your Career Memories Entry
              </label>
              <div className="flex items-center space-x-4">
                {isDraft && (
                  <button
                    onClick={handleSaveDraft}
                    className="save-draft-btn text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Save as Draft
                  </button>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {isOnline ? 'Online' : 'Offline (drafts autosave locally)'}
                </span>
                <span className={`text-sm font-medium ${isOverLimit ? 'text-red-500' :
                  isWordCountValid ? 'text-green-500' : 'text-gray-500'
                  }`}>
                  {wordCount} / {maxWords} words
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={journalEntry}
                onChange={handleTextChange}
                onFocus={() => setIsExpanded(true)}
                placeholder="Share your frustrations, wins, challenges, and career journey so far..."
                className={`w-full p-4 border-2 rounded-xl resize-none transition-all duration-200 ${isExpanded ? 'min-h-[400px]' : 'min-h-[200px]'
                  } ${isOverLimit
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-green-500'
                  } bg-white text-gray-800 placeholder-gray-500`}
                style={{ minHeight: isExpanded ? '400px' : '200px' }}
              />

              {/* Word count indicator */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {wordCount < minWords && wordCount > 0 && (
                  <span className="text-orange-500">
                    {minWords - wordCount} more words recommended
                  </span>
                )}
                {isOverLimit && (
                  <span className="text-red-500">
                    {wordCount - maxWords} words over limit
                  </span>
                )}
              </div>
            </div>

            {/* Character limit warning */}
            {isOverLimit && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Please keep your entry under {maxWords} words for better analysis.
                </p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              <i className="fas fa-lightbulb mr-2"></i>
              What to include:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your current job search challenges and frustrations</li>
              <li>• Recent wins or positive experiences</li>
              <li>• Skills you're trying to develop</li>
              <li>• Career goals and aspirations</li>
              <li>• Any specific areas where you need guidance</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => onSkip ? onSkip() : onComplete({ skipped: true })}
              className="px-8 py-3 rounded-full font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleContinue}
              disabled={isOverLimit || (wordCount > 0 && wordCount < minWords)}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg ${!isOverLimit && (wordCount === 0 || wordCount >= minWords)
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {wordCount > 0 ? 'Save & Continue' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CareerJournal;
