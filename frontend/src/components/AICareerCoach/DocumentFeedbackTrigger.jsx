import React, { useState } from "react";
import { FiMessageSquare, FiX } from "react-icons/fi";

/**
 * DocumentFeedbackTrigger Component
 * Allows users to provide feedback on uploaded documents
 */
function DocumentFeedbackTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitting(true);
    try {
      // TODO: Implement feedback submission API call
      // await documentService.submitFeedback({ feedback, documentIds: [...] });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setFeedback("");
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
        >
          <FiMessageSquare className="text-lg" />
          <span className="text-sm font-medium">Provide Feedback on Documents</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="text-blue-600 dark:text-blue-400 text-lg" />
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Document Feedback
            </h3>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              setFeedback("");
              setSubmitted(false);
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {submitted ? (
          <div className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✅ Thank you for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts on the document analysis, suggestions for improvement, or any issues you encountered..."
              rows="3"
              className="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setFeedback("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!feedback.trim() || submitting}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DocumentFeedbackTrigger;


