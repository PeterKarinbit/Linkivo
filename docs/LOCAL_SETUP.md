Local Development Setup
=======================

Environment
-----------
- Create a `.env` for backend with at least:
  - PORT=3000
  - MONGODB_URL=...
  - NODE_ENV=development

- Create a `.env` (Vite) for frontend with:
  - VITE_API_BASE_URL=http://localhost:3000

Frontend
--------
- The frontend builds API URLs from `VITE_API_BASE_URL`.
- SSE and fetch calls point to `${VITE_API_BASE_URL}/api/v1/...`.
- React Router v7 future flags are enabled.

Backend
-------
- Routes mounted under `/api/v1/...` including:
  - `/users` (profile, uploads, account delete)
  - `/subscription` (status, usage, plans, upgrade, cancel, reactivate)
  - `/enhanced-ai-career-coach` (recommendations, stream, consent, journal)
- CORS allows `http://localhost:5173` with credentials.
- SSE endpoint `/api/v1/enhanced-ai-career-coach/recommendations/stream` sends proper headers and heartbeat.

Testing
-------
- Subscription usage test:
  - `cd JobHunter/backend/test`
  - `BASE_URL=http://localhost:3000 TOKEN=... node test-subscription-usage.js`

- SSE stream test:
  - `cd JobHunter/backend/test`
  - `BASE_URL=http://localhost:3000 USER_ID=... MODEL="openrouter/sonoma-sky-alpha" node test-sse-recommendations.js`

Notes
-----
- Ensure you are logged in to get a valid `TOKEN` (JWT) for protected endpoints.
- For network testing on mobile/LAN, set `VITE_API_BASE_URL` to your machine IP (e.g. `http://192.168.x.x:3000`).

