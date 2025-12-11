# AI Coach Integration Notes

This document summarizes how the AI Coach feature was integrated by replacing the Job Listing page and consolidating to a single backend.

## Overview
- URL for replaced page: `/jobs`
- Replaced: `frontend/src/Pages/JobListing.jsx` now renders the AI Coach UI
- Frontend router mounts AI Coach at `/jobs` and redirects `/` → `/jobs`
- AI Coach backend routes integrated into main backend under `/api/*`

## Frontend Changes
- Copied AI Coach React app modules into the main app:
  - `frontend/src/components/**`
  - `frontend/src/Pages/AI-Career-Coach/**`
  - `frontend/src/store/**`
  - plus related `assets/`, `context/`, `hooks/`, `services/`
- Created/updated files:
  - `frontend/package.json` (dependencies: React, Router, Redux Toolkit, MUI, Toast, etc.)
  - `frontend/vite.config.js` (dev proxy to backend at `http://localhost:5000`)
  - `frontend/src/main.jsx` (Redux Provider, Router, MUI ThemeProvider, Toaster)
  - `frontend/src/App.jsx` (routes: `/` → `/jobs`, `/jobs` → AI Coach)
  - `frontend/src/Pages/JobListing.jsx` (renders `AICareerCoach`)

### How to run (Frontend)
1. Install Node.js and npm
2. cd `frontend`
3. npm install
4. npm run dev
5. Open `http://localhost:5173/jobs`

## Backend Changes
- Copied AI Coach backend into `backend/src/ai_coach` (routes, services, models, utils)
- Created/updated files:
  - `backend/package.json` (Express, Mongoose, Socket.IO, Helmet, CORS, etc.)
  - `backend/src/index.js` (mounts endpoints)
- Mounted endpoints:
  - `POST /api/ai-coach/*`
  - `GET/POST /api/journal/*`
  - `GET /api/knowledge-base/*`
  - `GET /api/ai-learning/*`

### How to run (Backend)
1. Install Node.js and npm
2. cd `backend`
3. npm install
4. Create `.env` with:
   - `MONGODB_URI=mongodb://localhost:27017/jobhunter`
   - `FRONTEND_URL=http://localhost:5173`
   - Any keys required by AI services (e.g., `OPENAI_API_KEY`)
5. npm run dev (server on port 5000)

## Environment Variables
- `MONGODB_URI` (Mongo connection for AI Coach models)
- `FRONTEND_URL` (CORS)
- AI-related: `OPENAI_API_KEY`, vector DB keys, etc. per service config

## Notes
- The Job Listing page is now an entry point to the AI Coach experience.
- Adjust additional envs per the AI Coach docs for full functionality.
- The dev proxy in Vite forwards `/api/*` to the backend at `http://localhost:5000`.
