// Simple E2E test for SSE stream endpoint
// Usage: BASE_URL=http://localhost:3000 USER_ID=... MODEL="openrouter/sonoma-sky-alpha" node test-sse-recommendations.js

import EventSource from 'eventsource';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'anonymous';
const MODEL = process.env.MODEL || 'openrouter/sonoma-sky-alpha';

const url = `${BASE_URL}/api/v1/enhanced-ai-career-coach/recommendations/stream?userId=${encodeURIComponent(USER_ID)}&model=${encodeURIComponent(MODEL)}`;
console.log('Connecting to:', url);

const es = new EventSource(url, { withCredentials: true });

const timeoutMs = 15000;
const timeout = setTimeout(() => {
  console.error('Timed out without receiving messages');
  es.close();
  process.exit(2);
}, timeoutMs);

es.onopen = () => {
  console.log('SSE connection opened');
};

es.onmessage = (e) => {
  console.log('Message:', e.data);
  clearTimeout(timeout);
  es.close();
  process.exit(0);
};

es.onerror = (e) => {
  console.error('SSE error:', e);
};


