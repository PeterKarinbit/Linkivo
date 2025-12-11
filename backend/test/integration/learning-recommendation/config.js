/**
 * Configuration for Learning Recommendation Service Tests
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'COURSERA_API_KEY',
  'OPENROUTER_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Please add them to your .env file or environment variables.');
  process.exit(1);
}

// API Configuration
const config = {
  // API Endpoints
  api: {
    coursera: {
      baseUrl: 'https://api.coursera.org/api/courses.v1',
      timeout: 10000, // 10 seconds
      maxRetries: 2,
      rateLimit: {
        maxRequests: 10,
        perMilliseconds: 60000, // 1 minute
      }
    },
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'anthropic/claude-3-haiku',
      timeout: 15000, // 15 seconds
      maxTokens: 1000,
      temperature: 0.3
    }
  },
  
  // Test Configuration
  test: {
    journalEntries: [
      "I want to learn machine learning and Python for data analysis.",
      "I need to study data science to advance my career.",
      "Looking for courses on web development.",
      "I'm interested in artificial intelligence and neural networks.",
      "How can I get started with cloud computing?"
    ],
    maxCoursesPerRequest: 5,
    cacheTtl: 3600 // 1 hour in seconds
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: 'learning-recommendation-test.log'
  }
};

export default config;
