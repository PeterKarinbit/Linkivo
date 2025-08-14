import { Router } from "express";
import { searchJobs } from "../controllers/job.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes defined here are prefixed with /api/v1/jobs

// Secured route - only logged-in users can search for jobs
router.route("/search").post(verifyJWT, searchJobs);

export default router;
