import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import EnhancedVectorDatabaseService from './enhancedVectorDatabase.service.js';

class MarketIntelligenceService {
  constructor() {
    this.sources = {
      linkedin: {
        baseUrl: 'https://www.linkedin.com/jobs/api/job-search',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      indeed: {
        baseUrl: 'https://www.indeed.com/jobs',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      glassdoor: {
        baseUrl: 'https://www.glassdoor.com/Job',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      github: {
        baseUrl: 'https://jobs.github.com/positions.json',
        headers: {
          'Accept': 'application/json'
        }
      },
      stackoverflow: {
        baseUrl: 'https://stackoverflow.com/jobs/feed',
        headers: {
          'Accept': 'application/rss+xml'
        }
      }
    };

    this.skillsKeywords = [
      'javascript', 'python', 'react', 'node.js', 'java', 'c++', 'c#', 'php',
      'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'angular', 'vue',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
      'machine learning', 'ai', 'data science', 'blockchain', 'devops',
      'microservices', 'api', 'rest', 'graphql', 'sql', 'nosql', 'mongodb',
      'postgresql', 'redis', 'elasticsearch', 'kafka', 'rabbitmq'
    ];

    this.industries = [
      'technology', 'finance', 'healthcare', 'e-commerce', 'education',
      'manufacturing', 'retail', 'automotive', 'aerospace', 'energy',
      'telecommunications', 'media', 'gaming', 'consulting', 'startup'
    ];

    // Start scheduled scraping
    this.startScheduledScraping();
  }

  // ==================== SCHEDULED SCRAPING ====================
  startScheduledScraping() {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Starting scheduled market intelligence scraping...');
      await this.runFullMarketAnalysis();
    });

    // Run skills demand analysis daily
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting skills demand analysis...');
      await this.analyzeSkillsDemand();
    });

