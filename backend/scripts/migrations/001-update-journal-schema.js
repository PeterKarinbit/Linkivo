import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { JournalEntry } from '../../src/models/aiCareerCoach.model.js';

dotenv.config();

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'jobhunter',
      serverSelectionTimeoutMS: 5000
    });

    console.log('Connected to MongoDB');

    // Find all journal entries that need updating
    const entriesToUpdate = await JournalEntry.find({
      $or: [
        { content_vector: { $exists: false } },
        { 'metadata.processing_status': { $exists: false } }
      ]
    });

    console.log(`Found ${entriesToUpdate.length} entries to update`);

    let updatedCount = 0;
    
    // Update each entry
    for (const entry of entriesToUpdate) {
      const update = {};
      let needsUpdate = false;

      // Add default content_vector if missing
      if (!entry.content_vector || entry.content_vector.length === 0) {
        update.content_vector = new Array(1536).fill(0);
        needsUpdate = true;
      }

      // Add default processing_status if missing
      if (!entry.metadata?.processing_status) {
        if (!update.metadata) update.metadata = {};
        update.metadata = {
          ...entry.metadata.toObject(),
          processing_status: 'completed', // Assume completed for existing entries
          ...(entry.metadata?.date ? {} : { date: entry.createdAt || new Date() })
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        await JournalEntry.updateOne(
          { _id: entry._id },
          { $set: update }
        );
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} journal entries`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
