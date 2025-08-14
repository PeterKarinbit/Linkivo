import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Function to connect to MongoDB
async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Log file setup
const logFile = path.join(__dirname, 'db-test.log');
const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
};

// Simple test to check user authentication
async function testUserAuth() {
  try {
    writeLog('Starting user authentication test...');

    // Test database connection
    await connectDB();
    writeLog('Database connected successfully');

    // Count users in the database
    const userCount = await User.countDocuments();
    writeLog(`Found ${userCount} users in the database`);

    // Find a test user by email
    const testEmail = 'test@example.com'; // Replace with a known email in your DB
    const user = await User.findOne({ email: testEmail });

    if (user) {
      writeLog(`Found test user: ${user.email}`);

      // Test password validation (assuming you have a test account with password 'password')
      const isValidPassword = await user.isPasswordCorrect('password');
      writeLog(`Password validation result: ${isValidPassword ? 'SUCCESS' : 'FAILED'}`);
    } else {
      writeLog(`Test user not found with email: ${testEmail}`);

      // List some users in the database to help diagnose
      const someUsers = await User.find().limit(3).select('email username');
      writeLog('Sample users in database:');
      someUsers.forEach(user => writeLog(` - ${user.email} (${user.username})`));
    }

  } catch (error) {
    writeLog(`ERROR: ${error.message}`);
    console.error(error);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      writeLog('Disconnected from database');
    }
  }
}

// Run the test
testUserAuth().then(() => {
  writeLog('Test completed');
  console.log(`Log written to ${logFile}`);
});
