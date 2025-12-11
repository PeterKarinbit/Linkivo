import SerperService from './SerperService.js';

/**
 * Lightweight helper to estimate time-to-competency for skills using Serper.
 * Returns conservative min/median/max hour ranges plus evidence snippets.
 * Falls back to heuristics when web data is thin.
 */
export class SkillEffortService {
  constructor(apiKey) {
    this.serper = new SerperService(apiKey);
    this.cache = new Map(); // skill -> { min, median, max, snippets }
  }

  /**
   * Get effort estimates for a list of skills.
   * @param {string[]} skills
   * @returns {Promise<Array<{skill, min, median, max, snippets}>>}
   */
  async getEffortEstimates(skills = []) {
    const unique = Array.from(new Set((skills || []).filter(Boolean))).slice(0, 10);
    const results = [];

    for (const skill of unique) {
      try {
        const estimate = await this._getEffortForSkill(skill);
        results.push({ skill, ...estimate });
      } catch (error) {
        console.warn('[SkillEffortService] fallback for skill', skill, error?.message || error);
        results.push({ skill, ...this._fallbackEstimate(skill) });
      }
    }

    return results;
  }

  async _getEffortForSkill(skill) {
    if (this.cache.has(skill)) return this.cache.get(skill);

    const queries = [
      `how long to learn ${skill} to intermediate hours`,
      `${skill} course duration hours`,
      `${skill} time to become job ready`
    ];

    const numbers = [];
    const snippets = [];

    for (const q of queries) {
      try {
        const hits = await this.serper.searchLearningResources(q, { limit: 5, type: 'guide' });
        hits.forEach(hit => {
          if (hit?.snippet) {
            const parsed = this._extractHours(hit.snippet);
            numbers.push(...parsed);
            snippets.push(hit.snippet.slice(0, 200));
          }
        });
      } catch (e) {
        // ignore individual query errors
      }
    }

    const estimate = numbers.length > 0
      ? this._buildEstimateFromNumbers(numbers, snippets)
      : this._fallbackEstimate(skill, snippets);

    this.cache.set(skill, estimate);
    return estimate;
  }

  _extractHours(text) {
    const matches = [];
    const hourRegex = /(\d{1,3})\s*(hours?|hrs?)/gi;
    const weekRegex = /(\d{1,2})\s*(weeks?)/gi;

    let m;
    while ((m = hourRegex.exec(text)) !== null) {
      matches.push(parseInt(m[1], 10));
    }
    while ((m = weekRegex.exec(text)) !== null) {
      // convert weeks to hours using a 5h/week baseline to stay conservative
      matches.push(parseInt(m[1], 10) * 5);
    }
    return matches;
  }

  _buildEstimateFromNumbers(numbers, snippets) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    return {
      min,
      median,
      max,
      snippets: Array.from(new Set(snippets)).slice(0, 5)
    };
  }

  _fallbackEstimate(skill, snippets = []) {
    // Heuristic based on skill complexity buckets
    const lower = 8;
    const upper = 40;
    return {
      min: lower,
      median: Math.round((lower + upper) / 2),
      max: upper,
      snippets: snippets.slice(0, 3)
    };
  }
}

export default SkillEffortService;



























