import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get available templates
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = {
    resumeTemplates: {
      modern: { name: 'Modern Professional', description: 'Clean, ATS-friendly format' },
      executive: { name: 'Executive Level', description: 'Senior-level format' },
      creative: { name: 'Creative Professional', description: 'Innovative design format' },
      technical: { name: 'Technical Specialist', description: 'Tech-focused format' }
    },
    coverLetterTemplates: {
      standard: { name: 'Standard Professional', description: 'Traditional cover letter format' },
      creative: { name: 'Creative Approach', description: 'Innovative and engaging cover letter' },
      technical: { name: 'Technical Focus', description: 'Technical cover letter emphasizing skills' }
    }
  };
  
  return res.status(200).json(
    new ApiResponse(200, templates, "Templates retrieved successfully")
  );
}));

// Analyze resume for job match
router.post('/analyze-resume', upload.single('resume'), asyncHandler(async (req, res) => {
  const { jobDescription, jobTitle, companyName } = req.body;
  const file = req.file;
  
  if (!file || !jobDescription) {
    throw new ApiError(400, "Resume file and job description are required");
  }

  // Extract text from file
  let resumeText = '';
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.docx') {
    const buffer = fs.readFileSync(file.path);
    const result = await mammoth.extractRawText({ buffer });
    resumeText = result.value;
  } else if (ext === '.pdf') {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    resumeText = data.text;
  } else {
    throw new ApiError(400, "Unsupported file type. Please upload a PDF or DOCX.");
  }

  // Clean up file
  fs.unlinkSync(file.path);

  // Mock analysis for now
  const analysis = {
    missingSkills: ["React", "TypeScript", "AWS"],
    matchingSkills: ["JavaScript", "Node.js", "MongoDB"],
    suggestions: ["Learn React to increase your job matches by 40%", "Add TypeScript to your skill set"],
    matchPercentage: 65,
    keyImprovements: ["Update resume format", "Add more technical keywords"]
  };

  return res.status(200).json(
    new ApiResponse(200, analysis, "Resume analysis completed successfully")
  );
}));

// Refactor resume - Handle FormData
router.post('/refactor-resume', upload.single('resume'), asyncHandler(async (req, res) => {
  const { jobDescription, templateType } = req.body;
  const file = req.file;
  
  if (!file || !jobDescription) {
    throw new ApiError(400, "Resume file and job description are required");
  }

  // Extract text from file
  let originalResume = '';
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.docx') {
    const buffer = fs.readFileSync(file.path);
    const result = await mammoth.extractRawText({ buffer });
    originalResume = result.value;
  } else if (ext === '.pdf') {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    originalResume = data.text;
  } else {
    throw new ApiError(400, "Unsupported file type. Please upload a PDF or DOCX.");
  }

  // Clean up file
  fs.unlinkSync(file.path);

  // Mock refactored resume for now
  const result = {
    refactoredResume: `REFACTORED RESUME (${templateType || 'modern'})\n\n${originalResume}\n\nEnhanced with professional language and improved formatting for the target role.`,
    improvements: ["Enhanced professional language", "Improved formatting", "Added relevant keywords"],
    template: templateType || "Modern Professional"
  };
  
  return res.status(200).json(
    new ApiResponse(200, result, "Resume refactored successfully")
  );
}));

// Generate cover letter - Handle FormData
router.post('/generate-cover-letter', upload.single('resume'), asyncHandler(async (req, res) => {
  const { jobDescription, companyName, jobTitle, templateType } = req.body;
  const file = req.file;
  
  if (!file || !jobDescription || !companyName || !jobTitle) {
    throw new ApiError(400, "Resume file, job description, company name, and job title are required");
  }

  // Extract text from file
  let resumeText = '';
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.docx') {
    const buffer = fs.readFileSync(file.path);
    const result = await mammoth.extractRawText({ buffer });
    resumeText = result.value;
  } else if (ext === '.pdf') {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    resumeText = data.text;
  } else {
    throw new ApiError(400, "Unsupported file type. Please upload a PDF or DOCX.");
  }

  // Clean up file
  fs.unlinkSync(file.path);

  // Mock cover letter for now
  const coverLetter = `Dear Hiring Manager,\n\nI am writing to express my interest in the ${jobTitle} position at ${companyName}. Based on my experience and the job requirements, I believe I would be a great fit for this role.\n\n${resumeText.substring(0, 200)}...\n\nI look forward to discussing how my skills and experience can contribute to your team.\n\nSincerely,\n[Your Name]`;
  
  return res.status(200).json(
    new ApiResponse(200, { coverLetter }, "Cover letter generated successfully")
  );
}));

