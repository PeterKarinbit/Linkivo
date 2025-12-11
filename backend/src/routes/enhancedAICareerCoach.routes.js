import express from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import Journal from '../models/journal.model.js';

const isValidObjectId = (id) => Types.ObjectId.isValid(id);
import { requireFeature } from '../middlewares/featureAccess.middleware.js';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';
import EnhancedAICareerCoachService, { aiCoachSimpleChat } from '../utils/ai/enhancedAICareerCoach.service.js';
import AICareerCoachService from '../utils/ai/aiCareerCoach.service.js';
import EnhancedVectorDatabaseService from '../utils/ai/enhancedVectorDatabase.service.js';
import MarketIntelligenceService from '../utils/ai/marketIntelligence.service.js';
import ProactiveAnalysisScheduler from '../utils/ai/proactiveAnalysis.scheduler.js';
import { User } from '../models/user.model.js';
import { KnowledgeBase, CareerRecommendation, JournalEntry } from '../models/aiCareerCoach.model.js';
import JournalProcessor from '../services/ai/JournalProcessor.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  console.log('Request received for path:', req.path, 'method:', req.method);
  console.log('Authorization header:', req.headers.authorization);
  verifyJWT(req, res, next);
});

// ==================== KNOWLEDGE BASE LIST ====================
// GET /api/v1/enhanced-ai-career-coach/knowledge-base?limit=50
router.get('/knowledge-base', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const items = await KnowledgeBase.find({}).sort({ last_updated: -1 }).limit(limit).lean();
  return res.status(200).json(new ApiResponse(200, { items, total: items.length }, 'Knowledge base items retrieved'));
}));

// GET /api/v1/enhanced-ai-career-coach/knowledge-base/shelf
router.get('/knowledge-base/shelf', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Use the service method we just created (or will create) to aggregate data
  const shelfData = await EnhancedAICareerCoachService.getKnowledgeShelfData(userId);

  return res.status(200).json(
    new ApiResponse(200, { sections: shelfData }, 'Knowledge shelf data retrieved')
  );
}));

// GET /api/v1/enhanced-ai-career-coach/dashboard/overview
router.get('/dashboard/overview', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const overview = await EnhancedAICareerCoachService.getDashboardOverview(userId);
  return res.status(200).json(
    new ApiResponse(200, overview, 'Dashboard overview retrieved')
  );
}));

// POST /api/v1/enhanced-ai-career-coach/knowledge-base/refresh-research
router.post('/knowledge-base/refresh-research', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Trigger research refresh in background
  res.status(202).json(
    new ApiResponse(202, { status: 'refreshing' }, 'Research refresh started in background')
  );

  // Run in background
  setImmediate(async () => {
    try {
      await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
      console.log(`[KB] Research refresh completed for user ${userId}`);
    } catch (error) {
      console.error(`[KB] Research refresh failed for user ${userId}:`, error);
    }
  });
}));

// PATCH /api/v1/enhanced-ai-career-coach/milestones/:milestoneId/status
router.patch('/milestones/:milestoneId/status', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { milestoneId } = req.params;
  const { status, notes } = req.body; // status: 'upcoming' | 'in_progress' | 'completed' | 'blocked'

  if (!['upcoming', 'in_progress', 'completed', 'blocked'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be: upcoming, in_progress, completed, or blocked');
  }

  const profile = await EnhancedAICareerCoachService.getUserCareerProfile(userId);
  if (!profile?.progress_roadmap?.milestones) {
    throw new ApiError(404, 'Roadmap not found');
  }

  const milestoneIndex = profile.progress_roadmap.milestones.findIndex(
    ms => ms.milestone_id === milestoneId
  );

  if (milestoneIndex === -1) {
    throw new ApiError(404, 'Milestone not found');
  }

  // Update milestone status
  profile.progress_roadmap.milestones[milestoneIndex].status = status;
  if (notes) {
    profile.progress_roadmap.milestones[milestoneIndex].evidence = notes;
  }

  // If marking as completed, add to milestones_completed
  if (status === 'completed') {
    const { UserCareerProfile } = await import('../models/aiCareerCoach.model.js');
    await UserCareerProfile.updateOne(
      { user_id: userId },
      {
        $addToSet: {
          'progress_tracking.milestones_completed': {
            milestone: milestoneId,
            completed_at: new Date(),
            category: profile.progress_roadmap.milestones[milestoneIndex].category || 'general'
          }
        },
        $set: {
          'progress_roadmap.milestones': profile.progress_roadmap.milestones,
          'progress_tracking.last_activity': new Date()
        }
      }
    );
  } else {
    // Update milestone status without adding to completed
    const { UserCareerProfile } = await import('../models/aiCareerCoach.model.js');
    await UserCareerProfile.updateOne(
      { user_id: userId },
      {
        $set: {
          'progress_roadmap.milestones': profile.progress_roadmap.milestones,
          'progress_tracking.last_activity': new Date()
        }
      }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { milestoneId, status }, 'Milestone status updated')
  );
}));

