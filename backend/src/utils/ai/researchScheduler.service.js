// Research Scheduler Service
// Schedules different research queries for different days/times to keep Research Deck fresh

/**
 * Determines which research categories to query based on day of week and time
 * This ensures variety and relevance in the Research Deck
 */
export class ResearchScheduler {
  constructor() {
    // Schedule configuration: day of week (0=Sunday, 6=Saturday) -> categories to query
    this.schedule = {
      0: ['industry', 'salary'], // Sunday: Industry insights and salary data
      1: ['skills', 'interview'], // Monday: Skill development and interview prep
      2: ['industry', 'skills'], // Tuesday: Industry trends and skills
      3: ['interview', 'salary'], // Wednesday: Interview prep and salary benchmarks
      4: ['industry', 'interview'], // Thursday: Industry insights and interview tips
      5: ['skills', 'salary'], // Friday: Skill development and salary data
      6: ['industry', 'skills', 'interview'] // Saturday: All categories (weekend catch-up)
    };

    // Time-based priorities (hour of day)
    this.timePriorities = {
      morning: [6, 7, 8, 9, 10, 11], // 6 AM - 11 AM: Focus on career growth and industry
      afternoon: [12, 13, 14, 15, 16, 17], // 12 PM - 5 PM: Skills and interview prep
      evening: [18, 19, 20, 21, 22, 23] // 6 PM - 11 PM: Salary data and general insights
    };
  }

  /**
   * Get categories to query based on current day and time
   * @param {Date} date - Optional date (defaults to now)
   * @returns {Array<string>} Categories to query
   */
  getCategoriesForToday(date = new Date()) {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Get base categories for the day
    const dayCategories = this.schedule[dayOfWeek] || ['industry', 'skills'];
    
    // Adjust based on time of day
    let categories = [...dayCategories];
    
    if (this.timePriorities.morning.includes(hour)) {
      // Morning: Add industry if not present
      if (!categories.includes('industry')) {
        categories.unshift('industry');
      }
    } else if (this.timePriorities.afternoon.includes(hour)) {
      // Afternoon: Prioritize skills and interview
      if (!categories.includes('skills')) {
        categories.unshift('skills');
      }
      if (!categories.includes('interview')) {
        categories.push('interview');
      }
    } else if (this.timePriorities.evening.includes(hour)) {
      // Evening: Add salary data
      if (!categories.includes('salary')) {
        categories.push('salary');
      }
    }
    
    // Limit to 3 categories per query to avoid rate limits
    return categories.slice(0, 3);
  }

  /**
   * Build search queries for specific categories
   * @param {Object} userProfile - User profile data
   * @param {Array<string>} categories - Categories to query
   * @returns {Array<Object>} Search query objects
   */
  buildQueriesForCategories(userProfile, categories) {
    const { skills = [], targetRole = '', industry = '' } = userProfile;
    const queries = [];

    if (categories.includes('industry')) {
      // Use exact industry and target role for precise queries
      if (industry && targetRole) {
        queries.push({
          query: `${industry} industry ${targetRole} career growth trends 2025`,
          category: 'industry',
          sites: 'forbes.com,hbr.org,techcrunch.com,bloomberg.com',
          priority: 'high'
        });
      } else if (industry) {
        queries.push({
          query: `${industry} industry trends 2025 career opportunities`,
          category: 'industry',
          sites: 'forbes.com,hbr.org,techcrunch.com,bloomberg.com',
          priority: 'high'
        });
      } else if (targetRole) {
        queries.push({
          query: `career growth ${targetRole} advancement tips`,
          category: 'industry',
          sites: 'linkedin.com,indeed.com,glassdoor.com',
          priority: 'medium'
        });
      }
    }

    if (categories.includes('skills')) {
      if (skills.length > 0) {
        const topSkills = skills.slice(0, 3).join(' ');
        queries.push({
          query: `${topSkills} skill development guide 2025`,
          category: 'skills',
          sites: 'coursera.org,udemy.com,skillshare.com,medium.com',
          priority: 'high'
        });
      }
    }

    if (categories.includes('salary')) {
      // Use exact target role and industry for salary queries
      if (targetRole && industry) {
        queries.push({
          query: `${targetRole} ${industry} salary range 2025`,
          category: 'salary',
          sites: 'glassdoor.com,payscale.com,indeed.com',
          priority: 'high'
        });
      } else if (targetRole) {
        queries.push({
          query: `${targetRole} salary range 2025`,
          category: 'salary',
          sites: 'glassdoor.com,payscale.com,indeed.com',
          priority: 'medium'
        });
      }
    }

    if (categories.includes('interview')) {
      // Use exact target role and industry for interview prep
      if (targetRole && industry) {
        queries.push({
          query: `${targetRole} ${industry} interview questions tips`,
          category: 'interview',
          sites: 'indeed.com,linkedin.com,themuse.com',
          priority: 'high'
        });
      } else if (targetRole) {
        queries.push({
          query: `${targetRole} interview questions tips`,
          category: 'interview',
          sites: 'indeed.com,linkedin.com,themuse.com',
          priority: 'high'
        });
      }
    }

    return queries;
  }

  /**
   * Check if research should be refreshed based on last update
   * @param {Date} lastUpdate - Last update timestamp
   * @param {number} hoursThreshold - Hours before next refresh (default: 24)
   * @returns {boolean} Whether to refresh
   */
  shouldRefresh(lastUpdate, hoursThreshold = 24) {
    if (!lastUpdate) return true;
    
    const now = new Date();
    const hoursSinceUpdate = (now - new Date(lastUpdate)) / (1000 * 60 * 60);
    return hoursSinceUpdate >= hoursThreshold;
  }

  /**
   * Get next scheduled refresh time
   * @param {Date} lastUpdate - Last update timestamp
   * @returns {Date} Next refresh time
   */
  getNextRefreshTime(lastUpdate) {
    const now = new Date();
    const nextRefresh = new Date(now);
    
    // Schedule for next day at 6 AM
    nextRefresh.setDate(nextRefresh.getDate() + 1);
    nextRefresh.setHours(6, 0, 0, 0);
    
    return nextRefresh;
  }
}

export default ResearchScheduler;

