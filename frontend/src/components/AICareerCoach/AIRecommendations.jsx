import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import GmailStyleRecommendations from './GmailStyleRecommendations';
import CareerInboxOnboarding from './CareerInboxOnboarding';
import CareerRoadmapDisplay from './CareerRoadmapDisplay';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiTrash2, FiTarget, FiRefreshCcw } from 'react-icons/fi';
import api from '../../services/apiBase';

function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState(null);
  const [pollAttempts, setPollAttempts] = useState(0); // Add poll counter
  const [hasOnboarding, setHasOnboarding] = useState(null); // null = checking, true = has onboarding, false = needs onboarding
  const [roadmap, setRoadmap] = useState(null);
  const [showRoadmap, setShowRoadmap] = useState(false); // Show roadmap view after fresh onboarding
  const [autoGenerateAfterOnboarding, setAutoGenerateAfterOnboarding] = useState(false);
  const [socketDisabled, setSocketDisabled] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const unreadRef = useRef(0);

  const syncUnreadState = useCallback((recs) => {
    const unreadCount = recs.filter(rec => rec.status === 'unread' || !rec.readAt).length;
    const totalCount = recs.length;

    window.dispatchEvent(new CustomEvent('aiRecommendationsUpdate', {
      detail: {
        type: 'recommendations',
        count: totalCount,
        unread: unreadCount,
      }
    }));

    if (unreadCount > unreadRef.current) {
      const delta = unreadCount - unreadRef.current;
      window.dispatchEvent(new CustomEvent('newRecommendations', {
        detail: {
          count: delta,
          type: 'recommendations'
        }
      }));
    }

    unreadRef.current = unreadCount;
  }, []);

  // Load recommendations from API - fetch existing without generating
  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConsentError(false);

    try {
      // Fetch recommendations (all types) without triggering generation
      const response = await api.get('/enhanced-ai-career-coach/recommendations', {
        params: {
          type: 'all',
          limit: 50
        },
        timeout: 15000,
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });

      let recommendationsData = [];
      const payload = response?.data;

      // Handle different possible response structures
      // ApiResponse structure: { statusCode, data: { recommendations: [...] }, message, success }
      if (Array.isArray(payload)) {
        recommendationsData = payload;
      } else if (payload?.data?.recommendations && Array.isArray(payload.data.recommendations)) {
        recommendationsData = payload.data.recommendations;
      } else if (Array.isArray(payload?.recommendations)) {
        recommendationsData = payload.recommendations;
      } else if (Array.isArray(payload?.data)) {
        recommendationsData = payload.data;
      } else {
        // No valid data, keep existing without showing mock
        setRecommendations([]);
        return [];
      }

      // Transform the API response to match GmailStyleRecommendations expected format
      const formattedRecommendations = recommendationsData.map((rec, index) => ({
        recommendation_id: rec.recommendation_id || rec._id || rec.id || `temp-${Date.now()}-${index}`,
        title: rec.title || `Career Suggestion ${index + 1}`,
        description: rec.description || rec.summary || 'Explore this career opportunity',
        category: rec.category || 'career',
        type: rec.type || 'proactive',
        priority: rec.priority || 'medium',
        created_at: rec.created_at || rec.createdAt || rec.date || new Date().toISOString(),
        due_date: rec.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default due in 7 days
        status: rec.status || 'unread',
        starred: rec.starred || false,
        readAt: rec.status === 'read' ? (rec.readAt || new Date().toISOString()) : null,
        labels: rec.labels || ['Career Development'],
        icon: rec.icon || '💼',
        // pass through structured insights and relevance if present
        structured: rec.structured || rec.content?.structured || rec.metadata?.structured_insights || null,
        relevance: rec.relevance || rec.relevance_score || rec.metadata?.relevance || null,
        action_items: rec.action_items || rec.content?.actionItems || rec.metadata?.action_items || []
      }));

      setRecommendations(formattedRecommendations);
      syncUnreadState(formattedRecommendations);
      return formattedRecommendations;
    } catch (error) {
      // Silent fail: keep UI clean and show no mock data
      console.warn('Error fetching recommendations:', error?.message || error);
      setRecommendations([]);
      syncUnreadState([]);
      // Do not set error to avoid banner
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [syncUnreadState]);

  // Trigger server-side generation then refresh once
  const triggerGenerationAndRefresh = useCallback(async () => {
    try {
      setIsGenerating(true);
      setConsentError(false);
      setProgressText('Generating personalized recommendations...');

      // Call generation endpoint and inspect response
      try {
        const genResponse = await api.post(
          '/enhanced-ai-career-coach/recommendations/generate',
          { type: 'proactive' },
          { timeout: 60000 }
        );
        const payload = genResponse?.data || {};
        const result = payload.data || payload;

        if (result?.reason === 'consent_disabled') {
          setConsentError(true);
          setProgressText('AI coach is disabled. Please enable consent.');
          toast.error('AI features are disabled. Please enable consent in settings.');
          // Don't clear immediately so user can see
          return;
        }

        if (typeof result?.count === 'number' && result.count === 0) {
          setProgressText('No new recommendations were generated. Try updating your journal or goals.');
        } else {
          setProgressText('Checking for new recommendations...');
        }
      } catch (e) {
        // If specific generate endpoint is not available, fallback to trigger-analysis
        try {
          await api.post(
            '/enhanced-ai-career-coach/trigger-analysis',
            {},
            { timeout: 60000 }
          );
        } catch (innerError) {
          console.warn("Trigger analysis fallback failed", innerError);
          setProgressText('Analysis taking longer than expected...');
          // Do NOT return here, let it fall through to loadRecommendations
        }
      }

      // Single refresh after generation attempt
      // We do this even if there was an error, just in case partial data exists
      await loadRecommendations();
      setProgressText('');
    } catch (e) {
      console.error("Generation flow error", e);
      // Even if flow failed, try to load one last time
      await loadRecommendations();
    } finally {
      setIsGenerating(false);
    }
  }, [loadRecommendations]);

  // Check onboarding status and roadmap availability
  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const checkOnboarding = async () => {
      try {
        // First check localStorage to avoid unnecessary API calls
        const localDone = localStorage.getItem('careerInboxOnboardingDone') === 'true';

        // Set a safety timeout - if nothing happens in 8 seconds, assume user has onboarding
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[Career Inbox] Timeout reached, assuming onboarding complete');
            setHasOnboarding(localDone ? true : false);
            if (localDone) {
              loadRecommendations();
            }
          }
        }, 8000);

        // 1. Check for roadmap status first (with shorter timeout)
        try {
          const statusResp = await Promise.race([
            api.get('/enhanced-ai-career-coach/roadmap/status', { timeout: 5000 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          const status = statusResp?.data?.data?.status; // idle, generating, completed, failed

          if (status === 'generating') {
            if (!isMounted) return;
            setHasOnboarding(true);
            setIsGenerating(true);
            setProgressText('AI is building your roadmap in the background... This may take a moment.');

            // Poll every 5s
            let attempts = 0;
            setPollAttempts(0);
            const interval = setInterval(async () => {
              attempts++;
              setPollAttempts(attempts);
              if (!isMounted) {
                clearInterval(interval);
                return;
              }
              try {
                const pollResp = await api.get('/enhanced-ai-career-coach/roadmap/status', {
                  timeout: 5000
                });
                const pollStatus = pollResp?.data?.data?.status;

                if (pollStatus === 'completed') {
                  clearInterval(interval);
                  clearTimeout(timeoutId);

                  if (!isMounted) return;

                  // Fetch the FULL roadmap immediately
                  try {
                    console.log('[Poll] Roadmap complete, fetching data...');
                    const roadmapResp = await api.get('/enhanced-ai-career-coach/roadmap', { timeout: 15000 });
                    const rMap = roadmapResp?.data?.data?.roadmap || roadmapResp?.data?.roadmap;

                    if (rMap && rMap.phases && rMap.phases.length > 0) {
                      setRoadmap(rMap);
                      setShowRoadmap(true);
                      setAutoGenerateAfterOnboarding(true);
                      localStorage.setItem('careerInboxOnboardingDone', 'true');

                      setIsGenerating(false);
                      setProgressText('');

                      // Trigger a fresh load of recommendations too (in background)
                      loadRecommendations();
                    } else {
                      throw new Error('Roadmap empty after completion');
                    }
                  } catch (fetchErr) {
                    console.error('[Poll] Failed to fetch final roadmap:', fetchErr);
                    setIsGenerating(false);
                    setProgressText('');
                    toast.error('Roadmap generated but failed to load. Please refresh.');
                  }

                } else if (pollStatus === 'failed') {
                  clearInterval(interval);
                  clearTimeout(timeoutId);
                  if (!isMounted) return;
                  setIsGenerating(false);
                  setProgressText('');
                  setHasOnboarding(localDone ? true : false);
                  toast.error('Roadmap generation failed. Please try again.');
                }
              } catch (pollError) {
                console.error('Polling error:', pollError);
                // Continue polling on transient errors
              }
            }, 5000);
            return () => {
              clearInterval(interval);
              clearTimeout(timeoutId);
            };
          }
        } catch (statusError) {
          console.warn('[Career Inbox] Status check failed, checking roadmap directly:', statusError.message);
          // Continue to roadmap check
        }

        // 2. If not generating, check if roadmap exists
        try {
          const response = await Promise.race([
            api.get('/enhanced-ai-career-coach/roadmap', { timeout: 10000 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
          ]);
          const roadmapData = response?.data?.data?.roadmap || response?.data?.roadmap;

          if (roadmapData && roadmapData.phases && roadmapData.phases.length > 0) {
            clearTimeout(timeoutId);
            if (!isMounted) return;
            setHasOnboarding(true);
            setRoadmap(roadmapData);
            setShowRoadmap(true); // Show roadmap if it exists
            localStorage.setItem('careerInboxOnboardingDone', 'true');
            // Don't load recommendations immediately - show roadmap first
            return;
          }
        } catch (roadmapError) {
          console.warn('[Career Inbox] Roadmap fetch failed:', roadmapError.message);
          // Fall through to localStorage check
        }

        // 3. Fallback to localStorage
        clearTimeout(timeoutId);
        if (!isMounted) return;
        setHasOnboarding(localDone ? true : false);
        if (localDone) {
          loadRecommendations();
        }
      } catch (error) {
        console.error('[Career Inbox] Error checking onboarding:', error);
        clearTimeout(timeoutId);
        if (!isMounted) return;
        const localDone = localStorage.getItem('careerInboxOnboardingDone') === 'true';
        setHasOnboarding(localDone ? true : false);
        if (localDone) {
          loadRecommendations();
        }
      }
    };

    checkOnboarding();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadRecommendations]);

  // Load existing recommendations only if onboarding is complete
  useEffect(() => {
    if (hasOnboarding === true) {
      loadRecommendations();
    }
  }, [hasOnboarding, loadRecommendations]);

  // Real-time updates via Socket.IO (DISABLED - causing connection errors)
  useEffect(() => {
    // Socket.io real-time updates disabled to prevent connection errors
    // Using polling instead via setInterval below
  }, []);

  // Mark a recommendation as read
  const markAsRead = useCallback((id) => {
    setRecommendations(prev => {
      const updated = prev.map(rec =>
        rec.recommendation_id === id ? { ...rec, status: 'read', readAt: new Date().toISOString() } : rec
      );
      syncUnreadState(updated);
      return updated;
    });
  }, [syncUnreadState]);

  // Toggle star status of a recommendation
  const toggleStar = async (id) => {
    try {
      const updatedRecs = recommendations.map(rec =>
        rec.id === id ? { ...rec, starred: !rec.starred } : rec
      );

      // Optimistic UI update
      setRecommendations(updatedRecs);

      // Update on the server
      await api.put(
        `/ai-career-coach/recommendations/${id}/star`,
        { starred: !recommendations.find(r => r.id === id)?.starred },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success('Recommendation updated');
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast.error('Failed to update recommendation');
      // Revert on error
      loadRecommendations();
    }
  };

  // Mark a recommendation as complete
  const markAsComplete = async (id) => {
    try {
      await api.post(`/enhanced-ai-career-coach/recommendations/${id}/complete`, {});

      setRecommendations(prev => {
        const updated = prev.filter(rec => rec.recommendation_id !== id);
        syncUnreadState(updated);
        return updated;
      });
      toast.success('Recommendation marked as completed');
    } catch (error) {
      console.error('Error completing recommendation:', error);
      toast.error('Failed to mark recommendation as completed');
    }
  };

  // Delete a recommendation (single or bulk)
  const deleteRecommendation = async (idOrIds) => {
    try {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

      if (ids.length === 0) return;

      if (ids.length === 1) {
        // Single delete
        await api.delete(`/enhanced-ai-career-coach/recommendations/${ids[0]}`);
      } else {
        // Bulk delete - using POST because DELETE requests don't have body parsing enabled
        await api.post('/enhanced-ai-career-coach/recommendations/bulk-delete', {
          recommendationIds: ids
        });
      }

      setRecommendations(prev => {
        const updated = prev.filter(rec => !ids.includes(rec.recommendation_id));
        syncUnreadState(updated);
        return updated;
      });

      toast.success(`${ids.length} recommendation${ids.length > 1 ? 's' : ''} deleted`);
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast.error(`Failed to delete recommendation${Array.isArray(idOrIds) && idOrIds.length > 1 ? 's' : ''}`);
      // Reload on error to ensure consistency
      loadRecommendations();
    }
  };

  // Delete all recommendations
  const deleteAllRecommendations = async () => {
    if (!window.confirm(`Delete all ${recommendations.length} recommendations? This cannot be undone.`)) {
      return;
    }

    try {
      const allIds = recommendations.map(rec => rec.recommendation_id);
      await api.post('/enhanced-ai-career-coach/recommendations/bulk-delete', {
        recommendationIds: allIds
      });

      setRecommendations([]);
      syncUnreadState([]);
      toast.success(`All ${allIds.length} recommendations deleted`);
    } catch (error) {
      console.error('Error deleting all recommendations:', error);
      toast.error('Failed to delete all recommendations');
      // Reload on error to ensure consistency
      loadRecommendations();
    }
  };

  // Handle onboarding completion - show roadmap first
  const handleOnboardingComplete = (data) => {
    console.log('[AIRecommendations] Onboarding complete, received data:', data);

    // If generation started in background, transition to polling mode
    if (data.isGenerating) {
      setHasOnboarding(true);
      setIsGenerating(true);
      setProgressText('AI is building your roadmap in the background... This may take a moment.');
      localStorage.setItem('careerInboxOnboardingDone', 'true');

      // Start polling immediately
      const interval = setInterval(async () => {
        try {
          const pollResp = await api.get('/enhanced-ai-career-coach/roadmap/status');
          const pollStatus = pollResp?.data?.data?.status;

          if (pollStatus === 'completed') {
            clearInterval(interval);
            setIsGenerating(false);
            setProgressText('');

            // Fetch final roadmap
            const roadmapResp = await api.get('/enhanced-ai-career-coach/roadmap');
            const rMap = roadmapResp?.data?.data?.roadmap || roadmapResp?.data?.roadmap;

            if (rMap && rMap.phases && rMap.phases.length > 0) {
              setRoadmap(rMap);
              setShowRoadmap(true); // Show roadmap immediately
              setAutoGenerateAfterOnboarding(true);
              // Don't trigger recommendations immediately - let user see roadmap first
            } else {
              toast.warn('Roadmap generated but structure was unexpected. Please refresh.');
            }
          } else if (pollStatus === 'failed') {
            clearInterval(interval);
            setIsGenerating(false);
            setProgressText('');
            toast.error('Roadmap generation failed. Please try again.');
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 5000);
      return;
    }

    // Extract roadmap from the data structure
    const roadmapData = data?.roadmap;
    console.log('[AIRecommendations] Extracted roadmap:', roadmapData);

    if (roadmapData && roadmapData.phases && roadmapData.phases.length > 0) {
      setHasOnboarding(true);
      setRoadmap(roadmapData);
      setShowRoadmap(true); // Show the roadmap view
      setAutoGenerateAfterOnboarding(true);
      localStorage.setItem('careerInboxOnboardingDone', 'true');
    } else {
      console.error('[AIRecommendations] Invalid roadmap received, skipping display');
      setHasOnboarding(true);
      localStorage.setItem('careerInboxOnboardingDone', 'true');
      // Skip roadmap display and go directly to recommendations
      loadRecommendations();
    }
  };

  const handleContinueFromRoadmap = () => {
    setShowRoadmap(false);
    loadRecommendations();
    if (autoGenerateAfterOnboarding) {
      setAutoGenerateAfterOnboarding(false);
      triggerGenerationAndRefresh();
    }
  };

  const handleAdjustRoadmap = async (action) => {
    try {
      setIsGenerating(true);
      setShowRoadmap(true); // Keep showing roadmap (or loading state)

      let reason = 'user_adjustment';
      if (action === 'extend') reason = 'extend_timeline';
      else if (action === 'intensify') reason = 'intensify_timeline';

      setProgressText(`Adjusting roadmap (${action === 'extend' ? 'More time' : 'More intensity'})...`);

      // 1. Trigger regeneration
      await api.post('/enhanced-ai-career-coach/roadmap', {
        regenerate: true,
        reason: reason,
        timeBudget: roadmap?.weekly_hours_budget
      });

      // 2. Poll for completion
      const interval = setInterval(async () => {
        try {
          const pollResp = await api.get('/enhanced-ai-career-coach/roadmap/status');
          const pollStatus = pollResp?.data?.data?.status;

          if (pollStatus === 'completed') {
            clearInterval(interval);
            setIsGenerating(false);
            setProgressText('');

            const roadmapResp = await api.get('/enhanced-ai-career-coach/roadmap');
            const rMap = roadmapResp?.data?.data?.roadmap || roadmapResp?.data?.roadmap;
            setRoadmap(rMap);
            toast.success('Roadmap adjusted successfully!');
          } else if (pollStatus === 'failed') {
            clearInterval(interval);
            setIsGenerating(false);
            setProgressText('');
            toast.error('Failed to adjust roadmap.');
          }
        } catch (e) { console.error(e); }
      }, 5000);

    } catch (error) {
      console.error('Adjustment failed:', error);
      setIsGenerating(false);
      toast.error('Failed to start adjustment.');
    }
  };

  const regenerateRoadmap = useCallback(async () => {
    // Reuse the adjustment logic for generic refresh
    handleAdjustRoadmap('refresh');
  }, [roadmap]);

  // Show onboarding if not completed
  if (hasOnboarding === false) {
    return <CareerInboxOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Show roadmap after fresh onboarding
  if (showRoadmap && roadmap) {
    if (isGenerating) {
      // While regenerating, show loading overlay on top of old roadmap or a loading screen
      // For simplicity, let's return a loading state if we want to hide the old one, 
      // OR we can pass isGenerating to CareerRoadmapDisplay to disable buttons.
      // The global isGenerating check below might hide this view if we aren't careful.
      // Let's just return the component but the spinner overlay will handle it?
      // Actually `CareerRoadmapDisplay` handles null roadmap, but we have an old one.
      // Let's rely on the global loading indicator at the top of this component or pass a prop.
    }
    return <CareerRoadmapDisplay roadmap={roadmap} onContinue={handleContinueFromRoadmap} onAdjust={handleAdjustRoadmap} />;
  }

  // Show loading while checking onboarding
  if (hasOnboarding === null) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // No top-level error banner; keep the page clean if service is unavailable

  return (
    <div className="w-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200" data-tour="ai-inbox-content">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">AI Career Recommendations</h2>
            <p className="text-sm text-gray-500">
              {roadmap && roadmap.targetRole ? `Roadmap-based suggestions for ${roadmap.targetRole}` : 'Roadmap-based suggestions for your career'}
            </p>
          </div>
          {consentError && (
            <button onClick={() => window.location.href = '/career-coach?tab=terms-consent'} className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold">
              Enable AI Consent
            </button>
          )}
          <div className="flex items-center space-x-2">
            {roadmap && (
              <>
                <button
                  onClick={() => setShowRoadmap(true)}
                  className="flex items-center px-3 py-1.5 text-sm text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50"
                >
                  <FiTarget className="mr-2" size={14} />
                  View Roadmap
                </button>
                <button
                  onClick={regenerateRoadmap}
                  disabled={isGenerating}
                  className="flex items-center px-3 py-1.5 text-sm text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 disabled:opacity-50"
                >
                  <FiRefreshCcw className="mr-2" size={14} />
                  Refresh Roadmap
                </button>
              </>
            )}
            {recommendations.length > 0 && (
              <button
                onClick={deleteAllRecommendations}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                disabled={isLoading || isGenerating}
              >
                <FiTrash2 className="mr-2" size={14} />
                Delete All
              </button>
            )}
          </div>
        </div>
      </div>

      {(isGenerating || isLoading) && (
        <div className="px-4 py-3 bg-blue-50 text-blue-700 text-sm border-b border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
            <span>{progressText || 'Working...'}</span>
            {pollAttempts > 20 && (
              <button
                onClick={() => window.location.reload()}
                className="ml-2 underline text-xs text-blue-800 hover:text-blue-900"
              >
                Taking too long? Click to refresh
              </button>
            )}
          </div>
          <span className="font-semibold text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
            ⚠️ Please do not close or refresh this page.
          </span>
        </div>
      )}

      {(isLoading || isGenerating) ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24"></div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No recommendations yet</h3>
          <p className="text-gray-500 mb-2 max-w-md">We’re preparing roadmap-based tasks for you. You can trigger generation now or refresh your roadmap.</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {roadmap ? (
              <>
                <button
                  onClick={() => setShowRoadmap(true)}
                  className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50"
                >
                  View roadmap
                </button>
                <button
                  onClick={regenerateRoadmap}
                  className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50"
                  disabled={isGenerating}
                >
                  Refresh roadmap
                </button>
              </>
            ) : (
              <button
                onClick={() => setHasOnboarding(false)}
                className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50"
              >
                Start My Journey
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">Tip: keep journaling and uploading documents to improve relevance.</p>
        </div>
      ) : (
        <GmailStyleRecommendations
          recommendations={recommendations}
          onMarkAsRead={markAsRead}
          onComplete={markAsComplete}
          onDelete={deleteRecommendation}
          onToggleStar={toggleStar}
          onSnooze={(id) => {
            // Snooze functionality - can be enhanced later
            toast.info('Snooze feature coming soon!');
          }}
          onArchive={(id) => {
            // Archive functionality - mark as read for now
            markAsRead(id);
            toast.success('Recommendation archived');
          }}
          isLoading={isLoading}
        />
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>{recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}</span>
          <div className="flex space-x-4">
            <span className="text-gray-400">Updates every few hours</span>
          </div>
        </div>
      </div>
    </div >
  );
}

export default AIRecommendations;