// PATCH /api/v1/enhanced-ai-career-coach/feedback/:feedbackId/status
router.patch('/feedback/:feedbackId/status', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { feedbackId } = req.params;
  const { status } = req.body; // status: 'new' | 'reviewed' | 'addressed' | 'dismissed'

  if (!['new', 'reviewed', 'addressed', 'dismissed'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be: new, reviewed, addressed, or dismissed');
  }

  // Verify feedback belongs to user
  const feedback = await KnowledgeBase.findOne({
    _id: feedbackId,
    content_id: { $regex: new RegExp(`^kb_${userId.toString()}_doc_feedback_`) }
  });

  if (!feedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  // Update feedback status
  await KnowledgeBase.updateOne(
    { _id: feedbackId },
    {
      $set: {
        'metadata.feedback_status': status,
        last_updated: new Date()
      }
    }
  );

  return res.status(200).json(
    new ApiResponse(200, { feedbackId, status }, 'Feedback status updated')
  );
}));

// DELETE /api/v1/enhanced-ai-career-coach/knowledge-base/:id
router.delete('/knowledge-base/:id', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid knowledge base item ID');
  }

  // Find and delete the knowledge base item
  const item = await KnowledgeBase.findById(id);
  if (!item) {
    throw new ApiError(404, 'Knowledge base item not found');
  }

  // Optional: Add user ownership check if needed
  // For now, allow deletion of any item (can be restricted later)

  await KnowledgeBase.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, { deleted: true, id }, 'Knowledge base item deleted successfully')
  );
}));

// ==================== PERSONA ASSESSMENT ====================
// POST /api/v1/enhanced-ai-career-coach/assessment
router.post('/assessment', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await EnhancedAICareerCoachService.setPersonaAssessment(userId, req.body || {});
  return res.status(200).json(
    new ApiResponse(200, result, 'Persona assessment saved')
  );
}));

// ==================== ROADMAP ====================
// GET /api/v1/enhanced-ai-career-coach/roadmap
router.get('/roadmap', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const roadmap = await EnhancedAICareerCoachService.getCareerRoadmap(userId);
  return res.status(200).json(
    new ApiResponse(200, { roadmap }, roadmap ? 'Roadmap retrieved' : 'No roadmap found')
  );
}));

// POST /api/v1/enhanced-ai-career-coach/roadmap
router.post('/roadmap', asyncHandler(async (req, res) => {
  console.log('[DEBUG] Hit roadmap endpoint - Start');
  console.time('roadmap-req');
  const userId = req.user._id;
  const { regenerate = false, reason = 'user_request', timeBudget } = req.body || {};

  // 1. Return success immediately (Fire-and-forget) - ZERO WAIT
  res.status(202).json(
    new ApiResponse(202, { status: 'generating' }, "Roadmap generation started in background")
  );
  console.log('[DEBUG] Response sent');
  console.timeEnd('roadmap-req');

  // 2. Trigger actual generation in background
  (async () => {
    try {
      // update status to generating
      await User.findByIdAndUpdate(userId, {
        $set: { 'aiCoachState.roadmapStatus': 'generating' }
      });
      console.log(`[Background] Starting roadmap generation for ${userId}`);

      await EnhancedAICareerCoachService.generateAdaptiveRoadmap(userId, { regenerate, reason, timeBudget });

      await User.findByIdAndUpdate(userId, {
        $set: { 'aiCoachState.roadmapStatus': 'completed' }
      });
      console.log(`[Background] Roadmap generation completed for ${userId}`);

    } catch (error) {
      console.error(`[Background] Roadmap generation failed for ${userId}:`, error);
      await User.findByIdAndUpdate(userId, {
        $set: { 'aiCoachState.roadmapStatus': 'failed' }
      });
    }
  })();
}));

// ==================== KNOWLEDGE BASE QUESTIONS ====================
// POST /api/v1/enhanced-ai-career-coach/knowledge-base/questions
// Saves user's preference questions to build their knowledge base profile
router.post('/knowledge-base/questions', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    throw new ApiError(400, 'Answers array is required');
  }

  // Format and validate answers
  const formattedAnswers = answers.map(a => ({
    questionId: a.questionId,
    questionNumber: a.questionNumber,
    question: a.question,
    answer: typeof a.answer === 'number' ? a.answer : 50,
    answerLabel: a.answerLabel || 'Neutral',
    required: a.questionNumber <= 10, // First 10 are required
    answered_at: new Date()
  }));

  // Save to user's AI coach profile
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'aiCoachProfile.knowledge_base_questions': formattedAnswers,
        'aiCoachProfile.last_activity': new Date()
      }
    },
    { new: true, upsert: true }
  ).lean();

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(201).json(
    new ApiResponse(201, {
      saved: formattedAnswers.length,
      questions: formattedAnswers
    }, 'Knowledge base questions saved successfully')
  );
}));

