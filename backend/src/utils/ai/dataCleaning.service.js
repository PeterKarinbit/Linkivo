// Clean and normalize text
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n|\r|\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

// Normalize a job object
export function normalizeJob(job) {
  return {
    id: job.id || job._id || '',
    title: job.title || '',
    description: cleanText(job.description || ''),
    salary: job.salary || job.salaryRange || '',
    skills: job.skills || [],
    // Add more normalization as needed
  };
} 