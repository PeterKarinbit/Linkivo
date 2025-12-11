import { apiCall } from './apiBase';

/**
 * Market Intelligence Service
 * 
 * Provides methods to fetch market intelligence data from the enhanced AI career coach API.
 * Used primarily in the WelcomeSequence for onboarding to show live market data.
 */
class MarketIntelligenceService {
    constructor() {
        this.baseEndpoint = 'enhanced-ai-career-coach';
    }

    /**
     * Build query string from context object
     * @param {Object} context - Intelligence context with industry, skills, location
     * @returns {string} Query string
     */
    buildQueryString(context = {}) {
        const params = new URLSearchParams();

        if (context.industry) {
            params.append('industry', context.industry);
        }
        if (context.skills && context.skills.length > 0) {
            params.append('skills', context.skills.join(','));
        }
        if (context.location) {
            params.append('location', context.location);
        }

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Fetch market overview data
     * Returns data about hot skills, industry growth, active jobs, etc.
     * 
     * @param {Object} context - Intelligence context
     * @returns {Promise<Object>} Market overview data
     */
    async fetchOverview(context = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('category', 'all');
            queryParams.append('limit', '20');

            if (context.industry) {
                queryParams.append('industry', context.industry);
            }
            if (context.location) {
                queryParams.append('location', context.location);
            }

            const response = await apiCall(
                'get',
                `/${this.baseEndpoint}/market-insights?${queryParams.toString()}`
            );

            // Transform the response to match expected overview structure
            const insights = response?.data || response?.results || {};

            return {
                data: {
                    hot_skills: insights.skills || [],
                    active_jobs: insights.totalJobs || insights.active_jobs || 0,
                    industry_growth: insights.industryGrowth || insights.growth || 'Growing',
                    top_industries: insights.industries || [],
                    salary_trends: insights.salaryTrends || []
                }
            };
        } catch (error) {
            console.warn('[MarketIntelligenceService] fetchOverview error:', error);
            // Return fallback data to prevent UI breaking
            return {
                data: {
                    hot_skills: [],
                    active_jobs: 0,
                    industry_growth: 'Stable',
                    top_industries: [],
                    salary_trends: []
                }
            };
        }
    }

    /**
     * Fetch market summary with salary and alignment data
     * 
     * @param {Object} context - Intelligence context with skills
     * @returns {Promise<Object>} Market summary data
     */
    async fetchSummary(context = {}) {
        try {
            const skills = context.skills || [];
            const queryParams = new URLSearchParams();

            if (skills.length > 0) {
                queryParams.append('skills', skills.join(','));
            }
            if (context.industry) {
                queryParams.append('industry', context.industry);
            }

            const response = await apiCall(
                'get',
                `/${this.baseEndpoint}/skills-demand?${queryParams.toString()}`
            );

            const demandData = response?.data || {};

            // Calculate skills alignment score based on demand data
            let alignmentScore = 50; // Default baseline
            if (demandData.skills && skills.length > 0) {
                const matchedSkills = skills.filter(skill =>
                    demandData.skills.some(s =>
                        s.name?.toLowerCase() === skill.toLowerCase() ||
                        s.skill?.toLowerCase() === skill.toLowerCase()
                    )
                );
                alignmentScore = Math.round((matchedSkills.length / skills.length) * 100);
            }

            return {
                data: {
                    salary_range: demandData.salaryRange || demandData.salary_range || {
                        min: 50000,
                        max: 120000,
                        currency: 'USD'
                    },
                    skills_alignment_score: alignmentScore,
                    top_paying_skills: demandData.topPayingSkills || [],
                    emerging_skills: demandData.emergingSkills || []
                }
            };
        } catch (error) {
            console.warn('[MarketIntelligenceService] fetchSummary error:', error);
            return {
                data: {
                    salary_range: { min: 50000, max: 120000, currency: 'USD' },
                    skills_alignment_score: 50,
                    top_paying_skills: [],
                    emerging_skills: []
                }
            };
        }
    }

    /**
     * Fetch latest market intelligence/trends
     * 
     * @param {Object} context - Intelligence context
     * @returns {Promise<Object>} Latest insights data
     */
    async fetchLatest(context = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('category', 'jobs');
            queryParams.append('limit', '10');

            if (context.industry) {
                queryParams.append('industry', context.industry);
            }
            if (context.location) {
                queryParams.append('location', context.location);
            }

            const response = await apiCall(
                'get',
                `/${this.baseEndpoint}/market-insights?${queryParams.toString()}`
            );

            const insights = response?.data || {};

            // Transform to expected latest insights structure
            const latestInsights = insights.jobs || insights.results || [];

            return {
                data: {
                    latest_insights: latestInsights.slice(0, 5).map((item, idx) => ({
                        id: item.id || `insight-${idx}`,
                        title: item.title || item.name || 'Market Trend',
                        snippet: item.description || item.snippet || '',
                        link: item.link || item.url || null,
                        related_skills: item.skills || item.related_skills || [],
                        source: item.source || 'Market Analysis'
                    })),
                    total_insights: latestInsights.length || 0,
                    last_updated: insights.lastUpdated || new Date().toISOString()
                }
            };
        } catch (error) {
            console.warn('[MarketIntelligenceService] fetchLatest error:', error);
            return {
                data: {
                    latest_insights: [],
                    total_insights: 0,
                    last_updated: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Fetch skills demand data for specific skills
     * 
     * @param {string[]} skills - Array of skill names
     * @returns {Promise<Object>} Skills demand data
     */
    async fetchSkillsDemand(skills = []) {
        try {
            const queryParams = new URLSearchParams();
            if (skills.length > 0) {
                queryParams.append('skills', skills.join(','));
            }

            const response = await apiCall(
                'get',
                `/${this.baseEndpoint}/skills-demand?${queryParams.toString()}`
            );

            return response?.data || {};
        } catch (error) {
            console.warn('[MarketIntelligenceService] fetchSkillsDemand error:', error);
            return {};
        }
    }
}

// Export singleton instance
export const marketIntelligenceService = new MarketIntelligenceService();

export default marketIntelligenceService;