// Generate PDF
router.post('/generate-pdf', asyncHandler(async (req, res) => {
  const { type, data, templateType } = req.body;
  
  if (!type || !data) {
    throw new ApiError(400, "Type and data are required");
  }

  // Mock PDF generation for now
  let mockPdfContent = '';
  
  if (type === 'resume') {
    mockPdfContent = `Mock Resume PDF\n\nName: ${data.personalInfo?.name || 'Your Name'}\nEmail: ${data.personalInfo?.email || 'your.email@example.com'}\n\n${data.summary || 'Resume content'}`;
  } else if (type === 'cover-letter') {
    mockPdfContent = `Mock Cover Letter PDF\n\nDate: ${data.date || new Date().toLocaleDateString()}\nTo: ${data.recipientName || 'Hiring Manager'}\nCompany: ${data.companyName || 'Company'}\n\n${data.content || 'Cover letter content'}`;
  } else {
    throw new ApiError(400, "Invalid PDF type. Use 'resume' or 'cover-letter'");
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.pdf"`);
  res.send(Buffer.from(mockPdfContent));
}));

// Create job application
router.post('/create-application', asyncHandler(async (req, res) => {
  const {
    jobId,
    jobTitle,
    companyName,
    jobDescription,
    jobUrl,
    applicationMethod,
    originalResume,
    refactoredResume,
    coverLetter,
    skillMatchPercentage,
    matchingSkills,
    missingSkills,
    aiSuggestions
  } = req.body;

  if (!jobTitle || !companyName || !jobDescription) {
    throw new ApiError(400, "Job title, company name, and job description are required");
  }

  // Mock application creation for now
  const application = {
    _id: 'mock_application_id_' + Date.now(),
    jobId,
    jobTitle,
    companyName,
    jobDescription,
    jobUrl,
    applicationMethod: applicationMethod || 'manual',
    status: 'pending',
    createdAt: new Date(),
    skillMatchPercentage,
    matchingSkills,
    missingSkills,
    aiSuggestions
  };

  return res.status(201).json(
    new ApiResponse(201, application, "Application created successfully")
  );
}));

// Send job application via email
router.post('/send-application', asyncHandler(async (req, res) => {
  const { applicationId, recipientEmail, recipientName, recipientTitle } = req.body;
  
  if (!applicationId || !recipientEmail) {
    throw new ApiError(400, "Application ID and recipient email are required");
  }

  // Mock email sending for now
  const emailResult = {
    success: true,
    messageId: 'mock_email_id_' + Date.now(),
    timestamp: new Date().toISOString(),
    method: 'mock'
  };

  return res.status(200).json(
    new ApiResponse(200, { 
      application: { _id: applicationId, status: 'applied' },
      emailResult 
    }, "Application sent successfully")
  );
}));

// Get user applications
router.get('/my-applications', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Mock applications for now
  const applications = [
    {
      _id: 'mock_app_1',
      jobTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      status: 'applied',
      appliedAt: new Date(),
      skillMatchPercentage: 75
    }
  ];

  return res.status(200).json(
    new ApiResponse(200, {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 1,
        pages: 1
      }
    }, "Applications retrieved successfully")
  );
}));

// Get application statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = {
    total: 1,
    applied: 1,
    underReview: 0,
    interviews: 0,
    accepted: 0,
    rejected: 0,
    avgSkillMatch: 75,
    avgTimeToApply: 30
  };
  
  return res.status(200).json(
    new ApiResponse(200, stats, "Statistics retrieved successfully")
  );
}));

// Update application status
router.patch('/:applicationId/status', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, notes } = req.body;

  // Mock status update
  const application = {
    _id: applicationId,
    status,
    notes,
    lastUpdated: new Date()
  };

  return res.status(200).json(
    new ApiResponse(200, application, "Application status updated successfully")
  );
}));

export default router; 