import { google } from 'googleapis';

// Your API credentials
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SEARCH_ENGINE_ID = 'YOUR_SEARCH_ENGINE_ID';

// Initialize the Custom Search API
const customsearch = google.customsearch('v1');

/**
 * Search using Google Custom Search JSON API
 */
async function search(query, options = {}) {
  try {
    const params = {
      auth: API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      ...options
    };

    console.log(`Searching for: "${query}"`);
    const response = await customsearch.cse.list(params);
    return response.data;
  } catch (error) {
    console.error('Error searching with Google Custom Search:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
}

// Test the search function
async function testSearch() {
  try {
    // Test search for job listings
    const results = await search('software developer jobs in chicago', {
      num: 5,
      siteSearch: 'linkedin.com,indeed.com,glassdoor.com',
      siteSearchFilter: 'i',
      lr: 'lang_en',
      cr: 'countryUS',
      gl: 'us'
    });

    console.log('\nSearch Results:');
    console.log('===============');
    
    if (results.items && results.items.length > 0) {
      results.items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ${item.link}`);
        console.log(`   ${item.snippet}`);
      });
    } else {
      console.log('No results found.');
    }
    
    console.log('\nSearch Information:');
    console.log('==================');
    console.log(`Total Results: ${results.searchInformation?.totalResults || 0}`);
    console.log(`Search Time: ${results.searchInformation?.searchTime || 0} seconds`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testSearch().catch(console.error);
