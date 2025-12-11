/**
 * MCP Knowledge Base Service - Frontend
 * Interacts with the MCP Knowledge Base backend service
 */

class MCPKnowledgeBaseService {
  constructor() {
    this.baseUrl = '/api/v1/ai-career-coach/mcp';
    this.eventSource = null;
    this.listeners = new Map();
  }

  getDefaultHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get knowledge base structure for a user
   */
  async getKnowledgeStructure(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/structure/${userId}`, {
        headers: this.getDefaultHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error('Failed to get knowledge structure');
      }
    } catch (error) {
      console.error('Error getting knowledge structure:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get knowledge base contents for a user
   */
  async getKnowledgeContents(userId, section = null) {
    try {
      // Update endpoint to match backend route
      let url = `${this.baseUrl}/knowledge-base/contents`;
      const params = new URLSearchParams();
      params.append('userId', userId);
      
      if (section) {
        params.append('section', section);
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: this.getDefaultHeaders(),
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error('Failed to get knowledge contents');
      }
    } catch (error) {
      console.error('Error getting knowledge contents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ask a question about the knowledge base
   */
  async askQuestion(userId, question) {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/ask`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ userId, question })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error('Failed to ask question');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update knowledge base with new data
   */
  async updateKnowledgeBase(userId, newData = null) {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/update/${userId}`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ newData })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        throw new Error('Failed to update knowledge base');
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build initial knowledge base from onboarding and journal data
   */
  async buildKnowledgeBase(userId, onboardingData, journalEntries) {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/build/${userId}`, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify({ onboardingData, journalEntries })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        throw new Error('Failed to build knowledge base');
      }
    } catch (error) {
      console.error('Error building knowledge base:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error('Failed to get service status');
      }
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available MCP tools
   */
  async getTools() {
    try {
      const response = await fetch(`${this.baseUrl}/tools`);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error('Failed to get tools');
      }
    } catch (error) {
      console.error('Error getting tools:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe to MCP Server-Sent Events
   */
  subscribe(callbacks = {}) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const token = localStorage.getItem('accessToken');
    const eventSourceUrl = `${this.baseUrl}/sse${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    this.eventSource = new EventSource(eventSourceUrl);

    this.eventSource.onopen = () => {
      console.log('MCP Knowledge Base SSE connection opened');
      if (callbacks.onOpen) callbacks.onOpen();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('MCP Knowledge Base update:', data);
        
        if (callbacks.onUpdate) callbacks.onUpdate(data);
        
        // Dispatch custom events for global listeners
        if (data.type === 'knowledge_base_updated') {
          window.dispatchEvent(new CustomEvent('knowledgeBaseUpdated', {
            detail: { userId: data.userId, data: data.data }
          }));
        }
      } catch (error) {
        console.error('Error parsing MCP SSE data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('MCP Knowledge Base SSE error:', error);
      if (callbacks.onError) callbacks.onError(error);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.subscribe(callbacks);
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

  /**
   * Unsubscribe from updates
   */
  unsubscribe() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Get MCP server information
   */
  async getMCPInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/mcp`);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data
        };
      } else {
        throw new Error('Failed to get MCP info');
      }
    } catch (error) {
      console.error('Error getting MCP info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new MCPKnowledgeBaseService();
