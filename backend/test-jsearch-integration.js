import JSearchService from './src/services/jsearch/jsearch.service.js';

// Initialize the JSearch service with your API key
const JSEARCH_API_KEY = 'ak_5mv9e7n1xl7w1r3jorwxlu1e0vizu83gmbgu0g13sm8l49i';
const jsearch = new JSearchService(JSEARCH_API_KEY);

// Test scenarios for different job titles and locations
const testScenarios = [
  {
    title: 'Developer',
    location: 'Chicago, IL',
    description: 'Developer jobs in Chicago',
    options: {
      fields: 'employer_name,job_publisher,job_title,job_country,job_min_salary,job_max_salary,job_salary_period,job_description',
      exclude_job_publishers: 'BeeBe,Dice',
      job_requirements: 'no_experience',
      work_from_home: false,
      employment_types: 'FULLTIME',
      radius: 1
    }
  }
];

/**
 * Format the salary estimate for display
 */
function formatSalaryEstimate(estimate) {
  if (!estimate) return 'No salary data available';
  
  const { salary, stats, levelDistribution, topCompanies, commonSkills } = estimate;
  
  let output = `\n📊 Salary Estimate for ${estimate.jobTitle} in ${estimate.location}:\n`;
  output += '='.repeat(60) + '\n';
  
  if (salary) {
    output += `💵 ${salary.formatted}\n`;
    output += `📈 Confidence: ${stats.salaryConfidence}% (based on ${stats.jobsWithSalary} of ${stats.totalJobs} jobs with salary data)\n\n`;
  }
  
  // Add level distribution
  if (levelDistribution) {
    output += '👔 Experience Level Distribution:\n';
    Object.entries(levelDistribution).forEach(([level, data]) => {
      if (data.percentage > 0) {
        output += `  • ${level.charAt(0).toUpperCase() + level.slice(1)}: ${data.percentage}% (${data.count} jobs)\n`;
      }
    });
    output += '\n';
  }
  
  // Add top companies
  if (topCompanies && topCompanies.length > 0) {
    output += '🏢 Top Companies Hiring:\n';
    topCompanies.forEach(company => {
      output += `  • ${company.name} (${company.count} ${company.count === 1 ? 'job' : 'jobs'})\n`;
    });
    output += '\n';
  }
  
  // Add common skills
  if (commonSkills && commonSkills.length > 0) {
    output += '🛠️  Common Skills/Technologies:\n';
    output += '  ' + commonSkills.map(skill => skill.name).join(' • ') + '\n';
  }
  
  output += '\n' + '='.repeat(60) + '\n';
  return output;
}

/**
 * Get job listings for a specific query
 * @param {string} jobTitle - Job title to search for
 * @param {string} location - Location (city, state, or country)
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} - Job listings data
 */
async function getJobListings(jobTitle, location, options = {}) {
  try {
    const query = `${jobTitle} in ${location}`;
    const params = {
      query,
      num_pages: 1, // Limit to first page
      ...options
    };

    const result = await jsearch.searchJobs(params);
    
    if (!result.data || result.data.length === 0) {
      throw new Error('No job listings found for the given criteria');
    }

    return result;
  } catch (error) {
    console.error(`❌ Error for ${jobTitle} in ${location}:`);
    console.error(`   ${error.message}`);
    
    if (error.details) {
      console.error('   Details:', JSON.stringify(error.details, null, 2));
    }
  }
}

/**
 * Run all test scenarios
 */
async function runTests() {
  console.log('🚀 Starting JSearch Salary Estimate Tests\n');
  
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Testing: ${scenario.description}`);
    console.log('='.repeat(60));
    
    try {
      const result = await getJobListings(scenario.title, scenario.location, scenario.options);
      
      console.log('✅ Successfully retrieved job listings:');
      console.log(JSON.stringify(result.data, null, 2));
    } catch (error) {
      console.error(`❌ Error for ${scenario.title} in ${scenario.location}:`);
      console.error(`   ${error.message}`);
      
      if (error.details) {
        console.error('   Details:', JSON.stringify(error.details, null, 2));
      }
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
