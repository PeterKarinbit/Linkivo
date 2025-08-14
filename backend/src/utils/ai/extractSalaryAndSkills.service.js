// Extract salary using regex (USD, K, per year/month, etc.)
export function extractSalary(text) {
  if (!text) return null;
  // Example regex for salary patterns
  const salaryRegex = /(\$|USD)?\s?([0-9]{2,3}(?:[,.][0-9]{3})*)(k|K)?\s?(per\s?(year|month|hr|hour))?/gi;
  const matches = [...text.matchAll(salaryRegex)];
  if (!matches.length) return null;
  // Return all found salaries as strings
  return matches.map(m => m[0]);
}

// Extract skills using a keyword list
const SKILL_KEYWORDS = [
  "javascript", "python", "java", "react", "node.js", "express", "mongodb", "sql", "css", "html", "aws", "docker", "kubernetes", "typescript", "c++", "c#", "git", "linux", "machine learning", "data analysis", "communication", "leadership", "project management", "agile", "scrum", "cloud", "devops", "rest api", "graphql", "nosql", "pandas", "numpy", "tensorflow", "pytorch", "excel", "powerpoint", "presentation", "problem solving"
];

export function extractSkills(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => lower.includes(skill));
} 