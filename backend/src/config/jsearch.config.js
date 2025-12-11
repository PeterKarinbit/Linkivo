/**
 * JSearch API Configuration
 * 
 * This file contains configuration for the JSearch API integration.
 * API Documentation: https://app.openwebninja.com/api/jsearch/docs
 */

export default {
  // Base URL for JSearch API
  baseUrl: 'https://api.openwebninja.com',
  
  // Default timeout for requests (in milliseconds)
  timeout: 10000,
  
  // Default query parameters for job searches
  defaultParams: {
    country: 'us',
    language: 'en',
    date_posted: 'all',
    num_pages: 1,
    page: 1,
    work_from_home: false,
    employment_types: 'FULLTIME',
    job_requirements: 'no_experience',
    radius: 1
  }
};
