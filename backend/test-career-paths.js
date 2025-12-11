// Quick manual test to exercise the career paths generation without hitting HTTP.
// Run with: node backend/test-career-paths.js <userId> [targetRole]
import EnhancedAICareerCoachService from './src/utils/ai/enhancedAICareerCoach.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const userId = process.argv[2];
  const targetRole = process.argv[3];

  if (!userId) {
    console.error('Usage: node backend/test-career-paths.js <userId> [targetRole]');
    process.exit(1);
  }

  try {
    // Connect to Mongo so we can read the user profile
    const uri = process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017/linkivo';
    await mongoose.connect(uri);

    const data = await EnhancedAICareerCoachService.getCareerPaths(userId, targetRole);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();


// Run with: node backend/test-career-paths.js <userId> [targetRole]
import EnhancedAICareerCoachService from './src/utils/ai/enhancedAICareerCoach.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const userId = process.argv[2];
  const targetRole = process.argv[3];

  if (!userId) {
    console.error('Usage: node backend/test-career-paths.js <userId> [targetRole]');
    process.exit(1);
  }

  try {
    // Connect to Mongo so we can read the user profile
    const uri = process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017/linkivo';
    await mongoose.connect(uri);

    const data = await EnhancedAICareerCoachService.getCareerPaths(userId, targetRole);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();




