// ==================== CONSENT MANAGEMENT ====================
// GET /api/v1/enhanced-ai-career-coach/consent
router.get('/consent', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('aiCoachConsent').lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, user.aiCoachConsent || {}, 'AI Coach consent retrieved successfully')
  );
}));

// PUT /api/v1/enhanced-ai-career-coach/consent
router.put('/consent', asyncHandler(async (req, res) => {
  console.log('Consent PUT endpoint hit');
  console.log('Request body:', req.body);
  const userId = req.user._id;
  const { enabled, scopes, schedule } = req.body || {};

  const update = {};

  if (typeof enabled === 'boolean') {
    update['aiCoachConsent.enabled'] = enabled;
  }

  if (scopes && typeof scopes === 'object') {
    const allowedScopes = ['resume', 'journals', 'goals', 'tasks', 'applications', 'knowledgeBase'];
    for (const key of allowedScopes) {
      if (key in scopes && typeof scopes[key] === 'boolean') {
        update[`aiCoachConsent.scopes.${key}`] = scopes[key];
      }
    }
  }

  if (schedule && typeof schedule === 'object') {
    const { cadence, windowLocalTime, timezone } = schedule;
    const allowedCadence = new Set(['daily', 'weekly', 'monthly', 'quarterly', 'off']);
    if (cadence && allowedCadence.has(cadence)) {
      update['aiCoachConsent.schedule.cadence'] = cadence;
    }
    if (windowLocalTime && /^\d{2}:\d{2}$/.test(windowLocalTime)) {
      update['aiCoachConsent.schedule.windowLocalTime'] = windowLocalTime;
    }
    if (timezone && typeof timezone === 'string' && timezone.length <= 64) {
      update['aiCoachConsent.schedule.timezone'] = timezone;
    }
  }

  update['aiCoachConsent.lastUpdatedAt'] = new Date();
  update['aiCoachConsent.updatedBy'] = userId;

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true, select: 'aiCoachConsent' }
  ).lean();

  if (!updated) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, updated.aiCoachConsent || {}, 'AI Coach consent updated successfully')
  );
}));

// ==================== ENHANCED RESUME ANALYSIS ====================
// POST /api/v1/enhanced-ai-career-coach/analyze-resume
router.post('/analyze-resume', asyncHandler(async (req, res) => {
  const { resumeFile } = req.body;
  const userId = req.user._id;

  if (!resumeFile) {
    throw new ApiError(400, "Resume file is required");
  }

  const analysis = await EnhancedAICareerCoachService.analyzeResume(resumeFile, userId);

  return res.status(200).json(
    new ApiResponse(200, analysis, "Enhanced resume analysis completed successfully")
  );
}));

// ==================== ENHANCED JOURNAL MANAGEMENT ====================
// GET /api/v1/enhanced-ai-career-coach/journal?page=1&limit=50&search=query
router.get('/journal', requireFeature('careerMemories'), asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const skip = (page - 1) * limit;
  const search = req.query.search;

  // Handle vector search if search query is provided
  if (search) {
    const vectorResults = await EnhancedVectorDatabaseService.searchSimilarContent(
      search,
      'journal_entries',
      userId,
      limit
    );

    return res.status(200).json(
      new ApiResponse(200, {
        items: vectorResults,
        pagination: {
          total: vectorResults.length,
          page: 1,
          pages: 1,
          limit: vectorResults.length
        }
      }, "Journal entries retrieved via vector search")
    );
  }

  // Regular paginated journal entries
  const [entries, total] = await Promise.all([
    EnhancedAICareerCoachService.getJournalEntries({
      userId,
      limit,
      skip,
      sort: { entry_date: -1 }
    }),
    EnhancedAICareerCoachService.countJournalEntries({ userId })
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      items: entries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    }, 'Journal entries retrieved successfully')
  );
}));

