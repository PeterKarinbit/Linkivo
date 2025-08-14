import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Test routes
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'Test server is running correctly' });
});

app.get('/api/v1/users/ping', (req, res) => {
  res.json({ message: 'User API is working' });
});

app.post('/api/v1/users/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Simple test authentication
  if (email === 'test@example.com' && password === 'password') {
    return res.status(200).json({
      status: 200,
      data: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      },
      message: 'User login successful'
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/api/v1/users/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Simple test user profile
  return res.status(200).json({
    status: 200,
    data: {
      _id: '123456789012345678901234',
      email: 'test@example.com',
      username: 'testuser',
      role: 'jobSeeker',
      userProfile: {
        name: 'Test User',
        location: 'Test City',
        doneOnboarding: true
      }
    },
    message: 'User profile fetch successful'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Use these credentials to test:');
  console.log('Email: test@example.com');
  console.log('Password: password');
});
