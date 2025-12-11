import axios from 'axios';
import qs from 'qs';
import config from '../../config/lightcast.config.js';

class LightcastService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.retryCount = 0;
    this.client = axios.create({
      timeout: config.defaults.timeout
    });
  }

  /**
   * Get an access token from the OAuth2 server
   * @private
   */
  async getAccessToken() {
    // Return cached token if it's still valid
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    try {
      const authResponse = await axios({
        method: 'post',
        url: `${config.auth.url}${config.auth.tokenEndpoint}`,
        data: qs.stringify({
          client_id: config.auth.clientId,
          client_secret: config.auth.clientSecret,
          grant_type: 'client_credentials',
          scope: config.auth.scope
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!authResponse.data || !authResponse.data.access_token) {
        throw new Error('Invalid response from authentication server');
      }

      // Cache the token
      this.token = authResponse.data.access_token;
      // Set expiry to 90% of the actual expiry time (usually 1 hour)
      this.tokenExpiry = Date.now() + (authResponse.data.expires_in * 900);
      this.retryCount = 0; // Reset retry counter on successful auth

      console.log('Successfully obtained access token');
      return this.token;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        response: error.response?.data
      };
      console.error('Failed to get access token:', JSON.stringify(errorDetails, null, 2));
      
      // Don't retry immediately on 4xx errors (except 429)
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw new Error(`Authentication failed: ${error.response.status} - ${error.message}`);
      }
      
      throw new Error('Authentication failed: ' + error.message);
    }
  }

  /**
   * Make a request to the Lightcast API with retry logic
   * @private
   */
  async _makeRequest(method, url, data = null, params = {}, attempt = 1) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second initial delay
    
    try {
      // Get fresh token for each request to avoid token expiration issues
      const token = await this.getAccessToken();
      const headers = {
        ...config.defaults.headers,
        'Authorization': `Bearer ${token}`
      };

      // Log request details for debugging
      console.log(`Making ${method} request to ${url}`, { 
        params,
        hasData: !!data,
        attempt
      });

      const response = await this.client({
        method,
        url,
        data,
        params,
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });

      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers['retry-after'] || '1', 10);
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, // Add jitter
          30000 // Max 30 seconds
        );
        
        if (attempt <= maxRetries) {
          console.warn(`Rate limited. Retrying (${attempt}/${maxRetries}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this._makeRequest(method, url, data, params, attempt + 1);
        }
      }

      // Handle other error statuses
      if (response.status >= 400) {
        const error = new Error(
          `Request failed with status ${response.status}: ${response.statusText || 'Unknown error'}`
        );
        error.status = response.status;
        error.response = response;
        
        // Log detailed error information
        console.error('API request failed:', {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          params,
          attempt
        });
        
        throw error;
      }

      return response.data;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url,
        params,
        response: error.response?.data
      };
      
      console.error('Lightcast API Error:', JSON.stringify(errorDetails, null, 2));
      
      // Handle token expiration
      if (error.response?.status === 401) {
        // Clear token to force refresh on next request
        this.token = null;
        // Retry once with new token
        if (this.retryCount < 1) {
          this.retryCount++;
          return this._makeRequest(method, url, data, params);
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message;
      const errorObj = new Error(`Lightcast API request failed: ${errorMessage}`);
      errorObj.details = errorDetails;
      throw errorObj;
    }
  }

  /**
   * Get service status
   * @returns {Promise<Object>} - Service status
   */
  async getStatus() {
    const url = config.getSkillsUrl(config.api.skills.endpoints.status);
    return this._makeRequest('GET', url);
  }

  /**
   * Get service metadata
   * @returns {Promise<Object>} - Service metadata
   */
  async getMeta() {
    const url = config.getSkillsUrl(config.api.skills.endpoints.meta);
    return this._makeRequest('GET', url);
  }

  /**
   * List all available skill versions
   * @returns {Promise<Array>} - Array of version strings
   */
  async listVersions() {
    const url = config.getSkillsUrl(config.api.skills.endpoints.versions);
    return this._makeRequest('GET', url);
  }

  /**
   * Get version info
   * @param {string} [version='latest'] - Version to get info for
   * @returns {Promise<Object>} - Version info
   */
  async getVersionInfo(version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.versionInfo(version));
    return this._makeRequest('GET', url);
  }

  /**
   * Search for skills
   * @param {Object} params - Search parameters
   * @param {string} params.q - Search query
   * @param {number} [params.limit=10] - Number of results to return
   * @param {string} [params.typeIds] - Comma-separated list of type IDs to filter by
   * @param {string} [params.fields] - Comma-separated list of fields to include
   * @param {string} [version='latest'] - Skills version to search
   * @returns {Promise<Object>} - Search results
   */
  async searchSkills({ q, limit = 10, typeIds, fields = 'id,name,type,infoUrl' }, version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.search(version));
    const params = { q, limit, fields };
    
    if (typeIds) {
      params.typeIds = typeIds;
    }
    
    return this._makeRequest('GET', url, null, params);
  }

  /**
   * Get skill details by ID
   * @param {string} skillId - Skill ID
   * @param {string} [version='latest'] - Skills version
   * @returns {Promise<Object>} - Skill details
   */
  async getSkillDetails(skillId, version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.getSkill(version, skillId));
    return this._makeRequest('GET', url);
  }

  /**
   * Get related skills
   * @param {Array<string>} skillIds - Array of skill IDs
   * @param {Object} [options] - Additional options
   * @param {number} [options.limit=10] - Number of related skills to return
   * @param {string} [version='latest'] - Skills version
   * @returns {Promise<Array>} - Array of related skills
   */
  async getRelatedSkills(skillIds, { limit = 10 } = {}, version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.getRelatedSkills(version));
    const data = { ids: Array.isArray(skillIds) ? skillIds : [skillIds] };
    
    return this._makeRequest('POST', url, data, { limit });
  }

  /**
   * Extract skills from text
   * @param {string} text - Text to extract skills from
   * @param {Object} [options] - Additional options
   * @param {number} [options.confidenceThreshold=0.5] - Minimum confidence threshold (0-1)
   * @param {string} [options.language] - Language code (e.g., 'fr' for French)
   * @param {string} [version='latest'] - Skills version
   * @returns {Promise<Array>} - Array of extracted skills with confidence scores
   */
  async extractSkills(text, { confidenceThreshold = 0.5, language } = {}, version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.extractSkills(version));
    const data = { text, confidenceThreshold };
    const params = {};
    
    if (language) {
      params.language = language;
    }
    
    const response = await this._makeRequest('POST', url, data, params);
    return response.data || [];
  }

  /**
   * Extract skills from text with trace information
   * @param {string} text - Text to extract skills from
   * @param {Object} [options] - Additional options
   * @param {number} [options.confidenceThreshold=0.5] - Minimum confidence threshold (0-1)
   * @param {string} [options.language] - Language code (e.g., 'fr' for French)
   * @param {boolean} [options.includeNormalizedText=false] - Whether to include normalized text in the response
   * @param {string} [version='latest'] - Skills version
   * @returns {Promise<Object>} - Extraction results with trace information
   */
  async extractSkillsWithTrace(text, { confidenceThreshold = 0.5, language, includeNormalizedText = false } = {}, version = config.api.skills.version) {
    const url = config.getSkillsUrl(config.api.skills.endpoints.extractSkillsWithTrace(version));
    const data = { text, confidenceThreshold };
    const params = { includeNormalizedText };
    
    if (language) {
      params.language = language;
    }
    
    return this._makeRequest('POST', url, data, params);
  }

  /**
   * Suggest careers based on skills
   * @param {Object} options - Options for career suggestions
   * @param {Array<string>} options.skills - Array of skill names or IDs
   * @param {number} [options.limit=5] - Maximum number of career suggestions to return
   * @param {string} [version='latest'] - Skills version to use
   * @returns {Promise<Array>} - Array of career suggestions with relevance scores
   */
  async suggestCareers({ skills, limit = 5 } = {}, version = config.api.skills.version) {
    // First, get the skill IDs if we were given skill names
    const skillIds = [];
    
    for (const skill of skills) {
      try {
        // If it's already an ID (starts with 'KS' or 'SS'), use it directly
        if (typeof skill === 'string' && (skill.startsWith('KS') || skill.startsWith('SS'))) {
          skillIds.push(skill);
        } else {
          // Otherwise, search for the skill to get its ID
          const searchResults = await this.searchSkills({ 
            q: skill,
            limit: 1,
            fields: 'id'
          }, version);
          
          if (searchResults.data && searchResults.data.length > 0) {
            skillIds.push(searchResults.data[0].id);
          }
        }
      } catch (error) {
        console.warn(`Could not find skill ID for: ${skill}`, error.message);
      }
    }

    if (skillIds.length === 0) {
      throw new Error('No valid skill IDs found');
    }

    // Get related skills to expand the search
    const relatedSkills = await this.getRelatedSkills(skillIds, { limit: 10 }, version);
    const allSkillIds = [...new Set([...skillIds, ...relatedSkills.data.map(s => s.id)])];

    // In a real implementation, we would call the careers API here
    // For now, we'll return a mock response based on the skills
    const careerTitles = [
      'Machine Learning Engineer',
      'Data Scientist',
      'Full Stack Developer',
      'Cloud Solutions Architect',
      'DevOps Engineer',
      'AI/ML Specialist',
      'Data Engineer',
      'Software Engineer',
      'Backend Developer',
      'Frontend Developer'
    ];

    // Return mock career suggestions with relevance scores
    return careerTitles.slice(0, limit).map((title, index) => ({
      id: `career-${index + 1}`,
      title,
      description: `Career that utilizes skills like ${skills.slice(0, 3).join(', ')}`,
      relevance: 1 - (index * 0.1), // Mock relevance score
      matchingSkills: skills.slice(0, 2), // Mock matching skills
      salaryRange: {
        min: 70000 + (index * 10000),
        max: 120000 + (index * 10000)
      },
      growthOutlook: 'Faster than average',
      educationRequired: index % 2 === 0 ? "Bachelor's degree" : "Master's degree"
    }));
  }
}

const lightcastService = new LightcastService();
export default lightcastService;
