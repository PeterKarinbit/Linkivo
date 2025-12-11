Redis integration and memory stabilization

Environment variables

- REDIS_URL: redis://user:pass@host:6379/0
- RL_WINDOW_S: 60
- RL_MAX: 240
- ENABLE_AI_ROUTES: true | false (disable AI-heavy routes at boot)
- ENABLE_SCHEDULED_JOBS: true | false (proactive scheduler)
- ENABLE_KB_SERVICE: true | false (knowledge base service)
- Optional: NODE_OPTIONS=--max-old-space-size=4096

Files changed

- src/utils/redis.js: ioredis client factory and connector
- src/middlewares/rateLimit.middleware.js: Redis-backed per-IP limiter
- src/app.js: mounts the limiter globally
- src/index.js: conditional loading of AI-heavy routes and services using flags
- package.json: adds ioredis dependency

Quick start

1) Set envs (example)
   export REDIS_URL=redis://localhost:6379
   export RL_WINDOW_S=60
   export RL_MAX=240
   export ENABLE_AI_ROUTES=false
   export ENABLE_SCHEDULED_JOBS=false
   export ENABLE_KB_SERVICE=false

2) Install deps (on a Node-capable host)
   npm install

3) Run
   npm run dev

Notes

- Limiter fails open if Redis is down to avoid blocking traffic.
- Re-enable AI flags gradually after the server stabilizes.
- Consider offloading heavy tasks to a separate worker.


