/**
 * Base AI Agent class for internal MCP communication
 * All AI agents should extend this class
 */

export class BaseAgent {
  constructor(agentId, capabilities) {
    this.agentId = agentId;
    this.capabilities = capabilities;
    this.mcpServer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the agent with the MCP server
   * @param {InternalMCPServer} mcpServer - The MCP server instance
   */
  initialize(mcpServer) {
    this.mcpServer = mcpServer;
    mcpServer.registerAgent(this.agentId, this.capabilities, this.handleMessage.bind(this));
    this.isInitialized = true;
    console.log(`🚀 Agent ${this.agentId} initialized`);
  }

  /**
   * Send a message to another agent
   * @param {string} targetAgent - Target agent ID
   * @param {Object} message - Message payload
   * @param {Object} context - Additional context data
   * @returns {Promise} Response from target agent
   */
  async sendToAgent(targetAgent, message, context = {}) {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.agentId} is not initialized`);
    }
    return await this.mcpServer.sendMessage(this.agentId, targetAgent, message, context);
  }

  /**
   * Broadcast a message to all other agents
   * @param {Object} message - Message payload
   * @param {Object} context - Additional context data
   * @returns {Promise<Array>} Array of responses from all agents
   */
  async broadcast(message, context = {}) {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.agentId} is not initialized`);
    }
    return await this.mcpServer.broadcast(this.agentId, message, context);
  }

  /**
   * Handle incoming messages from other agents
   * Must be implemented by subclasses
   * @param {Object} messageData - Message data from MCP server
   * @returns {Promise} Response to send back
   */
  async handleMessage(messageData) {
    throw new Error('handleMessage must be implemented by subclass');
  }

  /**
   * Store context data that can be shared with other agents
   * @param {string} key - Context key
   * @param {*} value - Context value
   */
  setContext(key, value) {
    if (this.mcpServer) {
      this.mcpServer.setContext(`${this.agentId}:${key}`, value);
    }
  }

  /**
   * Retrieve context data
   * @param {string} key - Context key
   * @returns {*} Context value or undefined
   */
  getContext(key) {
    if (this.mcpServer) {
      return this.mcpServer.getContext(`${this.agentId}:${key}`);
    }
    return undefined;
  }

  /**
   * Get agent status information
   * @returns {Object} Agent status
   */
  getStatus() {
    return {
      agentId: this.agentId,
      capabilities: this.capabilities,
      isInitialized: this.isInitialized,
      mcpServer: this.mcpServer ? 'connected' : 'disconnected'
    };
  }

  /**
   * Log agent activity
   * @param {string} action - Action being performed
   * @param {Object} data - Additional data
   */
  log(action, data = {}) {
    console.log(`🤖 ${this.agentId}: ${action}`, data);
  }
}
