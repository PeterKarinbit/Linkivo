import { expect } from 'chai';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import LearningRecommendationService from '../src/services/LearningRecommendationService.js';
import { SerperService } from '../src/services/SerperService.js';

// Mock DOM environment for any client-side code
const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;

// Mock Serper API response
const mockSerperResponse = {
  organic: [
    {
      title: 'Machine Learning by Andrew Ng',
      link: 'https://www.coursera.org/learn/machine-learning',
      snippet: 'Learn the fundamentals of machine learning and get hands-on experience building models.',
      position: 1
    },
    {
      title: 'Python for Everybody',
      link: 'https://www.coursera.org/specializations/python',
      snippet: 'Learn to program with Python, one of the most popular programming languages.',
      position: 2
    },
    {
      title: 'Introduction to Data Science',
      link: 'https://www.coursera.org/learn/introduction-to-data-science',
      snippet: 'Learn the basics of data science and how to analyze and visualize data.',
      position: 3
    }
  ]
};

// Mock SerperService
class MockSerperService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchLearningResources(query, options = {}) {
    return mockSerperResponse.organic.slice(0, options.limit || 3).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: 'Coursera',
      position: item.position
    }));
  }
}

describe('LearningRecommendationService', () => {
  let sandbox;
  let learningService;
  let originalSerperService;

  before(() => {
    // Save the original SerperService
    originalSerperService = LearningRecommendationService.serper;

    // Replace with mock implementation
    LearningRecommendationService.serper = new MockSerperService('test-api-key');
    learningService = LearningRecommendationService;
  });

  after(() => {
    // Restore original implementation
    LearningRecommendationService.serper = originalSerperService;
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('extractKeywords', () => {
    it('should extract relevant keywords from text', () => {
      const text = 'I want to learn machine learning and data science';
      const keywords = learningService.extractKeywords(text);

      expect(keywords).to.be.an('array');
      // Check that all expected keywords are present (order doesn't matter)
      expect(keywords).to.include('machin');
      expect(keywords).to.include('data');
      expect(keywords).to.include('scienc');
      expect(keywords).to.have.lengthOf.at.most(5);
    });

    it('should handle empty input', () => {
      const keywords = learningService.extractKeywords('');
      expect(keywords).to.be.an('array').that.is.empty;
    });
  });

  describe('generateSearchQuery', () => {
    it('should generate a search query from user input', () => {
      const input = 'How can I learn Python for data analysis?';
      const query = learningService.generateSearchQuery(input);

      expect(query).to.be.a('string');
      expect(query).to.include('python');
      expect(query).to.include('data');
      expect(query).to.include('analysis');
      expect(query).to.include('course');
    });

    it('should handle short inputs', () => {
      const input = 'Python';
      const query = learningService.generateSearchQuery(input);
      expect(query).to.equal('python course');
    });
  });

  describe('getLearningRecommendations', () => {
    it('should return course recommendations for a learning goal', async () => {
      const journalEntry = 'I want to learn machine learning and data science';

      const result = await learningService.getLearningRecommendations(journalEntry, {
        maxCourses: 2
      });

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('courses').that.is.an('array');
      expect(result.courses).to.have.lengthOf(2);
      expect(result.analysis).to.have.property('keywords').that.is.an('array');
      expect(result.analysis).to.have.property('searchQuery').that.is.a('string');

      const course = result.courses[0];
      expect(course).to.have.property('title');
      expect(course).to.have.property('description');
      expect(course).to.have.property('url');
      expect(course).to.have.property('source', 'Coursera');
    });

    it('should handle errors gracefully', async () => {
      // Force an error in the mock
      sandbox.stub(LearningRecommendationService.serper, 'searchLearningResources').rejects(new Error('API Error'));

      const result = await learningService.getLearningRecommendations('test');

      expect(result).to.have.property('success', false);
      expect(result).to.have.property('error', 'API Error');
      expect(result).to.have.property('courses').that.is.an('array').and.is.empty;
    });
  });

  describe('getLearningRecommendations with mock', () => {
    let originalSerper, originalJsearch, serperStub, jsearchStub;

    beforeEach(() => {
      // Save original implementations
      originalSerper = learningService.serper;
      originalJsearch = learningService.jsearch;

      // Create SerperService stub
      learningService.serper = {
        searchLearningResources: sinon.stub().resolves([
          {
            title: 'Test Course',
            snippet: 'This is a test course description',
            link: 'https://example.com/course1',
            source: 'Test University',
            position: 1
          }
        ])
      };

      // Create JSearchService stub if it exists
      if (learningService.jsearch) {
        learningService.jsearch = {
          searchJobs: sinon.stub().resolves({
            data: [
              {
                job_title: 'Machine Learning Engineer',
                job_min_salary: 90000,
                job_max_salary: 150000,
                job_employment_type: 'FULLTIME',
                job_apply_link: 'https://example.com/job/1',
                employer_name: 'Test Company',
                job_country: 'US',
                job_description: 'Job description here'
              }
            ]
          })
        };
      }
    });

    afterEach(() => {
      // Restore original implementations and restore stubs
      learningService.serper = originalSerper;
      learningService.jsearch = originalJsearch;

      // Restore any stubs
      if (serperStub) serperStub.restore();
      if (jsearchStub) jsearchStub.restore();
    });

    it('should return courses for a valid learning goal', async () => {
      const result = await learningService.getLearningRecommendations(
        'I want to learn machine learning'
      );

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('courses').that.is.an('array');
      expect(result.courses).to.have.lengthOf.at.least(1);

      // Check course structure
      const course = result.courses[0];
      expect(course).to.have.property('title').that.is.a('string');
      expect(course).to.have.property('description').that.is.a('string');
      expect(course).to.have.property('url').that.is.a('string');
      expect(course).to.have.property('source').that.is.a('string');

      // Check for salary data (if JSearch is configured)
      if (process.env.JSEARCH_API_KEY) {
        expect(course).to.have.property('salary');
        if (course.salary) {
          expect(course.salary).to.have.property('min').that.is.a('number');
          expect(course.salary).to.have.property('max').that.is.a('number');
          expect(course.salary).to.have.property('currency').that.is.a('string');
          expect(course.salary).to.have.property('formatted').that.is.a('string');
        }
      }
    });

    it('should handle errors from the API', async () => {
      // Mock an error from Serper API
      learningService.serper.searchLearningResources = sinon.stub().rejects(new Error('API Error'));

      const result = await learningService.getLearningRecommendations('test query');

      expect(result).to.have.property('success', false);
      expect(result).to.have.property('error');
      expect(result).to.have.property('courses').that.is.an('array').and.is.empty;
    });
  });
});
```
