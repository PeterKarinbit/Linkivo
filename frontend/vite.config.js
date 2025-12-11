import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket support
        timeout: 300000,
        proxyTimeout: 300000,
        configure: (proxy, _options) => {
          // Handle SSE connections
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            // Check if the response object is valid and headers haven't been sent
            if (res && !res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
            }
          });

          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // For SSE requests, ensure we don't close the connection
            if (req.headers.accept && req.headers.accept === 'text/event-stream') {
              proxyReq.setHeader('Connection', 'keep-alive');
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('Content-Type', 'text/event-stream');
            }
          });

          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // For SSE responses, ensure proper headers
            if (req.headers.accept && req.headers.accept === 'text/event-stream') {
              proxyRes.headers['connection'] = 'keep-alive';
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['content-type'] = 'text/event-stream';
            }
          });
        }
      },
      "/notifications/stream": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Notifications stream proxy error:', err);
            if (res && !res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Notifications stream error: ' + err.message }));
            }
          });
        }
      },
    },
    cors: true,
    host: true, // Enable access from network
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  optimizeDeps: {
    include: ["@heroicons/react", "@headlessui/react"],
  },
});