// POST /api/v1/enhanced-ai-career-coach/journal
router.post('/journal', requireFeature('careerMemories'), asyncHandler(async (req, res) => {
  const { content, entry_date, tags, title } = req.body;
  const userId = req.user._id;

  if (!content || content.length < 100) {
    throw new ApiError(400, "Journal content must be at least 100 characters");
  }

  if (content.length > 5000) {
    throw new ApiError(400, "Journal content must not exceed 5000 characters");
  }

  // Create the journal entry (this will save it immediately)
  const journalEntry = await EnhancedAICareerCoachService.createJournalEntry({
    userId,
    content,
    entry_date: entry_date || new Date(),
    tags: tags || [],
    title: title // Pass title if provided
  });

  // Process analysis in the background
  (async () => {
    try {
      // This will update the journal entry with analysis when complete
      const analysis = await EnhancedAICareerCoachService.analyzeJournalEntryWithMarketContext(content, userId);

      // Generate recommendations based on the analysis
      try {
        const recommendations = await EnhancedAICareerCoachService.generateProactiveRecommendations(
          userId,
          'journal-triggered'
        );
        console.log(`Generated ${recommendations.count || 0} recommendations from journal entry`);
      } catch (recError) {
        console.warn('Recommendation generation failed:', recError?.message || recError);
      }

      // Refresh knowledge base incrementally after analysis
      try {
        await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
      } catch (e) {
        console.warn('KB refresh after journal failed:', e?.message || e);
      }
    } catch (error) {
      console.error('Background analysis failed:', error);
    }
  })();

  // Increment usage and respond immediately
  await req.subscription.incrementUsage('careerMemories');
  return res.status(201).json(
    new ApiResponse(201, journalEntry, "Journal entry created successfully. Analysis in progress.")
  );
}));

// ==================== ENHANCED GOAL SETTING ====================
// GET /api/v1/enhanced-ai-career-coach/goals
router.get('/goals', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await EnhancedAICareerCoachService.getUserCareerProfile(userId);

  return res.status(200).json(
    new ApiResponse(200, {
      short_term: profile.career_goals?.short_term || [],
      long_term: profile.career_goals?.long_term || [],
      priority_areas: profile.career_goals?.priority_areas || [],
      timeline: profile.career_goals?.timeline || null
    }, "Career goals retrieved successfully")
  );
}));

// POST /api/v1/enhanced-ai-career-coach/goals
router.post('/goals', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { careerGoals } = req.body;

  if (!careerGoals) {
    throw new ApiError(400, "Career goals are required");
  }

  const result = await EnhancedAICareerCoachService.setCareerGoals(userId, careerGoals);

  return res.status(201).json(
    new ApiResponse(201, result, "Enhanced career goals set successfully")
  );
}));

// ==================== PROACTIVE RECOMMENDATIONS ====================
// GET /api/v1/enhanced-ai-career-coach/recommendations?type=daily|weekly|milestone|proactive|all
router.get('/recommendations', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const type = req.query.type || 'all';
  const limit = parseInt(req.query.limit) || 10;

  // Use vector search for better recommendations
  if (type === 'proactive') {
    const vectorResults = await EnhancedVectorDatabaseService.searchSimilarContent(
      'proactive career recommendations',
      'ai_recommendations',
      userId,
      limit
    );

    // If vector search returns nothing, fall back to stored recommendations
    if (Array.isArray(vectorResults?.data || vectorResults) && (vectorResults.data?.length || vectorResults.length)) {
      return res.status(200).json(
        new ApiResponse(200, vectorResults, "Proactive recommendations retrieved via vector search")
      );
    }
  }

  const recommendations = await EnhancedAICareerCoachService.getRecommendations({
    userId,
    type,
    limit
  });

  return res.status(200).json(
    new ApiResponse(200, recommendations, "Recommendations retrieved successfully")
  );
}));

// POST /api/v1/enhanced-ai-career-coach/recommendations/generate
router.post('/recommendations/generate', requireFeature('jobRecommendations'), asyncHandler(async (req, res) => {
  // Clear the default timeout since LLM generation can take longer than 30s
  if (req.clearTimeout) req.clearTimeout();

  const userId = req.user._id;
  const { type = 'proactive' } = req.body;

  console.log(`[Generate Recommendations] Request from user ${userId}, type: ${type}`);

  try {
    const result = await EnhancedAICareerCoachService.generateProactiveRecommendations(userId, type);

    console.log(`[Generate Recommendations] Generated ${result.count || 0} recommendations for user ${userId}`);

    await req.subscription.incrementUsage('jobRecommendations');
    return res.status(200).json(
      new ApiResponse(200, result, result.message || "Proactive recommendations generated successfully")
    );
  } catch (error) {
    console.error(`[Generate Recommendations] Error for user ${userId}:`, error);
    throw error;
  }
}));

// ==================== PROACTIVE RECOMMENDATIONS STREAM (SSE) ====================
// GET /api/v1/enhanced-ai-career-coach/recommendations/stream?userId=...&model=...
router.get('/recommendations/stream', asyncHandler(async (req, res) => {
  // Enforce authenticated user
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  // Initialize Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Flush headers
  res.flushHeaders?.();

  // Send initial event so frontend knows we're connected
  res.write(`event: open\n`);
  res.write(`data: {"status":"connected"}\n\n`);

  // Keep-alive heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {"ts":${Date.now()}}\n\n`);
  }, 25000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    try { res.end(); } catch (_) { }
  });
}));

