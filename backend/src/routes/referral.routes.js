import express from 'express';
import { trackReferral, getReferralStats } from '../controllers/referral.controller.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Generate referral link
router.post('/generate', (req, res) => {
  console.log('Generate referral link route hit');
  res.status(200).json({ message: 'Coming soon' });
});

// Track new referral
router.post('/track', trackReferral);

// Get referral statistics
router.get('/stats', isAuthenticated, getReferralStats);

export default router;
