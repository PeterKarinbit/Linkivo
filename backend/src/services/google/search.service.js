import axios from 'axios';
import config from '../../config/google-search.config.js';

class GoogleSearchService {
  constructor(apiKey, searchEngineId) {
    if (!apiKey || !searchEngineId) {
      throw new Error('API key and search engine ID are required for Google Custom Search API');
    }
    
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: config.headers,
      params: {
        key: this.apiKey,
        cx: this.searchEngineId,
        ...config.defaultParams
      }
    });
  }

  /**
   * Search for job listings with the given parameters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query (e.g., "software developer jobs in chicago")
   * @param {number} [params.num] - Number of results to return (1-10)
   * @param {number} [params.start] - Start index for pagination
   * @param {string} [params.location] - Location filter
   * @param {string} [params.salary] - Salary range filter
   * @param {string} [params.experience] - Experience level (entry, mid, senior)
   * @returns {Promise<Object>} - Search results
   */
  async searchJobs(params) {
    try {
      const { query, location, salary, experience, ...restParams } = params;
      
      // Build the search query with additional filters
      let searchQuery = query || '';
      
      // Add location if provided
      if (location) {
        searchQuery += ` ${location}`;
      }
      
      // Add salary filter if provided
      if (salary) {
        searchQuery += ` salary:${salary}`;
      }
      
      // Add experience level if provided
      if (experience) {
        const experienceTerms = {
          entry: 'entry level OR junior',
          mid: 'mid level OR experienced',
          senior: 'senior OR lead OR principal'
        };
        searchQuery += ` ${experienceTerms[experience] || ''}`;
      }
      
      const response = await this.client.get('', {
        params: {
          q: searchQuery.trim(),
          ...restParams
        }
      });
      
      return this._processSearchResults(response.data);
    } catch (error) {
      this._handleError(error, 'searchJobs');
    }
  }

  /**
   * Process raw search results into a more usable format
   * @private
   */
  _processSearchResults(data) {
    if (!data || !data.items) {
      return {
        totalResults: 0,
        searchTime: 0,
        items: []
      };
    }

    return {
      totalResults: parseInt(data.searchInformation?.totalResults) || 0,
      searchTime: parseFloat(data.searchInformation?.searchTime) || 0,
      items: data.items.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        formattedUrl: item.formattedUrl,
        htmlSnippet: item.htmlSnippet,
        // Extract potential salary information if available in the snippet
        salary: this._extractSalaryFromText(item.snippet || ''),
        // Extract potential location if available
        location: this._extractLocationFromText(item.snippet || '')
      }))
    };
  }

  /**
   * Extract salary information from text
   * @private
   */
  _extractSalaryFromText(text) {
    // Common salary patterns
    const salaryPatterns = [
      /(?:\$|£|€|¥)(?:\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)(?:\s*(?:-|to|–)\s*(?:\$|£|€|¥)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?))?/g,
      /(?:\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*(?:k|K)\s*(?:-|to|–)\s*(?:\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*(?:k|K)/g,
      /(?:\$|£|€|¥)\s*\d+\s*(?:k|K)(?:\s*\+?|\s*\-\s*\$?\s*\d+\s*(?:k|K))?/g
    ];

    for (const pattern of salaryPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Clean up the matches
        return matches.map(match => match.trim()).join(' - ');
      }
    }

    return null;
  }

  /**
   * Extract location information from text
   * @private
   */
  _extractLocationFromText(text) {
    // This is a simple implementation - you might want to use a more sophisticated approach
    const locationPattern = /(?:in|at|from|based in|located in|,)\s*([A-Z][a-zA-Z\s,]+(?:,\s*[A-Z]{2})?)(?:\s*\([^)]*\))?/i;
    const match = text.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Handle API errors
   * @private
   */
  _handleError(error, context = '') {
    console.error(`Google Search API Error (${context}):`, error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, statusText, data } = error.response;
      const errorMessage = data?.error?.message || statusText || 'Unknown error';
      
      const err = new Error(`Google Search API Error: ${status} - ${errorMessage}`);
      err.status = status;
      err.details = data?.error;
      
      throw err;
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from Google Search API');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

export default GoogleSearchService;
