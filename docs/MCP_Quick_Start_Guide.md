# MCP Quick Start Guide for Linkivo AI Career Coach

## 🚀 Getting Started with AI Agent Communication

This guide will help you quickly implement the internal MCP (Model Context Protocol) system for AI agent communication in your Linkivo platform.

## 📁 Files Created

### Core MCP Infrastructure
- `frontend/src/services/internalMCPServer.js` - Main MCP server for agent communication
- `frontend/src/services/aiAgents/BaseAgent.js` - Base class for all AI agents
- `frontend/src/services/aiAgents/CareerAssessmentAgent.js` - Career assessment AI agent
- `frontend/src/services/aiAgents/RecommendationAgent.js` - Recommendation engine AI agent

### UI Components
- `frontend/src/components/AICareerCoach/AICollaborationDashboard.jsx` - Real-time AI collaboration monitor
- `frontend/src/Pages/EnhancedAICareerCoachWithMCP.jsx` - Enhanced main page with MCP integration

### Documentation
- `docs/MCP_Integration_Plan.md` - Complete integration strategy
- `docs/Internal_AI_Communication_Implementation.md` - Technical implementation details

## 🛠️ Implementation Steps

### Step 1: Test the MCP System

Create a simple test file to verify everything works:

```javascript
// test-mcp.js
import { internalMCPServer } from './frontend/src/services/internalMCPServer.js';
import { CareerAssessmentAgent } from './frontend/src/services/aiAgents/CareerAssessmentAgent.js';
import { RecommendationAgent } from './frontend/src/services/aiAgents/RecommendationAgent.js';

async function testMCP() {
  console.log('🧪 Testing MCP System...');
  
  // Create agents
  const careerAgent = new CareerAssessmentAgent();
  const recommendationAgent = new RecommendationAgent();
  
  // Initialize with MCP server
  careerAgent.initialize(internalMCPServer);
  recommendationAgent.initialize(internalMCPServer);
  
  // Test communication
  const userId = 'test-user-123';
  
  try {
    // Test 1: Career assessment
    console.log('📊 Testing career assessment...');
    const progress = await careerAgent.sendToAgent('recommendation-engine', {
      type: 'assess_user_progress',
      data: { userId, timeframe: 'last_month' }
    });
    console.log('✅ Career assessment result:', progress);
    
    // Test 2: Generate recommendations
    console.log('💡 Testing recommendation generation...');
    const recommendations = await recommendationAgent.sendToAgent('career-assessment', {
      type: 'generate_recommendations',
      data: { userId, preferences: { progress } }
    });
    console.log('✅ Recommendations result:', recommendations);
    
    // Test 3: Check agent status
    console.log('📈 Agent status:', internalMCPServer.getAgentStatus());
    console.log('🏥 Server health:', internalMCPServer.getHealth());
    
    console.log('🎉 MCP System test completed successfully!');
    
  } catch (error) {
    console.error('❌ MCP System test failed:', error);
  }
}

testMCP();
```

### Step 2: Integrate with Your Existing App

1. **Replace your main component** (temporarily for testing):
   ```javascript
   // In your main App.js or routing file
   import EnhancedAICareerCoachWithMCP from './Pages/EnhancedAICareerCoachWithMCP';
   
   // Use this instead of your current EnhancedAICareerCoach
   <EnhancedAICareerCoachWithMCP />
   ```

2. **Add the collaboration dashboard** to any page:
   ```javascript
   import AICollaborationDashboard from './components/AICareerCoach/AICollaborationDashboard';
   import { internalMCPServer } from './services/internalMCPServer';
   
   // In your component
   <AICollaborationDashboard 
     mcpServer={internalMCPServer} 
     aiAgents={yourAiAgents} 
   />
   ```

### Step 3: Test Real Scenarios

1. **User Progress Assessment**:
   ```javascript
   // When user completes a journal entry
   await aiAgents.career.sendToAgent('recommendation-engine', {
     type: 'progress_update',
     data: { userId, progress: { journalEntry: 'New insights...' } }
   });
   ```

2. **Collaborative Recommendations**:
   ```javascript
   // Generate recommendations using multiple agents
   const progress = await aiAgents.career.assessUserProgress(userId);
   const recommendations = await aiAgents.recommendation.generatePersonalizedRecommendations(userId, { progress });
   ```

3. **Broadcast Updates**:
   ```javascript
   // Notify all agents about a major change
   await aiAgents.career.broadcast({
     type: 'user_goal_updated',
     data: { userId, newGoals: userGoals }
   });
   ```

## 🔧 Configuration Options

### Enable/Disable AI Collaboration
```javascript
// In your component state
const [aiCollaborationEnabled, setAiCollaborationEnabled] = useState(true);

// The system will automatically fall back to API-based recommendations
// if AI collaboration is disabled
```

### Custom Agent Capabilities
```javascript
// Add new capabilities to existing agents
const customAgent = new BaseAgent('custom-agent', [
  'analyze_data',
  'generate_reports',
  'send_notifications'
]);
```

### Message Filtering
```javascript
// Filter messages by type
const filteredMessages = mcpServer.getMessageHistory(50)
  .filter(msg => msg.message.type === 'progress_update');
```

## 📊 Monitoring and Debugging

### Real-time Dashboard
The `AICollaborationDashboard` component provides:
- Live agent status
- Message flow visualization
- Performance metrics
- Error tracking

### Console Logging
All agent communication is logged to console with emojis:
- 🤖 Agent actions
- 📨 Message sending
- ✅ Successful operations
- ❌ Errors

### Health Monitoring
```javascript
// Check system health
const health = internalMCPServer.getHealth();
console.log('Success rate:', health.successRate + '%');
console.log('Active agents:', health.activeAgents);
```

## 🚨 Troubleshooting

### Common Issues

1. **Agents not communicating**:
   - Check if agents are properly initialized
   - Verify MCP server is running
   - Check console for error messages

2. **Messages failing**:
   - Ensure target agent exists
   - Check agent status (active/inactive)
   - Verify message format

3. **Performance issues**:
   - Monitor message queue length
   - Check response times
   - Consider message batching

### Debug Mode
```javascript
// Enable detailed logging
const mcpServer = new InternalMCPServer();
mcpServer.debugMode = true; // Shows detailed message flow
```

## 🎯 Next Steps

### Phase 1: Internal Communication (Current)
- ✅ Basic agent communication
- ✅ Real-time dashboard
- ✅ Error handling
- ✅ Performance monitoring

### Phase 2: External MCP Integration
- [ ] PostgreSQL MCP for persistent storage
- [ ] Web Search MCP for market data
- [ ] Email MCP for notifications
- [ ] Analytics MCP for visualization

### Phase 3: Advanced Features
- [ ] Multi-agent workflows
- [ ] Predictive analytics
- [ ] Machine learning integration
- [ ] Advanced orchestration

## 📚 Additional Resources

- [MCP Servers Directory](https://mcpservers.org/official) - Find external MCP servers
- [Model Context Protocol Documentation](https://modelcontextprotocol.io) - Official MCP docs
- [Internal Implementation Guide](./Internal_AI_Communication_Implementation.md) - Detailed technical guide

## 🤝 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all agents are properly initialized
3. Test with the provided test script
4. Review the implementation documentation

The system is designed to be resilient - if AI collaboration fails, it will automatically fall back to your existing API-based recommendations.

---

**Ready to revolutionize your AI Career Coach with multi-agent collaboration! 🚀**
