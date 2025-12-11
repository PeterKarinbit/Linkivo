import EnhancedAICareerCoachService from './enhancedAICareerCoach.service.js';
import EnhancedVectorDatabaseService from './enhancedVectorDatabase.service.js';

export default class ProactiveAnalysisScheduler {
  constructor() {
    this.aiCoach = EnhancedAICareerCoachService;
    this.vectorDB = EnhancedVectorDatabaseService;
  }

  async getUserProfile(userId) {
    return this.aiCoach.getUserCareerProfile(userId);
  }

  async scheduleAnalysis(userId) {
    const profile = await this.getUserProfile(userId);
    const triggers = await this.evaluateTriggers(profile);
    const schedule = this.determineOptimalTiming(profile, triggers);

    return {
      nextAnalysis: schedule.nextRun,
      triggerReasons: triggers.active,
      analysisType: schedule.analysisType,
      expectedInsights: schedule.expectedOutcomes,
    };
  }

  async evaluateTriggers(userProfile) {
    const triggers = {
      careerStagnation: this.detectStagnation(userProfile),
      learningPlateau: this.detectLearningPlateau(userProfile),
      skillGapCritical: this.assessSkillGapUrgency(userProfile),
      marketOpportunities: await this.detectMarketShifts(userProfile),
      industryDisruption: await this.detectIndustryChanges(userProfile?.industry || userProfile?.careerTrajectory?.targetRole),
      behavioralPattern: this.detectBehavioralPattern(userProfile),
    };

    const active = Object.entries(triggers)
      .filter(([, v]) => v?.active)
      .map(([k, v]) => ({ key: k, score: v.score, reason: v.reason }));

    return { ...triggers, active };
  }

  detectStagnation(userProfile) {
    try {
      const lastActivity = new Date(userProfile?.progress_tracking?.last_activity || 0).getTime();
      const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      const journalConsistency = userProfile?.progress_tracking?.journal_consistency || 0;
      const active = daysSince >= 30 || journalConsistency < 0.2;
      return { active, score: active ? 0.7 : 0.0, reason: `daysSinceActivity=${Math.floor(daysSince)}, consistency=${journalConsistency}` };
    } catch (_) {
      return { active: false, score: 0.0, reason: 'insufficient_data' };
    }
  }

  detectLearningPlateau(userProfile) {
    const analysisHistory = userProfile?.analysisHistory || [];
    // Heuristic: repeated mention of same gap across last 3 analyses
    const last3 = analysisHistory.slice(-5);
    const gapCounts = new Map();
    for (const h of last3) {
      const gaps = userProfile?.careerProfile?.skillGaps || [];
      for (const g of gaps) {
        const key = (g.skill || '').toLowerCase();
        gapCounts.set(key, (gapCounts.get(key) || 0) + 1);
      }
    }
    const plateau = Array.from(gapCounts.values()).some((c) => c >= 3);
    return { active: plateau, score: plateau ? 0.6 : 0.0, reason: plateau ? 'repeated_gaps_3plus' : 'no_plateau' };
  }

  assessSkillGapUrgency(userProfile) {
    const gaps = userProfile?.careerProfile?.skillGaps || [];
    const critical = gaps.some((g) => (g.urgency === 'critical' || g.marketDemand === 'critical'));
    return { active: critical, score: critical ? 0.9 : 0.0, reason: critical ? 'critical_gap_detected' : 'no_critical_gap' };
  }

  async detectMarketShifts(userProfile) {
    try {
      const text = EnhancedVectorDatabaseService.createUserProfileText(userProfile);
      const terms = EnhancedVectorDatabaseService.extractKeyTerms(text).slice(0, 5);
      const intel = await this.aiCoach.getMarketContextForSkills(terms);
      const hasNew = (intel?.results || []).length > 0;
      return { active: hasNew, score: hasNew ? 0.5 : 0.0, reason: hasNew ? 'new_market_signals' : 'no_signal' };
    } catch (_) {
      return { active: false, score: 0.0, reason: 'intel_error' };
    }
  }

  async detectIndustryChanges(industry) {
    if (!industry) return { active: false, score: 0.0, reason: 'no_industry' };
    try {
      const intel = await this.aiCoach.getRelevantMarketData({ industry });
      const disruption = (intel || []).some((r) => JSON.stringify(r).toLowerCase().includes('ai'));
      return { active: disruption, score: disruption ? 0.6 : 0.0, reason: disruption ? 'ai_disruption_detected' : 'no_disruption' };
    } catch (_) {
      return { active: false, score: 0.0, reason: 'intel_error' };
    }
  }

  detectBehavioralPattern(userProfile) {
    const sentimentAvg = this._estimateSentiment(userProfile);
    const drop = sentimentAvg < -0.4;
    return { active: drop, score: drop ? 0.4 : 0.0, reason: `avg_sentiment=${sentimentAvg}` };
  }

  _estimateSentiment(userProfile) {
    const hist = userProfile?.analysisHistory || [];
    if (!hist.length) return 0;
    const lastN = hist.slice(-10);
    const avg = lastN.reduce((s, h) => s + (h.summary_sentiment ?? 0), 0) / lastN.length;
    return Math.max(-1, Math.min(1, avg));
  }

  determineOptimalTiming(userProfile, triggers) {
    // Base on consent schedule window if available
    const consent = userProfile?.aiCoachConsent || {};
    const cadence = consent?.schedule?.cadence || 'weekly';
    const windowLocalTime = consent?.schedule?.windowLocalTime || '09:00';

    const now = new Date();
    const [hh, mm] = windowLocalTime.split(':').map((n) => parseInt(n, 10));

    const baseNext = new Date(now);
    baseNext.setHours(hh, mm, 0, 0);
    if (baseNext <= now) {
      // move to next cadence window
      if (cadence === 'daily') baseNext.setDate(baseNext.getDate() + 1);
      else if (cadence === 'weekly') baseNext.setDate(baseNext.getDate() + 7);
      else if (cadence === 'monthly') baseNext.setMonth(baseNext.getMonth() + 1);
      else if (cadence === 'quarterly') baseNext.setMonth(baseNext.getMonth() + 3);
      else baseNext.setDate(baseNext.getDate() + 7);
    }

    // Escalate earlier if critical triggers
    const hasCritical = triggers.skillGapCritical?.active || false;
    const hasDisruption = triggers.industryDisruption?.active || false;
    let nextRun = baseNext;
    if (hasCritical || hasDisruption) {
      const soon = new Date(now.getTime() + 1000 * 60 * 60 * 6); // 6 hours
      if (soon < nextRun) nextRun = soon;
    }

    const analysisType = hasCritical ? 'urgent' : hasDisruption ? 'market' : 'regular';
    const expectedOutcomes = hasCritical
      ? ['targeted_skill_gap_plan', 'high-urgency_recommendations']
      : hasDisruption
        ? ['industry_shift_summary', 'adaptation_actions']
        : ['progress_check', 'fresh_learning_tasks'];

    return { nextRun: nextRun.toISOString(), analysisType, expectedOutcomes };
  }
}


