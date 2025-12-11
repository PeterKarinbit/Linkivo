/**
 * Secure Knowledge Base - 3D Shelf View
 * Features: AI-curated content from journals, documents, and goals
 */

import React from 'react';
import KnowledgeShelf from './KnowledgeShelf.jsx';

function SecureKnowledgeBase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" data-tour="knowledge-base-content">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <i className="fa-solid fa-database text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Knowledge Base
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-curated career insights from your journals, documents, and goals
          </p>
        </div>

        {/* 3D Shelf View */}
        <div className="mt-6">
          <KnowledgeShelf />
        </div>
      </div>
    </div>
  );
}

export default SecureKnowledgeBase;