// ==================== MARKET INTELLIGENCE ====================
// GET /api/v1/enhanced-ai-career-coach/market-insights?category=skills|jobs|salary&limit=10
// Cache market insights for 1 hour (3600 seconds)
router.get('/market-insights',
  cacheMiddleware({ ttl: 3600, prefix: 'market-insights:' }),
  asyncHandler(async (req, res) => {
    const category = req.query.category || 'all';
    const limit = parseInt(req.query.limit) || 10;

    const insights = await MarketIntelligenceService.getMarketInsights(category, limit);

    return res.status(200).json(
      new ApiResponse(200, insights, "Market insights retrieved successfully")
    );
  }));

// GET /api/v1/enhanced-ai-career-coach/skills-demand?skills=javascript,python,react
// Cache skills demand data for 6 hours (21600 seconds)
router.get('/skills-demand',
  cacheMiddleware({ ttl: 21600, prefix: 'skills-demand:' }),
  asyncHandler(async (req, res) => {
    const skills = req.query.skills ? req.query.skills.split(',') : [];

    const demand = await MarketIntelligenceService.getSkillsDemand(skills);

    return res.status(200).json(
      new ApiResponse(200, demand, "Skills demand analysis retrieved successfully")
    );
  }));

// ==================== CAREER PATHWAYS & GAPS ====================
// These power the MarketInsights D3 charts. If Lightcast/data sources are unavailable,
// the service gracefully falls back to deterministic sample data using the user's
// target role or current role.

// GET /api/v1/enhanced-ai-career-coach/career-paths?targetRole=...
router.get('/career-paths', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const targetRole = req.query.targetRole;

  const data = await EnhancedAICareerCoachService.getCareerPaths(userId, targetRole);

  return res.status(200).json(
    new ApiResponse(200, data, "Career pathways retrieved successfully")
  );
}));

// GET /api/v1/enhanced-ai-career-coach/skill-gaps?targetRole=...
router.get('/skill-gaps', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const targetRole = req.query.targetRole;

  const data = await EnhancedAICareerCoachService.getSkillGaps(userId, targetRole);

  return res.status(200).json(
    new ApiResponse(200, data, "Skill gaps retrieved successfully")
  );
}));

// GET /api/v1/enhanced-ai-career-coach/industry-trends
router.get('/industry-trends', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const data = await EnhancedAICareerCoachService.getIndustryTrends(userId);

  return res.status(200).json(
    new ApiResponse(200, data, "Industry trends retrieved successfully")
  );
}));

// ==================== VECTOR SEARCH ====================
// POST /api/v1/enhanced-ai-career-coach/search
router.post('/search', asyncHandler(async (req, res) => {
  const { query, collection, limit = 10 } = req.body;
  const userId = req.user._id;

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const validCollections = ['journal_entries', 'knowledge_base', 'market_intelligence', 'ai_recommendations'];
  if (collection && !validCollections.includes(collection)) {
    throw new ApiError(400, "Invalid collection specified");
  }

  const results = await EnhancedVectorDatabaseService.searchSimilarContent(
    query,
    collection || 'journal_entries',
    userId,
    limit
  );

  return res.status(200).json(
    new ApiResponse(200, results, "Vector search completed successfully")
  );
}));

// ==================== USER PROFILE VECTORIZATION ====================
// POST /api/v1/enhanced-ai-career-coach/vectorize-profile
router.post('/vectorize-profile', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { profileData } = req.body;

  if (!profileData) {
    throw new ApiError(400, "Profile data is required");
  }

  const result = await EnhancedVectorDatabaseService.vectorizeUserProfile(userId, profileData);

  return res.status(200).json(
    new ApiResponse(200, result, "User profile vectorized successfully")
  );
}));

// ==================== PROACTIVE ANALYSIS TRIGGER ====================
// POST /api/v1/enhanced-ai-career-coach/trigger-analysis
router.post('/trigger-analysis', asyncHandler(async (req, res) => {
  // Clear the default timeout for this long-running task
  if (req.clearTimeout) req.clearTimeout();

  const userId = req.user._id;

  const result = await EnhancedAICareerCoachService.triggerProactiveAnalysis(userId);

  return res.status(200).json(
    new ApiResponse(200, result, "Proactive analysis triggered successfully")
  );
}));

// ==================== ENHANCED CAREER PROFILE ====================
// GET /api/v1/enhanced-ai-career-coach/profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await EnhancedAICareerCoachService.getUserCareerProfile(userId);

  return res.status(200).json(
    new ApiResponse(200, profile, "Enhanced career profile retrieved successfully")
  );
}));

