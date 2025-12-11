import axios from 'axios';
import config from '../../config/jsearch.config.js';

class JSearchService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('JSearch API key is required');
    }
    
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout
      // Headers will be added per request
    });
  }

  /**
   * Search for jobs with optional filters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query (e.g., "software developer in chicago")
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.num_pages=1] - Number of pages to return
   * @param {string} [params.country='us'] - Country code (ISO 3166-1 alpha-2)
   * @param {string} [params.date_posted='all'] - Filter by date posted
   * @param {string} [params.employment_types] - Comma-separated list of employment types
   * @param {string} [params.job_requirements] - Job requirements filter
   * @param {number} [params.radius] - Search radius in km
   * @param {boolean} [params.work_from_home] - Filter for remote jobs
   * @returns {Promise<Object>} - Search results
   */
  async searchJobs(params) {
    try {
      // Add request_id as a query parameter (using the API key as request_id)
      const response = await this.client.get('/search', {
        params: {
          ...config.defaultParams,
          ...params,
          request_id: this.apiKey  // Use the API key as request_id
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      this._handleError(error, 'searchJobs');
    }
  }

  /**
   * Get salary estimates for a job title in a specific location
   * @param {string} jobTitle - Job title to search for
   * @param {string} location - Location (city, state, or country)
   * @param {Object} [options] - Additional options
   * @param {string} [options.experienceLevel] - Experience level (e.g., 'entry', 'mid', 'senior')
   * @param {number} [options.radius] - Search radius in km
   * @returns {Promise<Object>} - Salary estimate data
   */
  async getSalaryEstimate(jobTitle, location, options = {}) {
    try {
      // First, search for jobs to get salary data
      const query = `${jobTitle} in ${location}`;
      const params = {
        query,
        num_pages: 1, // Limit to first page for estimation
        ...options
      };

      const result = await this.searchJobs(params);
      
      if (!result.data || result.data.length === 0) {
        throw new Error('No job listings found for the given criteria');
      }

      // Extract and analyze salary data
      return this._analyzeSalaryData(result.data, jobTitle, location);
    } catch (error) {
      this._handleError(error, 'getSalaryEstimate');
    }
  }

  /**
   * Analyze salary data from job listings
   * @private
   */
  _analyzeSalaryData(jobs, jobTitle, location) {
    const jobsWithSalary = jobs.filter(job => 
      job.job_min_salary !== null && job.job_max_salary !== null
    );

    if (jobsWithSalary.length === 0) {
      return {
        jobTitle,
        location,
        message: 'No salary data available for the specified job and location',
        count: 0
      };
    }

    // Calculate average salary range
    const totalMin = jobsWithSalary.reduce((sum, job) => sum + (job.job_min_salary || 0), 0);
    const totalMax = jobsWithSalary.reduce((sum, job) => sum + (job.job_max_salary || 0), 0);
    const avgMin = Math.round(totalMin / jobsWithSalary.length);
    const avgMax = Math.round(totalMax / jobsWithSalary.length);

    // Get salary periods (assuming all jobs use the same period)
    const period = jobsWithSalary[0].job_salary_period || 'YEAR';

    // Get currency (assuming USD for now)
    const currency = 'USD';

    // Get job level distribution
    const levelDistribution = this._getJobLevelDistribution(jobs);

    // Get top companies hiring for this role
    const topCompanies = this._getTopCompanies(jobs);

    // Get skills mentioned in job descriptions
    const commonSkills = this._extractCommonSkills(jobs);

    return {
      jobTitle,
      location,
      salary: {
        min: avgMin,
        max: avgMax,
        currency,
        period,
        formatted: this._formatSalaryRange(avgMin, avgMax, currency, period)
      },
      stats: {
        totalJobs: jobs.length,
        jobsWithSalary: jobsWithSalary.length,
        salaryConfidence: this._calculateConfidenceScore(jobsWithSalary.length, jobs.length)
      },
      levelDistribution,
      topCompanies: topCompanies.slice(0, 5),
      commonSkills: commonSkills.slice(0, 10),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate confidence score based on data points
   * @private
   */
  _calculateConfidenceScore(withSalary, total) {
    if (total === 0) return 0;
    
    const ratio = withSalary / total;
    // Higher confidence with more data points
    const dataPointsFactor = Math.min(1, Math.log10(withSalary + 1) / 2);
    
    return Math.round((ratio * 0.7 + dataPointsFactor * 0.3) * 100);
  }

  /**
   * Extract job level from title and description
   * @private
   */
  _getJobLevelDistribution(jobs) {
    const levels = {
      entry: { count: 0, keywords: ['junior', 'entry', 'associate', 'i ', ' 1', '0-2', '0-3'] },
      mid: { count: 0, keywords: ['mid', 'ii', '2-5', '3-5', 'intermediate'] },
      senior: { count: 0, keywords: ['senior', 'lead', 'iii', '3+', '5+', 'principal', 'architect'] },
      executive: { count: 0, keywords: ['director', 'vp', 'cto', 'cio', 'head of', 'manager'] }
    };

    jobs.forEach(job => {
      const text = `${job.job_title || ''} ${job.job_description || ''}`.toLowerCase();
      let matched = false;

      for (const [level, data] of Object.entries(levels)) {
        if (data.keywords.some(keyword => text.includes(keyword))) {
          levels[level].count++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Default to mid-level if no level indicators found
        levels.mid.count++;
      }
    });

    return Object.entries(levels).reduce((acc, [level, data]) => {
      acc[level] = {
        count: data.count,
        percentage: Math.round((data.count / jobs.length) * 100) || 0
      };
      return acc;
    }, {});
  }

  /**
   * Get top companies hiring for this role
   * @private
   */
  _getTopCompanies(jobs) {
    const companyMap = new Map();
    
    jobs.forEach(job => {
      const company = job.employer_name;
      if (!company) return;
      
      const count = companyMap.get(company) || 0;
      companyMap.set(company, count + 1);
    });

    return Array.from(companyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Extract common skills from job descriptions
   * @private
   */
  _extractCommonSkills(jobs) {
    const skills = new Map();
    const commonSkills = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'TypeScript', 'Ruby', 'Swift', 'Go',
      'Rust', 'Kotlin', 'Scala', 'Dart', 'R', 'Objective-C', 'Perl', 'Haskell', 'Elixir', 'Clojure',
      
      // Web Technologies
      'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'Ruby on Rails', 'ASP.NET', 'Laravel', 'Symfony', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'SASS',
      'GraphQL', 'REST API', 'WebSocket', 'WebRTC',
      
      // Databases
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'SQLite', 'DynamoDB',
      'Cassandra', 'Elasticsearch', 'Firebase', 'Neo4j', 'CouchDB', 'MariaDB',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins',
      'GitHub Actions', 'GitLab CI', 'CI/CD', 'Microservices', 'Serverless', 'Lambda', 'S3', 'EC2',
      'Kubernetes', 'Docker Swarm', 'Helm', 'Prometheus', 'Grafana', 'ELK Stack', 'Splunk',
      
      // Mobile
      'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Xamarin', 'Ionic',
      
      // Other Technologies
      'Git', 'Linux', 'Agile', 'Scrum', 'TDD', 'DDD', 'Microservices', 'Blockchain', 'AI', 'ML',
      'Machine Learning', 'Data Science', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'RabbitMQ',
      'Apache Kafka', 'Apache Spark', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP',
      'Cybersecurity', 'Blockchain', 'IoT', 'AR/VR', 'Unity', 'Unreal Engine'
    ];

    jobs.forEach(job => {
      const text = `${job.job_title || ''} ${job.job_description || ''}`.toLowerCase();
      
      commonSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        // Match whole word to avoid partial matches
        if (text.includes(skillLower) || 
            text.includes(skillLower + ' ') || 
            text.includes(' ' + skillLower) ||
            text.includes(skillLower + ',') ||
            text.includes(skillLower + '.')) {
          const count = skills.get(skill) || 0;
          skills.set(skill, count + 1);
        }
      });
    });

    return Array.from(skills.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Format salary range for display
   * @private
   */
  _formatSalaryRange(min, max, currency, period) {
    const formatOptions = { 
      style: 'currency', 
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    };

    const formatter = new Intl.NumberFormat('en-US', formatOptions);
    
    let periodText = '';
    switch ((period || '').toUpperCase()) {
      case 'HOUR':
        periodText = 'per hour';
        break;
      case 'MONTH':
        periodText = 'per month';
        break;
      case 'YEAR':
      default:
        periodText = 'per year';
    }

    return `${formatter.format(min)} - ${formatter.format(max)} ${periodText}`;
  }

  /**
   * Handle API errors
   * @private
   */
  _handleError(error, context = '') {
    console.error(`JSearch API Error (${context}):`, error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, statusText, data } = error.response;
      const errorMessage = data?.message || statusText || 'Unknown error';
      
      const err = new Error(`JSearch API Error: ${status} - ${errorMessage}`);
      err.status = status;
      err.details = data;
      
      throw err;
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from JSearch API');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

export default JSearchService;
