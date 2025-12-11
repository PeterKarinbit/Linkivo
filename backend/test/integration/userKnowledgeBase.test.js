import { expect } from 'chai';
import mcpKnowledgeBaseService from '../../src/services/mcpKnowledgeBaseService.js';
import { promises as fs } from 'fs';
import sinon from 'sinon';

// Mock user data
const testUser = {
  _id: '6889fe188842ddd14e2ad38b',
  username: 'rogh',
  email: 'rogh@gmail.com',
  role: 'jobSeeker',
  aiCoachConsent: {
    scopes: { applications: false, goals: false, journals: false, knowledgeBase: false, resume: false, tasks: false },
    schedule: { cadence: 'weekly', timezone: 'UTC', windowLocalTime: '09:00' },
    enabled: false
  },
  userProfile: {
    address: { country: '' },
    doneOnboarding: true,
    savedJobs: [null],
    profilePicture: 'data:image/jpeg;base64,...'
  }
};

describe('User Knowledge Base Integration', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(fs, 'writeFile').resolves();
    sandbox.stub(fs, 'readFile').resolves(JSON.stringify({}));
    sandbox.stub(mcpKnowledgeBaseService, '_generateWithRetry').resolves({
      userProfile: { username: 'rogh', email: 'rogh@gmail.com' },
      actionPlan: {},
      marketInsights: {},
      skillDevelopment: {},
      actionableSteps: {},
      preferences: {}
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should create knowledge base for new user', async () => {
    const userId = testUser._id;
    const result = await mcpKnowledgeBaseService.updateKnowledgeBase(userId, testUser, 'full');

    // Verify the result structure
    expect(result).to.be.an('object');
    expect(result).to.have.property('version');
    expect(result).to.have.property('data');
    expect(result.data).to.have.property('userProfile');

    // Verify the knowledge base was created with user data
    const kb = await mcpKnowledgeBaseService.getKnowledgeContents(userId);
    expect(kb).to.exist;
    // Check for userId in the data object
    expect(kb.data.userProfile).to.exist;
    expect(kb.data.userProfile.username).to.equal(testUser.username);
    expect(kb.data.userProfile.email).to.equal(testUser.email);

    // Verify the structure of the saved knowledge base
    expect(kb).to.have.property('version');
    expect(kb).to.have.property('lastUpdated');
    expect(kb.data).to.have.property('preferences');
  });
});
