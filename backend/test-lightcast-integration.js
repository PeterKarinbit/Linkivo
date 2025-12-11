import 'dotenv/config';
import axios from 'axios';
import lightcastService from './src/services/lightcast/lightcast.service.js';

// Helper function to test connection to auth server
async function testAuthConnection() {
  try {
    console.log('Testing connection to authentication server...');
    const response = await axios({
      method: 'get',
      url: 'https://auth.emsicloud.com/.well-known/openid-configuration',
      timeout: 10000
    });
    console.log('✅ Successfully connected to authentication server');
    console.log('Auth server info:', {
      issuer: response.data.issuer,
      token_endpoint: response.data.token_endpoint,
      scopes_supported: response.data.scopes_supported
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to authentication server:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from auth server');
    }
    return false;
  }
}

async function testLightcastIntegration() {
  console.log('🚀 Starting Lightcast API integration tests...');
  
  // Test connection to auth server first
  if (!await testAuthConnection()) {
    console.error('❌ Aborting tests due to authentication server connection issues');
    process.exit(1);
  }

  try {
    // 1. Test service status
    console.log('\n1. Testing service status...');
    const status = await lightcastService.getStatus();
    console.log('✅ Service status:', status.data.message);
    console.log('✅ Service healthy:', status.data.healthy);

    // 2. Test service metadata
    console.log('\n2. Testing service metadata...');
    const meta = await lightcastService.getMeta();
    console.log('✅ Latest version:', meta.data.latestVersion);

    // 3. List available versions
    console.log('\n3. Listing available versions...');
    const versions = await lightcastService.listVersions();
    const versionList = versions.data.slice(0, 5);
    console.log(`✅ Found ${versions.data.length} versions (showing first 5):`);
    console.log(versionList.join(', '), '...');

    if (versionList.length > 0) {
      // 4. Get version info for the latest version
      const latestVersion = versionList[0];
      console.log(`\n4. Getting info for version: ${latestVersion}...`);
      const versionInfo = await lightcastService.getVersionInfo(latestVersion);
      console.log('✅ Version info:', {
        version: versionInfo.data.version,
        skillCount: versionInfo.data.skillCount,
        skillTypes: versionInfo.data.types.map(t => `${t.name} (${t.id})`).join(', ')
      });

      // 5. Test skills search with a common skill
      const testSkill = 'javascript';
      console.log(`\n5. Testing skills search for: "${testSkill}"`);
      const searchResults = await lightcastService.searchSkills({
        q: testSkill,
        limit: 3,
        typeIds: 'ST1,ST2' // Specialized and Common skills
      });
      
      console.log(`✅ Found ${searchResults.data.length} skills:`);
      searchResults.data.forEach((skill, index) => {
        console.log(`   ${index + 1}. ${skill.name} (${skill.type.name}, ID: ${skill.id})`);
      });
      
      if (searchResults.data.length > 0) {
        const skillId = searchResults.data[0].id;
        const skillName = searchResults.data[0].name;
        
        // 6. Test skill details
        console.log(`\n6. Testing skill details for ID: ${skillId} (${skillName})`);
        const skillDetails = await lightcastService.getSkillDetails(skillId);
        console.log('✅ Skill details:', {
          name: skillDetails.data.name,
          type: skillDetails.data.type.name,
          description: skillDetails.data.description || 'No description available'
        });
        
        // 7. Test related skills
        console.log(`\n7. Testing related skills for: ${skillName}`);
        const relatedSkills = await lightcastService.getRelatedSkills(skillId, { limit: 3 });
        console.log(`✅ Found ${relatedSkills.data.length} related skills:`);
        relatedSkills.data.forEach((skill, index) => {
          console.log(`   ${index + 1}. ${skill.name} (${skill.type.name})`);
        });
      }
      
      // 8. Test skill extraction
      console.log('\n8. Testing skill extraction from sample text...');
      const sampleText = `
        We are looking for a Senior JavaScript Developer with experience in React, Node.js, and AWS. 
        The ideal candidate should have strong skills in frontend development and cloud services.
      `;
      
      const extractedSkills = await lightcastService.extractSkills(sampleText, {
        confidenceThreshold: 0.7,
        language: 'en'
      });
      
      console.log(`✅ Extracted ${extractedSkills.length} skills:`);
      extractedSkills.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.skill.name} (Confidence: ${(item.confidence * 100).toFixed(1)}%)`);
      });
    }
    
    console.log('\n🎉 Lightcast API integration test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    
    if (error.details) {
      console.error('Error details:', JSON.stringify(error.details, null, 2));
    } else if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }
    
    process.exit(1);
  }
}

// Run the test with error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

testLightcastIntegration();
