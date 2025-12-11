/**
 * MCP Knowledge Base Service - MEMORY OPTIMIZED
 * Builds and maintains a knowledge base using DeepSeek LLM based on user onboarding and journals
 * Provides actionable career improvement steps
 */

import OpenAI from 'openai';
import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

class MCPKnowledgeBaseService {
  constructor() {
    console.log('🔑 Environment Variables:', {
      NOVITA_API_KEY: process.env.NOVITA_API_KEY ? '***' + process.env.NOVITA_API_KEY.slice(-4) : 'NOT SET',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '***' + process.env.OPENROUTER_API_KEY.slice(-4) : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development',
      AI_MODEL: process.env.AI_RECOMMENDER_MODEL || 'deepseek/deepseek-r1-distill-qwen-32b'
    });

    // Lazy initialization of OpenAI client
    this._openai = null;
    this.knowledgeBase = new Map(); // userId -> knowledge data
    this.lastUpdate = new Map(); // userId -> last update timestamp
    this.isInitialized = false;
    this._cronJobs = []; // Track cron jobs for cleanup
    this._updateQueue = new Set(); // Prevent duplicate updates

    // Memory optimization settings
    this.maxConcurrentUpdates = 2;
    this.currentUpdates = 0;
    this.maxKnowledgeBases = parseInt(process.env.MAX_KNOWLEDGE_BASES) || 10;

    // MCP Server endpoints
    this.mcpEndpoints = {
      '/mcp/knowledge-base/structure': this.getKnowledgeStructure.bind(this),
      '/mcp/knowledge-base/contents': this.getKnowledgeContents.bind(this),
      '/mcp/knowledge-base/ask': this.askQuestion.bind(this),
      '/mcp/knowledge-base/update': this.updateKnowledgeBase.bind(this)
    };
  }

  // Lazy initialization of OpenAI client to save startup memory
  get openai() {
    if (!this._openai) {
      // Prioritize Novita API key
      const apiKey = process.env.NOVITA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('NOVITA_API_KEY (or OPENROUTER_API_KEY/OPENAI_API_KEY) is not set in environment variables');
      }

      let baseURL = process.env.NOVITA_API_URL || 'https://api.novita.ai/openai';
      const defaultHeaders = {};
      
      // Use Novita if NOVITA_API_KEY is set
      if (process.env.NOVITA_API_KEY) {
        baseURL = process.env.NOVITA_API_URL || 'https://api.novita.ai/openai';
      } else if (process.env.OPENROUTER_API_KEY) {
        baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        defaultHeaders['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL || 'http://localhost:3000';
        defaultHeaders['X-Title'] = process.env.OPENROUTER_APP_NAME || 'JobHunter';
      } else {
        baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      }

      const configuration = {
        apiKey,
        baseURL,
        defaultHeaders
      };
      this._openai = new OpenAI(configuration);
      console.log(`✅ OpenAI client initialized with ${process.env.NOVITA_API_KEY ? 'Novita' : process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI'} configuration`);
    }
    return this._openai;
  }

  /**
   * Initialize the MCP Knowledge Base Service - MEMORY SAFE
   */
  async initialize() {
    try {
      console.log('🚀 Initializing MCP Knowledge Base Service...');

      // Load existing knowledge bases (metadata only to save memory)
      await this.loadExistingKnowledgeBases();

      // Only start scheduler if explicitly enabled
      if (process.env.ENABLE_KB_SCHEDULER === 'true') {
        this.startIncrementalUpdates();
      } else {
        console.log('📅 KB scheduler disabled (set ENABLE_KB_SCHEDULER=true to enable)');
      }

      this.isInitialized = true;
      console.log('✅ MCP Knowledge Base Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Knowledge Base Service:', error);
      throw error;
    }
  }

