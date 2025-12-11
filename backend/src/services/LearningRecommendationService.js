import natural from 'natural';
import { SerperService } from './SerperService.js';
import JSearchService from './jsearch/jsearch.service.js';
import config from '../config/jsearch.config.js';

const { WordTokenizer, PorterStemmer } = natural;

class LearningRecommendationService {
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    this.serper = new SerperService(process.env.SERPER_API_KEY);
    
    // Initialize JSearch service if API key is available
    if (process.env.JSEARCH_API_KEY) {
      this.jsearch = new JSearchService(process.env.JSEARCH_API_KEY);
    } else {
      console.warn('JSEARCH_API_KEY not found. Salary data will not be available.');
    }
  }

  /**
   * Extract keywords from text using TF-IDF and stemming
   */
  extractKeywords(text, count = 5) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const stopWords = new Set([
      'and', 'the', 'i', 'to', 'for', 'with', 'how', 'can', 'get',
      'learn', 'learning', 'want', 'need', 'course', 'courses', 'online'
    ]);
    
    // Filter out stop words and short words, then stem
    const filtered = tokens
      .filter(token => token.length > 2 && !stopWords.has(token.toLowerCase()))
      .map(token => this.stemmer.stem(token));
    
    // Simple frequency analysis
    const freq = {};
    filtered.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    // Return top N keywords
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }

  /**
   * Generate a search query from user input
   */
  generateSearchQuery(userInput) {
    // Remove common question words and phrases
    const cleanedInput = userInput
      .toLowerCase()
      .replace(/(^|\s)(i\s+want\s+to\s+|how\s+to\s+|best\s+way\s+to\s+|learn\s+|courses?\s+for\s+|i\s+need\s+to\s+)/g, ' ')
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')     // Collapse multiple spaces
      .trim();
    
    // Extract key terms (nouns and adjectives)
    const terms = cleanedInput
      .split(' ')
      .filter(term => term.length > 2) // Remove short words
      .filter(term => !this.isCommonWord(term));
    
    // If we have enough terms, use them, otherwise use the cleaned input
    const query = terms.length >= 2 ? terms.join(' ') : cleanedInput;
    
    // Add 'course' if not already in the query
    return query.includes('course') ? query : `${query} course`;
  }
  
  /**
   * Check if a word is a common word that doesn't add search value
   */
  isCommonWord(term) {
    const commonWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'what', 'when',
      'where', 'which', 'will', 'your', 'about', 'they', 'would', 'there', 'their',
      'could', 'some', 'into', 'other', 'than', 'then', 'them', 'these', 'those'
    ]);
    return commonWords.has(term.toLowerCase());
  }

  /**
   * Get learning recommendations based on journal entry
   */
  async getLearningRecommendations(journalEntry, options = {}) {
    const { maxCourses = 3 } = options;
    
    try {
      // Step 1: Extract keywords from journal entry
      const keywords = this.extractKeywords(journalEntry);
      console.log('🔍 Extracted keywords:', keywords.join(', '));
      
      // Step 2: Generate a search query
      const searchQuery = this.generateSearchQuery(journalEntry);
      console.log('🔍 Generated search query:', searchQuery);
      
      // Step 3: Get course recommendations from Serper API
      const results = await this.serper.searchLearningResources(searchQuery, {
        limit: maxCourses,
        type: 'course',
        site: 'coursera.org,udemy.com,edx.org'
      });

      // Get salary data for the main skill/topic if JSearch is available
      let salaryData = null;
      if (this.jsearch && keywords.length > 0) {
        // Use the first keyword as the main skill for salary lookup
        salaryData = await this.getSalaryData(keywords[0]);
      }
      
      // Format the response
      const response = {
        success: true,
        analysis: {
          keywords,
          searchQuery,
          timestamp: new Date().toISOString()
        },
        courses: await Promise.all(
          results.map(async (course, index) => {
            // Extract potential skill/job title from course title
            const courseKeywords = this.extractKeywords(course.title);
            let courseSalaryData = null;
            
            // Get salary data for the course if it's different from the main skill
            if (this.jsearch && courseKeywords.length > 0 && 
                (!salaryData || courseKeywords[0].toLowerCase() !== keywords[0]?.toLowerCase())) {
              courseSalaryData = await this.getSalaryData(courseKeywords[0]);
            }
            
            return {
              id: `course-${index + 1}`,
              title: course.title,
              description: course.snippet,
              url: course.link,
              source: course.source,
              position: course.position,
              salary: courseSalaryData || (salaryData && salaryData.salary) || null
            };
          })
        ),
        metadata: {
          source: 'Serper API' + (this.jsearch ? ' + JSearch API' : ''),
          resultCount: results.length,
          timestamp: new Date().toISOString()
        }
      };

      // Add salary data to the main response if available
      if (salaryData) {
        response.salaryData = salaryData;
      }

      return response;
      
    } catch (error) {
      console.error('Error in getLearningRecommendations:', error);
      return {
        success: false,
        error: error.message,
        courses: []
      };
    }
  }
}

export default new LearningRecommendationService();
