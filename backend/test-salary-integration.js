import axios from 'axios';
import { getAuthToken } from './src/services/lightcast/auth.service.js';

// Create an axios instance with the base URL for the Compensation API
const compensationApi = axios.create({
  baseURL: 'https://comp.emsicloud.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token
compensationApi.interceptors.request.use(async (config) => {
  // Use emsiauth scope for Compensation API
  const token = await getAuthToken('emsiauth');
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Test scenarios for different job entries
const testScenarios = [
  {
    name: 'Software Developer Entry',
    content: `I'm a senior software developer with 5 years of experience in JavaScript and React. 
             I'm considering a job change and want to know the salary range for my role in Seattle.`,
    expected: {
      title: 'Software Developer',
      msa: '42660', // Seattle MSA
      experience: 5
    }
  },
  {
    name: 'Data Scientist Entry',
    content: `I recently completed my Master's in Data Science and have 1 year of internship experience.
             What's the typical salary for entry-level data scientists in New York?`,
    expected: {
      title: 'Data Scientist',
      msa: '35620', // New York MSA
      experience: 1
    }
  },
  {
    name: 'Product Manager Entry',
    content: `I have 8 years of experience in product management, with expertise in agile methodologies.
             I'm curious about the salary range for senior product managers in Austin.`,
    expected: {
      title: 'Product Manager',
      msa: '12420', // Austin MSA
      experience: 8
    }
  },
  {
    name: 'UX Designer Entry',
    content: `I'm a UX designer with 3 years of experience. 
             I'm considering relocating to Chicago and want to understand the salary expectations.`,
    expected: {
      title: 'UX Designer',
      msa: '16980', // Chicago MSA
      experience: 3
    }
  }
];

async function testSalaryIntegration() {
  console.log('🚀 Starting Lightcast Salary API Integration Tests\n');
  
  // First, test authentication
  try {
    console.log('🔐 Testing authentication...');
    const token = await getAuthToken('emsi_open');
    console.log('✅ Authentication successful!\n');
    console.log('Token:', token.substring(0, 20) + '...'); // Log first 20 chars of token
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  // Test each scenario
  for (const scenario of testScenarios) {
    console.log(`\n📊 Testing Scenario: ${scenario.name}`);
    console.log('-' .repeat(50));
    
    try {
      console.log(`\n💰 Getting salary estimate for ${scenario.expected.title} in MSA ${scenario.expected.msa}...`);
      
      // Use the estimate endpoint directly with the job title
      const response = await compensationApi.post('/estimate', {
        keyword: scenario.expected.title,
        msa: scenario.expected.msa,
        experiences: [scenario.expected.experience]
      });
      
      const estimate = response.data;
      
      // Display results
      console.log('\n📈 Salary Estimate Results:');
      console.log('-' .repeat(30));
      
      if (estimate.regional_estimate) {
        console.log(`💼 Title: ${scenario.expected.title}`);
        console.log(`🌎 Location: MSA ${scenario.expected.msa}`);
        console.log(`👨‍💻 Experience: ${scenario.expected.experience} years`);
        
        // Display salary percentiles if available
        if (estimate.regional_estimate.percentiles) {
          console.log('\n💵 Salary Percentiles:');
          estimate.regional_estimate.percentiles.forEach(p => {
            console.log(`  ${p.percentile}%: $${p.annual_salary.toLocaleString()}/year ($${p.hourly_salary.toFixed(2)}/hour)`);
          });
        }
        
        // Display national comparison if available
        if (estimate.national_estimate?.percentiles) {
          const natMedian = estimate.national_estimate.percentiles.find(p => p.percentile === 50);
          const regMedian = estimate.regional_estimate.percentiles.find(p => p.percentile === 50);
          if (natMedian && regMedian) {
            const diff = ((regMedian.annual_salary / natMedian.annual_salary - 1) * 100).toFixed(1);
            console.log(`\n🌐 National Median: $${natMedian.annual_salary.toLocaleString()}/year`);
            console.log(`🏙️  Local vs National: ${diff}% ${parseFloat(diff) > 0 ? 'higher' : 'lower'}`);
          }
        }
      } else {
        console.log('No experience-specific data found, showing overall estimates:');
        console.log(JSON.stringify(estimate, null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error.message);
      if (error.details) {
        console.error('Error details:', JSON.stringify(error.details, null, 2));
      }
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
  }
  
  console.log('🏁 All tests completed!');
  process.exit(0);
}

testSalaryIntegration().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
