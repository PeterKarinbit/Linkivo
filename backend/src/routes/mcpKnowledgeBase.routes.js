/**
 * MCP Knowledge Base Routes
 * Provides MCP-compatible endpoints for the knowledge base service
 */

import express from 'express';
import mcpKnowledgeBaseService from '../services/mcpKnowledgeBaseService.js';
import { isAuthenticated } from '../middleware/auth.js';
import { User } from '../models/user.model.js';

const router = express.Router();

/**
 * MCP Server-Sent Events endpoint
 * Provides real-time updates for MCP clients
 */
router.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'MCP Knowledge Base Server connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

/**
 * Test endpoint to manually trigger knowledge base update
 */
router.get('/test-update/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Manually triggering knowledge base update for user ${userId}`);
    
    // Fetch the latest user data
    const userData = await User.findById(userId);
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Update the knowledge base with the latest user data
    const result = await mcpKnowledgeBaseService.updateKnowledgeBase(userId, userData, 'manual');
    
    res.json({
      success: true,
      message: 'Knowledge base update triggered successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering knowledge base update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * MCP HTTP endpoint
 * Provides HTTP-based MCP protocol support
 */
router.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.0.0',
    name: 'JobHunter Knowledge Base MCP Server',
    description: 'AI-powered knowledge base for career development',
    capabilities: [
      'read_knowledge_structure',
      'read_knowledge_contents', 
      'ask_question',
      'update_knowledge_base'
    ],
    endpoints: {
      sse: '/api/v1/mcp-knowledge-base/sse',
      http: '/api/v1/mcp-knowledge-base/mcp'
    }
  });
});

/**
 * Get knowledge base structure
 * MCP Tool: read_knowledge_structure
 */
router.get('/knowledge-base/structure/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await mcpKnowledgeBaseService.getKnowledgeStructure(userId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting knowledge structure:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get knowledge base contents
 * MCP Tool: read_knowledge_contents
 */
router.get('/knowledge-base/contents', isAuthenticated, async (req, res) => {
  try {
    const { userId, section } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await mcpKnowledgeBaseService.getKnowledgeContents(userId, section);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting knowledge contents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Ask question about knowledge base
 * MCP Tool: ask_question
 */
router.post('/knowledge-base/ask', isAuthenticated, async (req, res) => {
  try {
    const { userId, question } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        error: 'userId and question are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await mcpKnowledgeBaseService.askQuestion(userId, question);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error asking question:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update knowledge base
 * MCP Tool: update_knowledge_base
 */
router.post('/knowledge-base/update/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newData } = req.body;
    
    const result = await mcpKnowledgeBaseService.updateKnowledgeBase(userId, newData);
    
    res.json({
      success: true,
      data: result,
      message: 'Knowledge base updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Build initial knowledge base from onboarding and journals
 */
router.post('/knowledge-base/build/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { onboardingData, journalEntries } = req.body;
    
    if (!onboardingData || !journalEntries) {
      return res.status(400).json({
        success: false,
        error: 'onboardingData and journalEntries are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await mcpKnowledgeBaseService.buildKnowledgeBase(
      userId, 
      onboardingData, 
      journalEntries
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Knowledge base built successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error building knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get service status
 */
// Test endpoint to manually trigger knowledge base update
router.get('/test-update/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🚀 Manually triggering knowledge base update for user ${userId}`);
    
    // Force update the knowledge base
    const result = await mcpKnowledgeBaseService.updateKnowledgeBase(userId, {}, 'manual');
    
    res.json({
      success: true,
      message: 'Knowledge base update triggered successfully',
      data: {
        version: result.version,
        lastUpdated: result.lastUpdated,
        changes: result.updateHistory[result.updateHistory.length - 1]?.changes?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Error triggering knowledge base update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update knowledge base',
      error: error.message
    });
  }
});

router.get('/status', (req, res) => {
  try {
    const status = mcpKnowledgeBaseService.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * MCP Tool definitions for client discovery
 */
router.get('/tools', (req, res) => {
  res.json({
    success: true,
    data: {
      tools: [
        {
          name: 'read_knowledge_structure',
          description: 'Get the structure of a user\'s knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to get knowledge structure for'
              }
            },
            required: ['userId']
          }
        },
        {
          name: 'read_knowledge_contents',
          description: 'Get the contents of a user\'s knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to get knowledge contents for'
              },
              section: {
                type: 'string',
                description: 'Optional section to filter contents',
                enum: ['userProfile', 'careerPath', 'skillDevelopment', 'actionableSteps', 'insights', 'progressTracking']
              }
            },
            required: ['userId']
          }
        },
        {
          name: 'ask_question',
          description: 'Ask a question about a user\'s knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to ask question about'
              },
              question: {
                type: 'string',
                description: 'Question to ask about the knowledge base'
              }
            },
            required: ['userId', 'question']
          }
        },
        {
          name: 'update_knowledge_base',
          description: 'Update a user\'s knowledge base with new data',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID to update knowledge base for'
              },
              newData: {
                type: 'object',
                description: 'New data to incorporate into knowledge base'
              }
            },
            required: ['userId']
          }
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
