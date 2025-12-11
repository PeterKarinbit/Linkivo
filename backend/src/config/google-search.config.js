/**
 * Google Custom Search API Configuration
 * 
 * To use this API, you'll need to:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable the Custom Search JSON API
 * 4. Create API credentials (API key)
 * 5. Create a Programmable Search Engine at https://programmablesearch.google.com/about/
 */

export default {
  // Base URL for Google Custom Search JSON API
  baseUrl: 'https://www.googleapis.com/customsearch/v1',
  
  // Default request timeout in milliseconds
  timeout: 10000,
  
  // Default headers
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  
  // Default query parameters
  defaultParams: {
    // These will be merged with search parameters
    num: 10,                  // Number of search results to return (1-10)
    start: 1,                 // The index of the first result to return
    safe: 'active',           // Search safety level (active, off)
    filter: '1',              // Enable duplicate content filter
    lr: 'lang_en',            // Restrict search to documents written in English
    cr: 'countryUS',          // Country restrict (US)
    gl: 'us',                 // Geolocation of end user
    hq: 'salary OR compensation OR pay', // Appears high in results
    siteSearch: 'linkedin.com jobs,indeed.com,glassdoor.com', // Sites to search
    siteSearchFilter: 'i'     // Include results from these sites
  }
};
