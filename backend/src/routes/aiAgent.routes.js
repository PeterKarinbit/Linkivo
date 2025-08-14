import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import AIAgentService from '../utils/ai/aiAgent.service.js';

const router = express.Router();

// Main AI Agent workflow endpoint
router.post('/process-webhook', asyncHandler(async (req, res) => {
  const webhookData = req.body;
  
  if (!webhookData.resume || !webhookData.userId) {
    throw new ApiError(400, "Resume and userId are required");
  }

  const results = await AIAgentService.processWebhookData(webhookData);
  
  return res.status(200).json(
    new ApiResponse(200, results, "AI Agent workflow completed successfully")
  );
}));

// User consent endpoints
router.post('/consent/resume-refactor', asyncHandler(async (req, res) => {
  const { userId, jobId, consent } = req.body;
  
  if (!userId || !jobId || consent === undefined) {
    throw new ApiError(400, "userId, jobId, and consent are required");
  }

  // TODO: Store user consent in database
  const consentResult = {
    userId,
    jobId,
    consent,
    timestamp: new Date(),
    action: 'resume_refactor'
  };

  return res.status(200).json(
    new ApiResponse(200, consentResult, "Consent recorded successfully")
  );
}));

router.post('/consent/send-email', asyncHandler(async (req, res) => {
  const { userId, jobId, recipientEmail, consent } = req.body;
  
  if (!userId || !jobId || !recipientEmail || consent === undefined) {
    throw new ApiError(400, "userId, jobId, recipientEmail, and consent are required");
  }

  if (!consent) {
    return res.status(200).json(
      new ApiResponse(200, { action: 'manual_apply' }, "User chose manual application")
    );
  }

  // TODO: Send email via Gmail API
  const emailResult = {
    userId,
    jobId,
    recipientEmail,
    sent: true,
    timestamp: new Date(),
    messageId: 'mock_email_id_' + Date.now()
  };

  return res.status(200).json(
    new ApiResponse(200, emailResult, "Application email sent successfully")
  );
}));

// Application tracking
router.post('/track-application', asyncHandler(async (req, res) => {
  const {
    userId,
    jobId,
    jobTitle,
    companyName,
    applicationMethod,
    status,
    notes
  } = req.body;

  if (!userId || !jobId || !jobTitle || !companyName) {
    throw new ApiError(400, "userId, jobId, jobTitle, and companyName are required");
  }

  // TODO: Store application in database
  const application = {
    _id: 'mock_app_' + Date.now(),
    userId,
    jobId,
    jobTitle,
    companyName,
    applicationMethod: applicationMethod || 'manual',
    status: status || 'applied',
    appliedAt: new Date(),
    notes,
    lastUpdated: new Date()
  };

  return res.status(201).json(
    new ApiResponse(201, application, "Application tracked successfully")
  );
}));

// Get user's application insights
router.get('/insights/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // TODO: Get real insights from database
  const insights = {
    totalApplications: 5,
    responseRate: 60,
    averageCompatibilityScore: 75,
    topSkills: ['JavaScript', 'React', 'Node.js'],
    improvementAreas: ['TypeScript', 'AWS'],
    successRate: 40,
    recentActivity: [
      {
        date: new Date(),
        action: 'Applied to Software Engineer at Tech Corp',
        status: 'Under Review'
      }
    ]
  };

  return res.status(200).json(
    new ApiResponse(200, insights, "Application insights retrieved successfully")
  );
}));

// Monetization gate checks
router.get('/monetization-gates/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // TODO: Check user's subscription plan
  const gates = {
    plan: 'free',
    features: {
      autoSend: false,
      unlimitedApplications: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customTemplates: false
    },
    limits: {
      applicationsPerMonth: 5,
      aiRefactorsPerMonth: 3,
      coverLettersPerMonth: 3
    },
    upgradeUrl: '/upgrade'
  };

  return res.status(200).json(
    new ApiResponse(200, gates, "Monetization gates retrieved successfully")
  );
}));

// Download generated documents
router.get('/download/:type/:jobId', asyncHandler(async (req, res) => {
  const { type, jobId } = req.params;
  
  if (!['resume', 'cover-letter'].includes(type)) {
    throw new ApiError(400, "Invalid document type. Use 'resume' or 'cover-letter'");
  }

  // TODO: Get actual documents from storage
  const mockContent = type === 'resume' 
    ? 'Mock Resume PDF Content' 
    : 'Mock Cover Letter PDF Content';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_${jobId}.pdf"`);
  res.send(Buffer.from(mockContent));
}));

// Follow-up reminder generation
router.post('/follow-up/:applicationId', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { daysSinceApplied } = req.body;

  // TODO: Generate follow-up email content
  const followUpContent = `Dear Hiring Manager,

I hope this email finds you well. I wanted to follow up on my application for the [Position] role at [Company] that I submitted on [Date].

I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience align with your team's needs.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  return res.status(200).json(
    new ApiResponse(200, { 
      followUpContent,
      suggestedSendDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }, "Follow-up content generated successfully")
  );
}));

export default router; 