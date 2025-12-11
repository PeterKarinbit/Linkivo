# Memory Optimization Guide

This guide documents the concrete memory optimizations in the backend and how to operate them safely at scale. It reflects the current implementation in `src/index.js` and related utilities.

## Key Strategies Implemented

1. Staged lazy loading of heavy routes
   - AI-related routes are imported with delay and spacing between imports to avoid heap spikes.
   - After each stage, we force a GC pass when available.

2. Redis-backed distributed locks to gate heavy initialization
   - Heavy initializations (AI routes, MCP Knowledge Base service) are wrapped in short-lived locks so only one instance does the work.
   - A short TTL “done” flag prevents repeat work across restarts for a cooling window.

3. Conservative feature flags and thresholds
   - AI routes and schedulers are opt-in and delayed.
   - Initialization is skipped if heap usage exceeds thresholds.

4. Periodic memory monitoring and opportunistic GC
   - A 30s interval logs high heap usage and triggers GC when available.

5. Clinic heapprofiler script for targeted profiling
   - Use provided npm scripts to profile memory and generate `.clinic` reports.

## Files and Relevant Snippets

- `src/index.js`
  - Sets `UV_THREADPOOL_SIZE`, raises listener limit, adds memory monitor.
  - Delayed, batched route loading with GC in between.
  - Wraps heavy initializations with Redis locks and a short-circuit cache.

- `src/utils/redisClient.js`
  - Provides `ensureRedisConnected`, `getJson`, `setJson`, and `withLock` helpers using ioredis.

- `profile.js` and `package.json`
  - `profile:memory` and `profile:ai-coach` scripts run Clinic heapprofiler.

## Environment Variables

- `REDIS_URL` (required for lock/caching)
  - Example: `redis://default:<password>@<host>:<port>`
- `ENABLE_AI_ROUTES` (default: true)
- `ENABLE_KB_SERVICE` (opt-in: set to `true`)
- `ENABLE_SCHEDULED_JOBS` (opt-in: set to `true`)

## Operational Guidance

1. Startup behavior
   - On boot, the app attempts to connect to Redis. If unavailable, it proceeds without locks/caching.
   - Heavy initialization is gated by Redis locks to prevent concurrent work across instances.

2. Lock keys and TTLs (defaults)
   - AI routes: lock key `init:ai-routes`, TTL 15s; done flag `init:ai-routes:done`, TTL 5m.
   - MCP KB: lock key `init:mcp-kb`, TTL 20s; done flag `init:mcp-kb:done`, TTL 10m.
   - Adjust TTLs if your environment needs longer windows.

3. Memory thresholds
   - Scheduler starts only if heap < 2GB.
   - MCP KB init runs only if heap < 1.5GB.
   - High-usage alert at > 3GB triggers GC.

4. Profiling
   - Install tools: `npm run profile:install`.
   - Run quick profile: `npm run profile:memory`.
   - For AI-coach endpoint load profile: `npm run profile:ai-coach`.

## Troubleshooting

- Redis unavailable at startup
  - App logs a warning and continues without locks. Heavy init may proceed on multiple instances; prefer making Redis available for stability.

- Repeated heavy init after restarts
  - Increase done-flag TTLs (e.g., to 15–30 minutes) to smooth frequent restarts.

- Memory spikes remain
  - Increase inter-stage delays (1–3s), lower batch sizes, or raise thresholds for skipping optional components.
  - Verify `NODE_OPTIONS=--max-old-space-size=4096` in `package.json` is applied in your environment.

## Future Enhancements

- Cache warmup artifacts in Redis to reuse across restarts where safe.
- Add per-route memory tracking middleware during diagnostics windows.
- Persist memory snapshots and alerts to a monitoring backend.