    console.log('Market intelligence scraping scheduled');
  }

  // ==================== FULL MARKET ANALYSIS ====================
  async runFullMarketAnalysis() {
    try {
      const results = {
        jobPostings: await this.scrapeJobPostings(),
        salaryData: await this.scrapeSalaryData(),
        industryTrends: await this.analyzeIndustryTrends(),
        skillsDemand: await this.analyzeSkillsDemand(),
        remoteWorkTrends: await this.analyzeRemoteWorkTrends()
      };

      // Store all data in vector database
      await this.storeMarketData(results);

      console.log('Market analysis completed successfully');
      return results;
    } catch (error) {
      console.error('Market analysis error:', error);
    }
  }

  // ==================== JOB POSTINGS SCRAPING ====================
  async scrapeJobPostings() {
    const jobPostings = [];

    try {
      // Scrape from multiple sources
      const sources = [
        this.scrapeLinkedInJobs(),
        this.scrapeIndeedJobs(),
        this.scrapeGitHubJobs(),
        this.scrapeStackOverflowJobs()
      ];

      const results = await Promise.allSettled(sources);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          jobPostings.push(...result.value);
        } else {
          console.error(`Job scraping failed for source ${index}:`, result.reason);
        }
      });

      return jobPostings;
    } catch (error) {
      console.error('Job postings scraping error:', error);
      return [];
    }
  }

  async scrapeLinkedInJobs() {
    try {
      // Note: LinkedIn requires authentication and has rate limits
      // This is a simplified example - in production, use their official API
      const response = await axios.get(this.sources.linkedin.baseUrl, {
        headers: this.sources.linkedin.headers,
        params: {
          keywords: 'software engineer',
          location: 'United States',
          start: 0,
          count: 25
        }
      });

      // Parse LinkedIn job data (simplified)
      const jobs = response.data?.elements || [];

      return jobs.map(job => ({
        title: job.title,
        company: job.companyName,
        location: job.location,
        description: job.description,
        skills: this.extractSkillsFromText(job.description),
        salary: job.salaryInfo,
        postedDate: job.postedDate,
        source: 'linkedin',
        url: job.jobUrl
      }));
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return [];
    }
  }

  async scrapeIndeedJobs() {
    try {
      const response = await axios.get(this.sources.indeed.baseUrl, {
        headers: this.sources.indeed.headers,
        params: {
          q: 'software engineer',
          l: 'United States',
          start: 0
        }
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      $('.jobsearch-SerpJobCard').each((index, element) => {
        const title = $(element).find('.title a').text().trim();
        const company = $(element).find('.company').text().trim();
        const location = $(element).find('.location').text().trim();
        const description = $(element).find('.summary').text().trim();
        const salary = $(element).find('.salaryText').text().trim();

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            description,
            skills: this.extractSkillsFromText(description),
            salary,
            source: 'indeed',
            url: $(element).find('.title a').attr('href')
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('Indeed scraping error:', error);
      return [];
    }
  }

  async scrapeGitHubJobs() {
    try {
      const response = await axios.get(this.sources.github.baseUrl, {
        headers: this.sources.github.headers
      });

      return response.data.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        skills: this.extractSkillsFromText(job.description),
        salary: null,
        postedDate: job.created_at,
        source: 'github',
        url: job.url
      }));
    } catch (error) {
      console.error('GitHub jobs scraping error:', error);
      return [];
    }
  }

  async scrapeStackOverflowJobs() {
    try {
      const response = await axios.get(this.sources.stackoverflow.baseUrl, {
        headers: this.sources.stackoverflow.headers
      });

      // Parse RSS feed
      const $ = cheerio.load(response.data, { xmlMode: true });
      const jobs = [];

      $('item').each((index, element) => {
        const title = $(element).find('title').text();
        const description = $(element).find('description').text();
        const company = $(element).find('a10\\:name, name').text();
        const location = $(element).find('location').text();

        jobs.push({
          title,
          company,
          location,
          description,
          skills: this.extractSkillsFromText(description),
          source: 'stackoverflow',
          url: $(element).find('link').text()
        });
      });

      return jobs;
    } catch (error) {
      console.error('Stack Overflow scraping error:', error);
      return [];
    }
  }

  // ==================== SALARY DATA SCRAPING ====================
  async scrapeSalaryData() {
    try {
      // Scrape from Glassdoor salary data
      const salaryData = await this.scrapeGlassdoorSalaries();

      // Add data from other sources
      const additionalData = await this.getSalaryDataFromAPIs();

      return [...salaryData, ...additionalData];
    } catch (error) {
      console.error('Salary data scraping error:', error);
      return [];
    }
  }

  async scrapeGlassdoorSalaries() {
    try {
      // This is a simplified example - Glassdoor has anti-scraping measures
      const response = await axios.get('https://www.glassdoor.com/Salaries/index.htm', {
        headers: this.sources.glassdoor.headers
      });

      const $ = cheerio.load(response.data);
      const salaries = [];

      $('.salary-item').each((index, element) => {
        const role = $(element).find('.salary-role').text().trim();
        const salary = $(element).find('.salary-amount').text().trim();
        const location = $(element).find('.salary-location').text().trim();

        if (role && salary) {
          salaries.push({
            role,
            salary,
            location,
            source: 'glassdoor'
          });
        }
      });

      return salaries;
    } catch (error) {
      console.error('Glassdoor salary scraping error:', error);
      return [];
    }
  }

  async getSalaryDataFromAPIs() {
    // In production, integrate with salary APIs like:
    // - Payscale API
    // - Salary.com API
    // - Bureau of Labor Statistics API

    return [
      {
        role: 'Software Engineer',
        salary: '$95,000 - $150,000',
        location: 'United States',
        source: 'api'
      },
      {
        role: 'Data Scientist',
        salary: '$100,000 - $160,000',
        location: 'United States',
        source: 'api'
      }
    ];
  }

  // ==================== SKILLS DEMAND ANALYSIS ====================
  async analyzeSkillsDemand() {
    try {
      const jobPostings = await this.scrapeJobPostings();
      const skillsDemand = {};

      // Count skill mentions across all job postings
      jobPostings.forEach(job => {
        job.skills.forEach(skill => {
          const normalizedSkill = skill.toLowerCase();
          skillsDemand[normalizedSkill] = (skillsDemand[normalizedSkill] || 0) + 1;
        });
      });

      // Calculate percentages
      const totalJobs = jobPostings.length;
      const skillsPercentage = {};

      Object.entries(skillsDemand).forEach(([skill, count]) => {
        skillsPercentage[skill] = Math.round((count / totalJobs) * 100);
      });

      // Sort by demand
      const sortedSkills = Object.entries(skillsPercentage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 50);

      return {
        skills_demand: Object.fromEntries(sortedSkills),
        total_jobs_analyzed: totalJobs,
        analysis_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Skills demand analysis error:', error);
      return {};
    }
  }

  // ==================== INDUSTRY TRENDS ANALYSIS ====================
  async analyzeIndustryTrends() {
    try {
      const jobPostings = await this.scrapeJobPostings();
      const industryData = {};

      // Analyze job postings by industry
      jobPostings.forEach(job => {
        const industry = this.categorizeJobByIndustry(job);
        if (industry) {
          industryData[industry] = (industryData[industry] || 0) + 1;
        }
      });

      // Calculate trends
      const totalJobs = jobPostings.length;
      const industryTrends = {};

      Object.entries(industryData).forEach(([industry, count]) => {
        industryTrends[industry] = {
          job_count: count,
          percentage: Math.round((count / totalJobs) * 100),
          growth_trend: this.calculateGrowthTrend(industry, count)
        };
      });

      return industryTrends;
    } catch (error) {
      console.error('Industry trends analysis error:', error);
      return {};
    }
  }

  // ==================== REMOTE WORK TRENDS ====================
  async analyzeRemoteWorkTrends() {
    try {
      const jobPostings = await this.scrapeJobPostings();
      const remoteWorkData = {
        remote_jobs: 0,
        hybrid_jobs: 0,
        on_site_jobs: 0,
        total_jobs: jobPostings.length
      };

      jobPostings.forEach(job => {
        const workType = this.categorizeWorkType(job);
        if (workType === 'remote') remoteWorkData.remote_jobs++;
        else if (workType === 'hybrid') remoteWorkData.hybrid_jobs++;
        else remoteWorkData.on_site_jobs++;
      });

      // Calculate percentages
      remoteWorkData.remote_percentage = Math.round(
        (remoteWorkData.remote_jobs / remoteWorkData.total_jobs) * 100
      );
      remoteWorkData.hybrid_percentage = Math.round(
        (remoteWorkData.hybrid_jobs / remoteWorkData.total_jobs) * 100
      );
      remoteWorkData.on_site_percentage = Math.round(
        (remoteWorkData.on_site_jobs / remoteWorkData.total_jobs) * 100
      );

      return remoteWorkData;
    } catch (error) {
      console.error('Remote work trends analysis error:', error);
      return {};
    }
  }

  // ==================== UTILITY METHODS ====================
  extractSkillsFromText(text) {
    if (!text) return [];

    const skills = [];
    const textLower = text.toLowerCase();

    this.skillsKeywords.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  categorizeJobByIndustry(job) {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const company = job.company?.toLowerCase() || '';

    const text = `${title} ${description} ${company}`;

    for (const industry of this.industries) {
      if (text.includes(industry)) {
        return industry;
      }
    }

    return 'technology'; // Default to technology
  }

  categorizeWorkType(job) {
    const text = `${job.title} ${job.description} ${job.location}`.toLowerCase();

    if (text.includes('remote') || text.includes('work from home')) {
      return 'remote';
    } else if (text.includes('hybrid') || text.includes('flexible')) {
      return 'hybrid';
    } else {
      return 'on_site';
    }
  }

  calculateGrowthTrend(industry, currentCount) {
    // This would compare with historical data
    // For now, return a mock trend
    return Math.random() > 0.5 ? 'growing' : 'stable';
  }

  // ==================== DATA STORAGE ====================
  async storeMarketData(marketData) {
    try {
      const {
        jobPostings,
        salaryData,
        industryTrends,
        skillsDemand,
        remoteWorkTrends
      } = marketData;

      // Store job postings
      for (const job of jobPostings) {
        await EnhancedVectorDatabaseService.vectorizeMarketData({
          source: job.source,
          content: `${job.title} at ${job.company} - ${job.description}`,
          category: 'job_posting',
          skills_demand: job.skills.reduce((acc, skill) => {
            acc[skill] = 1;
            return acc;
          }, {}),
          job_trends: {
            industry: this.categorizeJobByIndustry(job),
            work_type: this.categorizeWorkType(job)
          },
          salary_data: job.salary ? { [job.title]: job.salary } : {}
        });
      }

      // Store salary data
      for (const salary of salaryData) {
        await EnhancedVectorDatabaseService.vectorizeMarketData({
          source: salary.source,
          content: `Salary data for ${salary.role} in ${salary.location}`,
          category: 'salary_data',
          salary_data: { [salary.role]: salary.salary }
        });
      }

      // Store industry trends
      await EnhancedVectorDatabaseService.vectorizeMarketData({
        source: 'analysis',
        content: 'Industry trends analysis',
        category: 'industry_trends',
        job_trends: industryTrends
      });

      // Store skills demand
      await EnhancedVectorDatabaseService.vectorizeMarketData({
        source: 'analysis',
        content: 'Skills demand analysis',
        category: 'skills_demand',
        skills_demand: skillsDemand.skills_demand || {}
      });

      // Store remote work trends
      await EnhancedVectorDatabaseService.vectorizeMarketData({
        source: 'analysis',
        content: 'Remote work trends analysis',
        category: 'remote_work_trends',
        job_trends: remoteWorkTrends
      });

      console.log('Market data stored successfully');
    } catch (error) {
      console.error('Store market data error:', error);
    }
  }

  // ==================== API ENDPOINTS ====================
  async getMarketInsights(category = 'all', limit = 10) {
    try {
      const results = await EnhancedVectorDatabaseService.searchSimilarContent(
        category,
        'market_intelligence',
        null,
        limit
      );
      // Construct highlights for frontend display (title/value pairs)
      const highlights = [];
      const top = results?.results?.slice(0, 3) || [];
      top.forEach((r, idx) => {
        const meta = results?.metadatas?.[idx] || {};
        if (meta?.skills_demand && Object.keys(meta.skills_demand).length > 0) {
          const topSkill = Object.entries(meta.skills_demand).sort((a, b) => b[1] - a[1])[0];
          if (topSkill) highlights.push({ title: 'Top Skill', value: `${topSkill[0]} · ${topSkill[1]}%` });
        } else if (meta?.job_trends && meta.job_trends.industry) {
          const industries = Object.entries(meta.job_trends).slice(0, 1).map(([k, v]) => k).join(', ');
          highlights.push({ title: 'Industry Trend', value: industries || 'Trending' });
        } else if (typeof r === 'string') {
          highlights.push({ title: 'Insight', value: r.slice(0, 80) + (r.length > 80 ? '…' : '') });
        }
      });

      return { ...results, highlights };
    } catch (error) {
      console.error('Get market insights error:', error);
      return { results: [], metadatas: [], distances: [] };
    }
  }

  async getSkillsDemand(skills = []) {
    try {
      const query = skills.length > 0 ? skills.join(' ') : 'skills demand';

      const results = await EnhancedVectorDatabaseService.searchSimilarContent(
        query,
        'market_intelligence',
        null,
        20
      );

      return results;
    } catch (error) {
      console.error('Get skills demand error:', error);
      return { results: [], metadatas: [], distances: [] };
    }
  }
}

export default new MarketIntelligenceService();
