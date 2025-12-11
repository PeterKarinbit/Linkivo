import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './src/db/db.js';
import mongoose from 'mongoose';
import vectorStoreService from './src/services/vectorStore.service.js';
import { getLocalEmbedding } from './src/utils/ai/localEmbedding.service.js';

// Sample document for testing
const SAMPLE_DOCUMENT = `
Job Title: Senior Software Engineer
Company: Tech Innovations Inc.
Location: San Francisco, CA (Remote)

Job Description:
We are looking for a Senior Software Engineer with expertise in JavaScript, Node.js, and modern web technologies. 
The ideal candidate will have experience with cloud platforms like AWS and containerization with Docker. 
You will be responsible for designing and implementing scalable backend services and APIs.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Knowledge of containerization and orchestration (Docker, Kubernetes)
- Experience with databases (MongoDB, PostgreSQL)
- Strong problem-solving skills and attention to detail

Nice to have:
- Experience with microservices architecture
- Knowledge of CI/CD pipelines
- Familiarity with AI/ML concepts
- Open source contributions

Benefits:
- Competitive salary
- Flexible work hours
- Remote work options
- Health insurance
- 401(k) matching
`;

async function testVectorStore() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    // Test data
    const userId = '000000000000000000000001'; // Sample user ID
    const documentId = new mongoose.Types.ObjectId(); // Generate a new document ID
    const documentType = 'job_posting';
    
    console.log('\n1️⃣ Testing document processing...');
    
    // First, test the local embedding service directly
    console.log('\n🔍 Testing local embedding service...');
    const testEmbedding = await getLocalEmbedding('This is a test sentence');
    console.log(`✅ Local embedding generated with ${testEmbedding.length} dimensions`);
    
    // Process the sample document
    const processResult = await vectorStoreService.processDocument({
      documentId,
      userId,
      documentType,
      text: SAMPLE_DOCUMENT,
      metadata: {
        source: 'sample-job-posting.txt',
        title: 'Senior Software Engineer Position'
      }
    });
    
    console.log('\n✅ Document processed successfully!');
    console.log(`   - Chunks processed: ${processResult.chunksProcessed}`);
    console.log(`   - Total chunks: ${processResult.totalChunks}`);
    
    if (processResult.chunksProcessed > 0) {
      // Test vector search
      console.log('\n2️⃣ Testing vector search...');
      const searchQuery = 'What are the requirements for the senior software engineer position?';
      console.log(`   - Search query: "${searchQuery}"`);
      
      try {
        const searchResults = await vectorStoreService.vectorSearch(searchQuery, {
          userId,
          documentType,
          limit: 3
        });
        
        console.log('\n🔍 Search results:');
        searchResults.forEach((result, index) => {
          console.log(`\n   ${index + 1}. Score: ${result.score.toFixed(4)}`);
          console.log(`   ${result.text.substring(0, 150)}${result.text.length > 150 ? '...' : ''}`);
        });
      } catch (error) {
        console.error('\n❌ Error during vector search:', error.message);
        console.log('This might be because the vector index is not created yet.');
        console.log('In a real application, you would create the index in MongoDB Atlas:');
        console.log('1. Go to your MongoDB Atlas dashboard');
        console.log('2. Select your database and collection');
        console.log('3. Go to the "Search" tab');
        console.log('4. Create a search index with the following definition:');
        console.log(`{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 384,
        "similarity": "cosine"
      }
    }
  }
}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error in test:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testVectorStore();
