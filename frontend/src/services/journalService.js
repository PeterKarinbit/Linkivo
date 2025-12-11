import api from './apiBase';

const journalService = {
  /**
   * Process journal entry and generate career suggestions
   * @param {string} content - Journal entry content
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<Object>} - Returns the generated suggestions
   */
  /**
   * Process journal entry and generate career suggestions
   * @param {string} content - Journal entry content
   * @param {string} [entryId] - Optional journal entry ID
   * @returns {Promise<Object>} - Returns the generated suggestions and recommendation
   * @throws {Error} If the request fails or returns an error
   */
  async processJournalEntry(content, entryId) {
    if (!content || typeof content !== 'string') {
      throw new Error('Journal content is required and must be a string');
    }

    // Validate entryId format if provided
    if (entryId && typeof entryId !== 'string') {
      console.warn('Invalid entryId format, proceeding without it');
      entryId = undefined;
    }

    try {
      const response = await api.post('/api/v1/enhanced-ai-career-coach/process-journal', {
        content: content.trim(),
        entryId: entryId || undefined
      });

      // Handle successful response
      if (response.data && response.data.recommendation) {
        return {
          success: true,
          recommendation: response.data.recommendation,
          message: response.data.message || 'Journal processed successfully'
        };
      }

      // Handle unexpected response format
      throw new Error('Unexpected response format from server');
    } catch (error) {
      console.error('Error processing journal entry:', error);
      
      // Extract and format error message
      let errorMessage = 'Failed to process journal entry';
      if (error.response) {
        // Server responded with an error status code
        errorMessage = error.response.data?.message || 
                      error.response.statusText || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || 'Request setup failed';
      }
      
      // Create a new error with the formatted message
      const formattedError = new Error(errorMessage);
      formattedError.originalError = error;
      formattedError.isNetworkError = !error.response;
      
      throw formattedError;
    }
  },

  /**
   * Get career suggestions for a journal entry
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<Array>} - Returns an array of career suggestions
   */
  async getJournalSuggestions(entryId) {
    try {
      const response = await api.get(
        `/api/v1/enhanced-ai-career-coach/recommendations?source=journal&sourceId=${entryId}`
      );
      return response.data?.data?.recommendations || [];
    } catch (error) {
      console.error('Error fetching journal suggestions:', error);
      return [];
    }
  },

  /**
   * Get all career suggestions for the current user
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Returns an array of career suggestions
   */
  async getAllSuggestions(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        type: 'career_suggestion',
        limit: params.limit || 50,
        ...params
      });
      
      const response = await api.get(
        `/api/v1/enhanced-ai-career-coach/recommendations?${queryParams}`
      );
      return response.data?.data?.recommendations || [];
    } catch (error) {
      console.error('Error fetching career suggestions:', error);
      return [];
    }
  }
};

export default journalService;
