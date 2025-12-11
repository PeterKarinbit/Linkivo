# Learning Recommendation System Integration Test

This directory contains the integration test for the Learning Recommendation System, which combines LLM-based analysis with the Coursera API to provide personalized course recommendations based on journal entries.

## Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. API Keys:
   - OpenRouter API key (for LLM processing)
   - Coursera API key (for course data)

## Setup

1. Install dependencies:
   ```bash
   npm install node-fetch dotenv
   ```

2. Create a `.env` file in the project root with your API keys:
   ```env
   # Required
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   COURSERA_API_KEY=your_coursera_api_key_here
   
   # Optional
   LOG_LEVEL=info
   ```

## Running the Test

To run the integration test:

```bash
# From the project root
node --experimental-json-modules test/integration/learning-recommendation/run-test.js
```

## Test Cases

The test script processes the following journal entries by default:

1. "I want to learn machine learning and Python for data analysis."
2. "I need to study data science to advance my career."
3. "Looking for courses on web development."
4. "I'm interested in artificial intelligence and neural networks."
5. "How can I get started with cloud computing?"

## Output

The test will display:
- The original journal entry
- Analysis results (identified topics, confidence, reasoning)
- Recommended courses from Coursera with relevant details
- Processing time for each entry

## Configuration

You can modify the test configuration in `config.js`:
- Adjust the list of test journal entries
- Change API timeouts and rate limits
- Modify the number of courses returned per topic
- Enable/disable caching

## Troubleshooting

- **Rate Limiting**: If you encounter rate limiting, increase the delay between requests in `run-test.js`
- **API Errors**: Check your API keys and network connection
- **Empty Results**: The Coursera API might not return results for very specific queries

## Notes

- The system includes a fallback mechanism that uses simple keyword matching if the LLM fails
- Results are cached to avoid redundant API calls during testing
- The test includes proper error handling and logging
