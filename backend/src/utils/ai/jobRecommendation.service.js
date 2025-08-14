import { getEmbedding } from './embedding.service.js';
import { cosineSimilarity } from './similarity.service.js';

/**
 * Recommend jobs based on AI similarity to user profile
 * @param {Object} userProfile - { resumeText: string, skills: string[], experience: string }
 * @param {Array} jobs - [{ id, title, description, ... }]
 * @returns {Promise<Array>} - Jobs ranked by similarity
 */
export async function recommendJobs(userProfile, jobs) {
  // Combine resume, skills, and experience into one string
  const profileText = [
    userProfile.resumeText || '',
    (userProfile.skills || []).join(' '),
    userProfile.experience || ''
  ].join(' ');

  // Get embedding for user profile
  const userEmbedding = await getEmbedding(profileText);

  // For each job, get embedding and compute similarity
  const jobSimilarities = await Promise.all(jobs.map(async (job) => {
    const jobText = [job.title, job.description].join(' ');
    const jobEmbedding = await getEmbedding(jobText);
    const similarity = cosineSimilarity(userEmbedding, jobEmbedding);
    return { ...job, similarity };
  }));

  // Sort jobs by similarity descending
  jobSimilarities.sort((a, b) => b.similarity - a.similarity);
  return jobSimilarities;
} 