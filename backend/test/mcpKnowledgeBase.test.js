import { expect } from 'chai';
import sinon from 'sinon';
import mcpKnowledgeBaseService from '../src/services/mcpKnowledgeBaseService.js';
import { promises as fs } from 'fs';

// Simple mock object to replace the actual Gemini API calls
const mockGeminiResponse = {
  response: {
    text: () => JSON.stringify({
      userProfile: { name: 'Test User', currentRole: 'Software Engineer' },
      careerPath: { goals: [{ goal: 'Become a Senior Developer', timeframe: '2 years', progress: 30 }] },
      skillDevelopment: { currentSkills: ['JavaScript', 'Node.js'], targetSkills: ['Machine Learning', 'Cloud Architecture'] },
      marketInsights: { trends: ['AI is growing rapidly', 'Remote work is increasing'] },
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    })
  }
};

describe('MCP Knowledge Base Service', () => {
  const testUserId = 'test-user-123';
  let sandbox;

  before(() => {
    // Stub the private _generateWithRetry method which handles the API calls
    // We do this at the class/singleton level for all tests
    sinon.stub(mcpKnowledgeBaseService, '_generateWithRetry').resolves({
      userProfile: { name: 'Test User', currentRole: 'Software Engineer' },
      actionPlan: { goals: [{ goal: 'Become a Senior Developer', timeframe: '2 years', progress: 30 }] },
      skillDevelopment: { currentSkills: ['JavaScript', 'Node.js'], targetSkills: ['Machine Learning', 'Cloud Architecture'] },
      marketInsights: { trends: ['AI is growing rapidly', 'Remote work is increasing'] },
      actionableSteps: { steps: ['Learn Python', 'Build a project'] }
    });
  });

  after(() => {
    // Restore the stub
    if (mcpKnowledgeBaseService._generateWithRetry.restore) {
      mcpKnowledgeBaseService._generateWithRetry.restore();
    }
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Reset the knowledge base before each test
    mcpKnowledgeBaseService.knowledgeBase.clear();
    mcpKnowledgeBaseService.lastUpdate.clear();
    mcpKnowledgeBaseService.isInitialized = false;

    // Mock filesystem operations
    sandbox.stub(fs, 'writeFile').resolves();
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify({
      userId: 'test-user-123',
      version: '1.0',
      data: {}
    }));
    sandbox.stub(fs, 'readdir').resolves(['test-user-123.json']);
    sandbox.stub(fs, 'mkdir').resolves();
    sandbox.stub(fs, 'stat').resolves({ size: 1024 });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('updateKnowledgeBase', () => {
    it('should create a new knowledge base with research data', async function () {
      this.timeout(15000); // Increase timeout for this test

      const testData = {
        name: 'Test User',
        role: 'Software Engineer',
        researchData: [
          {
            title: 'Test Research',
            source: 'Test Source',
            summary: 'This is a test research summary',
            relevance: 'high',
            date: new Date().toISOString()
          }
        ]
      };

      const result = await mcpKnowledgeBaseService.updateKnowledgeBase(testUserId, testData, 'full');

      // Check the structure of the result
      expect(result).to.be.an('object');
      expect(result).to.have.property('userId', testUserId);
      expect(result).to.have.property('version');
      expect(result).to.have.property('data');

      // Verify the knowledge base was created with the expected structure
      const kb = mcpKnowledgeBaseService.knowledgeBase.get(testUserId);
      expect(kb).to.be.an('object');
      expect(kb).to.have.property('userId', testUserId);
      expect(kb).to.have.property('version');
      expect(kb).to.have.property('data');
    });
  });

  describe('updateAllKnowledgeBases', () => {
    it('should update all knowledge bases with research data', async function () {
      this.timeout(30000); // Increase timeout for this test

      // First create a test knowledge base
      await mcpKnowledgeBaseService.updateKnowledgeBase(testUserId, {
        name: 'Test User',
        role: 'Developer',
        researchData: [{
          title: 'Test Research',
          summary: 'Test summary',
          source: 'Test Source',
          relevance: 'high',
          date: new Date().toISOString()
        }]
      }, 'full');

      // Now test updating all knowledge bases
      await mcpKnowledgeBaseService.updateAllKnowledgeBases();

      // Verify the knowledge base was updated
      const kb = mcpKnowledgeBaseService.knowledgeBase.get(testUserId);
      expect(kb).to.be.an('object');
      expect(kb).to.have.property('lastUpdated');
      expect(kb).to.have.property('version');
      expect(kb).to.have.property('data');

      // The data should have been processed by the update
      expect(kb.data).to.be.an('object');
    });
  });

  describe('createKnowledgeBasePrompt', () => {
    it('should include research data in the prompt', () => {
      const prompt = mcpKnowledgeBaseService.createKnowledgeBasePrompt(
        { name: 'Test User' },
        [{ content: 'Test journal entry' }],
        [{
          title: 'Test Research',
          summary: 'Test summary',
          source: 'Test Source',
          relevance: 'high',
          date: new Date().toISOString()
        }]
      );

      // Check if the prompt includes the research data
      expect(prompt).to.include('Test Research');
      expect(prompt).to.include('Test summary');
      expect(prompt).to.include('Test Source');
    });
  });
});