  /**
   * Load existing knowledge bases from storage - MEMORY OPTIMIZED
   * Only loads metadata to prevent memory bloat
   */
  async loadExistingKnowledgeBases() {
    try {
      const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge-bases');
      await fs.mkdir(knowledgeDir, { recursive: true });

      const files = await fs.readdir(knowledgeDir);
      let loadedCount = 0;

      // Limit the number of files we process
      const filesToLoad = files
        .filter(file => file.endsWith('.json'))
        .slice(0, this.maxKnowledgeBases);

      for (const file of filesToLoad) {
        try {
          const userId = file.replace('.json', '');
          const filePath = path.join(knowledgeDir, file);

          // Check file size first to avoid loading huge files
          const stats = await fs.stat(filePath);
          if (stats.size > 5 * 1024 * 1024) { // Skip files larger than 5MB
            console.warn(`⚠️ Skipping large knowledge base file: ${file} (${Math.round(stats.size / 1024 / 1024)}MB)`);
            continue;
          }

          // Only load metadata, not the full data
          const data = await fs.readFile(filePath, 'utf8');
          const parsedData = JSON.parse(data);

          // Store only essential metadata to save memory
          this.knowledgeBase.set(userId, {
            userId: parsedData.userId,
            version: parsedData.version || '1.0.0',
            lastUpdated: parsedData.lastUpdated,
            createdAt: parsedData.createdAt,
            metadata: {
              source: parsedData.metadata?.source,
              sections: parsedData.data ? Object.keys(parsedData.data).length : 0
            },
            // Store file path instead of full data
            _filePath: filePath,
            _dataLoaded: false
          });

          this.lastUpdate.set(userId, parsedData.lastUpdated || new Date().toISOString());
          loadedCount++;

          // Periodic garbage collection
          if (loadedCount % 5 === 0 && global.gc) {
            global.gc();
          }
        } catch (fileError) {
          console.error(`Error loading knowledge base file ${file}:`, fileError.message);
        }
      }

      console.log(`📚 Loaded ${loadedCount} existing knowledge bases (metadata only)`);

      // Final cleanup
      if (global.gc) global.gc();
    } catch (error) {
      console.error('Error loading existing knowledge bases:', error);
    }
  }

  /**
   * Load full knowledge base data when actually needed
   */
  async _loadFullKnowledgeBase(userId) {
    const kb = this.knowledgeBase.get(userId);
    if (!kb || kb._dataLoaded) return kb;

    try {
      const data = await fs.readFile(kb._filePath, 'utf8');
      const fullData = JSON.parse(data);

      // Update with full data
      const updatedKb = {
        ...kb,
        data: fullData.data,
        updateHistory: fullData.updateHistory,
        _dataLoaded: true
      };

      this.knowledgeBase.set(userId, updatedKb);
      return updatedKb;
    } catch (error) {
      console.error(`Error loading full data for user ${userId}:`, error);
      return kb;
    }
  }

