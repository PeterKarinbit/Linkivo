# MCP Knowledge Base Implementation

## Overview

This implementation creates a Model Context Protocol (MCP) server that uses Google's Gemini LLM to build and maintain personalized knowledge bases for users based on their onboarding data and career journals. The system provides actionable career improvement steps and updates knowledge incrementally every 24 hours.

## Features

### 🤖 AI-Powered Knowledge Base
- **Gemini Integration**: Uses Google's Gemini 1.5 Flash model for intelligent analysis
- **Personalized Insights**: Builds knowledge base from user onboarding and journal data
- **Actionable Steps**: Provides specific, actionable career improvement recommendations
- **Incremental Updates**: Automatically updates knowledge base every 24 hours

### 🔧 MCP Server Capabilities
- **DeepWiki-style Interface**: Similar to Devin's DeepWiki MCP server
- **Real-time Updates**: Server-Sent Events (SSE) for live updates
- **HTTP API**: RESTful endpoints for programmatic access
- **Tool Discovery**: Self-describing API with tool definitions

### 📊 Knowledge Base Structure
- **User Profile**: Current role, experience, skills, strengths, weaknesses
- **Career Path**: Short-term and long-term goals with milestones
- **Skill Development**: Critical and emerging skills with learning paths
- **Actionable Steps**: Immediate, weekly, and monthly action items
- **Insights**: Career trends, market opportunities, and recommendations
- **Progress Tracking**: Metrics and milestone tracking

## Architecture

### Backend Components

```
backend/src/
├── services/
│   └── mcpKnowledgeBaseService.js    # Core MCP service
├── routes/
│   └── mcpKnowledgeBase.routes.js    # MCP API endpoints
└── index.js                          # Server integration
```

### Frontend Components

```
frontend/src/
├── services/
│   └── mcpKnowledgeBaseService.js    # Frontend service
└── components/AICareerCoach/
    ├── MCPKnowledgeBase.jsx          # React component
    └── KnowledgeBase.jsx             # Updated with MCP toggle
```

## API Endpoints

### MCP Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/mcp-knowledge-base/sse` | GET | Server-Sent Events for real-time updates |
| `/api/v1/mcp-knowledge-base/mcp` | GET | MCP server information and capabilities |
| `/api/v1/mcp-knowledge-base/status` | GET | Service status and statistics |
| `/api/v1/mcp-knowledge-base/tools` | GET | Available MCP tools and schemas |

### Knowledge Base Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/mcp-knowledge-base/knowledge-base/structure/:userId` | GET | Get knowledge base structure |
| `/api/v1/mcp-knowledge-base/knowledge-base/contents/:userId` | GET | Get knowledge base contents |
| `/api/v1/mcp-knowledge-base/knowledge-base/ask` | POST | Ask questions about knowledge base |
| `/api/v1/mcp-knowledge-base/knowledge-base/update/:userId` | POST | Update knowledge base with new data |
| `/api/v1/mcp-knowledge-base/knowledge-base/build/:userId` | POST | Build initial knowledge base |

## Usage

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

### 2. Test the MCP Server

```bash
cd backend
node test-mcp-server.js
```

### 3. Access the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Use the Knowledge Base

1. Navigate to the AI Career Coach page
2. Go to the Knowledge Base section
3. Toggle to "AI-Powered" mode
4. The system will build your knowledge base from onboarding data
5. Ask questions and get personalized career advice

## MCP Integration

### For MCP Clients (like Claude, Cursor, etc.)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "jobhunter-knowledge": {
      "serverUrl": "http://localhost:3000/api/v1/mcp-knowledge-base/sse"
    }
  }
}
```

### Available MCP Tools

1. **read_knowledge_structure** - Get knowledge base structure
2. **read_knowledge_contents** - Get knowledge base contents
3. **ask_question** - Ask questions about career development
4. **update_knowledge_base** - Update knowledge with new data

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
MONGODB_URL=mongodb://localhost:27017/jobhunter
PORT=3000
```

### Knowledge Base Storage

Knowledge bases are stored in:
- **Memory**: Active knowledge bases in service memory
- **Files**: Persistent storage in `backend/data/knowledge-bases/`
- **Database**: User data and journal entries (via existing MongoDB)

## Features in Detail

### 🤖 AI-Powered Analysis

The system uses Gemini to analyze:
- **Onboarding Data**: User profile, skills, goals, preferences
- **Journal Entries**: Career reflections, achievements, challenges
- **Market Data**: Industry trends, salary information, skill demand

### 📈 Incremental Updates

Every 24 hours, the system:
1. Fetches new user data (journals, progress, preferences)
2. Analyzes changes and progress
3. Updates recommendations and insights
4. Adjusts timelines and priorities
5. Saves updated knowledge base

### 🎯 Actionable Recommendations

The knowledge base provides:
- **Immediate Actions**: Things to do today/this week
- **Weekly Goals**: Medium-term objectives
- **Monthly Milestones**: Long-term career development
- **Skill Development**: Learning paths and resources
- **Market Insights**: Industry trends and opportunities

## Example Knowledge Base Structure

```json
{
  "userProfile": {
    "currentRole": "Software Developer",
    "experienceLevel": "Mid-level",
    "industry": "Technology",
    "skills": ["JavaScript", "React", "Node.js"],
    "careerGoals": ["Senior Developer", "Tech Lead"]
  },
  "actionableSteps": {
    "immediate": [
      {
        "action": "Complete React Advanced course",
        "timeline": "2 weeks",
        "expectedOutcome": "Improved React skills for senior role"
      }
    ],
    "weekly": [
      {
        "action": "Build portfolio project",
        "timeline": "1 month",
        "expectedOutcome": "Demonstrate technical leadership"
      }
    ]
  },
  "skillDevelopment": {
    "criticalSkills": [
      {
        "skill": "System Design",
        "currentLevel": 3,
        "targetLevel": 7,
        "learningPath": ["Basic concepts", "Practice problems", "Real projects"]
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Backend not starting**: Check if MongoDB is running and GEMINI_API_KEY is set
2. **Knowledge base not building**: Ensure user has completed onboarding
3. **MCP client connection issues**: Verify server is running on correct port
4. **Authentication errors**: Check if user is logged in and token is valid

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Future Enhancements

- [ ] Multi-model support (OpenAI, Anthropic, etc.)
- [ ] Advanced analytics and reporting
- [ ] Integration with external career platforms
- [ ] Mobile app support
- [ ] Team collaboration features
- [ ] Advanced AI coaching capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Gemini AI and the Model Context Protocol**
