Health checks and backoff

Endpoints (already present)

- GET /health -> { status: 'ok' }
- GET /ready -> { mongo: boolean, aiKey: boolean }

Backoff recommendations

- Container orchestration: configure restartPolicy with exponential backoff.
- pm2: use --exp-backoff-restart-delay to backoff restarts.

Example pm2

pm2 start npm --name web -- start --exp-backoff-restart-delay 1000 --max-memory-restart 800M


