import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './src/db/db.js';
import mongoose from 'mongoose';
import aiCareerCoach from './src/utils/ai/aiCareerCoach.service.js';

// Import your models
import { User } from './src/models/user.model.js';
import { Job } from './src/models/job.model.js';
import { JobSeekerProfile } from './src/models/jobSeekerProfile.model.js';

// Simple retry function
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    console.log(`Retrying... (${retries - 1} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

async function testAIDatabaseIntegration() {
  try {
    // 1. Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    // 2. Fetch some sample data (adjust based on your schema)
    console.log('📊 Fetching sample data from database...');
    
    // Get any user from the database
    const sampleUser = await User.findOne().limit(1);
    if (!sampleUser) {
      throw new Error('No users found in the database');
    }
    
    // Try to get job seeker profile if it exists
    let jobSeekerProfile = null;
    try {
      jobSeekerProfile = await JobSeekerProfile.findOne({ user: sampleUser._id });
    } catch (error) {
      console.log('No job seeker profile found, continuing with basic user data');
    }
    
    // Get some sample jobs
    let jobs = [];
    try {
      jobs = await Job.find({}).limit(3);
    } catch (error) {
      console.log('No jobs found in database, continuing without job data');
    }
    
    console.log(`\n👤 User: ${sampleUser.fullName || 'N/A'} (${sampleUser.email || 'No email'})`);
    console.log(`📝 Found ${jobs.length} sample jobs`);
    
    // Prepare data for AI analysis with fallbacks
    const userData = {
      name: sampleUser.fullName || 'User',
      email: sampleUser.email || 'No email',
      role: sampleUser.role || 'user',
      skills: jobSeekerProfile?.skills?.join(', ') || 'No skills listed',
      experience: jobSeekerProfile?.experience || 'No experience listed',
      jobTitles: jobs.length > 0 ? jobs.map(job => job.title).join(', ') : 'No job titles available',
      companies: jobs.length > 0 ? jobs.map(job => job.companyName || 'Unknown').filter(Boolean).join(', ') : 'No companies available'
    };
    
    // 4. Use the AI service to analyze the data with retry logic
    console.log('\n🤖 Analyzing data with AI...');
    
    // Dynamic prompt based on available data
    let prompt = `Analyze this user's profile and provide career insights:
    
    Name: ${userData.name}
    Role: ${userData.role}
    Email: ${userData.email}
    
    Skills: ${userData.skills}
    Experience: ${userData.experience}
    `;
    
    if (jobs.length > 0) {
      prompt += `\nRecent Job Listings in System:\n${jobs.map((job, i) => `    ${i+1}. ${job.title} at ${job.companyName || 'a company'}`).join('\n')}\n`;
    }
    
    prompt += '\nProvide 2-3 career suggestions or insights based on the available information.';
    
    console.log('\n🤖 Sending to AI for analysis...');
    
    // Wrap the AI call in our retry function
    const response = await retry(async () => {
      return await aiCareerCoach.openai.chat.completions.create({
        model: aiCareerCoach.model,
        messages: [
          { role: 'system', content: 'You are a helpful career advisor. Provide concise, actionable career advice.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        timeout: 30000 // 30 second timeout
      });
    }, 3, 2000); // Retry 3 times with 2 second delay
    
    const analysis = response.choices[0]?.message?.content;
    console.log('\n📈 AI Career Analysis:');
    console.log(analysis);
    
  } catch (error) {
    console.error('\n❌ Error in test:');
    console.error(error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testAIDatabaseIntegration();
