import React from 'react';
import AIRecommendations from './AIRecommendations';

/**
 * ProactiveRecommendations Component
 * 
 * This component is a wrapper around AIRecommendations that focuses on
 * proactive career recommendations. It can be used as a dedicated view
 * for proactive suggestions.
 * 
 * @returns {JSX.Element} The proactive recommendations view
 */
function ProactiveRecommendations() {
  return (
    <div className="w-full">
      <AIRecommendations />
    </div>
  );
}

export default ProactiveRecommendations;





































