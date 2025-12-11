import axios from 'axios';

export class SerperService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.SERPER_API_KEY;
    this.baseUrl = 'https://google.serper.dev';
    
    if (!this.apiKey) {
      throw new Error('Serper API key is required');
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Search for learning resources using Serper API
   * @param {string} query - The search query
   * @param {Object} options - Additional search options
   * @returns {Promise<Array>} - Array of learning resources
   */
  async searchLearningResources(query, options = {}) {
    const {
      limit = 5,
      type = 'course',
      language = 'en',
      location = 'us',
      page = 1
    } = options;

    try {
      const response = await this.client.post('/search', {
        q: `${type} ${query} site:coursera.org OR site:udemy.com OR site:edx.org`,
        num: limit,
        gl: location,
        hl: language,
        page
      });

      return this._formatSearchResults(response.data, type);
    } catch (error) {
      console.error('Error searching with Serper API:', error);
      throw new Error('Failed to fetch learning resources');
    }
  }

  /**
   * Format Serper API results into a consistent format
   * @private
   */
  _formatSearchResults(data, type) {
    if (!data || !data.organic) {
      return [];
    }

    return data.organic.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: this._extractSource(item.link),
      type,
      position: item.position
    }));
  }

  /**
   * Extract the source from a URL
   * @private
   */
  _extractSource(url) {
    if (!url) return 'Unknown';
    
    if (url.includes('coursera.org')) return 'Coursera';
    if (url.includes('udemy.com')) return 'Udemy';
    if (url.includes('edx.org')) return 'edX';
    
    return new URL(url).hostname.replace('www.', '');
  }
}

export default SerperService;
