import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
// Removed n8n session handler import - now using direct AI integration
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireFeatureAccess, trackFeatureUsage } from '../middlewares/featureAccess.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze-resume', 
  verifyJWT,
  requireFeatureAccess('resumeScoringCards'),
  trackFeatureUsage(),
  upload.single('resume'), 
  async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Use original file name for extension
    const ext = path.extname(file.originalname).toLowerCase();
    console.log('[Resume Route] Uploaded file:', file.originalname, 'ext:', ext);

    let text = '';
    if (ext === '.docx') {
      const buffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === '.pdf') {
      const buffer = fs.readFileSync(file.path);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      console.error('[Resume Route] Unsupported file type:', ext);
      throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
    }

    // Use the simple session handler
    const n8nData = {
      resume: text,
      userId: req.body.userId,
      skills: req.body.skills,
      experience: req.body.experience,
    };

    // Direct AI analysis instead of n8n
    const { default: EnhancedAICareerCoach } = await import('../utils/ai/enhancedAICareerCoach.service.js');
    const aiCoach = new EnhancedAICareerCoach();
    
    const result = await aiCoach.analyzeResumeContent(text, req.body.userId, {
      skills: req.body.skills,
      experience: req.body.experience
    });

    console.log('[Resume Route] AI analysis response:', result);
    res.json({ analysis: result });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ error: 'Resume analysis failed' });
  }
});

export default router; 