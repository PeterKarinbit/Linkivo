Memory stabilization checklist

Node heap

- Temporarily increase heap locally:
  export NODE_OPTIONS="--max-old-space-size=4096"
- In pm2:
  pm2 start npm --name web -- start --max-memory-restart 800M

Feature flags to reduce boot memory

- ENABLE_AI_ROUTES=false
- ENABLE_SCHEDULED_JOBS=false
- ENABLE_KB_SERVICE=false

Observability

- Enable GC logs temporarily:
  export NODE_OPTIONS="--max-old-space-size=4096 --trace-gc"
- Health endpoints: /health, /ready

Queue heavy work

- Use a separate worker for heavy AI jobs and queues backed by Redis.


