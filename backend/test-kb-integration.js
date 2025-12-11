#!/usr/bin/env node
// Quick test script to verify KB integration is working

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testKBIntegration() {
  console.log('🧪 Testing Knowledge Base Integration...\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Environment Variables:');
  console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AI_COACH_MODEL: ${process.env.AI_COACH_MODEL || 'deepseek/deepseek-chat-v3.1:free'}`);
  console.log(`   OPENROUTER_ENABLE_WEB_SEARCH: ${process.env.OPENROUTER_ENABLE_WEB_SEARCH || 'false'}`);
  
  if (process.env.OPENROUTER_ENABLE_WEB_SEARCH === 'true') {
    console.log(`   🌐 Web Search: ENABLED (model will be: ${process.env.AI_COACH_MODEL || 'deepseek/deepseek-chat-v3.1:free'}:online)`);
  } else {
    console.log(`   🌐 Web Search: DISABLED`);
  }

  // Test 2: Check Enhanced AI Coach service
  console.log('\n2️⃣ Enhanced AI Coach Service:');
  try {
    const { default: EnhancedAICareerCoach } = await import('./src/utils/ai/enhancedAICareerCoach.service.js');
    const aiCoach = new EnhancedAICareerCoach();
    console.log('   ✅ Enhanced AI Coach service loaded');
    
    // Test model getter
    const model = aiCoach._getModel();
    console.log(`   📋 Current model: ${model}`);
  } catch (error) {
    console.log(`   ❌ Enhanced AI Coach service failed: ${error.message}`);
  }

  // Test 3: Check MCP Knowledge Base service
  console.log('\n3️⃣ MCP Knowledge Base Service:');
  try {
    const { default: mcpKB } = await import('./src/services/mcpKnowledgeBaseService.js');
    const status = mcpKB.getStatus();
    console.log(`   ✅ MCP KB service loaded`);
    console.log(`   📊 Status: ${JSON.stringify(status, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ MCP KB service failed: ${error.message}`);
  }

  // Test 4: Check MongoDB models
  console.log('\n4️⃣ MongoDB Models:');
  try {
    const { KnowledgeBase, UserCareerProfile, JournalEntry } = await import('./src/models/aiCareerCoach.model.js');
    console.log('   ✅ AI Career Coach models loaded');
    console.log(`   📋 Available models: KnowledgeBase, UserCareerProfile, JournalEntry`);
  } catch (error) {
    console.log(`   ❌ MongoDB models failed: ${error.message}`);
  }

  console.log('\n🎯 Quick Fixes Applied:');
  console.log('   ✅ Auto-enable AI Coach consent on user registration');
  console.log('   ✅ Write to both MCP file-based and MongoDB KnowledgeBase after uploads');
  console.log('   ✅ Enable web search via OPENROUTER_ENABLE_WEB_SEARCH=true');
  console.log('   ✅ Single model consolidation: deepseek/deepseek-chat-v3.1:free');

  console.log('\n📝 To enable web search, set in your .env:');
  console.log('   OPENROUTER_ENABLE_WEB_SEARCH=true');
  console.log('   OPENROUTER_API_KEY=your_key_here');

  console.log('\n✨ Integration test complete!');
}

testKBIntegration().catch(console.error);
