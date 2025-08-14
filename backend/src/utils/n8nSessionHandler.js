// Simple n8n Session Handler
// This script automatically handles session tokens for n8n workflows

class N8nSessionHandler {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Generate a simple session token
   */
  generateSessionToken(userId = 'guest') {
    const timestamp = Date.now();
    const token = `${timestamp}_${userId}`;
    
    // Store session info
    this.sessions.set(token, {
      userId,
      createdAt: new Date(),
      lastActivity: new Date()
    });
    
    console.log(`[N8N SESSION] Generated token: ${token}`);
    return token;
  }

  /**
   * Prepare n8n payload with session token
   */
  prepareN8nPayload(data) {
    const sessionToken = this.generateSessionToken(data.userId);
    
    return {
      sessionId: sessionToken,
      sessionToken: sessionToken, // Alternative field name
      timestamp: new Date().toISOString(),
      ...data
    };
  }

  /**
   * Send data to n8n with automatic session handling
   */
  async sendToN8n(webhookUrl, data) {
    try {
      const payload = this.prepareN8nPayload(data);
      
      console.log('[N8N SESSION] Sending to n8n:', {
        url: webhookUrl,
        sessionId: payload.sessionId,
        dataKeys: Object.keys(payload)
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[N8N SESSION] n8n response received');
      
      return result;
    } catch (error) {
      console.error('[N8N SESSION] Error sending to n8n:', error);
      throw error;
    }
  }

  /**
   * Clean up old sessions (optional)
   */
  cleanupOldSessions(maxAgeHours = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.sessions.delete(token);
        console.log(`[N8N SESSION] Cleaned up old session: ${token}`);
      }
    }
  }
}

// Create singleton instance
const n8nSessionHandler = new N8nSessionHandler();

export default n8nSessionHandler; 