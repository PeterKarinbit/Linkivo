import express from 'express';
import { handleClerkWebhook } from '../controllers/clerkWebhook.controller.js';

const createClerkRoutes = () => {
    const router = express.Router();

    // Webhook endpoint - NO auth middleware (Clerk verifies via signature)
    // Note: Raw body middleware must be applied in main app BEFORE this route
    router.post('/webhooks/clerk', handleClerkWebhook);

    return router;
};

export default createClerkRoutes;
