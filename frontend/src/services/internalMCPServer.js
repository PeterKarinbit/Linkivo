/**
 * Internal MCP Server for AI Agent Communication
 * Enables AI agents within Linkivo to communicate with each other
 */

class InternalMCPServer {
  constructor() {
    this.agents = new Map();
    this.messageQueue = [];
    this.contextStore = new Map();
    this.messageId = 0;
    this.isProcessing = false;
  }

  /**
   * Register an AI agent with the MCP server
   * @param {string} agentId - Unique identifier for the agent
   * @param {Array} capabilities - List of capabilities the agent provides
   * @param {Function} handler - Function to handle incoming messages
   */
  registerAgent(agentId, capabilities, handler) {
    this.agents.set(agentId, {
      capabilities,
      handler,
      status: 'active',
      lastSeen: Date.now(),
      messageCount: 0,
      errorCount: 0
    });
    
    console.log(`🤖 Agent ${agentId} registered with capabilities:`, capabilities);
  }

  /**
   * Send a message from one agent to another
   * @param {string} fromAgent - Source agent ID
   * @param {string} toAgent - Target agent ID
   * @param {Object} message - Message payload
   * @param {Object} context - Additional context data
   * @returns {Promise} Response from target agent
   */
  async sendMessage(fromAgent, toAgent, message, context = {}) {
    const messageId = this.generateMessageId();
    const messageData = {
      id: messageId,
      from: fromAgent,
      to: toAgent,
      message,
      context,
      timestamp: Date.now(),
      status: 'pending'
    };

    console.log(`📨 ${fromAgent} → ${toAgent}: ${message.type || 'message'}`);
    
    this.messageQueue.push(messageData);
    return await this.processMessage(messageData);
  }

  /**
   * Process a message and route it to the appropriate agent
   * @param {Object} messageData - Message data to process
   * @returns {Promise} Response from target agent
   */
  async processMessage(messageData) {
    const targetAgent = this.agents.get(messageData.to);
    if (!targetAgent) {
      const error = new Error(`Agent ${messageData.to} not found`);
      messageData.status = 'failed';
      messageData.error = error.message;
      throw error;
    }

    if (targetAgent.status !== 'active') {
      const error = new Error(`Agent ${messageData.to} is not active`);
      messageData.status = 'failed';
      messageData.error = error.message;
      throw error;
    }

    try {
      const startTime = Date.now();
      const response = await targetAgent.handler(messageData);
      const responseTime = Date.now() - startTime;
      
      messageData.status = 'completed';
      messageData.response = response;
      messageData.responseTime = responseTime;
      
      // Update agent metrics
      targetAgent.messageCount++;
      targetAgent.lastSeen = Date.now();
      
      console.log(`✅ ${messageData.from} → ${messageData.to}: Completed in ${responseTime}ms`);
      return response;
    } catch (error) {
      messageData.status = 'failed';
      messageData.error = error.message;
      targetAgent.errorCount++;
      
      console.error(`❌ ${messageData.from} → ${messageData.to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Broadcast a message to all registered agents
   * @param {string} fromAgent - Source agent ID
   * @param {Object} message - Message payload
   * @param {Object} context - Additional context data
   * @returns {Promise<Array>} Array of responses from all agents
   */
  async broadcast(fromAgent, message, context = {}) {
    const responses = [];
    const agentIds = Array.from(this.agents.keys()).filter(id => id !== fromAgent);
    
    console.log(`📢 ${fromAgent} broadcasting to ${agentIds.length} agents`);
    
    for (const agentId of agentIds) {
      try {
        const response = await this.sendMessage(fromAgent, agentId, message, context);
        responses.push({ agentId, response, success: true });
      } catch (error) {
        responses.push({ agentId, error: error.message, success: false });
      }
    }
    
    return responses;
  }

  /**
   * Get the status of all registered agents
   * @returns {Object} Status information for all agents
   */
  getAgentStatus() {
    const status = {};
    for (const [agentId, agent] of this.agents) {
      status[agentId] = {
        status: agent.status,
        lastSeen: agent.lastSeen,
        messageCount: agent.messageCount,
        errorCount: agent.errorCount,
        capabilities: agent.capabilities
      };
    }
    return status;
  }

  /**
   * Get recent message history
   * @param {number} limit - Maximum number of messages to return
   * @returns {Array} Recent messages from the queue
   */
  getMessageHistory(limit = 50) {
    return this.messageQueue
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Store context data that can be shared between agents
   * @param {string} key - Context key
   * @param {*} value - Context value
   */
  setContext(key, value) {
    this.contextStore.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Retrieve context data
   * @param {string} key - Context key
   * @returns {*} Context value or undefined
   */
  getContext(key) {
    const context = this.contextStore.get(key);
    return context ? context.value : undefined;
  }

  /**
   * Generate a unique message ID
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  /**
   * Get server health information
   * @returns {Object} Health metrics
   */
  getHealth() {
    const activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'active').length;
    
    const totalMessages = this.messageQueue.length;
    const failedMessages = this.messageQueue.filter(msg => msg.status === 'failed').length;
    
    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalMessages,
      failedMessages,
      successRate: totalMessages > 0 ? ((totalMessages - failedMessages) / totalMessages) * 100 : 100
    };
  }
}

// Export singleton instance
export const internalMCPServer = new InternalMCPServer();
export default InternalMCPServer;