// PUT /api/v1/enhanced-ai-career-coach/profile
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const updatedProfile = await EnhancedAICareerCoachService.updateCareerProfile(userId, profileData);

  // Re-vectorize the updated profile
  await EnhancedVectorDatabaseService.vectorizeUserProfile(userId, updatedProfile);

  return res.status(200).json(
    new ApiResponse(200, updatedProfile, "Enhanced career profile updated successfully")
  );
}));

// ==================== PROGRESS TRACKING ====================
// GET /api/v1/enhanced-ai-career-coach/progress
router.get('/progress', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Reuse the proven progress metrics logic from the legacy service to avoid
  // duplicated calculations.
  const progress = await EnhancedAICareerCoachService.getProgressMetrics(userId, AICareerCoachService);

  return res.status(200).json(
    new ApiResponse(200, progress, "Progress metrics retrieved successfully")
  );
}));

// ==================== SYSTEM HEALTH ====================
// GET /api/v1/enhanced-ai-career-coach/health
router.get('/health', asyncHandler(async (req, res) => {
  const health = await EnhancedAICareerCoachService.healthCheck();

  return res.status(200).json(
    new ApiResponse(200, health, "System health check completed")
  );
}));

// ==================== IVO - CONTEXT-AWARE CAREER COACH CHAT ====================
// POST /api/v1/enhanced-ai-career-coach/dev/chat
router.post('/dev/chat', asyncHandler(async (req, res) => {
  // Clear the default timeout for this route since LLM calls can take longer
  if (req.clearTimeout) req.clearTimeout();

  const userId = req.user._id;
  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json(new ApiResponse(400, { text: 'Please provide a message.' }, 'Invalid prompt'));
  }

  try {
    // Fetch user context for Ivo
    const [profile, roadmap] = await Promise.allSettled([
      UserCareerProfile.findOne({ user_id: userId }).lean(),
      UserCareerProfile.findOne({ user_id: userId }).select('progress_roadmap').lean()
    ]);

    const userProfile = profile.status === 'fulfilled' ? profile.value : null;
    const roadmapData = roadmap.status === 'fulfilled' ? roadmap.value?.progress_roadmap : null;

    // Build context string for Ivo
    const contextParts = [];
    if (userProfile?.persona_profile?.target_role) {
      contextParts.push(`Target Role: ${userProfile.persona_profile.target_role}`);
    }
    if (userProfile?.persona_profile?.current_level) {
      contextParts.push(`Current Level: ${userProfile.persona_profile.current_level}`);
    }
    if (userProfile?.resume_analysis?.skills_heat_map) {
      const topSkills = Object.keys(userProfile.resume_analysis.skills_heat_map)
        .sort((a, b) => userProfile.resume_analysis.skills_heat_map[b] - userProfile.resume_analysis.skills_heat_map[a])
        .slice(0, 10);
      if (topSkills.length > 0) {
        contextParts.push(`Top Skills: ${topSkills.join(', ')}`);
      }
    }
    if (roadmapData?.phases) {
      const currentPhase = roadmapData.phases.find(p => !p.completed);
      if (currentPhase) {
        contextParts.push(`Current Roadmap Phase: ${currentPhase.title}`);
      }
    }
    if (roadmapData?.weekly_hours_budget || userProfile?.persona_profile?.weekly_time) {
      contextParts.push(`Weekly Hours Available: ${roadmapData?.weekly_hours_budget || userProfile?.persona_profile?.weekly_time}`);
    }

    // Enhance prompt with context if available
    const enhancedPrompt = contextParts.length > 0
      ? `${prompt}\n\n[User Context: ${contextParts.join('; ')}]`
      : prompt;

    const result = await aiCoachSimpleChat(enhancedPrompt);

    // Always return a valid response structure
    if (result.error && !result.text) {
      result.text = 'I encountered an issue processing your request. Please try again.';
    }

    return res.status(200).json(new ApiResponse(200, result, 'Chat completed'));
  } catch (error) {
    console.error('Ivo chat error:', error);
    return res.status(200).json(new ApiResponse(200, {
      text: 'I encountered an error. Please try again.',
      error: error.message
    }, 'Chat error'));
  }
}));


// ==================== PROACTIVE SCHEDULER ====================
// GET /api/v1/enhanced-ai-career-coach/schedule
router.get('/schedule', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const scheduler = new ProactiveAnalysisScheduler();
  const schedule = await scheduler.scheduleAnalysis(userId);
  return res.status(200).json(new ApiResponse(200, schedule, 'Proactive schedule computed'));
}));

// POST /api/v1/enhanced-ai-career-coach/schedule/trigger
router.post('/schedule/trigger', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { analysisType = 'regular' } = req.body || {};
  const result = await EnhancedAICareerCoachService.generateProactiveRecommendations(userId, analysisType === 'urgent' ? 'proactive' : 'daily');
  return res.status(200).json(new ApiResponse(200, result, 'Scheduled analysis triggered'));
}));

