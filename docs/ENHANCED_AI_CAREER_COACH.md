# 🚀 Enhanced AI Career Coach System

## Overview

The Enhanced AI Career Coach is a sophisticated, proactive career guidance system that combines vectorized knowledge storage, real-time market intelligence, and advanced LLM analytics to provide personalized career recommendations. This system learns from user data and market trends to offer proactive, actionable career guidance.

## 🎯 Key Features

### 1. **Vectorized Knowledge Base**
- **ChromaDB Integration**: Local vector database for secure, fast semantic search
- **User Profile Vectorization**: All user data stored as searchable vectors
- **Journal Entry Analysis**: Enhanced content analysis with market context
- **Market Intelligence Storage**: Real-time job market data vectorized for insights

### 2. **Proactive AI System**
- **12-Hour Triggers**: Automatic analysis every 12 hours
- **Market-Aware Recommendations**: Based on current job market trends
- **Professional LLM Analysis**: Deep analytical career guidance
- **Personalized Growth Paths**: Tailored to individual career goals

### 3. **Market Intelligence Scraping**
- **Multi-Source Data**: LinkedIn, Indeed, Glassdoor, GitHub Jobs, Stack Overflow
- **Skills Demand Analysis**: Real-time skill market demand tracking
- **Salary Intelligence**: Current salary trends and compensation data
- **Industry Trends**: Emerging technologies and career opportunities

### 4. **Enhanced Goal Setting**
- **Market-Aligned Goals**: Goals validated against current market trends
- **Specific Action Items**: Detailed, actionable steps for each goal
- **Timeline Optimization**: Realistic timelines based on market data
- **Priority Weighting**: Goals prioritized by market relevance

## 🏗️ Architecture

### Backend Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced AI Career Coach                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Vector DB     │  │ Market Intel    │  │   LLM API   │  │
│  │   (ChromaDB)    │  │   Service       │  │ (OpenRouter)│  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Enhanced AI     │  │ Proactive       │  │ Market      │  │
│  │ Career Coach    │  │ Scheduler       │  │ Scraping    │  │
│  │ Service         │  │ (12h triggers)  │  │ Engine      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ MongoDB         │  │ Express.js      │  │ React       │  │
│  │ (User Data)     │  │ (API Routes)    │  │ Frontend    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Resume upload, journal entries, goal setting
2. **Vectorization** → All data converted to embeddings and stored in ChromaDB
3. **Market Analysis** → Real-time scraping and analysis of job market trends
4. **LLM Processing** → Professional analysis with market context
5. **Proactive Recommendations** → 12-hour scheduled analysis and recommendations
6. **User Dashboard** → Personalized insights and actionable recommendations

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Node.js 18+ and npm
node --version
npm --version

# Docker (for ChromaDB)
docker --version
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start ChromaDB

```bash
# Using Docker Compose
docker-compose -f docker-compose.vector.yml up -d

# Or using Docker directly
docker run -p 8000:8000 chromadb/chroma
```

### 4. Environment Variables

Create `.env` file in backend directory:

```env
# Database
MONGODB_URL=mongodb://localhost:27017/jobhunter

# ChromaDB
CHROMA_DB_PATH=http://localhost:8000

# LLM API (OpenRouter)
OPENAI_API_KEY=your_openrouter_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# Market Intelligence
LINKEDIN_API_KEY=your_linkedin_api_key
INDEED_API_KEY=your_indeed_api_key
GLASSDOOR_API_KEY=your_glassdoor_api_key
```

### 5. Initialize Vector Database

```bash
cd backend
node src/utils/ai/setupVectorDB.js
```

### 6. Start the Server

```bash
npm run dev
```

## 📊 API Endpoints

### Enhanced AI Career Coach Routes

Base URL: `/api/v1/enhanced-ai-career-coach`

#### Resume Analysis
```http
POST /analyze-resume
Content-Type: application/json
Authorization: Bearer <token>

{
  "resumeFile": "base64_encoded_pdf"
}
```

#### Journal Management
```http
POST /journal
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Today I learned about React hooks and state management...",
  "entry_date": "2024-01-15T10:30:00Z",
  "tags": ["learning", "react", "frontend"]
}
```

