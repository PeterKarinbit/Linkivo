AI Coach Data Flow
==================

1) Signup → Default Consent → Seed Profile/KB
- On signup, default `aiCoachConsent` is enabled with all scopes.
- Backend creates/ensures `UserCareerProfile` and triggers a KB refresh.

2) Onboarding → Consent Save
- Onboarding UI includes consent toggles and saves to `/api/v1/enhanced-ai-career-coach/consent`.

3) Journals
- POST `/api/v1/enhanced-ai-career-coach/journal` saves entries (100–5000 chars).
- After save: vectorize journal and refresh KB.

4) Resume/Goals
- Resume analysis updates profile and vectorizes; KB refresh recommended.
- Goals update vectorizes profile and can trigger recommendations.

5) Vector DB
- ChromaDB stores vectors for profiles, journals, knowledge base, recommendations.
- Env: `CHROMA_DB_PATH` (default `http://localhost:8000`).

6) Recommendations
- Pull user profile + recent journals + market intel → LLM → store recs; optional vector store.

7) MCP Knowledge Base
- Scheduler runs twice daily and on-demand; now fetches real Mongo data.

Backfill
--------
- Run `node backend/scripts/backfill-indexing.js` to vectorize existing data and refresh KB for all users.