// POST /api/v1/enhanced-ai-career-coach/kb/refresh?withResearch=true&query=...
router.post('/kb/refresh', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let updated;
  if (req.query.withResearch === 'true' && req.query.query) {
    try {
      const { getExternalResearchData } = await import('../utils/ai/research.service.js');
      const researchData = await getExternalResearchData({ query: String(req.query.query), limit: 5 });
      updated = await EnhancedAICareerCoachService.updateKnowledgeBase(userId, { researchData }, 'manual');
    } catch (e) {
      console.warn('Manual KB refresh with research failed, falling back:', e?.message || e);
      updated = await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
    }
  } else {
    updated = await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
  }

  return res.status(200).json(new ApiResponse(200, updated, 'Knowledge base refreshed'));
}));

// ==================== KB REFRESH (ADMIN/TEST) ====================
// POST /api/v1/enhanced-ai-career-coach/admin/refresh-kb
router.post('/admin/refresh-kb', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
  return res.status(200).json(new ApiResponse(200, result, 'Knowledge base refresh executed'));
}));

// ==================== JOURNAL PROCESSING ====================
// POST /api/v1/enhanced-ai-career-coach/process-journal
router.post('/process-journal', requireFeature('careerMemories'), asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { content, entryId } = req.body;

  if (!content) {
    throw new ApiError(400, 'Journal content is required');
  }

  // Validate entryId if provided
  if (entryId && !isValidObjectId(entryId)) {
    throw new ApiError(400, 'Invalid entryId format');
  }

  // Check if journal entry exists if entryId is provided
  let journalEntry = null;
  if (entryId) {
    journalEntry = await JournalEntry.findOne({
      $or: [
        { _id: entryId },
        { entry_id: entryId }
      ],
      user_id: userId
    });
    if (!journalEntry) {
      throw new ApiError(404, 'Journal entry not found');
    }
  }

  try {
    const processor = new JournalProcessor();
    const suggestions = await processor.generateCareerSuggestions(content);

    // Extract key themes from summary and suggestions
    const keyThemes = [];
    if (suggestions.summary) {
      // Extract key phrases from summary (simple extraction)
      const summaryWords = suggestions.summary.toLowerCase().split(/\s+/);
      // Add career-related keywords as themes
      if (summaryWords.some(w => ['career', 'job', 'work', 'professional'].includes(w))) {
        keyThemes.push('Career Development');
      }
      if (summaryWords.some(w => ['skill', 'learn', 'training', 'education'].includes(w))) {
        keyThemes.push('Skill Development');
      }
      if (summaryWords.some(w => ['goal', 'plan', 'future', 'aspiration'].includes(w))) {
        keyThemes.push('Career Goals');
      }
    }
    // Add titles from career suggestions as themes
    if (suggestions.careerSuggestions && suggestions.careerSuggestions.length > 0) {
      suggestions.careerSuggestions.forEach(s => {
        if (s.title && !keyThemes.includes(s.title)) {
          keyThemes.push(s.title);
        }
      });
    }
    // Add skills as themes
    if (suggestions.skillsIdentified && suggestions.skillsIdentified.length > 0) {
      keyThemes.push(...suggestions.skillsIdentified.slice(0, 5));
    }

    // Prepare recommendation data
    const recommendationData = {
      user: userId,
      source: 'journal',
      sourceId: entryId || journalEntry?._id,
      type: 'career_suggestion',
      content: {
        summary: suggestions.summary,
        skills: suggestions.skillsIdentified || [],
        suggestions: suggestions.careerSuggestions || [],
        actionItems: suggestions.actionItems || []
      },
      metadata: {
        model: 'claude-3-haiku',
        version: '1.0',
        processedAt: new Date()
      }
    };

    // Check if a recommendation already exists for this entry
    let recommendation;
    const sourceId = entryId || journalEntry?._id;
    if (sourceId) {
      recommendation = await CareerRecommendation.findOneAndUpdate(
        { user: userId, source: 'journal', sourceId: sourceId },
        { $set: recommendationData },
        { new: true, upsert: true }
      );
    } else {
      // If no entryId, create a new recommendation
      recommendation = new CareerRecommendation(recommendationData);
      await recommendation.save();
    }

    // Update the journal entry with AI insights (key_themes, summary, etc.)
    if (journalEntry) {
      await JournalEntry.findByIdAndUpdate(
        journalEntry._id,
        {
          $set: {
            'ai_insights.key_themes': keyThemes.slice(0, 10), // Limit to 10 themes
            'ai_insights.action_items': suggestions.actionItems || [],
            'ai_insights.summary': suggestions.summary || '', // Store the summary
            'metadata.topics': keyThemes.slice(0, 10),
            'ai_insights.processing_status': 'completed',
            'ai_insights.last_processed': new Date()
          },
          $addToSet: { 'ai_insights.recommendations': recommendation._id }
        },
        { new: true }
      );
    }

    // Save to Knowledge Base (processed insights) after processing
    try {
      await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
      console.log(`[KB] Successfully updated knowledge base with processed journal entry for user ${userId}`);
    } catch (kbErr) {
      console.warn('[KB] Failed to persist processed journal to knowledge base:', kbErr?.message || kbErr);
      // Don't fail the request if KB update fails
    }

    return res.status(200).json(
      new ApiResponse(200, {
        recommendation,
        success: true,
        message: 'Journal processed successfully'
      })
    );
  } catch (error) {
    console.error('Error processing journal:', error);

    // Update journal entry with error status if entryId exists
    if (entryId) {
      await Journal.findByIdAndUpdate(
        entryId,
        {
          'ai_insights.processing_status': 'error',
          'ai_insights.error': error.message,
          'ai_insights.last_processed': new Date()
        },
        { new: true }
      ).catch(console.error);
    }

    throw new ApiError(500, `Failed to process journal entry: ${error.message}`);
  }
}));

