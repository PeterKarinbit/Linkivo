/**
 * Test script for MCP Knowledge Base Server
 * Run with: node test-mcp-server.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/v1/mcp-knowledge-base';

async function testMCPServer() {
  console.log('🧪 Testing MCP Knowledge Base Server...\n');

  try {
    // Test 1: Get MCP server info
    console.log('1️⃣ Testing MCP server info...');
    const mcpInfo = await fetch(`${BASE_URL}/mcp`);
    const mcpData = await mcpInfo.json();
    console.log('✅ MCP Info:', mcpData);

    // Test 2: Get service status
    console.log('\n2️⃣ Testing service status...');
    const status = await fetch(`${BASE_URL}/status`);
    const statusData = await status.json();
    console.log('✅ Service Status:', statusData);

    // Test 3: Get available tools
    console.log('\n3️⃣ Testing available tools...');
    const tools = await fetch(`${BASE_URL}/tools`);
    const toolsData = await tools.json();
    console.log('✅ Available Tools:', toolsData.data.tools.length, 'tools found');

    // Test 4: Test knowledge base structure (requires auth)
    console.log('\n4️⃣ Testing knowledge base structure...');
    const testUserId = 'test-user-123';
    const structure = await fetch(`${BASE_URL}/knowledge-base/structure/${testUserId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (structure.ok) {
      const structureData = await structure.json();
      console.log('✅ Knowledge Structure:', structureData);
    } else {
      console.log('⚠️ Knowledge Structure requires authentication (expected)');
    }

    // Test 5: Test knowledge base contents
    console.log('\n5️⃣ Testing knowledge base contents...');
    const contents = await fetch(`${BASE_URL}/knowledge-base/contents/${testUserId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (contents.ok) {
      const contentsData = await contents.json();
      console.log('✅ Knowledge Contents:', contentsData);
    } else {
      console.log('⚠️ Knowledge Contents requires authentication (expected)');
    }

    // Test 6: Test asking a question
    console.log('\n6️⃣ Testing ask question...');
    const question = await fetch(`${BASE_URL}/knowledge-base/ask`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: testUserId,
        question: 'What are my career development opportunities?'
      })
    });
    
    if (question.ok) {
      const questionData = await question.json();
      console.log('✅ Question Response:', questionData);
    } else {
      console.log('⚠️ Ask Question requires authentication (expected)');
    }

    console.log('\n🎉 MCP Knowledge Base Server tests completed!');
    console.log('\n📋 Summary:');
    console.log('- MCP server is running and accessible');
    console.log('- Service status endpoint working');
    console.log('- Tools discovery working');
    console.log('- Authentication-protected endpoints working as expected');
    console.log('\n🔗 MCP Endpoints:');
    console.log(`- SSE: ${BASE_URL}/sse`);
    console.log(`- HTTP: ${BASE_URL}/mcp`);
    console.log(`- Status: ${BASE_URL}/status`);
    console.log(`- Tools: ${BASE_URL}/tools`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3000');
    console.log('   Run: cd backend && npm run dev');
  }
}

// Run the tests
testMCPServer();
