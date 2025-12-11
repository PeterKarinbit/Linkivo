import { Router } from 'express';
import jobRoutes from './jobs.routes.js';
import userRoutes from './user.routes.js';
import companyRoutes from './company.routes.js';
import applicationRoutes from './application.routes.js';
import resumeRoutes from './resume.routes.js';
import aiAgentRoutes from './aiAgent.routes.js';
import debugRoutes from './debug.routes.js';
import enhancedAICoachRoutes from './enhancedAICareerCoach.routes.js';
import aiRecommendationsRoutes from './aiRecommendations.routes.js';

const router = Router();

// API routes
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/applications', applicationRoutes);
router.use('/resumes', resumeRoutes);
router.use('/ai', aiAgentRoutes);
router.use('/debug', debugRoutes);
router.use('/enhanced-ai-career-coach', enhancedAICoachRoutes);
router.use('/api/v1/ai-recommendations', aiRecommendationsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
