const APP_NS = 'jobhunter:backend';

const getEnv = () => (process.env.NODE_ENV || 'development');
const getVer = () => 'v1';

export const ttl = {
  aiRoutesDoneSec: 300,       // 5 minutes
  mcpKbDoneSec: 600,          // 10 minutes
  startupHealthSec: 180,      // 3 minutes
  shortLockMs: 15000,
  longLockMs: 20000
};

const base = () => `${APP_NS}:${getEnv()}:${getVer()}`;

export const keys = {
  lock: {
    aiRoutes: () => `${base()}:lock:init:ai-routes`,
    mcpKb: () => `${base()}:lock:init:mcp-kb`
  },
  done: {
    aiRoutes: () => `${base()}:init:ai-routes:done`,
    mcpKb: () => `${base()}:init:mcp-kb:done`
  },
  metrics: {
    startupHealth: () => `${base()}:health:startup`,
    memLast: () => `${base()}:mem:last`
  },
  kb: {
    meta: (userId) => `${base()}:kb:meta:${userId}`
  },
  ai: {
    modelCaps: (modelName) => `${base()}:ai:model:capabilities:${modelName}`
  }
};

// Minimal validators for structured payloads
export const validate = {
  initDone: (obj) => !!obj && typeof obj === 'object' && typeof obj.ok === 'boolean' && typeof obj.at === 'string',
  startupHealth: (obj) => !!obj && typeof obj === 'object' && typeof obj.heapMB === 'number' && typeof obj.timeMs === 'number' && typeof obj.at === 'string'
};

export const payloads = {
  initDone: () => ({ ok: true, at: new Date().toISOString(), version: getVer() })
};


