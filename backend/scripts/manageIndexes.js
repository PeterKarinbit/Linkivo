import mongoose from 'mongoose';
import { DB_NAME } from '../src/constants.js';
import dotenv from 'dotenv';

dotenv.config();

// Index definitions for each collection
const INDEX_DEFINITIONS = {
  users: [
    { email: 1 }, 
    { username: 1 },
    { 'aiCoachConsent.enabled': 1 },
    { subscription: 1 }
  ],
  jobs: [
    { employer: 1 },
    { location: 1 },
    { type: 1 },
    { workMode: 1 },
    { datePosted: -1 },
    { title: 'text', description: 'text', skills: 'text' },
    { 'salaryRange.from': 1, 'salaryRange.to': 1 }
  ],
  applications: [
    { userId: 1, status: 1 },
    { jobId: 1, status: 1 },
    { appliedAt: -1 },
    { nextFollowUp: 1 }
  ],
  jobseekerprofiles: [
    { userId: 1 },
    { skills: 1 },
    { 'experience.years': -1 }
  ]
};

class IndexManager {
  constructor(db) {
    this.db = db;
  }

  async getExistingIndexes(collectionName) {
    try {
      const collection = this.db.collection(collectionName);
      return await collection.indexes();
    } catch (error) {
      console.error(`Error getting indexes for ${collectionName}:`, error.message);
      return [];
    }
  }

  async createIndexes(collectionName, indexSpecs) {
    const collection = this.db.collection(collectionName);
    const results = [];

    for (const spec of indexSpecs) {
      try {
        const options = { background: true, name: this.generateIndexName(spec) };
        
        // Special handling for text indexes
        if (Object.values(spec).some(v => v === 'text')) {
          options.default_language = 'english';
          options.name = `${collectionName}_text`;
          await collection.createIndex(spec, options);
          results.push({ spec, status: 'created', type: 'text' });
          continue;
        }

        // Handle compound indexes
        if (Object.keys(spec).length > 1) {
          options.background = true;
          await collection.createIndex(spec, options);
          results.push({ spec, status: 'created', type: 'compound' });
          continue;
        }

        // Handle single field indexes
        const [field, direction] = Object.entries(spec)[0];
        const indexName = `${field}_${direction}`;
        
        // Skip if index already exists
        const existingIndexes = await collection.indexes();
        if (existingIndexes.some(idx => idx.name === indexName)) {
          results.push({ spec, status: 'exists', type: 'single' });
          continue;
        }

        await collection.createIndex(spec, options);
        results.push({ spec, status: 'created', type: 'single' });
      } catch (error) {
        results.push({ 
          spec, 
          status: 'error', 
          error: error.message,
          type: 'error'
        });
      }
    }

    return results;
  }

  generateIndexName(spec) {
    return Object.entries(spec)
      .map(([field, direction]) => `${field}_${direction}`)
      .join('_');
  }

  async run() {
    console.log('Starting index management...');
    
    for (const [collectionName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
      console.log(`\n=== Managing indexes for ${collectionName} ===`);
      
      try {
        const results = await this.createIndexes(collectionName, indexes);
        console.table(results.map(r => ({
          'Index Type': r.type,
          'Fields': Object.entries(r.spec).map(([k, v]) => `${k} (${v})`).join(', '),
          'Status': r.status,
          'Error': r.error || 'N/A'
        })));
      } catch (error) {
        console.error(`Error managing indexes for ${collectionName}:`, error.message);
      }
    }
    
    console.log('\nIndex management completed!');
  }
}

// Run the script
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000
    });

    const manager = new IndexManager(mongoose.connection.db);
    await manager.run();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
