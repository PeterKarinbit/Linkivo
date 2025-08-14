import express from "express";
import { logger } from "./utils/logger.js";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PRODUCTION_URL } from "./constants.js";

export const app = express();

// Configure CORS with detailed options - FIXED VERSION
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000', // Add backend origin for testing
  'http://127.0.0.1:3000',
  'http://192.168.100.8:5173', // Your local network IP
  PRODUCTION_URL // Production frontend URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin); // Debug log
        return callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static("public"));

// HTTP request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cookieParser());

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
import companyRouter from "./routes/company.routes.js";
import resumeRouter from './routes/resume.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import referralRouter from './routes/referral.routes.js';

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter); // Fixed: removed extra slash
app.use("/api/v1/companies", companyRouter); // Fixed: removed extra slash  
app.use('/api/v1/resume', resumeRouter);
app.use('/api/v1/subscription', subscriptionRouter);
app.use('/api/v1/referral', referralRouter);

// Error logging middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});