// ==================== ADMIN ENDPOINTS ====================
// POST /api/v1/enhanced-ai-career-coach/admin/run-market-analysis
router.post('/admin/run-market-analysis', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  const result = await MarketIntelligenceService.runFullMarketAnalysis();

  return res.status(200).json(
    new ApiResponse(200, result, "Market analysis completed successfully")
  );
}));

// POST /api/v1/enhanced-ai-career-coach/admin/generate-all-recommendations
router.post('/admin/generate-all-recommendations', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  const { type = 'daily' } = req.body;

  // Get all active users and generate recommendations
  const activeUsers = await EnhancedVectorDatabaseService.getActiveUsers();
  const results = [];

  for (const userId of activeUsers) {
    try {
      const result = await EnhancedAICareerCoachService.generateProactiveRecommendations(userId, type);
      results.push({ userId, success: true, count: result.count });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { results, total_users: activeUsers.length }, "Bulk recommendation generation completed")
  );
}));

// GET /api/v1/enhanced-ai-career-coach/admin/stats
router.get('/admin/stats', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  const vectorDBHealth = await EnhancedVectorDatabaseService.healthCheck();
  const marketIntelligenceHealth = await MarketIntelligenceService.getMarketInsights('test', 1);

  const stats = {
    vector_database: vectorDBHealth,
    market_intelligence: {
      status: marketIntelligenceHealth.results ? 'healthy' : 'unhealthy',
      last_analysis: new Date().toISOString()
    },
    system_uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(
    new ApiResponse(200, stats, "System statistics retrieved successfully")
  );
}));

// Check roadmap generation status
router.get('/roadmap/status', asyncHandler(async (req, res) => {
  const user = await (await import('../models/user.model.js')).User.findById(req.user._id).select('aiCoachState.roadmapStatus');
  return res.status(200).json(
    new ApiResponse(200, { status: user?.aiCoachState?.roadmapStatus || 'idle' }, "Roadmap status retrieved")
  );
}));

// POST /api/v1/enhanced-ai-career-coach/roadmap/check-skills
// Check and validate skills in roadmap using Lightcast and Serper
router.post('/roadmap/check-skills', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { phaseIndex, milestoneId } = req.body;

  try {
    const { default: SkillRequirementChecker } = await import('../../services/SkillRequirementChecker.service.js');
    const checker = new SkillRequirementChecker(process.env.SERPER_API_KEY);

    const roadmap = await EnhancedAICareerCoachService.getCareerRoadmap(userId);
    if (!roadmap || !roadmap.phases) {
      throw new ApiError(404, 'Roadmap not found');
    }

    // Check specific phase if provided
    if (typeof phaseIndex === 'number' && roadmap.phases[phaseIndex]) {
      const phaseCheck = await checker.checkPhaseSkills(roadmap.phases[phaseIndex], roadmap.targetRole || roadmap.target_role);
      return res.status(200).json(
        new ApiResponse(200, phaseCheck, 'Phase skills checked successfully')
      );
    }

    // Check all phases
    const enrichedRoadmap = await checker.checkRoadmapSkills(roadmap);
    return res.status(200).json(
      new ApiResponse(200, { roadmap: enrichedRoadmap }, 'Roadmap skills checked successfully')
    );
  } catch (error) {
    console.error('[Roadmap] Skill check error:', error);
    throw new ApiError(500, error.message || 'Failed to check roadmap skills');
  }
}));

export default router;
