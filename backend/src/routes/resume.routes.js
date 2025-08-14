import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import n8nSessionHandler from '../utils/n8nSessionHandler.js';
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

    // Send to n8n with automatic session handling
    const result = await n8nSessionHandler.sendToN8n(
      'https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1',
      n8nData
    );

    console.log('[Resume Route] n8n response:', result);
    res.json({ n8n: result });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ error: 'Resume analysis failed' });
  }
});

export default router; 