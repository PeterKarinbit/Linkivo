import GoogleSearchService from './src/services/google/search.service.js';

// Configuration - Replace these with your actual API key and search engine ID
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const SEARCH_ENGINE_ID = 'YOUR_SEARCH_ENGINE_ID';

// Initialize the Google Search service
const searchService = new GoogleSearchService(GOOGLE_API_KEY, SEARCH_ENGINE_ID);

// Test scenarios for different job searches
const testScenarios = [
  {
    title: 'Software Developer',
    location: 'Chicago, IL',
    description: 'Software developer jobs in Chicago with salary info',
    options: {
      num: 5,
      siteSearch: 'linkedin.com/jobs,indeed.com,glassdoor.com',
      siteSearchFilter: 'i',
      hq: 'salary OR compensation OR pay',
      lr: 'lang_en',
      cr: 'countryUS',
      gl: 'us'
    }
  },
  {
    title: 'Data Scientist',
    location: 'New York, NY',
    description: 'Data scientist jobs in New York with salary range',
    options: {
      num: 5,
      siteSearch: 'linkedin.com/jobs,indeed.com,glassdoor.com',
      siteSearchFilter: 'i',
      hq: 'salary range OR compensation',
      lr: 'lang_en',
      cr: 'countryUS',
      gl: 'us'
    }
  }
];

/**
 * Format and display search results
 */
function formatSearchResults(results, scenario) {
  if (!results || results.totalResults === 0) {
    return 'No results found.';
  }

  let output = `\n🔍 Search Results for "${scenario.title} in ${scenario.location}"\n`;
  output += '='.repeat(80) + '\n';
  output += `📊 Found ${results.totalResults} total results (showing ${results.items.length})\n\n`;

  results.items.forEach((item, index) => {
    output += `📌 ${index + 1}. ${item.title}\n`;
    output += `   🔗 ${item.link}\n`;
    
    if (item.salary) {
      output += `   💰 Salary: ${item.salary}\n`;
    }
    
    if (item.location) {
      output += `   📍 Location: ${item.location}\n`;
    }
    
    output += `   📝 ${item.snippet.substring(0, 150)}...\n`;
    output += '   '.padEnd(80, '-') + '\n';
  });

  return output;
}

/**
 * Run all test scenarios
 */
async function runTests() {
  console.log('🚀 Starting Google Custom Search API Tests\n');
  
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Testing: ${scenario.description}`);
    console.log('='.repeat(80));
    
    try {
      const query = `${scenario.title} jobs in ${scenario.location}`;
      
      console.log(`🔎 Searching for: "${query}"`);
      
      const results = await searchService.searchJobs({
        query,
        ...scenario.options
      });
      
      console.log(formatSearchResults(results, scenario));
    } catch (error) {
      console.error(`❌ Error for "${scenario.title}" in ${scenario.location}:`);
      console.error(`   ${error.message}`);
      
      if (error.details) {
        console.error('   Details:', JSON.stringify(error.details, null, 2));
      }
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
