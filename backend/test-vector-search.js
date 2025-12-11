import mongoose from 'mongoose';
import dotenv from 'dotenv';
import vectorStore from './src/services/vectorStore.service.js';

dotenv.config();

// Helper function to format text for display
function formatText(text, maxLength = 100) {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.length > maxLength 
    ? trimmed.substring(0, maxLength) + '...' 
    : trimmed;
}

async function testVectorSearch() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test data - multiple documents with different content
    const testUserId = '000000000000000000000001'; // Replace with a valid user ID
    const testDocuments = [
      {
        title: 'Software Engineer Resume',
        content: `
          I'm a senior software engineer with 5+ years of experience in JavaScript and Node.js.
          I've worked on large-scale web applications using React, MongoDB, and AWS.
          My expertise includes system design, API development, and cloud architecture.
        `,
        type: 'resume'
      },
      {
        title: 'Project Documentation',
        content: `
          This project is built with Python and Django for the backend, with a React frontend.
          It uses PostgreSQL for the database and is deployed on AWS ECS.
          Key features include user authentication, file uploads, and real-time notifications.
        `,
        type: 'documentation'
      },
      {
        title: 'Job Description - Full Stack Developer',
        content: `
          We are looking for a Full Stack Developer with experience in:
          - JavaScript/TypeScript
          - React.js and Node.js
          - MongoDB and PostgreSQL
          - AWS services
          - CI/CD pipelines
          
          The ideal candidate has 3+ years of experience and a strong understanding of web technologies.
        `,
        type: 'job_posting'
      }
    ];
    
    // Process test documents
    console.log('\n📝 Processing test documents...');
    for (const doc of testDocuments) {
      console.log(`\nProcessing: ${doc.title}`);
      await vectorStore.processDocument({
        documentId: new mongoose.Types.ObjectId(),
        userId: testUserId,
        documentType: doc.type,
        text: doc.content,
        metadata: {
          title: doc.title,
          type: doc.type,
          source: 'test-vector-search.js',
          timestamp: new Date()
        }
      });
      console.log(`✅ Added: ${doc.title}`);
    }
    
    // Clear previous test data to avoid duplicates
    console.log('\n🧹 Cleaning up previous test data...');
    await mongoose.connection.db.collection('documentembeddings').deleteMany({ 
      'metadata.source': 'test-vector-search.js' 
    });
    
    // Process test documents with better chunking
    console.log('\n📝 Processing enhanced test documents...');
    for (const doc of testDocuments) {
      console.log(`\nProcessing: ${doc.title}`);
      await vectorStore.processDocument({
        documentId: new mongoose.Types.ObjectId(),
        userId: testUserId,
        documentType: doc.type,
        text: doc.content,
        metadata: {
          title: doc.title,
          type: doc.type,
          source: 'test-vector-search.js',
          timestamp: new Date(),
          keywords: doc.keywords || []
        }
      });
      console.log(`✅ Added: ${doc.title}`);
    }
    
    // Test vector search with different queries and lower threshold
    const testQueries = [
      { 
        query: 'What programming languages are mentioned?',
        minScore: 0.25,
        expectedKeywords: ['JavaScript', 'TypeScript', 'Python', 'Node.js']
      },
      { 
        query: 'Find candidates with cloud experience',
        minScore: 0.2,
        expectedKeywords: ['AWS', 'cloud architecture', 'deployment']
      },
      { 
        query: 'Show me database technologies',
        minScore: 0.2,
        expectedKeywords: ['MongoDB', 'PostgreSQL', 'database']
      },
      { 
        query: 'What web frameworks are used?',
        minScore: 0.2,
        expectedKeywords: ['React', 'Django', 'Node.js']
      },
      { 
        query: 'Find developers with full stack experience',
        minScore: 0.2,
        expectedKeywords: ['full stack', 'frontend', 'backend', 'JavaScript', 'React', 'Node.js']
      }
    ];
    
    for (const { query, minScore, expectedKeywords } of testQueries) {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 Testing query: "${query}" (min score: ${minScore})`);
      
      const searchResults = await vectorStore.vectorSearch(query, {
        userId: testUserId,
        limit: 5, // Increase limit to get more results
        minScore
      });
      
      console.log(`\n📊 Found ${searchResults.length} results:`);
      
      if (searchResults.length === 0) {
        console.log('No matching results found.');
        continue;
      }
      
      if (searchResults.length === 0) {
        console.log('❌ No results found. Try lowering the minimum score threshold.');
        continue;
      }
      
      console.log(`\n📊 Found ${searchResults.length} results (score >= ${minScore}):`);
      
      searchResults.forEach((result, index) => {
        const highlightText = (text, keywords) => {
          if (!text || !keywords) return text;
          let highlighted = text;
          keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlighted = highlighted.replace(regex, '✨$1✨');
          });
          return highlighted;
        };
        
        console.log(`\n📄 Result ${index + 1} (score: ${result.score.toFixed(4)})`);
        console.log(`Title: ${result.metadata?.title || 'Untitled'}`);
        console.log(`Type: ${result.metadata?.type || 'unknown'}`);
        console.log('Text:', highlightText(formatText(result.text, 200), expectedKeywords));
        
        // Show matching keywords
        if (expectedKeywords) {
          const matchedKeywords = expectedKeywords.filter(keyword => 
            result.text.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matchedKeywords.length > 0) {
            console.log(`🔑 Matched keywords: ${matchedKeywords.join(', ')}`);
          }
        }
        
        // Show additional metadata if available
        const { title, type, source, ...otherMetadata } = result.metadata || {};
        if (Object.keys(otherMetadata).length > 0) {
          console.log('ℹ️ Additional metadata:', JSON.stringify(otherMetadata, null, 2));
        }
      });
      
      // Show query analysis
      console.log('\n🔍 Query analysis:');
      console.log(`- Query: "${query}"`);
      console.log(`- Expected keywords: ${expectedKeywords.join(', ')}`);
      console.log(`- Min score: ${minScore}`);
      console.log(`- Results found: ${searchResults.length}`);
      
      if (searchResults.length > 0) {
        const avgScore = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;
        console.log(`- Average score: ${avgScore.toFixed(4)}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
console.log('🚀 Starting vector search test...');
testVectorSearch();
