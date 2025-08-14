import { Router } from "express";
import {
  Ping,
  AuthPing,
  GetJobs,
  GetJobById,
  PostJob,
  SendJobDescription,
  ApplyForJob,
  SaveJob,
  RemoveSavedJob,
  GetJobLocations,
  GetCompanies,
  ScrapeLinkedInJobs,
  ExchangeRates,
  JobSearchHandler,
  adzunaJobSearch,
  RecommendJobsHandler,
  extractSalaryAndSkillsHandler,
  BatchRecommendJobsHandler,
} from "../controllers/job.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
// Ping routers
router.route("/ping").get(Ping);
router.route("/auth-ping").get(verifyJWT, AuthPing);
//
router.route("/jobs").get(GetJobs);
router.route("/jobs/:id?").get(GetJobById);
router.route("/jobs").post(verifyJWT, PostJob);
router.route("/generate-job-description").post(verifyJWT, SendJobDescription);
router.route("/apply/:id?").post(verifyJWT, ApplyForJob);
router.route("/save/:id?").post(verifyJWT, SaveJob);
router.route("/remove-saved-job/:id?").delete(verifyJWT, RemoveSavedJob);
router.route("/job-locations").get(GetJobLocations);
router.route("/companies").get(GetCompanies);
router.route("/scrape-linkedin-jobs").get(ScrapeLinkedInJobs);
router.route("/exchange-rates").get(ExchangeRates);
router.route("/jsearch").get(JobSearchHandler);
router.route("/adzuna-jobs").get(adzunaJobSearch);
router.post("/recommend", RecommendJobsHandler);
router.post("/extract-salary-skills", extractSalaryAndSkillsHandler);
router.post("/batch-recommend", BatchRecommendJobsHandler);
router.get('/adzuna-test', (req, res) => res.send('Adzuna test route works!'));

// Add new route for job scraping
router.post('/job-scrape', async (req, res) => {
  try {
    const { skills, locations = [], results_wanted = 50, sites = ["linkedin", "indeed"] } = req.body;
    if (!skills || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skills and at least one location are required' 
      });
    }
    // If 'ALL' is present or locations is empty, do a global search (no location filter)
    const isGlobal = locations.includes('ALL') || locations.length === 0;
    const scriptPath = path.join(__dirname, '../../job_scraper_v4.py');
    // Helper to run the script for a given location
    const runScraper = (location) => new Promise((resolve, reject) => {
      const args = [
      scriptPath,
      '--search-term', skills,
      '--results-wanted', results_wanted.toString(),
      '--sites', ...sites
      ];
      if (!isGlobal) {
        args.push('--location', location);
        // Add country for Indeed searches
        if (locations.length > 0 && locations[0] !== 'ALL') {
          args.push('--country-indeed', locations[0]);
        }
      }
      const pythonProcess = spawn('python3', args, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    let output = '';
    let errorOutput = '';
      pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
          return reject(errorOutput);
      }
      try {
        const result = JSON.parse(output);
          resolve(result.jobs || []);
        } catch (err) {
          reject(err);
        }
      });
      pythonProcess.on('error', (err) => reject(err));
    });
    let allJobs = [];
    if (isGlobal) {
      // Global search: no location filter
      allJobs = await runScraper('');
    } else if (locations.length === 1) {
      allJobs = await runScraper(locations[0]);
    } else {
      // Multiple countries: run in parallel and combine
      const results = await Promise.all(locations.map(loc => runScraper(loc)));
      allJobs = results.flat();
    }
    res.json({
      success: true,
      jobs: allJobs,
      total_count: allJobs.length,
      sources: sites,
      search_term: skills,
      locations,
      scraped_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Job scraping route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

export default router;
