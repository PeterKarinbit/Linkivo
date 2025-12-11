import SerperService from './SerperService.js';
import lightcastService from './lightcast/lightcast.service.js';

/**
 * Skill Requirement Checker Service
 * Integrates Lightcast API and Serper API to validate and enrich skill requirements
 * for roadmap milestones and career paths
 */
class SkillRequirementChecker {
  constructor(serperApiKey) {
    this.serper = serperApiKey ? new SerperService(serperApiKey) : null;
    this.lightcast = lightcastService;
  }

  /**
   * Check skill requirements for a roadmap milestone or phase
   * @param {Object} options - Check options
   * @param {Array<string>} options.skills - Skills to check
   * @param {string} options.targetRole - Target role for context
   * @param {string} options.milestoneTitle - Milestone/phase title
   * @returns {Promise<Object>} - Enriched skill requirements with validation
   */
  async checkSkillRequirements({ skills, targetRole, milestoneTitle }) {
    const results = {
      skills: [],
      summary: {
        total: skills.length,
        validated: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        learningResources: 0
      },
      sources: {
        lightcast: false,
        serper: false
      }
    };

    // Process each skill
    for (const skill of skills) {
      const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || '');
      if (!skillName) continue;

      const skillResult = {
        name: skillName,
        priority: typeof skill === 'object' ? (skill.priority || 'medium') : 'medium',
        validated: false,
        lightcastData: null,
        learningResources: [],
        marketDemand: null,
        estimatedHours: null
      };

      // Try Lightcast API for skill validation and market data
      try {
        const lightcastResults = await this.lightcast.searchSkills({
          q: skillName,
          limit: 1,
          fields: 'id,name,type,infoUrl'
        });

        if (lightcastResults?.data && lightcastResults.data.length > 0) {
          skillResult.lightcastData = lightcastResults.data[0];
          skillResult.validated = true;
          results.sources.lightcast = true;

          // Get related skills for better context
          try {
            const relatedSkills = await this.lightcast.getRelatedSkills(
              [lightcastResults.data[0].id],
              { limit: 3 }
            );
            if (relatedSkills?.data) {
              skillResult.relatedSkills = relatedSkills.data.map(s => s.name);
            }
          } catch (err) {
            console.warn(`[SkillChecker] Could not fetch related skills for ${skillName}:`, err.message);
          }
        }
      } catch (error) {
        console.warn(`[SkillChecker] Lightcast validation failed for ${skillName}:`, error.message);
      }

      // Use Serper API to find learning resources
      if (this.serper) {
        try {
          const searchQuery = targetRole 
            ? `${skillName} for ${targetRole}`
            : `learn ${skillName}`;
          
          const learningResources = await this.serper.searchLearningResources(searchQuery, {
            limit: 3,
            type: 'course'
          });

          if (learningResources && learningResources.length > 0) {
            skillResult.learningResources = learningResources;
            results.sources.serper = true;
            results.summary.learningResources += learningResources.length;
          }
        } catch (error) {
          console.warn(`[SkillChecker] Serper search failed for ${skillName}:`, error.message);
        }
      }

      // Estimate learning hours based on priority and skill complexity
      skillResult.estimatedHours = this._estimateLearningHours(skillResult);

      // Update summary
      if (skillResult.validated) results.summary.validated++;
      if (skillResult.priority === 'high') results.summary.highPriority++;
      else if (skillResult.priority === 'medium') results.summary.mediumPriority++;
      else results.summary.lowPriority++;

      results.skills.push(skillResult);
    }

    // Generate overall summary
    results.summary.validatedPercentage = results.summary.total > 0
      ? Math.round((results.summary.validated / results.summary.total) * 100)
      : 0;

    return results;
  }

  /**
   * Check skill requirements for a roadmap phase
   * @param {Object} phase - Roadmap phase object
   * @param {string} targetRole - Target role
   * @returns {Promise<Object>} - Enriched phase with skill validation
   */
  async checkPhaseSkills(phase, targetRole) {
    const skills = phase.skills || [];
    if (skills.length === 0) {
      return {
        phase,
        skillCheck: null,
        message: 'No skills to check for this phase'
      };
    }

    const skillCheck = await this.checkSkillRequirements({
      skills,
      targetRole,
      milestoneTitle: phase.title
    });

    return {
      phase: {
        ...phase,
        enrichedSkills: skillCheck.skills.map(s => ({
          name: s.name,
          priority: s.priority,
          validated: s.validated,
          learningResources: s.learningResources,
          estimatedHours: s.estimatedHours,
          lightcastId: s.lightcastData?.id
        }))
      },
      skillCheck,
      recommendations: this._generateRecommendations(skillCheck)
    };
  }

  /**
   * Check all roadmap milestones/phases
   * @param {Object} roadmap - Roadmap object
   * @returns {Promise<Object>} - Roadmap with enriched skill data
   */
  async checkRoadmapSkills(roadmap) {
    if (!roadmap || !roadmap.phases) {
      throw new Error('Invalid roadmap: missing phases');
    }

    const targetRole = roadmap.targetRole || roadmap.target_role;
    const enrichedPhases = [];
    const overallSummary = {
      totalSkills: 0,
      validatedSkills: 0,
      totalLearningResources: 0,
      phasesChecked: 0
    };

    for (const phase of roadmap.phases) {
      const phaseCheck = await this.checkPhaseSkills(phase, targetRole);
      
      if (phaseCheck.skillCheck) {
        overallSummary.totalSkills += phaseCheck.skillCheck.summary.total;
        overallSummary.validatedSkills += phaseCheck.skillCheck.summary.validated;
        overallSummary.totalLearningResources += phaseCheck.skillCheck.summary.learningResources;
        overallSummary.phasesChecked++;
      }

      enrichedPhases.push(phaseCheck.phase);
    }

    return {
      ...roadmap,
      phases: enrichedPhases,
      skillValidation: {
        summary: overallSummary,
        validatedPercentage: overallSummary.totalSkills > 0
          ? Math.round((overallSummary.validatedSkills / overallSummary.totalSkills) * 100)
          : 0,
        lastChecked: new Date().toISOString()
      }
    };
  }

  /**
   * Estimate learning hours for a skill
   * @private
   */
  _estimateLearningHours(skillResult) {
    const baseHours = {
      high: 40,
      medium: 20,
      low: 10
    };

    let hours = baseHours[skillResult.priority] || 20;

    // Adjust based on Lightcast data (if available)
    if (skillResult.lightcastData) {
      // Skills with more related skills might be more complex
      if (skillResult.relatedSkills && skillResult.relatedSkills.length > 2) {
        hours *= 1.2;
      }
    }

    return Math.round(hours);
  }

  /**
   * Generate recommendations based on skill check results
   * @private
   */
  _generateRecommendations(skillCheck) {
    const recommendations = [];

    if (skillCheck.summary.validatedPercentage < 50) {
      recommendations.push({
        type: 'warning',
        message: 'Less than 50% of skills were validated. Consider reviewing skill names for accuracy.',
        priority: 'medium'
      });
    }

    if (skillCheck.summary.learningResources === 0 && this.serper) {
      recommendations.push({
        type: 'info',
        message: 'No learning resources found. Consider adding more specific skill names.',
        priority: 'low'
      });
    }

    const highPriorityCount = skillCheck.summary.highPriority;
    if (highPriorityCount > skillCheck.summary.total / 2) {
      recommendations.push({
        type: 'info',
        message: `${highPriorityCount} high-priority skills identified. Focus on these first.`,
        priority: 'high'
      });
    }

    return recommendations;
  }
}

export default SkillRequirementChecker;

