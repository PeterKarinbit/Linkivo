// Enhanced Research Service using Serper API for active web searches
// Populates Research Deck with real-time career growth information

import SerperService from '../../services/SerperService.js';

/**
 * Search for career growth articles and resources using Serper API
 * @param {Object} options - Search options
 * @param {Array} options.skills - User's skills
 * @param {string} options.targetRole - Target role
 * @param {string} options.industry - Industry
 * @param {number} options.limit - Number of results
 * @param {Array<string>} options.categories - Specific categories to query (optional, uses scheduler if not provided)
 * @returns {Promise<Array>} Array of research items
 */
export async function searchCareerGrowthResources({ skills = [], targetRole = '', industry = '', limit = 10, categories = null }) {
  try {
    // Check if Serper API key is available
    if (!process.env.SERPER_API_KEY) {
      console.warn('[Research] Serper API key not available, falling back to Wikipedia');
      return await fallbackWikipediaSearch({ skills, targetRole, industry, limit });
    }

    const serper = new SerperService(process.env.SERPER_API_KEY);
    const results = [];

    // Use scheduler to determine which categories to query based on day/time
    let queries = [];
    if (categories && categories.length > 0) {
      // Use provided categories (from scheduler)
      const { ResearchScheduler } = await import('./researchScheduler.service.js');
      const scheduler = new ResearchScheduler();
      queries = scheduler.buildQueriesForCategories(
        { skills, targetRole, industry },
        categories
      );
    } else {
      // Default: query all categories (legacy behavior)
      // 1. Career growth and advancement
      if (targetRole) {
        queries.push({
          query: `career growth ${targetRole} advancement tips`,
          category: 'industry',
          sites: 'linkedin.com,indeed.com,glassdoor.com,forbes.com,hbr.org',
          priority: 'high'
        });
      }

      // 2. Skill development
      if (skills.length > 0) {
        const topSkills = skills.slice(0, 3).join(' ');
        queries.push({
          query: `${topSkills} skill development guide 2025`,
          category: 'skills',
          sites: 'coursera.org,udemy.com,skillshare.com,medium.com',
          priority: 'high'
        });
      }

      // 3. Industry insights - use exact industry and target role
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
      }

      // 4. Salary benchmarks - use exact target role and industry
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

      // 5. Interview preparation - use exact target role and industry
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

    // Execute searches in parallel (limit to avoid rate limits)
    const searchPromises = queries.slice(0, 5).map(async ({ query, category, sites }) => {
      try {
        const response = await serper.client.post('/search', {
          q: `${query} site:${sites.split(',')[0]}`,
          num: Math.ceil(limit / queries.length),
          gl: 'us',
          hl: 'en'
        });

        if (response.data?.organic) {
          return response.data.organic.map(item => ({
            title: item.title,
            content: item.snippet || item.description || '',
            url: item.link, // Store full URL for clickable links
            source: extractSource(item.link),
            category: category,
            relevance_tags: [category, 'career_growth', 'external'],
            content_type: 'article',
            last_updated: new Date(),
            source_url: `external://${new URL(item.link).hostname}`,
            // Store query that was used to find this
            search_query: query,
            // Store when this was queried
            queried_at: new Date().toISOString(),
            queried_day: new Date().getDay(), // 0-6 (Sunday-Saturday)
            queried_hour: new Date().getHours() // 0-23
          }));
        }
        return [];
      } catch (error) {
        console.warn(`[Research] Search failed for query "${query}":`, error.message);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    return searchResults.flat().slice(0, limit);

  } catch (error) {
    console.error('[Research] Error in searchCareerGrowthResources:', error);
    return await fallbackWikipediaSearch({ skills, targetRole, industry, limit });
  }
}

/**
 * Fallback to Wikipedia search if Serper is unavailable
 */
async function fallbackWikipediaSearch({ skills, targetRole, industry, limit }) {
  try {
    const { getExternalResearchData } = await import('./research.service.js');
    const query = [targetRole, industry, ...skills.slice(0, 2)].filter(Boolean).join(' ');
    return await getExternalResearchData({ query, limit });
  } catch (error) {
    console.error('[Research] Wikipedia fallback failed:', error);
    return [];
  }
}

/**
 * Extract clean source name from URL
 */
function extractSource(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      'linkedin.com': 'LinkedIn',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'forbes.com': 'Forbes',
      'hbr.org': 'Harvard Business Review',
      'coursera.org': 'Coursera',
      'udemy.com': 'Udemy',
      'medium.com': 'Medium',
      'techcrunch.com': 'TechCrunch',
      'bloomberg.com': 'Bloomberg',
      'payscale.com': 'PayScale',
      'themuse.com': 'The Muse'
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return 'External Source';
  }
}

/**
 * Save research results to KnowledgeBase for Research Deck
 * @param {string} userId - User ID
 * @param {Array} researchItems - Research items to save
 */
export async function saveResearchToKnowledgeBase(userId, researchItems) {
  try {
    const { KnowledgeBase } = await import('../../models/aiCareerCoach.model.js');
    const { default: vectorDB } = await import('./enhancedVectorDatabase.service.js');

    const savedItems = [];
    for (const item of researchItems) {
      try {
        // Generate embedding for the content
        const contentText = `${item.title} ${item.content}`;
        const embedding = await vectorDB.generateEmbedding(contentText);
        
        // Create unique content_id
        const contentId = `kb_${userId}_research_${Buffer.from(item.url).toString('base64').slice(0, 24)}`;

        // Save to KnowledgeBase
        await KnowledgeBase.updateOne(
          { content_id: contentId },
          {
              $set: {
                content_vector: embedding,
                source_url: item.source_url || `external://${new URL(item.url).hostname}`,
                content_type: item.content_type || 'article',
                title: item.title,
                content: item.content,
                relevance_tags: item.relevance_tags || [item.category, 'external'],
                category: item.category || 'industry',
                last_updated: new Date(),
                // Store metadata about when/why this was queried
                url: item.url, // Store URL for clickable links
                source: item.source,
                search_query: item.search_query,
                queried_at: item.queried_at,
                queried_day: item.queried_day,
                queried_hour: item.queried_hour
              }
          },
          { upsert: true }
        );

        savedItems.push(contentId);
      } catch (itemError) {
        console.warn(`[Research] Failed to save item "${item.title}":`, itemError.message);
      }
    }

    console.log(`[Research] Saved ${savedItems.length} research items to KnowledgeBase`);
    return savedItems;
  } catch (error) {
    console.error('[Research] Error saving to KnowledgeBase:', error);
    throw error;
  }
}

