import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import EnhancedAICareerCoachService from '../utils/ai/enhancedAICareerCoach.service.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/ai-recommendations/process-journal
 * @desc    Process a journal entry and generate recommendations
 * @access  Private
 */
router.post('/process-journal', asyncHandler(async (req, res) => {
  const { content, entryId } = req.body;
  const userId = req.user._id;

  if (!content) {
    throw new ApiError(400, 'Journal content is required');
  }

  // Process the journal entry
  const analysis = await EnhancedAICareerCoachService.analyzeJournalEntryWithMarketContext(
    content,
    userId
  );

  // Generate recommendations based on the analysis
  const recommendations = await EnhancedAICareerCoachService.generateProactiveRecommendations(
    userId,
    'journal-triggered'
  );

  // Update the journal entry with the analysis
  if (entryId) {
    await EnhancedAICareerCoachService.updateJournalEntry(entryId, {
      'ai_insights.analysis': analysis,
      'ai_insights.recommendations': recommendations,
      'ai_insights.processed_at': new Date()
    });
  }

  // Emit real-time update to the client
  if (req.app.get('io')) {
    req.app.get('io').to(`user_${userId}`).emit('new_recommendations', {
      type: 'new_recommendations',
      recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
      count: Array.isArray(recommendations) ? recommendations.length : 1
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { analysis, recommendations }, 'Journal processed successfully')
  );
}));

export default router;
