import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';

// In-memory notifications store and SSE clients (replace with DB later)
const userIdToNotifications = new Map();
const sseClientsByUserId = new Map();

function getUserId(req) {
  // Basic fallback: allow explicit query or header for demo; integrate auth later
  const fromQuery = req.query.userId;
  const fromHeader = req.get('x-user-id');
  return fromQuery || fromHeader || 'anonymous';
}

function getUserNotifications(userId) {
  if (!userIdToNotifications.has(userId)) {
    userIdToNotifications.set(userId, []);
  }
  return userIdToNotifications.get(userId);
}

function sendSse(userId, event) {
  const clients = sseClientsByUserId.get(userId) || [];
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => {
    try { res.write(data); } catch (_) {}
  });
}

const router = Router();

// Require auth for notifications in production
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return verifyJWT(req, res, next);
  }
  next();
});

// List notifications
router.get('/', (req, res) => {
  const userId = req.user?._id?.toString() || getUserId(req);
  const items = getUserNotifications(userId);
  res.json({ success: true, notifications: items });
});

// Mark notifications read
router.post('/mark-read', (req, res) => {
  const userId = getUserId(req);
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) {
    return res.status(400).json({ success: false, message: 'ids array required' });
  }
  const items = getUserNotifications(userId);
  const now = new Date().toISOString();
  ids.forEach((id) => {
    const item = items.find((n) => n.id === id);
    if (item) item.readAt = now;
  });
  res.json({ success: true });
});

// Server-Sent Events stream
router.get('/stream', (req, res) => {
  const userId = req.user?._id?.toString() || getUserId(req);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Register client
  if (!sseClientsByUserId.has(userId)) sseClientsByUserId.set(userId, []);
  sseClientsByUserId.get(userId).push(res);

  // Send initial hello
  res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);

  // Keepalive pings
  const ping = setInterval(() => {
    try { res.write('event: ping\n' + `data: ${Date.now()}\n\n`); } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    const arr = sseClientsByUserId.get(userId) || [];
    sseClientsByUserId.set(userId, arr.filter((r) => r !== res));
  });
});

// Internal: publish a notification (for demo/testing)
router.post('/publish', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Disabled in production' });
  }
  const userId = getUserId(req);
  const { title, body, kind } = req.body || {};
  if (!title) return res.status(400).json({ success: false, message: 'title required' });
  const items = getUserNotifications(userId);
  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    body: body || '',
    kind: kind || 'info',
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  items.unshift(note);
  sendSse(userId, { type: 'notification', data: note });
  res.json({ success: true, notification: note });
});

export default router;


