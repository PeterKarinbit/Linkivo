import { recommendJobs } from './jobRecommendation.service.js';

/**
 * Batch recommend jobs for multiple user profiles
 * @param {Array} userProfiles - Array of user profiles
 * @param {Array} jobs - Array of jobs
 * @returns {Promise<Array>} - Array of { userIndex, recommendations: [ {job, similarity} ] }
 */
export async function batchRecommendJobs(userProfiles, jobs) {
  const results = [];
  for (let i = 0; i < userProfiles.length; i++) {
    const recommendations = await recommendJobs(userProfiles[i], jobs);
    results.push({ userIndex: i, recommendations });
  }
  return results;
} 