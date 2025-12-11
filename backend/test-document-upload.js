import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';
const TEST_USER_ID = '000000000000000000000001'; // Replace with a valid user ID
const TEST_TOKEN = 'your-test-token'; // Replace with a valid JWT token

// Sample PDF file for testing (you'll need to create this or use an existing one)
const TEST_FILE_PATH = './test-resume.pdf';

async function testDocumentUpload() {
  try {
    // 1. Check if test file exists
    if (!fs.existsSync(TEST_FILE_PATH)) {
      console.error(`Test file not found: ${TEST_FILE_PATH}`);
      console.log('Please create a test PDF file or update the TEST_FILE_PATH');
      return;
    }

    // 2. Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_FILE_PATH));
    formData.append('documentType', 'resume');

    console.log('🚀 Testing document upload...');
    
    // 3. Make the request
    const response = await axios.post(
      `${API_BASE_URL}/documents`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log('✅ Document uploaded successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // 4. Test getting the uploaded document
    if (response.data.data && response.data.data._id) {
      const docId = response.data.data._id;
      console.log('\n🔍 Testing document retrieval...');
      
      const getResponse = await axios.get(
        `${API_BASE_URL}/documents/${docId}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        }
      );
      
      console.log('✅ Document retrieved successfully!');
      console.log('Document details:', JSON.stringify({
        id: getResponse.data.data._id,
        status: getResponse.data.data.status,
        documentType: getResponse.data.data.documentType,
        skills: getResponse.data.data.structuredData?.skills?.map(s => s.name) || []
      }, null, 2));
      
      // 5. Test searching documents
      console.log('\n🔍 Testing document search...');
      const searchResponse = await axios.get(
        `${API_BASE_URL}/documents/search`,
        {
          params: { query: 'skills' },
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        }
      );
      
      console.log('✅ Search completed!');
      console.log(`Found ${searchResponse.data.count} matching documents`);
      
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    console.error('Error config:', error.config);
  }
}

// Run the test
testDocumentUpload();
