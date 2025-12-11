# AI Career Coach – Test Plan (Backend + Frontend)

This document provides step-by-step checks and sample requests (curl) to validate the enhanced AI Coach, consent, embeddings, scheduler, recommendations inbox, and related endpoints.

## Prerequisites
- ENV set and server restarted:
  - `GEMINI_API_KEY`
  - `OPENROUTER_API_KEY` (or `OPENAI_API_KEY`)
  - Optional: `AI_COACH_MODEL` (e.g., `deepseek/deepseek-chat-v3.1:free`)
- A valid `accessToken` for an authenticated user (from login flow).
- MongoDB running and connected.

## Conventions
- Base URL: `http://localhost:3000`
- Auth header used in examples:
  - `-H "Authorization: Bearer $TOKEN"`

---

## 1) Consent Management (Required for autonomy)

### GET consent
```bash
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/consent | jq
```

### PUT consent (enable + scopes + cadence + local time + timezone)
```bash
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "scopes": {
      "resume": true,
      "journals": true,
      "goals": true,
      "tasks": true,
      "applications": false,
      "knowledgeBase": false
    },
    "schedule": {
      "cadence": "weekly",
      "windowLocalTime": "09:00",
      "timezone": "Africa/Nairobi"
    }
  }' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/consent | jq
```

Expected: 200 with the saved preferences.

---

## 2) Resume Analysis (LLM + Embedding with consent)

- UI Path: Upload page. After upload, the resume is analyzed automatically.
- API Validation (simulate):
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeFile": "BASE64_OR_PATH_PLACEHOLDER"}' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/analyze-resume | jq
```

Expected: 200 with `analysis` JSON. If `resume` scope is enabled, the profile is vectorized for future recommendations.

---

## 3) Journals (Store + Analyze + Embed with consent)

### POST journal
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This week I struggled with presenting my ideas to my team and want to improve communication.",
    "tags": ["communication","presentation"]
  }' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/journal | jq
```

Expected: 201 with created entry. With `journals` scope enabled, content is embedded.

### GET journals (with and without search)
```bash
# Regular list
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/enhanced-ai-career-coach/journal?page=1&limit=10" | jq

# Vector search
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/enhanced-ai-career-coach/journal?search=presentation%20skills&limit=5" | jq
```

Expected: 200 with results; vector search path returns semantically related entries.

---

## 4) Goals / Profile

### POST goals (enhanced with market context)
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "careerGoals": {
      "short_term": [{"goal":"Improve presentation","timeline":"3 months","priority":8}],
      "long_term": [{"goal":"Tech lead","timeline":"2 years","priority":9}]
    }
  }' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/goals | jq
```

### GET profile
```bash
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/profile | jq
```

### PUT profile
```bash
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"learning_preferences": {"frequency":"weekly"}}' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/profile | jq
```

Expected: 200 and updated profile; re-vectorization occurs after update.

---

## 5) Recommendations

### GET proactive recommendations (Vector search path when type=proactive)
```bash
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/enhanced-ai-career-coach/recommendations?type=proactive&limit=5" | jq
```

Expected: 200 with an array of recommendations. Frontend inbox (Gmail‑style) displays them.

Note: Manual generation has been removed from UI by design. Scheduler generates autonomously based on consent and schedule.

---

## 6) Search (Vector)

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "improve presentation skills",
    "collection": "journal_entries",
    "limit": 5
  }' \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/search | jq
```

Expected: 200 with top relevant items.

---

## 7) Market Intelligence

```bash
# Insights
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/enhanced-ai-career-coach/market-insights?category=skills&limit=5" | jq

# Skills demand
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/enhanced-ai-career-coach/skills-demand?skills=react,python" | jq
```

Expected: 200 with results payloads.

---

## 8) System Health / Admin (Optional)

```bash
# Health
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/health | jq

# Admin market analysis (no auth guard yet – use carefully)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/admin/run-market-analysis | jq

# Admin stats
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/enhanced-ai-career-coach/admin/stats | jq
```

Expected: 200 responses with service health and system stats.

---

## 9) Scheduler (Autonomous Generation)

- Behavior: runs per user’s `aiCoachConsent.schedule` cadence at their local `windowLocalTime` and `timezone`.
- To verify:
  1. Set consent (enabled + scopes) and choose a near‑future local time (e.g., in 2–3 minutes).
  2. Wait for the minute tick. The server logs “Proactive AI scheduler started …” and silent ticks; new recommendations should appear afterward.
  3. Open the AI Career Coach Inbox (Gmail‑style) and click Refresh if needed.

---

## 10) Frontend Validation Checklist

- Consent modal (Settings → Consent):
  - Loads current preferences.
  - Can enable/disable, toggle scopes, set cadence/time/timezone.
  - Saves and shows success toast.
- Enhanced AI Coach dashboard:
  - Recommendations card shows recent items.
  - Memory usage bar and Upgrade CTA behave as expected.
- Gmail‑style Inbox:
  - Full comfortable layout; can Refresh, mark as read, and complete items.
- Navbar bell icon:
  - Shows aggregated count (notifications + AI recs), opens dropdown, and “View Recommendations” routes to inbox.

---

## 11) Troubleshooting

- 401/403: Ensure `accessToken` is valid and `verifyJWT` is applied.
- No recommendations: confirm consent enabled + scopes (journals/goals/resume), verify GEMINI and OpenRouter env keys, and allow scheduler to run.
- Embedding errors: confirm `GEMINI_API_KEY` and internet access.
- Vector search empty: create a journal entry first or analyze a resume to generate vectors.

---

## 12) Security & Limits (Recommended)
- Add retry/backoff for LLM calls and per‑user daily generation caps.
- Add admin auth on admin routes when moving to production.

---

Document version: 1.0 (autogenerated)
