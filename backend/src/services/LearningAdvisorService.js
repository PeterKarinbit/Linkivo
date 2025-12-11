import { SerperService } from './SerperService.js';

export class LearningAdvisorService {
  constructor(serperApiKey) {
    this.serper = new SerperService(serperApiKey);
  }

  /**
   * Generate a search query using rule-based approach
   */
  async generateSearchQuery(userInput) {
    try {
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
      
    } catch (error) {
      console.error('Error generating search query:', error);
      return userInput; // Fallback to original input on error
    }
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
   * Get course recommendations based on user input
   */
  async getCourseRecommendations(userInput, options = {}) {
    try {
      console.log('\n🤖 Processing your learning request...');
      
      // Generate a search query using the LLM
      console.log('🔍 Generating search query...');
      const searchQuery = await this.generateSearchQuery(userInput);
      console.log(`   Generated query: "${searchQuery}"`);
      
      // Search for courses using Serper API
      console.log('🌐 Searching for courses...');
      const courses = await this.serper.searchLearningResources(
        searchQuery,
        { limit: options.limit || 3, type: 'course' }
      );
      
      return {
        success: true,
        query: searchQuery,
        courses: courses.map(course => ({
          title: course.title,
          description: course.snippet,
          url: course.link,
          source: course.source,
        }))
      };
      
    } catch (error) {
      console.error('Error in getCourseRecommendations:', error);
      return {
        success: false,
        error: error.message,
        query: userInput,
        courses: []
      };
    }
  }
}

export default LearningAdvisorService;
