import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { 
  UserCareerProfile, 
  JournalEntry, 
  KnowledgeBase, 
  AIRecommendation,
  WebhookLog 
} from '../models/aiCareerCoach.model.js';
import AICareerCoachService from '../utils/ai/aiCareerCoach.service.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// ==================== RESUME PROCESSING ====================
// POST /api/v1/ai-career-coach/analyze-resume
router.post('/analyze-resume', asyncHandler(async (req, res) => {
  const { resumeFile } = req.body;
  const userId = req.user._id;

  if (!resumeFile) {
    throw new ApiError(400, "Resume file is required");
  }

  const analysis = await AICareerCoachService.analyzeResume(resumeFile, userId);
  
  return res.status(200).json(
    new ApiResponse(200, analysis, "Resume analysis completed successfully")
  );
}));

// ==================== JOURNAL MANAGEMENT ====================
// POST /api/v1/ai-career-coach/journal
router.post('/journal', asyncHandler(async (req, res) => {
  const { content, entry_date, tags } = req.body;
  const userId = req.user._id;

  // Input validation
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new ApiError(400, "Journal content is required and cannot be empty");
  }

  if (content.length > 5000) {
    throw new ApiError(400, "Journal content must not exceed 5000 characters");
  }

  // Validate entry_date if provided
  if (entry_date && isNaN(Date.parse(entry_date))) {
    throw new ApiError(400, "Invalid entry date format");
  }

  // Validate tags if provided
  if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
    throw new ApiError(400, "Tags must be an array of strings");
  }

  const journalEntry = await AICareerCoachService.createJournalEntry({
    userId,
    content,
    entry_date: entry_date || new Date(),
    tags: tags || []
  });

  return res.status(201).json(
    new ApiResponse(201, journalEntry, "Journal entry created successfully")
  );
}));

// GET /api/v1/ai-career-coach/journal?page=1&limit=10
router.get('/journal', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  const journalEntries = await AICareerCoachService.getJournalEntries({
    userId,
    page,
    limit,
    search
  });

  return res.status(200).json(
    new ApiResponse(200, journalEntries, "Journal entries retrieved successfully")
  );
}));

// GET /api/v1/ai-career-coach/journal/:entryId
router.get('/journal/:entryId', asyncHandler(async (req, res) => {
  const { entryId } = req.params;
  const userId = req.user._id;

  const journalEntry = await AICareerCoachService.getJournalEntry(entryId, userId);

  return res.status(200).json(
    new ApiResponse(200, journalEntry, "Journal entry retrieved successfully")
  );
}));

// ==================== AI RECOMMENDATIONS ====================
// GET /api/v1/ai-career-coach/recommendations?type=daily|weekly|milestone
router.get('/recommendations', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const type = req.query.type || 'all';
  const limit = parseInt(req.query.limit) || 10;

  const recommendations = await AICareerCoachService.getRecommendations({
    userId,
    type,
    limit
  });

  return res.status(200).json(
    new ApiResponse(200, recommendations, "Recommendations retrieved successfully")
  );
}));

// POST /api/v1/ai-career-coach/recommendations/:recommendationId/complete
router.post('/recommendations/:recommendationId/complete', asyncHandler(async (req, res) => {
  const { recommendationId } = req.params;
  const userId = req.user._id;
  const { feedback } = req.body;

  const result = await AICareerCoachService.completeRecommendation({
    recommendationId,
    userId,
    feedback
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Recommendation completed successfully")
  );
}));

// ==================== KNOWLEDGE BASE ====================
// GET /api/v1/ai-career-coach/knowledge-base?category=skills|interview|networking&limit=10
router.get('/knowledge-base', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const category = req.query.category || 'all';
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  const knowledgeItems = await AICareerCoachService.getKnowledgeBase({
    userId,
    category,
    limit,
    search
  });

  return res.status(200).json(
    new ApiResponse(200, knowledgeItems, "Knowledge base items retrieved successfully")
  );
}));

// GET /api/v1/ai-career-coach/memories
router.get('/memories', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const search = req.query.search;
  const limit = parseInt(req.query.limit) || 20;

  // Memories are user-synthesized items stored in KnowledgeBase with source_url user://journal
  const query = { source_url: 'user://journal' };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { relevance_tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  const items = await KnowledgeBase.find(query).sort({ last_updated: -1 }).limit(limit);
  return res.status(200).json(new ApiResponse(200, { items }, 'Memories loaded'));
}));

// POST /api/v1/ai-career-coach/memories/backfill
router.post('/memories/backfill', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 50 } = req.body || {};
  const entries = await JournalEntry.find({ user_id: userId }).sort({ 'metadata.date': -1 }).limit(limit);
  let created = 0;
  for (const entry of entries) {
    const analysis = {
      sentiment: entry.metadata?.sentiment,
      topics: entry.metadata?.topics,
      key_themes: entry.ai_insights?.key_themes
    };
    const item = await AICareerCoachService.createKnowledgeMemoryFromJournal({
      userId,
      content: entry.content,
      analysis
    });
    if (item) created++;
  }
  return res.status(200).json(new ApiResponse(200, { created }, 'Backfill completed'));
}));

