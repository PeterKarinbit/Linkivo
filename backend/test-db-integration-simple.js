import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './src/db/db.js';
import mongoose from 'mongoose';

// Import your models
import { User } from './src/models/user.model.js';
import { Job } from './src/models/job.model.js';
import { JobSeekerProfile } from './src/models/jobSeekerProfile.model.js';

async function testDatabaseIntegration() {
  try {
    // 1. Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    // 2. Get user count
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    // 3. Get a sample user
    const sampleUser = await User.findOne();
    console.log('\n👤 Sample User:');
    console.log(`- Name: ${sampleUser.fullName || 'N/A'}`);
    console.log(`- Email: ${sampleUser.email || 'N/A'}`);
    console.log(`- Role: ${sampleUser.role || 'N/A'}`);
    
    // 4. Try to get job seeker profile if it exists
    try {
      const jobSeekerProfile = await JobSeekerProfile.findOne({ user: sampleUser._id });
      if (jobSeekerProfile) {
        console.log('\n📋 Job Seeker Profile:');
        console.log(`- Skills: ${jobSeekerProfile.skills?.join(', ') || 'None'}`);
        console.log(`- Experience: ${jobSeekerProfile.experience || 'None'}`);
      } else {
        console.log('\nℹ️ No job seeker profile found for this user.');
      }
    } catch (error) {
      console.log('\n⚠️ Error fetching job seeker profile:', error.message);
    }
    
    // 5. Get some sample jobs
    try {
      const jobs = await Job.find({}).limit(3);
      console.log(`\n💼 Found ${jobs.length} sample jobs:`);
      jobs.forEach((job, index) => {
        console.log(`\n  Job ${index + 1}:`);
        console.log(`  - Title: ${job.title || 'N/A'}`);
        console.log(`  - Company: ${job.companyName || 'N/A'}`);
        console.log(`  - Type: ${job.jobType || 'N/A'}`);
      });
    } catch (error) {
      console.log('\n⚠️ Error fetching jobs:', error.message);
    }
    
    console.log('\n✅ Database integration test completed successfully!');
    
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
testDatabaseIntegration();
