class AIRecommendationsService {
  constructor() {
    const baseOrigin = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000');
    this.baseUrl = `${baseOrigin}/api/v1/enhanced-ai-career-coach`;
    this.eventSource = null;
    this.listeners = new Map();
  }

  getDefaultHeaders() {
    const model = localStorage.getItem('aiCoachModel') || 'deepseek/deepseek-chat-v3.1:free';
    return {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
      'x-ai-model': model
    };
  }

  // Get all recommendations
  async getRecommendations(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        type: params.type || 'all',
        limit: params.limit || '50',
        ...params
      });

      const response = await fetch(`${this.baseUrl}/recommendations?${queryParams}`, {
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          recommendations: data.data?.recommendations || [],
          total: data.data?.total || 0
        };
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return {
        success: false,
        recommendations: [],
        total: 0,
        error: error.message
      };
    }
  }

  // Generate new recommendations
  async generateRecommendations(type = 'proactive') {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/generate`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          recommendations: data.data?.recommendations || [],
          message: data.message || 'Recommendations generated successfully'
        };
      } else {
        throw new Error('Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  // Mark recommendation as read
  async markAsRead(recommendationId) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${recommendationId}/read`, {
        method: 'POST',
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark recommendation as complete
  async markAsComplete(recommendationId, feedback = 'completed') {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${recommendationId}/complete`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ feedback })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to mark as complete');
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
      return { success: false, error: error.message };
    }
  }

  // Star/unstar recommendation
  async toggleStar(recommendationId) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${recommendationId}/star`, {
        method: 'POST',
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, starred: data.data?.starred };
      } else {
        throw new Error('Failed to toggle star');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      return { success: false, error: error.message };
    }
  }

  // Archive recommendation
  async archiveRecommendation(recommendationId) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${recommendationId}/archive`, {
        method: 'POST',
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to archive recommendation');
      }
    } catch (error) {
      console.error('Error archiving recommendation:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/unread-count`, {
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          count: data.data?.count || 0
        };
      } else {
        throw new Error('Failed to get unread count');
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, count: 0 };
    }
  }

  // Subscribe to real-time updates
  subscribe(userId, callbacks = {}) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const model = localStorage.getItem('aiCoachModel') || 'deepseek/deepseek-chat-v3.1:free';
    const token = localStorage.getItem('accessToken');
    const baseOrigin = (import.meta?.env?.VITE_API_BASE_URL || '');
    // Use API proxy in dev (served by frontend) to avoid CORS and port mismatch
    const prefix = '/api/v1/ai-proxy';
    const eventSourceUrl = `${baseOrigin}${prefix}/enhanced-ai-career-coach/recommendations/stream?userId=${encodeURIComponent(userId)}&model=${encodeURIComponent(model)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    
    // Create a custom EventSource that includes the authorization header
    const eventSourceInit = { withCredentials: true };
    
    // Use a custom EventSource implementation with credentials enabled so cookies are sent
    this.eventSource = this.createAuthenticatedEventSource(eventSourceUrl, { ...eventSourceInit, withCredentials: true });

    this.eventSource.onopen = () => {
      console.log('AI Recommendations SSE connection opened');
      if (callbacks.onOpen) callbacks.onOpen();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('AI Recommendations update:', data);
        
        if (callbacks.onUpdate) callbacks.onUpdate(data);
        
        // Dispatch custom events for global listeners
        if (data.type === 'new_recommendations') {
          window.dispatchEvent(new CustomEvent('newRecommendations', {
            detail: { count: data.count, recommendations: data.recommendations }
          }));
        } else if (data.type === 'unread_count_update') {
          window.dispatchEvent(new CustomEvent('aiRecommendationsUpdate', {
            detail: { count: data.count, type: 'recommendations' }
          }));
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('AI Recommendations SSE error:', error);
      if (callbacks.onError) callbacks.onError(error);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.subscribe(userId, callbacks);
        }
      }, 5000);
    };

    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  // Create a custom EventSource that supports headers
  createAuthenticatedEventSource(url, options = {}) {
    // Create a new EventSource with credentials to include cookies for auth
    const es = new EventSource(url, { withCredentials: !!options.withCredentials });
    
    // Store the original event source methods
    const originalAddEventListener = es.addEventListener.bind(es);
    const originalClose = es.close.bind(es);
    
    // Override the addEventListener to intercept the 'open' event
    es.addEventListener = (type, listener, options) => {
      if (type === 'open') {
        // Call the listener immediately since we can't intercept the actual open event
        setTimeout(() => {
          if (typeof listener === 'function') {
            listener({ type: 'open' });
          }
        }, 0);
        return;
      }
      originalAddEventListener(type, listener, options);
    };
    
    // Override the close method to clean up properly
    es.close = () => {
      // Clean up any resources
      originalClose();
    };
    
    return es;
  }

  // Unsubscribe from updates
  unsubscribe() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Bulk operations
  async bulkMarkAsRead(recommendationIds) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/bulk-read`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ recommendationIds })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to bulk mark as read');
      }
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkComplete(recommendationIds) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/bulk-complete`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ recommendationIds })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to bulk complete');
      }
    } catch (error) {
      console.error('Error bulk completing:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkArchive(recommendationIds) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/bulk-archive`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ recommendationIds })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to bulk archive');
      }
    } catch (error) {
      console.error('Error bulk archiving:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AIRecommendationsService();