// ==================== CAREER PROFILE ====================
// GET /api/v1/ai-career-coach/profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await AICareerCoachService.getCareerProfile(userId);

  return res.status(200).json(
    new ApiResponse(200, profile, "Career profile retrieved successfully")
  );
}));

// PUT /api/v1/ai-career-coach/profile
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profileData = req.body;

  const updatedProfile = await AICareerCoachService.updateCareerProfile(userId, profileData);

  return res.status(200).json(
    new ApiResponse(200, updatedProfile, "Career profile updated successfully")
  );
}));

// ==================== GOAL SETTING ====================
// POST /api/v1/ai-career-coach/goals
router.post('/goals', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { careerGoals } = req.body;

  if (!careerGoals) {
    throw new ApiError(400, "Career goals are required");
  }

  const result = await AICareerCoachService.setCareerGoals(userId, careerGoals);

  return res.status(201).json(
    new ApiResponse(201, result, "Career goals set successfully")
  );
}));

// ==================== ONBOARDING ====================
// POST /api/v1/ai-career-coach/initialize
router.post('/initialize', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { resumeData, journalEntry, careerGoals, consent } = req.body;

  if (!resumeData || !journalEntry || !careerGoals || !consent) {
    throw new ApiError(400, "All onboarding data is required");
  }

  const result = await AICareerCoachService.initializeUserProfile({
    userId,
    resumeData,
    journalEntry,
    careerGoals,
    consent
  });

  return res.status(201).json(
    new ApiResponse(201, result, "AI Career Coach initialized successfully")
  );
}));

// ==================== PROGRESS TRACKING ====================
// GET /api/v1/ai-career-coach/progress
router.get('/progress', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const progress = await AICareerCoachService.getProgressMetrics(userId);

  return res.status(200).json(
    new ApiResponse(200, progress, "Progress metrics retrieved successfully")
  );
}));

// ==================== N8N WEBHOOK ENDPOINTS ====================
// POST /api/v1/ai-career-coach/webhook/initialize
router.post('/webhook/initialize', asyncHandler(async (req, res) => {
  const { userId, resumeData, journalEntry, careerGoals, timestamp } = req.body;

  if (!userId || !resumeData || !journalEntry || !careerGoals) {
    throw new ApiError(400, "Required webhook data is missing");
  }

  // Log webhook request
  const webhookLog = new WebhookLog({
    webhook_id: `init_${Date.now()}`,
    user_id: userId,
    event_type: 'resume_analysis',
    payload: { resumeData, journalEntry, careerGoals, timestamp },
    status: 'processing'
  });
  await webhookLog.save();

  // Trigger N8N workflow
  const result = await AICareerCoachService.triggerInitializationWorkflow({
    userId,
    resumeData,
    journalEntry,
    careerGoals,
    webhookLogId: webhookLog._id
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Initialization workflow triggered successfully")
  );
}));

// POST /api/v1/ai-career-coach/webhook/journal-processing
router.post('/webhook/journal-processing', asyncHandler(async (req, res) => {
  const { userId, journalEntry, analysis } = req.body;

  if (!userId || !journalEntry || !analysis) {
    throw new ApiError(400, "Required webhook data is missing");
  }

  const result = await AICareerCoachService.processJournalEntry({
    userId,
    journalEntry,
    analysis
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Journal processing completed successfully")
  );
}));

// POST /api/v1/ai-career-coach/webhook/knowledge-scraping
router.post('/webhook/knowledge-scraping', asyncHandler(async (req, res) => {
  const { userId, scrapedContent, category } = req.body;

  if (!userId || !scrapedContent || !category) {
    throw new ApiError(400, "Required webhook data is missing");
  }

  const result = await AICareerCoachService.processScrapedContent({
    userId,
    scrapedContent,
    category
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Knowledge scraping completed successfully")
  );
}));

// ==================== ANALYTICS & INSIGHTS ====================
// GET /api/v1/ai-career-coach/insights
router.get('/insights', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timeframe = req.query.timeframe || '30d';

  const insights = await AICareerCoachService.getUserInsights(userId, timeframe);

  return res.status(200).json(
    new ApiResponse(200, insights, "User insights retrieved successfully")
  );
}));

// ==================== ADMIN ENDPOINTS ====================
// GET /api/v1/ai-career-coach/admin/stats
router.get('/admin/stats', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  const stats = await AICareerCoachService.getSystemStats();

  return res.status(200).json(
    new ApiResponse(200, stats, "System statistics retrieved successfully")
  );
}));

// POST /api/v1/ai-career-coach/admin/generate-recommendations
router.post('/admin/generate-recommendations', asyncHandler(async (req, res) => {
  // TODO: Add admin authentication
  const { userId, type } = req.body;

  const result = await AICareerCoachService.generateProactiveRecommendations({
    userId,
    type
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Proactive recommendations generated successfully")
  );
}));

export default router;
