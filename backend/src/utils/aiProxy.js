import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './logger.js';
import http from 'http';

/**
 * Creates a proxy middleware for the AI service
 * @param {string} target - The target URL of the AI service
 * @returns {Function} Express middleware function
 */
export const createAIProxy = (target) => {
  // Parse the target URL
  const targetUrl = new URL(target);
  const targetHost = targetUrl.hostname;
  const targetPort = targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80);
  const targetProtocol = targetUrl.protocol.replace(':', '');

  const proxyOptions = {
    target: {
      host: targetHost,
      port: targetPort,
      protocol: targetProtocol
    },
    changeOrigin: true,
    ws: true, // Enable WebSocket support
    pathRewrite: {
      '^/api/v1/ai-proxy': '/api/v1', // Remove the /ai-proxy prefix when forwarding
    },
    router: function(req) {
      // For SSE/EventSource requests, we need to ensure the protocol is correct
      if (req.headers.accept && req.headers.accept === 'text/event-stream') {
        return `${targetProtocol}://${targetHost}:${targetPort}`;
      }
      return target;
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Add any required headers for the AI service
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user._id);
        }
        // Ensure we don't close the connection for SSE
        if (req.headers.accept && req.headers.accept === 'text/event-stream') {
          proxyReq.setHeader('Connection', 'keep-alive');
          proxyReq.setHeader('Cache-Control', 'no-cache');
        }
        logger.info(`Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.method} ${proxyReq.path}`);
      },
      proxyRes: (proxyRes, req, res) => {
        // For SSE, we need to ensure the response headers are set correctly
        if (req.headers.accept && req.headers.accept === 'text/event-stream') {
          proxyRes.headers['Cache-Control'] = 'no-cache';
          proxyRes.headers['Connection'] = 'keep-alive';
          proxyRes.headers['Content-Type'] = 'text/event-stream; charset=utf-8';
        }
      },
      error: (err, req, res) => {
        logger.error('Proxy error:', err);
        // Don't close the connection for SSE errors
        if (req.headers.accept && req.headers.accept === 'text/event-stream') {
          return;
        }
        res.status(500).json({ 
          success: false, 
          message: 'Error connecting to AI service',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    },
    logLevel: 'debug'
  };

  return createProxyMiddleware(proxyOptions);
};

// Create a pre-configured proxy instance
export const aiServiceProxy = createAIProxy(process.env.AI_SERVICE_URL || 'http://localhost:5000');
