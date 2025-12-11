import mongoose from 'mongoose';
import { DB_NAME } from '../src/constants.js';
import dotenv from 'dotenv';

dotenv.config();

const analyzeCollection = async (collection) => {
  try {
    console.log(`\n=== Analyzing ${collection.collectionName} ===`);
    
    // Get index information
    const indexes = await collection.indexes();
    console.log('\nIndexes:');
    console.table(indexes.map(idx => ({
      Name: idx.name,
      Fields: Object.entries(idx.key).map(([k, v]) => `${k} (${v})`).join(', '),
      Unique: !!idx.unique || false,
      Sparse: !!idx.sparse || false,
      'Background': !!idx.background || false
    })));

    // Get collection stats
    const stats = await collection.stats();
    console.log('\nCollection Stats:');
    console.table({
      'Document Count': stats.count,
      'Size (MB)': (stats.size / (1024 * 1024)).toFixed(2),
      'Avg Doc Size (bytes)': stats.avgObjSize.toFixed(2),
      'Indexes': stats.nindexes,
      'Total Index Size (MB)': (stats.totalIndexSize / (1024 * 1024)).toFixed(2)
    });

  } catch (error) {
    console.error(`Error analyzing ${collection.collectionName}:`, error.message);
  }
};

const main = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000
    });

    console.log('Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    // Analyze each collection
    for (const collection of collections) {
      await analyzeCollection(collection);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

main();
