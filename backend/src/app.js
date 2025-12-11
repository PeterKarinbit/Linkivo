import express from "express";
import { logger } from "./utils/logger.js";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PRODUCTION_URL } from "./constants.js";
import { aiServiceProxy } from "./utils/aiProxy.js";
import { createRateLimiter } from "./middlewares/rateLimit.middleware.js";
import timeout from 'connect-timeout';

export const app = express();

// Force restart for new routes


// Set server timeout (300 seconds)
app.use(timeout('300s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Enhanced CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.100.8:5173',
  'http://192.168.100.8:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  PRODUCTION_URL
].filter(Boolean);

// CORS middleware with enhanced security
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In development, allow all origins but log them
    if (process.env.NODE_ENV === 'development') {
      if (origin) {
        console.log(`Allowing CORS for development origin: ${origin}`);
      }
      return callback(null, true);
    }

    // In production, only allow whitelisted origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Auth-Token",
    "X-API-Key",
    "x-ai-model"
  ],
  exposedHeaders: [
    "Content-Length",
    "X-Request-ID",
    "X-Response-Time"
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS with the above options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    logger.error(`Request timed out: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timed out',
        code: 'REQUEST_TIMEOUT'
      });
    }
  });
  next();
});

// Body parsing with limits
app.use(express.json({
  limit: process.env.BODY_LIMIT || "20mb",
  verify: (req, res, buf) => {
    // Skip JSON parsing for methods that don't typically have bodies (GET, DELETE, HEAD, OPTIONS)
    if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return;
    }
    // Skip if buffer is empty
    if (!buf || buf.length === 0) {
      return;
    }
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: process.env.URLENCODED_LIMIT || "20mb",
  parameterLimit: 10000
}));

// Static files with cache control
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
};
app.use(express.static("public", staticOptions));

// HTTP request logging with response time
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: {
    write: message => logger.info(message.trim())
  },
  skip: (req) => req.path === '/health'
}));

// Cookie parser with secret
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// Basic Redis-backed rate limiting (fail-open)
const rateLimit = createRateLimiter({
  windowSeconds: Number(process.env.RL_WINDOW_S) || 60,
  maxRequests: Number(process.env.RL_MAX) || 240
});
app.use(rateLimit);

// Optional: allow per-request temporary model override for testing
app.use((req, res, next) => {
  const override = req.get('x-ai-model');
  if (override) {
    process.env.AI_COACH_MODEL = override;
  }
  next();
});

// Test endpoint to verify server is working
app.get('/', (req, res) => {
  res.json({
    message: 'JobHunter API is running!',
    timestamp: new Date().toISOString(),
    origin: req.get('origin')
  });
});

// routes import
import userRouter from "./routes/user.routes.js";
import jobRouter from "./routes/job.routes.js";
import indexRouter from './routes/index.js';
import userRoutes from './routes/user.routes.js';
import enhancedAICoachRoutes from './routes/enhancedAICareerCoach.routes.js';
import companyRouter from "./routes/company.routes.js";
import resumeRouter from './routes/resume.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import referralRouter from './routes/referral.routes.js';
import linkPreviewRouter from './routes/linkPreview.routes.js';
import notificationsRouter from './routes/notifications.routes.js';
import pesapalRouter from './routes/pesapal.routes.js';
import paystackRouter from './routes/paystack.routes.js';
import documentRouter from './routes/document.routes.js';

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter);
app.use('/api/v1', indexRouter);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/enhanced-ai-career-coach', enhancedAICoachRoutes);
app.use("/api/v1/companies", companyRouter);
app.use('/api/v1/resume', resumeRouter);
app.use('/api/v1/subscription', subscriptionRouter);
app.use('/api/v1/referral', referralRouter);
app.use('/api/v1/link-preview', linkPreviewRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/pesapal', pesapalRouter);
app.use('/api/v1/paystack', paystackRouter);
app.use('/api/v1/documents', documentRouter);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log the error with request context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || 'anonymous'
  };

  logger.error('Unhandled error', errorContext);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors ? Object.values(err.errors).map(e => e.message) : [err.message],
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED'
    });
  }

  if (err.message === 'Request timed out') {
    return res.status(504).json({
      success: false,
      message: 'Request timed out',
      code: 'REQUEST_TIMEOUT'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    code: 'NOT_FOUND'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider whether to crash the app or continue
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Consider whether to crash the app or continue
  // process.exit(1);
});