#### Goal Setting
```http
POST /goals
Content-Type: application/json
Authorization: Bearer <token>

{
  "careerGoals": {
    "short_term": [
      {
        "goal": "Master React and TypeScript",
        "timeline": "3 months",
        "priority": 8
      }
    ],
    "long_term": [
      {
        "goal": "Become a Senior Frontend Developer",
        "timeline": "2 years",
        "priority": 9
      }
    ]
  }
}
```

#### Proactive Recommendations
```http
GET /recommendations?type=proactive&limit=10
Authorization: Bearer <token>
```

#### Market Intelligence
```http
GET /market-insights?category=skills&limit=10
Authorization: Bearer <token>

GET /skills-demand?skills=javascript,python,react
Authorization: Bearer <token>
```

#### Vector Search
```http
POST /search
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "react development best practices",
  "collection": "knowledge_base",
  "limit": 5
}
```

## 🔧 Configuration

### ChromaDB Configuration

```javascript
// In enhancedVectorDatabase.service.js
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_DB_PATH || "http://localhost:8000"
});
```

### Market Intelligence Sources

```javascript
// In marketIntelligence.service.js
const sources = {
  linkedin: { baseUrl: 'https://www.linkedin.com/jobs/api/job-search' },
  indeed: { baseUrl: 'https://www.indeed.com/jobs' },
  glassdoor: { baseUrl: 'https://www.glassdoor.com/Job' },
  github: { baseUrl: 'https://jobs.github.com/positions.json' },
  stackoverflow: { baseUrl: 'https://stackoverflow.com/jobs/feed' }
};
```

### Proactive Scheduler

```javascript
// Runs every 12 hours
cron.schedule('0 */12 * * *', async () => {
  await this.runProactiveAnalysis();
});
```

## 📈 Monitoring & Health Checks

### System Health Check

```http
GET /api/v1/enhanced-ai-career-coach/health
```

Response:
```json
{
  "status": "healthy",
  "vector_database": {
    "status": "healthy",
    "chroma_connected": true,
    "embedding_generation": true
  },
  "market_intelligence": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Admin Statistics

```http
GET /api/v1/enhanced-ai-career-coach/admin/stats
```

## 🔒 Security Features

### Data Encryption
- **Client-side encryption** before sending to server
- **Vector embeddings** (no raw text in vectors)
- **JWT tokens** with short expiration
- **Rate limiting** on all endpoints

### Privacy Protection
- **Local ChromaDB** (no external dependencies)
- **User data isolation** (per-user collections)
- **Secure API keys** (environment variables)

## 🚀 Deployment

### Production Setup

1. **ChromaDB Production**:
   ```bash
   # Use managed ChromaDB or self-hosted with persistence
   docker run -d -p 8000:8000 -v chroma_data:/chroma/chroma chromadb/chroma
   ```

2. **Environment Variables**:
   ```env
   NODE_ENV=production
   CHROMA_DB_PATH=https://your-chromadb-instance.com
   OPENAI_API_KEY=your_production_api_key
   ```

3. **Monitoring**:
   - Set up health check endpoints
   - Monitor ChromaDB performance
   - Track API usage and costs

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Vector database tests
node src/utils/ai/setupVectorDB.js
```

### Test Vector Search

```bash
curl -X POST http://localhost:3000/api/v1/enhanced-ai-career-coach/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "javascript development", "collection": "knowledge_base"}'
```

## 📚 Integration with Existing System

### Frontend Integration

The enhanced system integrates seamlessly with the existing AI Career Coach frontend:

1. **Enhanced Resume Upload**: Now includes market analysis
2. **Improved Goal Setting**: Market-aligned goal validation
3. **Proactive Recommendations**: Real-time, personalized suggestions
4. **Vector Search**: Semantic search across all user data

### Backward Compatibility

- All existing API endpoints remain functional
- Enhanced endpoints are additive (new `/enhanced-ai-career-coach` routes)
- Gradual migration path from old to new system

## 🔮 Future Enhancements

### Planned Features

1. **Voice Integration**: TTS for proactive recommendations
2. **Mobile App**: Native mobile experience
3. **Advanced Analytics**: Career trajectory predictions
4. **Team Features**: Collaborative career planning
5. **Integration APIs**: Connect with LinkedIn, GitHub, etc.

### Scalability

- **Horizontal scaling** with multiple ChromaDB instances
- **Caching layer** with Redis
- **Load balancing** for high availability
- **CDN integration** for global performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

---

**Built with ❤️ for career growth and professional development**
