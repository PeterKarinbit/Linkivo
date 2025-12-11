import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

// List of databases to test
const DATABASES = [
  { name: 'test', uri: process.env.MONGODB_URI.replace('test', 'test') },
  { name: 'jobhunter', uri: process.env.MONGODB_URI.replace('test', 'jobhunter') }
];

async function testDatabaseConnection(uri, dbName) {
  let conn;
  try {
    console.log(`\n🔌 Connecting to database: ${dbName}...`);
    
    conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    }).asPromise();
    
    console.log(`✅ Successfully connected to ${dbName}`);
    
    // Get collections in the database
    const collections = await conn.db.listCollections().toArray();
    console.log(`\n📊 Collections in ${dbName}:`);
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Try to get document counts for each collection
    for (const col of collections) {
      try {
        const count = await conn.db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} documents`);
      } catch (err) {
        console.log(`  ${col.name}: Error counting documents - ${err.message}`);
      }
    }
    
    return { success: true, dbName, collections: collections.map(c => c.name) };
    
  } catch (error) {
    console.error(`❌ Error connecting to ${dbName}:`, error.message);
    return { success: false, dbName, error: error.message };
  } finally {
    if (conn) {
      await conn.close();
      console.log(`🔌 Disconnected from ${dbName}`);
    }
  }
}

async function testAllDatabases() {
  console.log('🚀 Starting database connection tests...');
  
  const results = [];
  
  for (const db of DATABASES) {
    const result = await testDatabaseConnection(db.uri, db.name);
    results.push(result);
  }
  
  console.log('\n📋 Test Results:');
  results.forEach(result => {
    console.log(`\n${result.success ? '✅' : '❌'} ${result.dbName}: ${result.success ? 'Connected successfully' : 'Failed to connect'}`);
    if (result.collections) {
      console.log(`   Collections: ${result.collections.length}`);
      console.log(`   Sample collections: ${result.collections.slice(0, 3).join(', ')}${result.collections.length > 3 ? '...' : ''}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n✨ All tests completed!');
  process.exit(0);
}

// Run the tests
testAllDatabases().catch(console.error);
