import axios from 'axios';
import config from '../../config/lightcast-compensation.config.js';
import { getAuthToken } from './auth.service.js';

class CompensationService {
  /**
   * Search for job titles
   * @param {Object} params - Search parameters
   * @param {string} params.q - Search query
   * @param {number} [params.limit=10] - Maximum number of results
   * @returns {Promise<Object>} - Search results
   */
  async searchTitles({ q, limit = 10 }) {
    const url = `${this.baseUrl}/titles`;
    const params = {
      q,
      limit,
      fields: 'id,name,description'
    };
    
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      this._handleError(error, 'searchTitles');
    }
  }
  
  /**
   * Get title details by ID
   * @param {string} id - Title ID
   * @returns {Promise<Object>} - Title details
   */
  async getTitleById(id) {
    const url = `${this.baseUrl}/titles/${id}`;
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getTitleById');
    }
  }
  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.defaults.timeout,
      headers: config.defaults.headers
    });
    
    // Add request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getAuthToken('emsiauth');
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get salary estimate
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Salary estimate
   */
  async getEstimate(params) {
    try {
      const response = await this.client.post(
        config.api.endpoints.estimate,
        params
      );
      return response.data;
    } catch (error) {
      this._handleError(error, 'getEstimate');
    }
  }

  /**
   * Get salary estimates by years of experience
   * @param {Object} params - Request parameters
   * @param {Array<number>} experiences - Array of years of experience
   * @returns {Promise<Object>} - Salary estimates by experience
   */
  async getEstimateByExperience(params, experiences = [1, 3, 5, 10]) {
    try {
      const response = await this.client.post(
        config.api.endpoints.estimateByExperience,
        { ...params, experiences }
      );
      return response.data;
    } catch (error) {
      this._handleError(error, 'getEstimateByExperience');
    }
  }

  /**
   * Get salary estimates by MSA
   * @param {Object} params - Request parameters
   * @param {Array<string>} msas - Array of MSA codes
   * @returns {Promise<Object>} - Salary estimates by MSA
   */
  async getEstimatesByMsa(params, msas) {
    try {
      const response = await this.client.post(
        config.api.endpoints.byMsa,
        { ...params, msas }
      );
      return response.data;
    } catch (error) {
      this._handleError(error, 'getEstimatesByMsa');
    }
  }

  /**
   * Get available geographies
   * @returns {Promise<Array>} - List of available geographies
   */
  async getGeographies() {
    try {
      const response = await this.client.get(config.api.endpoints.geographies);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getGeographies');
    }
  }

  /**
   * Get the current datarun version
   * @returns {Promise<string>} - Datarun version
   */
  async getDatarunVersion() {
    try {
      const response = await this.client.get(config.api.endpoints.datarun);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getDatarunVersion');
    }
  }

  /**
   * Get the SOC version in use
   * @returns {Promise<string>} - SOC version
   */
  async getSocVersion() {
    try {
      const response = await this.client.get(config.api.endpoints.socVersion);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getSocVersion');
    }
  }

  /**
   * Handle API errors
   * @private
   */
  _handleError(error, methodName) {
    const errorDetails = {
      method: methodName,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      response: error.response?.data
    };

    console.error(`Lightcast Compensation API Error (${methodName}):`, errorDetails);
    
    const errorObj = new Error(`Lightcast Compensation API request failed: ${error.message}`);
    errorObj.details = errorDetails;
    throw errorObj;
  }
}

// Create and export a singleton instance
const compensationService = new CompensationService();
export default compensationService;
