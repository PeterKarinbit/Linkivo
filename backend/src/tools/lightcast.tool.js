import lightcastService from '../services/lightcast/lightcast.service.js';

const jobTaxonomyTool = {
  name: 'job_taxonomy_search',
  description: 'Search for job titles and get detailed job taxonomy information from Lightcast',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Job title or keyword to search for'
      },
      location: {
        type: 'string',
        description: 'Location/region to filter by (e.g., "Kenya", "Nairobi")',
        default: null
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 5
      },
      include_skills: {
        type: 'boolean',
        description: 'Whether to include skills for each job title',
        default: false
      }
    },
    required: ['query']
  },
  execute: async ({ query, location = null, limit = 5, include_skills = false }) => {
    try {
      // Search for job titles
      const jobs = await lightcastService.searchJobTitles({
        q: query,
        limit,
        region: location
      });

      // If skills are requested, fetch them for each job
      if (include_skills && jobs.length > 0) {
        const jobsWithSkills = await Promise.all(
          jobs.map(async (job) => {
            try {
              const skills = await lightcastService.getJobSkills(job.id, { limit: 5 });
              return { ...job, skills };
            } catch (error) {
              console.error(`Error fetching skills for job ${job.id}:`, error);
              return { ...job, skills: [], skills_error: 'Failed to load skills' };
            }
          })
        );
        return { success: true, data: jobsWithSkills };
      }

      return { success: true, data: jobs };
    } catch (error) {
      console.error('Job taxonomy search failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to search job taxonomy',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }
};

export default jobTaxonomyTool;
