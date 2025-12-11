// Backfill vectorization and knowledge base for existing users/journals
// Usage: node scripts/backfill-indexing.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import EnhancedAICareerCoachService from '../src/utils/ai/enhancedAICareerCoach.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const { User } = await import('../src/models/user.model.js');
  const { UserCareerProfile, JournalEntry } = await import('../src/models/aiCareerCoach.model.js');

  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    console.error('Missing MONGODB_URL');
    process.exit(1);
  }
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  const users = await User.find({}, '_id aiCoachConsent').lean();
  console.log(`Found ${users.length} users`);

  let processed = 0;
  for (const user of users) {
    const userId = user._id;
    try {
      // Ensure profile exists
      await EnhancedAICareerCoachService.getUserCareerProfile(userId);

      // Vectorize profile if consent
      if (user?.aiCoachConsent?.enabled && (user.aiCoachConsent.scopes?.resume || user.aiCoachConsent.scopes?.goals)) {
        const profile = await EnhancedAICareerCoachService.getUserCareerProfile(userId);
        await EnhancedAICareerCoachService.vectorizeUserProfile(userId, profile);
      }

      // Vectorize journals if consent
      if (user?.aiCoachConsent?.enabled && user.aiCoachConsent.scopes?.journals) {
        const entries = await JournalEntry.find({ user_id: userId }).sort({ 'metadata.date': 1 }).lean();
        for (const e of entries) {
          try {
            await EnhancedAICareerCoachService.vectorDB.vectorizeJournalEntry({
              content: e.content,
              user_id: userId,
              entry_id: e.entry_id,
              metadata: e.metadata || {}
            });
          } catch (err) {
            console.warn(`Vectorize journal failed for ${userId}:${e.entry_id}`, err?.message || err);
          }
        }
      }

      // Refresh knowledge base
      try {
        await EnhancedAICareerCoachService.refreshKnowledgeBase(userId);
      } catch (e) {
        console.warn('KB refresh failed:', e?.message || e);
      }

      processed += 1;
      if (processed % 5 === 0) console.log(`Processed ${processed}/${users.length}`);
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`Error processing user ${userId}:`, e?.message || e);
    }
  }

  console.log('Backfill completed');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});


