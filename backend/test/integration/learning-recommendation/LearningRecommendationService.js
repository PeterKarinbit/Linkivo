import fetch from 'node-fetch';
import config from './config.js';

class LearningRecommendationService {
  constructor() {
    this.cache = new Map();
    this.rateLimit = {
      remaining: config.api.coursera.rateLimit.maxRequests,
      resetTime: Date.now() + config.api.coursera.rateLimit.perMilliseconds,
      queue: []
    };
  }

  /**
   * Make an API request with rate limiting and retries
   */
  async _makeRequest(url, options = {}, isRetry = false) {
    const { method = 'GET', body, headers = {} } = options;
    
    // Check rate limiting
    await this._checkRateLimit();
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(config.api.coursera.apiKey && { 'Authorization': `Bearer ${config.api.coursera.apiKey}` }),
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        timeout: config.api.coursera.timeout
      });
      
      // Update rate limit headers if available
      this._updateRateLimitFromHeaders(response.headers);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API request failed with status ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      if (!isRetry && config.api.coursera.maxRetries > 0) {
        console.log(`Retrying request (${config.api.coursera.maxRetries} attempts left)...`);
        return this._makeRequest(url, options, true);
      }
      throw error;
    }
  }
  
  /**
   * Check and enforce rate limiting
   */
  async _checkRateLimit() {
    const now = Date.now();
    
    // Reset rate limit if the window has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.remaining = config.api.coursera.rateLimit.maxRequests;
      this.rateLimit.resetTime = now + config.api.coursera.rateLimit.perMilliseconds;
    }
    
    // If we've hit the rate limit, wait until the window resets
    if (this.rateLimit.remaining <= 0) {
      const waitTime = this.rateLimit.resetTime - now;
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimit.remaining = config.api.coursera.rateLimit.maxRequests;
    }
    
    this.rateLimit.remaining--;
  }
  
  /**
   * Update rate limit from response headers
   */
  _updateRateLimitFromHeaders(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    
    if (remaining !== null) {
      this.rateLimit.remaining = parseInt(remaining, 10);
    }
    
    if (reset !== null) {
      this.rateLimit.resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
    }
  }
  
  /**
   * Analyze learning needs from journal entry using LLM
   */
  async analyzeLearningNeeds(journalEntry) {
    const cacheKey = `analysis:${journalEntry.substring(0, 100).replace(/\s+/g, '_')}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    console.log('🔍 Analyzing learning needs from journal entry...');
    
    try {
      const response = await this._makeRequest(
        config.api.openrouter.baseUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://linkivo.app',
            'X-Title': 'Linkivo Career Coach'
          },
          body: {
            model: config.api.openrouter.model,
            messages: [{
              role: 'user',
              content: `Analyze this journal entry and identify if the user needs learning resources. 
                Respond with a JSON object containing: {
                  needsLearningResources: boolean,
                  topics: string[],
                  confidence: number (0-1),
                  reason: string
                }
                \nJournal Entry: "${journalEntry}"`
            }],
            temperature: config.api.openrouter.temperature,
            max_tokens: config.api.openrouter.maxTokens,
            response_format: { type: 'json_object' }
          }
        }
      );
      
      const result = JSON.parse(response.choices[0].message.content);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing learning needs:', error);
      // Fallback to simple keyword matching if LLM fails
      return this._fallbackAnalysis(journalEntry);
    }
  }
  
  /**
   * Fallback analysis using simple keyword matching
   */
  _fallbackAnalysis(journalEntry) {
    console.log('⚠️ Using fallback analysis');
    const text = journalEntry.toLowerCase();
    const topics = [];
    
    // Simple keyword matching
    const keywordMap = {
      'machine learning': ['machine learning', 'ml', 'neural network', 'deep learning'],
      'python': ['python', 'pandas', 'numpy'],
      'data science': ['data science', 'data analysis', 'data visualization'],
      'web development': ['web dev', 'frontend', 'backend', 'react', 'node', 'javascript'],
      'cloud computing': ['aws', 'azure', 'google cloud', 'cloud computing', 'devops']
    };
    
    // Find matching topics
    Object.entries(keywordMap).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return {
      needsLearningResources: topics.length > 0 || text.includes('learn') || text.includes('study'),
      topics: topics.length > 0 ? topics : ['programming'],
      confidence: topics.length > 0 ? 0.7 : 0.5,
      reason: topics.length > 0 
        ? `Identified relevant topics: ${topics.join(', ')}`
        : 'General learning interest detected'
    };
  }
  
  /**
   * Search for courses on Coursera
   */
  async searchCourses(query, limit = 5) {
    const cacheKey = `courses:${query.toLowerCase().replace(/\s+/g, '_')}:${limit}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached course results');
      return this.cache.get(cacheKey);
    }
    
    console.log(`🔍 Searching Coursera for: ${query}`);
    
    try {
      const params = new URLSearchParams({
        q: query,
        limit: Math.min(limit, 10), // Coursera API typically has a max limit
        fields: 'id,name,slug,courseType,workload,primaryLanguages,description,partnerIds,instructorIds'
      });
      
      const url = `${config.api.coursera.baseUrl}?${params.toString()}`;
      const response = await this._makeRequest(url);
      
      // Cache the result
      this.cache.set(cacheKey, response.elements || []);
      
      return response.elements || [];
    } catch (error) {
      console.error('Error searching Coursera courses:', error);
      return [];
    }
  }
  
  /**
   * Get course recommendations based on journal entry
   */
  async getLearningRecommendations(journalEntry) {
    try {
      // Step 1: Analyze learning needs
      const analysis = await this.analyzeLearningNeeds(journalEntry);
      
      if (!analysis.needsLearningResources) {
        return {
          analysis,
          courses: [],
          message: 'No specific learning needs identified in the journal entry.'
        };
      }
      
      // Step 2: Get course recommendations for each topic
      const coursePromises = analysis.topics.map(topic => 
        this.searchCourses(topic, 2) // Get 2 courses per topic
      );
      
      const coursesResults = await Promise.all(coursePromises);
      const courses = coursesResults.flat();
      
      // Remove duplicates by course ID
      const uniqueCourses = Array.from(new Map(courses.map(course => [course.id, course])).values());
      
      return {
        analysis,
        courses: uniqueCourses.slice(0, config.test.maxCoursesPerRequest),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting learning recommendations:', error);
      return {
        error: 'Failed to generate learning recommendations',
        details: error.message
      };
    }
  }
}

export default LearningRecommendationService;