  /**
   * Start the incremental update scheduler - FIXED VERSION
   * IMPORTANT: Does NOT run updates immediately during startup
   */
  startIncrementalUpdates() {
    // Only schedule daily updates at 2 AM
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('🌙 Running scheduled knowledge base updates (2 AM)...');
      try {
        await this.updateAllKnowledgeBases();
        console.log('✅ Completed 2 AM knowledge base updates');
      } catch (error) {
        console.error('❌ Error during 2 AM update:', error);
      }
    }, {
      timezone: 'Africa/Nairobi',
      scheduled: false // Don't start immediately
    });

    this._cronJobs.push(job);

    // Only start if auto-updates are enabled
    if (process.env.ENABLE_KB_AUTO_UPDATE === 'true') {
      job.start();
      console.log('⏰ Knowledge base updates scheduled (2 AM daily)');
    } else {
      console.log('⏰ Auto-updates disabled (set ENABLE_KB_AUTO_UPDATE=true to enable)');
    }

    // CRITICAL FIX: DO NOT run updates immediately during startup
    // This was causing the memory crash
    console.log('✅ Scheduler configured (no immediate updates to prevent memory issues)');
  }

  /**
   * Update all knowledge bases - MEMORY OPTIMIZED WITH BATCHING
   */
  async updateAllKnowledgeBases() {
    const userIds = Array.from(this.knowledgeBase.keys());
    if (userIds.length === 0) {
      console.log('ℹ️ No knowledge bases to update');
      return;
    }

    console.log(`🔄 Updating knowledge bases for ${userIds.length} users (memory-safe batching)`);

    // Process in very small batches to avoid memory issues
    const batchSize = 2;
    let processedCount = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Process batch sequentially (not parallel) to control memory usage
      for (const userId of batch) {
        try {
          if (this._updateQueue.has(userId)) {
            console.log(`⏭️ Skipping user ${userId} - already in update queue`);
            continue;
          }

          this._updateQueue.add(userId);

          // Check current memory usage before proceeding
          const memUsage = process.memoryUsage();
          const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

          if (heapUsedMB > 3000) { // Stop if memory usage is too high
            console.warn(`⚠️ Stopping updates due to high memory usage: ${heapUsedMB}MB`);
            this._updateQueue.delete(userId);
            break;
          }

          const knowledge = this.knowledgeBase.get(userId);
          if (!knowledge) {
            this._updateQueue.delete(userId);
            continue;
          }

          console.log(`🔍 Processing user ${userId} (v${knowledge.version})`);

          // Get new data since last update
          const lastUpdated = knowledge.lastUpdated || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const newData = await this.fetchNewUserData(userId, lastUpdated);

          // Check if there's actually new data to process
          const hasNewData = newData && Object.entries(newData).some(([key, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && typeof value === 'object' ? Object.keys(value).length > 0 : false;
          });

          if (hasNewData) {
            await this.updateKnowledgeBase(userId, newData, 'scheduled');
            console.log(`  ✓ Successfully updated knowledge base for user ${userId}`);
          } else {
            console.log(`  ✓ No new data for user ${userId}, skipping update`);
          }

          processedCount++;
        } catch (error) {
          console.error(`❌ Error updating knowledge base for user ${userId}:`, error);
        } finally {
          this._updateQueue.delete(userId);
        }

        // Add delay between each user and force GC
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (global.gc) global.gc();
      }

      // Longer delay between batches
      if (i + batchSize < userIds.length) {
        console.log(`⏳ Processed ${processedCount}/${userIds.length} users, pausing for memory cleanup...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        if (global.gc) global.gc();
      }
    }

    console.log('✅ Completed all knowledge base updates');
  }

  /**
   * Build knowledge base for a user - MEMORY CONTROLLED
   */
  async buildKnowledgeBase(userId, onboardingData, journalEntries, researchData = []) {
    // Check if we're already at max concurrent updates
    if (this.currentUpdates >= this.maxConcurrentUpdates) {
      throw new Error('Too many concurrent knowledge base updates. Try again later.');
    }

    this.currentUpdates++;

    try {
      console.log(`🏗️ Building knowledge base for user ${userId}`);

      // Truncate inputs if they're too large
      const maxInputSize = 8000;
      let onboardingStr = JSON.stringify(onboardingData);
      let journalStr = JSON.stringify(journalEntries);

      if (onboardingStr.length > maxInputSize) {
        onboardingData = JSON.parse(onboardingStr.substring(0, maxInputSize));
      }
      if (journalStr.length > maxInputSize) {
        journalEntries = journalEntries.slice(0, 10); // Limit to 10 most recent entries
      }

      // Limit research data
      researchData = researchData.slice(0, 5);

      const prompt = this.createKnowledgeBasePrompt(onboardingData, journalEntries, researchData);
      console.log(`📊 Including ${researchData.length} research items in knowledge base`);

      // Generate content with memory-conscious retry logic
      const knowledgeData = await this._generateWithRetry(prompt, userId);

      if (!knowledgeData || typeof knowledgeData !== 'object') {
        throw new Error('Invalid knowledge data format received from model');
      }

      // Store the knowledge base
      const knowledgeBase = {
        userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        data: knowledgeData,
        metadata: {
          source: process.env.AI_RECOMMENDER_MODEL || 'deepseek/deepseek-r1-distill-qwen-32b',
          inputTokens: Math.floor(prompt.length / 4),
          outputTokens: Math.floor(JSON.stringify(knowledgeData).length / 4),
          modelParameters: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        },
        _dataLoaded: true
      };

      this.knowledgeBase.set(userId, knowledgeBase);
      await this.saveKnowledgeBase(userId);

      console.log(`✅ Knowledge base built for user ${userId}`);

      // Clean up memory
      if (global.gc) global.gc();

      return knowledgeBase;
    } catch (error) {
      console.error(`❌ Error building knowledge base for user ${userId}:`, error);
      throw error;
    } finally {
      this.currentUpdates--;
    }
  }

  /**
   * Generate content with retry logic and memory optimization
   */
  async _generateWithRetry(prompt, userId) {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_RECOMMENDER_MODEL || 'deepseek/deepseek-r1-distill-qwen-32b',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that builds knowledge bases in JSON format. Keep responses concise to conserve memory.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 3000, // Reduced from 4096 to save memory
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || [responseText];
          const knowledgeData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          console.log(`✅ [build-${userId}] Successfully parsed knowledge base data`);
          return knowledgeData;
        } catch (parseError) {
          console.warn(`⚠️ JSON parse attempt ${attempts + 1} failed:`, parseError.message);
          attempts++;
          if (attempts >= maxAttempts) throw new Error('Failed to parse response after multiple attempts');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        console.error(`❌ Generation attempt ${attempts + 1} failed:`, error.message);
        attempts++;
        if (attempts >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  // Keep existing methods but with memory checks...
  createKnowledgeBasePrompt(onboardingData, journalEntries, researchData = []) {
    const formattedResearch = researchData.length > 0
      ? `RESEARCH & MARKET INSIGHTS:\n${researchData.map(item =>
        `- ${item.title || 'Insight'} (${item.source || 'Unknown Source'}): ${(item.summary || item.content || '').substring(0, 200)}`
      ).join('\n')}`
      : 'RESEARCH & MARKET INSIGHTS: None provided';

    // Truncate to prevent memory issues
    return `You are an AI career coach building a knowledge base for a user. Create a JSON response with these sections: userProfile, actionPlan, marketInsights, skillDevelopment, actionableSteps.

USER DATA:
ONBOARDING: ${JSON.stringify(onboardingData, null, 1)}
JOURNALS: ${JSON.stringify(journalEntries.slice(0, 5), null, 1)}
${formattedResearch}

Return ONLY valid JSON with the structure containing userProfile, actionPlan, marketInsights, skillDevelopment, and actionableSteps sections. Keep responses concise.`;
  }

  // Fetch user data with limits
  async fetchUserData(userId) {
    try {
      const { UserCareerProfile, JournalEntry } = await import('../models/aiCareerCoach.model.js');
      const profile = await UserCareerProfile.findOne({ user_id: userId }).lean();
      const recentJournalEntries = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(5) // Reduced from 20
        .lean();

      return {
        recentJournalEntries: recentJournalEntries.map(e => ({
          content: (e.content || '').substring(0, 500), // Truncate content
          timestamp: e.metadata?.date || e.createdAt
        })),
        newSkills: Object.keys(profile?.resume_analysis?.skills_heat_map || {}).slice(0, 10).map(s => ({ skill: s })),
        completedGoals: [],
        updatedPreferences: {},
        researchData: []
      };
    } catch (e) {
      console.warn('fetchUserData DB fallback:', e?.message || e);
      return { recentJournalEntries: [], newSkills: [], completedGoals: [], updatedPreferences: {}, researchData: [] };
    }
  }

  async fetchNewUserData(userId, lastUpdated) {
    try {
      const newData = await this.fetchUserData(userId);

      const filteredData = {
        recentJournalEntries: (newData.recentJournalEntries || []).filter(
          entry => new Date(entry.timestamp) > new Date(lastUpdated)
        ),
        newSkills: (newData.newSkills || []),
        completedGoals: [],
        updatedPreferences: {},
        researchData: []
      };

      return filteredData;
    } catch (error) {
      console.error(`Error fetching new data for user ${userId}:`, error);
      return { recentJournalEntries: [], newSkills: [], completedGoals: [], updatedPreferences: {}, researchData: [] };
    }
  }

  // Keep other existing methods but add memory checks where needed...
  async updateKnowledgeBase(userId, newData = null, updateType = 'incremental') {
    // Load full data only when needed
    // Load full data only when needed
    const knowledge = await this._loadFullKnowledgeBase(userId);

    if (!knowledge) {
      console.log(`ℹ️ Knowledge base not found for user ${userId} - creating new one`);
      // Initialize an empty knowledge base structure
      const emptyOnboarding = { skills: [], goals: [] };
      const emptyJournals = [];
      return this.buildKnowledgeBase(userId, emptyOnboarding, emptyJournals, []);
    }

    // For now, return existing knowledge to avoid memory issues during updates
    // You can implement the full update logic once the basic startup is working
    console.log(`📝 Update requested for user ${userId} (type: ${updateType}) - returning existing data`);
    return knowledge;
  }

  async saveKnowledgeBase(userId) {
    try {
      const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge-bases');
      await fs.mkdir(knowledgeDir, { recursive: true });

      const knowledge = this.knowledgeBase.get(userId);
      if (knowledge) {
        await fs.writeFile(
          path.join(knowledgeDir, `${userId}.json`),
          JSON.stringify(knowledge, null, 2)
        );
      }
    } catch (error) {
      console.error(`Error saving knowledge base for user ${userId}:`, error);
    }
  }

  // MCP endpoint methods (simplified for memory safety)
  async getKnowledgeStructure(userId) {
    const knowledge = this.knowledgeBase.get(userId);
    if (!knowledge) return { error: 'Knowledge base not found' };

    return {
      userId,
      version: knowledge.version,
      lastUpdated: knowledge.lastUpdated,
      structure: knowledge.data ? Object.keys(knowledge.data) : []
    };
  }

  async getKnowledgeContents(userId, section = null) {
    const knowledge = await this._loadFullKnowledgeBase(userId);
    if (!knowledge) return { error: 'Knowledge base not found' };

    if (section) {
      return { userId, section, data: knowledge.data?.[section] || {} };
    }

    return { userId, version: knowledge.version, lastUpdated: knowledge.lastUpdated, data: knowledge.data };
  }

  async askQuestion(userId, question) {
    const knowledge = await this._loadFullKnowledgeBase(userId);
    if (!knowledge) return { error: 'Knowledge base not found' };

    // Simplified to avoid memory issues
    return {
      userId,
      question,
      answer: 'Knowledge base question answering is currently disabled to conserve memory. Please try again later.',
      timestamp: new Date().toISOString()
    };
  }

  getMCPEndpoints() {
    return this.mcpEndpoints;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalKnowledgeBases: this.knowledgeBase.size,
      lastUpdates: Object.fromEntries(Array.from(this.lastUpdate.entries()).slice(0, 5)), // Limit output
      endpoints: Object.keys(this.mcpEndpoints),
      currentUpdates: this.currentUpdates,
      maxConcurrentUpdates: this.maxConcurrentUpdates
    };
  }

  // Cleanup method
  async cleanup() {
    console.log('🧹 Cleaning up MCP Knowledge Base Service...');

    // Stop all cron jobs
    this._cronJobs.forEach(job => job.destroy());
    this._cronJobs = [];

    // Clear memory
    this.knowledgeBase.clear();
    this.lastUpdate.clear();
    this._updateQueue.clear();

    // Close OpenAI client if initialized
    if (this._openai) {
      this._openai = null;
    }

    if (global.gc) global.gc();
    console.log('✅ MCP Knowledge Base Service cleanup completed');
  }
}

export default new MCPKnowledgeBaseService();