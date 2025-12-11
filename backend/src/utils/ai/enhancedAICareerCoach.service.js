import OpenAI from "openai";
import { User } from "../../models/user.model.js";
import {
  UserCareerProfile,
  JournalEntry,
  KnowledgeBase,
  AIRecommendation,
  WebhookLog,
  CareerRecommendation
} from "../../models/aiCareerCoach.model.js";
import { Application } from "../../models/application.model.js";

import cache, { CACHE_KEYS, CACHE_TTL } from '../initCache.js';
import ModelCache from '../modelCache.js';
import MarketDataCache from '../marketDataCache.js';

// Lazy load heavy dependencies
let openaiInstance = null;
let vectorDBInstance = null;
let marketIntelligenceInstance = null;
let skillEffortInstance = null;

const LEVEL_STAGE_MAP = {
  high_school: 'student',
  high_school_graduating: 'student',
  exploring: 'student',
  intern_part_time: 'student',
  university: 'student',
  fresh_graduate: 'recent_grad',
  entry: 'early_career',
  junior: 'early_career',
  mid: 'mid_career',
  senior: 'senior',
  lead: 'senior',
  executive: 'senior',
  consultant: 'senior',
  mentor: 'senior',
  second_career: 'career_switch',
  career_switcher: 'career_switch',
  career_switch: 'career_switch'
};

const getOpenAI = async () => {
  if (!openaiInstance) {
    openaiInstance = await ModelCache.getOrCreateModel(
      'default',
      async () => {
        console.log('Initializing new OpenAI-compatible client...');
        const apiKey = process.env.NOVITA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
        let baseURL = process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

        if (process.env.NOVITA_API_KEY) {
          baseURL = process.env.NOVITA_API_URL || "https://api.novita.ai/openai";
        } else if (!process.env.OPENAI_BASE_URL && process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_BASE_URL) {
          baseURL = "https://openrouter.ai/api/v1";
        }

        const defaultHeaders = {};
        if (baseURL.includes('openrouter.ai')) {
          if (process.env.OPENROUTER_SITE_URL) defaultHeaders['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
          if (process.env.OPENROUTER_APP_NAME) defaultHeaders['X-Title'] = process.env.OPENROUTER_APP_NAME;
        }

        const client = new OpenAI({
          apiKey,
          baseURL,
          defaultHeaders
        });

        // Test the connection
        await client.models.list();
        return client;
      },
      { ttl: CACHE_TTL.AI_MODELS }
    );
  }
  return openaiInstance;
};

const getVectorDB = async () => {
  if (!vectorDBInstance) {
    console.log('Initializing Vector DB...');
    const { default: VectorDB } = await import('./enhancedVectorDatabase.service.js');
    vectorDBInstance = VectorDB;
  }
  return vectorDBInstance;
};

const getMarketIntelligence = async () => {
  if (!marketIntelligenceInstance) {
    console.log('Initializing Market Intelligence Service...');
    const { default: MarketIntel } = await import('./marketIntelligence.service.js');
    marketIntelligenceInstance = MarketIntel;
  }
  return marketIntelligenceInstance;
};

const getSkillEffort = async () => {
  if (!skillEffortInstance) {
    try {
      const { default: SkillEffortService } = await import('../../services/SkillEffortService.js');
      skillEffortInstance = new SkillEffortService(process.env.SERPER_API_KEY);
    } catch (error) {
      console.warn('SkillEffortService unavailable (Serper API key missing or init failed):', error?.message || error);
      skillEffortInstance = null;
    }
  }
  return skillEffortInstance;
};

class EnhancedAICareerCoachService {
  constructor() {
    // Will be lazy loaded when needed
    this._openai = null;
    this._vectorDB = null;
    this._marketIntelligence = null;
    this._skillEffort = null;
    this._initializing = false;
  }

  // Property getters for accessing lazy-loaded dependencies
  get openai() {
    return this._openai;
  }

  get vectorDB() {
    return this._vectorDB;
  }

  get marketIntelligence() {
    return this._marketIntelligence;
  }


  // Lazy loaders with caching
  async _getOpenAI() {
    if (!this._openai) {
      this._openai = await ModelCache.getOrCreateModel(
        'default',
        getOpenAI,
        { ttl: CACHE_TTL.AI_MODELS }
      );
    }
    return this._openai;
  }

  async _getVectorDB() {
    if (!this._vectorDB) {
      this._vectorDB = await getVectorDB();
    }
    return this._vectorDB;
  }

  // ==================== HELPER METHODS ====================
  async _ensureDependencies() {
    if (!this._openai) this._openai = await this._getOpenAI();
    if (!this._vectorDB) this._vectorDB = await this._getVectorDB();
    if (!this._marketIntelligence) this._marketIntelligence = await getMarketIntelligence();
    if (!this._skillEffort) this._skillEffort = await getSkillEffort(); // may be null if Serper key not set
  }

  _clampHours(value, min = 2, max = 40) {
    if (typeof value !== 'number') {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return null;
      value = parsed;
    }
    return Math.min(max, Math.max(min, value));
  }

  _inferStageFromLevel(level) {
    if (!level) return 'early_career';
    return LEVEL_STAGE_MAP[level] || 'early_career';
  }

  _mapRoleToIndustry(role = '') {
    const normalized = role?.toString().toLowerCase() || '';
    if (!normalized) return 'Technology';
    if (normalized.includes('data') || normalized.includes('ai') || normalized.includes('software') || normalized.includes('dev') || normalized.includes('engineer') || normalized.includes('developer')) return 'Technology';
    if (normalized.includes('product')) return 'Product';
    if (normalized.includes('marketing') || normalized.includes('growth') || normalized.includes('brand')) return 'Marketing';
    if (normalized.includes('finance') || normalized.includes('account') || normalized.includes('investment') || normalized.includes('analyst')) return 'Finance';
    if (normalized.includes('operations') || normalized.includes('project') || normalized.includes('manager')) return 'Operations';
    if (normalized.includes('sales') || normalized.includes('customer') || normalized.includes('account executive')) return 'Sales';
    if (normalized.includes('design') || normalized.includes('ux') || normalized.includes('ui')) return 'Design';
    if (normalized.includes('hr') || normalized.includes('human resources') || normalized.includes('recruiter')) return 'Human Resources';
    if (normalized.includes('consultant') || normalized.includes('consulting')) return 'Consulting';
    return 'Technology'; // Default
  }

  _sanitizePersonaAssessment(input = {}) {
    const now = new Date();
    const weekly_time = this._clampHours(input.weeklyTime || input.hoursPerWeek || input.weekly_time || null);
    const targetRole = (input.targetRole || input.target_role || '').slice(0, 120);

    // Derive industry from target role if not explicitly provided
    const industry = input.industry || this._mapRoleToIndustry(targetRole);

    return {
      stage: input.stage || this._inferStageFromLevel(input.currentLevel || input.current_level),
      current_level: input.currentLevel || input.current_level || '',
      target_role: targetRole,
      industry: industry, // Store derived or provided industry
      focus_area: (input.focusArea || input.focus_area || '').slice(0, 160),
      motivation: Array.isArray(input.whyReasons || input.motivation)
        ? (input.whyReasons || input.motivation).slice(0, 6)
        : [],
      weekly_time,
      learning_style: input.learningStyle || input.learning_style || 'mixed',
      confidence_map: Array.isArray(input.confidence_map) ? input.confidence_map.slice(0, 10) : [],
      updated_at: now
    };
  }

  async _buildSkillEffortSummary(skills = []) {
    if (!skills?.length || !this._skillEffort) return '';
    try {
      const estimates = await this._skillEffort.getEffortEstimates(skills.slice(0, 10));
      return estimates.map(e =>
        `${e.skill}: median ${e.median}h (range ${e.min}-${e.max}h)${e.snippets?.[0] ? ` | evidence: ${e.snippets[0]}` : ''}`
      ).join('\n');
    } catch (error) {
      console.warn('Skill effort summary failed:', error?.message || error);
      return '';
    }
  }

  _computeHorizonWeeks(phases = []) {
    if (!Array.isArray(phases) || phases.length === 0) return 6;
    return phases.reduce((sum, phase) => sum + (phase.weeks || phase.week_span || 1), 0);
  }

  _flattenToStrings(items) {
    if (!items) return [];
    const array = Array.isArray(items) ? items : [items];
    return array
      .map(item => {
        if (typeof item === 'string') return item;
        if (item?.title) return item.title;
        if (item?.description) return item.description;
        if (item?.name) return item.name;
        if (typeof item === 'object') {
          const firstValue = Object.values(item).find(val => typeof val === 'string');
          return firstValue || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean)
      .slice(0, 10);
  }

  _getModel() {
    // Allow overriding model via env; default kept for local/dev
    const baseModel = process.env.AI_CAREER_COACH_MODEL || "deepseek/deepseek-r1-distill-qwen-32b";
    const enableWeb = (process.env.OPENROUTER_ENABLE_WEB_SEARCH === '1' || process.env.OPENROUTER_ENABLE_WEB_SEARCH === 'true');
    if (enableWeb && !baseModel.endsWith(':online')) {
      return `${baseModel}:online`;
    }
    return baseModel;
  }

  // ==================== ENHANCED RESUME ANALYSIS ====================
  async analyzeResume(resumeFile, userId) {
    await this._ensureDependencies();
    const openai = this._openai;
    try {
      // Extract text from resume
      const { extractTextFromPDF } = await import("./textExtraction.service.js");
      const resumeText = await extractTextFromPDF(resumeFile);

      // Enhanced AI analysis with market context
      const analysis = await openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: `You are a professional career coach with deep analytical skills and knowledge of current job market trends. 
            Analyze resumes comprehensively, considering market demand, skill gaps, and career trajectory alignment. 
            Provide actionable insights and specific recommendations. Return JSON format.`
          },
          {
            role: "user",
            content: `Analyze this resume comprehensively and return JSON with:
            {
              "skills_heat_map": {"skill": proficiency_score},
              "experience_level": "entry|mid|senior|lead|executive",
              "career_trajectory": "technical|management|entrepreneurial|consulting|academic",
              "identified_gaps": [{"skill": "string", "importance": number, "learning_path": "string", "market_demand": "high|medium|low"}],
              "market_alignment": {"overall_score": number, "in_demand_skills": [string], "growth_potential": "high|medium|low"},
              "career_recommendations": [{"area": "string", "action": "string", "timeline": "string", "priority": "high|medium|low"}]
            }
            
            Resume: ${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysisResult = JSON.parse(analysis.choices[0].message.content);

      // Get market context for skills
      const marketContext = await this.getMarketContextForSkills(
        Object.keys(analysisResult.skills_heat_map || {})
      );

      // Enhance analysis with market data
      const enhancedAnalysis = this.enhanceAnalysisWithMarketData(analysisResult, marketContext);

      // Update or create user career profile
      await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            'resume_analysis': enhancedAnalysis,
            'last_activity': new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Vectorize the profile for future recommendations (if consent allows)
      try {
        const user = await User.findById(userId).select('aiCoachConsent').lean();
        if (user?.aiCoachConsent?.enabled && user?.aiCoachConsent?.scopes?.resume) {
          await this.vectorizeUserProfile(userId, enhancedAnalysis);
        }
      } catch (_) { }

      return {
        success: true,
        analysis: enhancedAnalysis,
        skills: Object.keys(enhancedAnalysis.skills_heat_map || {}),
        experience_level: enhancedAnalysis.experience_level,
        career_trajectory: enhancedAnalysis.career_trajectory,
        gaps: enhancedAnalysis.identified_gaps,
        market_alignment: enhancedAnalysis.market_alignment,
        recommendations: enhancedAnalysis.career_recommendations
      };
    } catch (error) {
      console.error('Enhanced resume analysis error:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  // ==================== DOCUMENT CONTENT ANALYSIS ====================
  /**
   * Analyze document content (resume, cover letter, portfolio) and extract structured insights
   * @param {string} docText - Extracted text from document
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result with skills, summary, and insights
   */
  async analyzeDocumentContent(docText, userId, options = {}) {
    await this._ensureDependencies();
    const openai = this._openai;
    const { documentType = 'resume', filename = 'document' } = options;

    try {
      console.log(`[DOCUMENT ANALYSIS] Analyzing ${documentType} for user ${userId}`);

      // Use Lightcast API for skill extraction if available
      let extractedSkills = [];
      try {
        const { default: lightcastService } = await import('../../services/lightcast/lightcast.service.js');
        // const lightcastService = new LightcastService(); // Removed: Module exports instance
        const lightcastResults = await lightcastService.extractSkills(docText, {
          confidenceThreshold: 0.6,
          language: 'en'
        });
        extractedSkills = lightcastResults.map(s => ({
          name: s.skill?.name || s.name || '',
          normalized: s.skill?.normalizedName || s.normalized || s.skill?.name || s.name || '',
          confidence: s.confidence || 0.7,
          category: s.skill?.type?.name || 'technical'
        }));
        console.log(`[DOCUMENT ANALYSIS] Extracted ${extractedSkills.length} skills via Lightcast`);
      } catch (lightcastError) {
        console.warn('[DOCUMENT ANALYSIS] Lightcast extraction failed, using LLM fallback:', lightcastError.message);
      }

      // Enhanced AI analysis with comprehensive extraction
      const analysisPrompt = documentType === 'resume'
        ? `Analyze this resume comprehensively and extract:
- All technical and soft skills mentioned
- Work experience details
- Education background
- Certifications and qualifications
- Key achievements and accomplishments
- Career trajectory indicators

Return JSON format:
{
  "skills": [{"name": "string", "proficiency": "beginner|intermediate|advanced|expert", "context": "string"}],
  "experience": [{"title": "string", "company": "string", "duration": "string", "key_achievements": [string]}],
  "education": [{"degree": "string", "institution": "string", "field": "string"}],
  "certifications": [{"name": "string", "issuer": "string"}],
  "summary": {
    "key_themes": [string],
    "strengths": [string],
    "areas_for_improvement": [string],
    "sentiment": number,
    "analysis_status": "completed"
  },
  "skills_heat_map": {"skill_name": proficiency_score_0_to_1}
}

Resume text:
${docText.slice(0, 8000)}` // Limit to avoid token limits
        : documentType === 'cover-letter'
          ? `Analyze this cover letter and extract:
- Key skills and qualifications mentioned
- Alignment with job requirements
- Writing quality indicators
- Personal branding elements
- Call-to-action effectiveness

Return JSON format:
{
  "skills": [{"name": "string", "relevance": "high|medium|low"}],
  "summary": {
    "key_themes": [string],
    "strengths": [string],
    "suggestions": [string],
    "sentiment": number,
    "analysis_status": "completed"
  },
  "alignment_score": number
}

Cover letter text:
${docText.slice(0, 8000)}`
          : `Analyze this portfolio document and extract:
- Projects and work showcased
- Technologies and tools used
- Skills demonstrated
- Impact and achievements
- Presentation quality

Return JSON format:
{
  "projects": [{"title": "string", "technologies": [string], "description": "string"}],
  "skills": [{"name": "string", "examples": [string]}],
  "summary": {
    "key_themes": [string],
    "strengths": [string],
    "suggestions": [string],
    "sentiment": number,
    "analysis_status": "completed"
  }
}

Portfolio text:
${docText.slice(0, 8000)}`;

      const analysis = await openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: `You are a professional career coach and document analyst. Extract structured information from career documents with high accuracy. Always return valid JSON.`
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      let analysisResult = {};
      try {
        const content = analysis.choices[0].message.content;
        analysisResult = JSON.parse(content);
      } catch (parseError) {
        console.error('[DOCUMENT ANALYSIS] Failed to parse LLM response:', parseError);
        // Fallback to basic extraction
        analysisResult = {
          skills: extractedSkills.map(s => ({ name: s.name, proficiency: 'intermediate' })),
          summary: {
            key_themes: [],
            strengths: [],
            areas_for_improvement: [],
            sentiment: 0.5,
            analysis_status: 'completed'
          }
        };
      }

      // Merge Lightcast skills with LLM skills
      if (extractedSkills.length > 0 && analysisResult.skills) {
        const skillMap = new Map();
        analysisResult.skills.forEach(s => {
          skillMap.set(s.name.toLowerCase(), s);
        });
        extractedSkills.forEach(s => {
          if (!skillMap.has(s.name.toLowerCase())) {
            analysisResult.skills.push({
              name: s.name,
              proficiency: 'intermediate',
              normalized: s.normalized,
              confidence: s.confidence
            });
          }
        });
      }

      // Generate embedding for vector storage
      let contentVector = null;
      try {
        const vectorDB = await this._getVectorDB();
        contentVector = await vectorDB.generateEmbedding(docText.slice(0, 2000));
      } catch (vecError) {
        console.warn('[DOCUMENT ANALYSIS] Vector generation failed:', vecError.message);
      }

      // Ensure summary structure exists
      if (!analysisResult.summary) {
        analysisResult.summary = {
          key_themes: [],
          strengths: [],
          areas_for_improvement: [],
          sentiment: 0.5,
          analysis_status: 'completed'
        };
      }

      // Add vector to result
      if (contentVector) {
        analysisResult.content_vector = contentVector;
      }

      console.log(`[DOCUMENT ANALYSIS] Analysis completed for ${documentType}, extracted ${analysisResult.skills?.length || 0} skills`);

      return analysisResult;
    } catch (error) {
      console.error('[DOCUMENT ANALYSIS] Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  /**
   * Generate document improvement recommendations
   * @param {string} docText - Document text
   * @param {string} userId - User ID
   * @param {Object} options - Options including analysisResult
   * @returns {Promise<Array>} Array of recommendation objects
   */
  async generateDocumentRecommendations(docText, userId, options = {}) {
    await this._ensureDependencies();
    const openai = this._openai;
    const { documentType = 'resume', analysisResult = {}, jobDescription } = options;

    try {
      console.log(`[DOCUMENT RECOMMENDATIONS] Generating comprehensive recommendations for ${documentType}`);

      // Enhanced prompt covering all 4 areas of resume analysis
      const recommendationPrompt = documentType === 'resume' || documentType === 'cv'
        ? `You are an AI resume analysis tool. Analyze this resume comprehensively and provide detailed feedback in 4 key areas:

RESUME TEXT:
${docText.slice(0, 8000)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}\n` : ''}

ANALYSIS SUMMARY:
${JSON.stringify(analysisResult.summary || {}, null, 2)}
SKILLS FOUND: ${JSON.stringify(analysisResult.skills?.slice(0, 15) || [], null, 2)}

Provide comprehensive feedback in these 4 areas:

1. KEYWORD GAP ANALYSIS AND OPTIMIZATION
   - Extract essential keywords, skills (hard and soft), and qualifications from the job description (if provided)
   - Compare resume against job description and identify missing keywords
   - Calculate compatibility/match score
   - Suggest specific keywords and industry terms to add
   - Recommend where to integrate keywords (summary, skills section, work experience)

2. CONTENT AND ACHIEVEMENT ENHANCEMENT
   - Flag vague or generic language (e.g., "managed a team", "responsible for reports")
   - Recommend quantifiable, achievement-focused statements
   - Identify transferable skills for career changers
   - Check for missing sections (professional summary, certifications, projects)
   - Suggest ways to reframe past roles to highlight relevant connections

3. FORMATTING AND STRUCTURE FEEDBACK
   - Check ATS compatibility (flag graphics, images, tables, unconventional headers)
   - Assess grammar, spelling, sentence structure, and tone
   - Identify formatting issues that might cause parsing errors
   - Suggest improvements for clarity and professionalism

4. CAREER GAP DETECTION
   - Parse dates from work experience to create chronological timeline
   - Flag employment gaps longer than 3 months
   - Use NLP to identify context clues (sabbatical, freelance, education)
   - Suggest appropriate ways to explain periods of inactivity

Return JSON object:
{
  "recommendations": [
    {
      "title": "string (specific issue title)",
      "rationale": "string (detailed explanation)",
      "actions": ["specific action 1", "specific action 2"],
      "priority": "high|medium|low",
      "category": "keyword_gap|content_enhancement|formatting|career_gap",
      "section": "summary|skills|experience|education|other",
      "match_score": number (0-100, if job description provided),
      "missing_keywords": [string] (if applicable),
      "suggested_improvements": [string]
    }
  ],
  "overall_assessment": {
    "ats_compatibility_score": number (0-100),
    "keyword_match_score": number (0-100, if job description provided),
    "content_quality_score": number (0-100),
    "formatting_score": number (0-100),
    "career_gaps_detected": number,
    "summary": "string (overall assessment)"
  }
}

Provide 8-12 specific, actionable recommendations covering all 4 areas.`
        : `Analyze this ${documentType} and provide improvement recommendations.

${documentType === 'cover-letter' ? 'COVER LETTER TEXT:' : 'DOCUMENT TEXT:'}
${docText.slice(0, 8000)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}\n` : ''}

Return JSON object with a "recommendations" key containing an array:
{
  "recommendations": [
    {
      "title": "string",
      "rationale": "string",
      "actions": ["action1", "action2"],
      "priority": "high|medium|low",
      "category": "content|formatting|alignment|presentation"
    }
  ]
}

Provide 5-8 specific, actionable recommendations.`;

      const response = await openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: "You are a professional career coach and resume analysis expert. Provide detailed, actionable feedback using natural language processing and machine learning insights. Be specific and practical."
          },
          {
            role: "user",
            content: recommendationPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      let recommendations = [];
      let overallAssessment = null;
      try {
        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        recommendations = Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : Array.isArray(parsed)
            ? parsed
            : [];

        // Extract overall assessment if available
        if (parsed.overall_assessment) {
          overallAssessment = parsed.overall_assessment;
        }
      } catch (parseError) {
        console.error('[DOCUMENT RECOMMENDATIONS] Failed to parse recommendations:', parseError);
        // Fallback recommendations
        recommendations = [
          {
            title: "Review Document Structure",
            rationale: "Ensure your document follows best practices for clarity and readability.",
            actions: ["Check formatting consistency", "Verify section organization", "Review contact information"],
            priority: "medium",
            category: "formatting"
          }
        ];
      }

      // Add overall assessment to recommendations if available
      if (overallAssessment && recommendations.length > 0) {
        recommendations.forEach(rec => {
          rec.overall_assessment = overallAssessment;
        });
      }

      console.log(`[DOCUMENT RECOMMENDATIONS] Generated ${recommendations.length} recommendations`);
      return {
        recommendations,
        overallAssessment
      };
    } catch (error) {
      console.error('[DOCUMENT RECOMMENDATIONS] Error generating recommendations:', error);
      // Return fallback recommendations
      return [
        {
          title: "Document Review Needed",
          rationale: "Your document has been uploaded. Consider reviewing it for improvements.",
          actions: ["Review content", "Check for typos", "Verify completeness"],
          priority: "medium",
          category: "content"
        }
      ];
    }
  }

  // ==================== ENHANCED JOURNAL MANAGEMENT ====================
  async createJournalEntry({ userId, content, entry_date, tags, title }) {
    const startTime = Date.now();

    // Input validation
    if (!content || typeof content !== 'string') {
      throw new Error('Journal content is required and must be a string');
    }

    // Content length validation
    if (content.length > 5000) {
      throw new Error('Journal content cannot exceed 5000 characters');
    }

    // Helper function to log operation time
    const logTime = (operation) => {
      console.log(`${operation} took ${Date.now() - startTime}ms`);
    };

    try {
      // Create basic journal entry
      const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
      // Extract title from content if not provided (first 50 chars)
      const entryTitle = title || content.trim().substring(0, 50).replace(/\n/g, ' ').trim();
      const baseEntry = {
        user_id: userId,  // Using user_id to match the schema
        entry_id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        metadata: {
          date: entry_date || new Date(),
          word_count: wordCount,
          reading_time: Math.ceil(wordCount / 200),
          processing_status: 'pending',
          title: entryTitle, // Store title in metadata
          ...(tags && tags.length ? { tags } : {})
        },
        ai_insights: {
          processing_status: 'pending'
        }
      };

      // Save and return the initial entry
      const journalEntry = new JournalEntry(baseEntry);
      await journalEntry.save();
      logTime('Journal entry saved');

      // Start analysis in background
      this.analyzeJournalEntryWithMarketContext(content, userId)
        .then(async (analysis) => {
          try {
            // Update entry with analysis results
            const updateData = {
              'metadata.processing_status': 'completed',
              'metadata.sentiment': analysis.SUMMARY?.sentiment,
              'metadata.topics': analysis.SUMMARY?.key_themes || [],
              'ai_insights': {
                key_themes: analysis.SUMMARY?.key_themes || [],
                action_items: analysis.SUMMARY?.action_items || [],
                skill_mentions: analysis.SKILLS_MENTIONED || [],
                summary: analysis.SUMMARY?.summary || analysis.SUMMARY?.key_themes?.join(', ') || 'Analyzed entry',
                processing_status: analysis.SUMMARY?.analysis_status || 'completed',
                error: analysis.SUMMARY?.error
              },
              'metadata.market_relevance': analysis.MARKET_AWARENESS?.length > 0 ? 'high' : 'low'
            };

            // Add vector if available
            if (analysis.content_vector) {
              updateData.content_vector = analysis.content_vector;
            }

            // Update the entry
            await JournalEntry.findOneAndUpdate(
              { _id: journalEntry._id },
              { $set: updateData },
              { new: true }
            );
            logTime('Journal entry updated with analysis');

            // Update career profile if analysis was successful
            if (analysis.SUMMARY?.analysis_status !== 'analysis_failed') {
              try {
                await this.updateCareerProfileFromJournal(userId, analysis, journalEntry.entry_id, entry_date);
                logTime('Career profile updated');
              } catch (e) {
                console.warn('Failed to update career profile:', e?.message || e);
              }
            }

            // Vectorize if consent allows
            try {
              const user = await User.findById(userId).select('aiCoachConsent').lean();
              if (user?.aiCoachConsent?.enabled && user?.aiCoachConsent?.scopes?.journals) {
                await this.vectorDB.vectorizeJournalEntry({
                  content,
                  user_id: userId,
                  entry_id: journalEntry.entry_id,
                  metadata: { ...journalEntry.metadata, ...updateData.metadata }
                });
                logTime('Vectorization completed');
              }
            } catch (e) {
              console.warn('Vectorization failed:', e?.message || e);
            }

            // Update journal consistency
            try {
              await this.updateJournalConsistency(userId);
            } catch (e) {
              console.warn('Failed to update journal consistency:', e?.message || e);
            }

            // Trigger proactive analysis if needed
            if ((analysis.SKILLS_MENTIONED?.length > 0) || (analysis.CAREER_ASPIRATIONS?.length > 0)) {
              try {
                await this.triggerProactiveAnalysis(userId);
                logTime('Proactive analysis triggered');
              } catch (e) {
                console.warn('Proactive analysis failed:', e?.message || e);
              }
            }
          } catch (error) {
            console.error('Error updating journal with analysis:', error);
            // Update entry with error status
            await JournalEntry.updateOne(
              { _id: journalEntry._id },
              {
                $set: {
                  'metadata.processing_status': 'error',
                  'ai_insights.processing_status': 'error',
                  'ai_insights.error': error.message
                }
              }
            );
          }
        })
        .catch(error => {
          console.error('Background analysis failed:', error);
          // Update entry with error status
          JournalEntry.updateOne(
            { _id: journalEntry._id },
            {
              $set: {
                'metadata.processing_status': 'error',
                'ai_insights.processing_status': 'error',
                'ai_insights.error': error.message
              }
            }
          ).catch(e => console.error('Failed to update error status:', e));
        });

      // Return the initial entry immediately
      return journalEntry.toObject();
    } catch (error) {
      console.error('Journal entry creation failed:', error);
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }
  }

  async analyzeJournalEntryWithMarketContext(content, userId) {
    // Initialize with default values
    const defaultResponse = {
      SKILLS_MENTIONED: [],
      FRUSTRATIONS: [],
      ACHIEVEMENTS: [],
      LEARNING_GOALS: [],
      CAREER_ASPIRATIONS: [],
      AI_READINESS_INDICATORS: [],
      MARKET_AWARENESS: [],
      SKILL_GAPS: [],
      SUMMARY: {
        sentiment: 0,
        key_themes: [],
        action_items: [],
        analysis_status: 'completed',
        error: null
      }
    };

    try {
      // First, try to use Lightcast API for skill extraction
      let lightcastResults = null;
      try {
        const { default: JournalProcessor } = await import('../../services/ai/JournalProcessor.js');
        const journalProcessor = new JournalProcessor();
        const lightcastAnalysis = await journalProcessor.processJournalEntry(content);

        if (lightcastAnalysis.taxonomyResults && lightcastAnalysis.taxonomyResults.skills.length > 0) {
          lightcastResults = lightcastAnalysis.taxonomyResults;
          console.log('Lightcast API extracted skills:', lightcastResults.skills.length);
        }
      } catch (lightcastError) {
        console.warn('Lightcast API processing failed:', lightcastError.message);
        // Continue with regular analysis
      }

      // Set a timeout for the entire operation
      const timeoutMs = 10000; // 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timed out')), timeoutMs)
      );

      // Get user's career profile for context (with timeout)
      const userProfilePromise = this.getUserCareerProfile(userId)
        .catch(error => {
          console.warn('Error getting user profile, using empty context:', error.message);
          return {};
        });

      // Get relevant market data (with timeout)
      const marketDataPromise = this.getRelevantMarketData(content)
        .catch(error => {
          console.warn('Error getting market data, using empty context:', error.message);
          return {};
        });

      // Wait for both promises with timeout
      const [userProfile, marketData] = await Promise.race([
        Promise.all([userProfilePromise, marketDataPromise]),
        timeoutPromise.then(() => {
          throw new Error('Analysis timed out while fetching context');
        })
      ]);

      // Prepare the analysis prompt with Lightcast results if available
      let analysisPrompt = `Analyze this journal entry with market context and extract:
      1. SKILLS_MENTIONED: [{ skill, normalized_skill, category, confidence }]
      2. FRUSTRATIONS: [{ frustration, frequency_hint, sentiment (-1..1), confidence }]
      3. ACHIEVEMENTS: [{ achievement, date_hint, confidence }]
      4. LEARNING_GOALS: [{ skill, timeframe_hint, motivation, confidence }]
      5. CAREER_ASPIRATIONS: [{ target_role, industry, timeframe_hint, confidence }]
      6. AI_READINESS_INDICATORS: [{ indicator, evidence, confidence }]
      7. MARKET_AWARENESS: [{ topic, understanding_level: "low|medium|high", confidence }]
      8. SKILL_GAPS: [{ skill, urgency: "low|medium|high|critical", identified_reason, market_demand: "low|medium|high|critical", confidence }]
      9. SUMMARY: { sentiment: (-1..1), key_themes: [string], action_items: [string] }
      Return JSON object only.
      
      Journal Entry: ${content}
      User Profile Context: ${JSON.stringify(userProfile, null, 2)}
      Market Data Context: ${JSON.stringify(marketData, null, 2)}`;

      // Add Lightcast results to the prompt if available
      if (lightcastResults) {
        analysisPrompt += `\n\nLIGHTCAST SKILLS EXTRACTION RESULTS:
        Extracted Skills: ${JSON.stringify(lightcastResults.skills, null, 2)}
        Career Paths: ${JSON.stringify(lightcastResults.careerPaths, null, 2)}
        
        Use these Lightcast results to enhance your analysis, especially for SKILLS_MENTIONED and CAREER_ASPIRATIONS.`;
      }

      // Prepare the analysis request
      const analysisRequest = this.openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: `You are an expert AI career coach. Extract structured information from a career journal entry.
            Focus on AI-quotient and skills gap measurement aligned to O*NET-like skills taxonomy.
            Return STRICT JSON with confidence scores for each category; no prose.`
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        timeout: 15000 // 15 seconds timeout for the OpenAI request
      });

      // Race between the analysis and the timeout
      const response = await Promise.race([
        analysisRequest,
        timeoutPromise.then(() => {
          throw new Error('Analysis timed out while processing');
        })
      ]);

      // Parse and validate the response
      try {
        const result = JSON.parse(response.choices[0].message.content);

        // Enhance the result with Lightcast data if available
        if (lightcastResults) {
          // Merge Lightcast skills with AI-extracted skills
          const lightcastSkills = lightcastResults.skills.map(skill => ({
            skill: skill.name,
            normalized_skill: skill.name,
            category: skill.type || 'technical',
            confidence: skill.confidence || 0.8,
            source: 'lightcast'
          }));

          result.SKILLS_MENTIONED = [
            ...(result.SKILLS_MENTIONED || []),
            ...lightcastSkills
          ];

          // Add career paths from Lightcast if available
          if (lightcastResults.careerPaths && lightcastResults.careerPaths.length > 0) {
            const lightcastCareerPaths = lightcastResults.careerPaths.map(path => ({
              target_role: path.title || path.name,
              industry: path.industry || 'technology',
              timeframe_hint: '6-12 months',
              confidence: 0.8,
              source: 'lightcast'
            }));

            result.CAREER_ASPIRATIONS = [
              ...(result.CAREER_ASPIRATIONS || []),
              ...lightcastCareerPaths
            ];
          }
        }

        return {
          ...defaultResponse,
          ...result,
          SUMMARY: {
            ...defaultResponse.SUMMARY,
            ...(result.SUMMARY || {}),
            lightcast_processed: !!lightcastResults
          }
        };
      } catch (parseError) {
        console.error('Failed to parse analysis response:', parseError);
        return {
          ...defaultResponse,
          SUMMARY: {
            ...defaultResponse.SUMMARY,
            analysis_status: 'completed_with_errors',
            error: 'Failed to parse analysis response'
          }
        };
      }
    } catch (error) {
      console.error('Enhanced journal analysis error:', error);
      return {
        ...defaultResponse,
        SUMMARY: {
          ...defaultResponse.SUMMARY,
          analysis_status: 'failed',
          error: error.message || 'Unknown error during analysis'
        }
      };
    }
  }

  // Update evolving user career profile and analysis history with ONET-aligned skills
  async updateCareerProfileFromJournal(userId, extraction, journalEntryId, entryDate) {
    try {
      const normalizedSkills = (extraction.SKILLS_MENTIONED || []).map(s => ({
        skill: s.skill,
        normalized_skill: this.normalizeSkillToONET(s.normalized_skill || s.skill),
        category: s.category || 'unspecified',
        confidence: s.confidence ?? 0.5,
        lastMentioned: new Date(entryDate || Date.now())
      }));

      const skillGaps = (extraction.SKILL_GAPS || []).map(g => ({
        skill: this.normalizeSkillToONET(g.skill),
        urgency: g.urgency || 'medium',
        identifiedDate: new Date(entryDate || Date.now()),
        marketDemand: g.market_demand || 'medium',
        confidence: g.confidence ?? 0.5
      }));

      const frustrations = (extraction.FRUSTRATIONS || []).map(f => ({
        frustration: f.frustration,
        frequency: f.frequency_hint || 1,
        sentiment: typeof f.sentiment === 'number' ? f.sentiment : 0,
        firstMentioned: new Date(entryDate || Date.now())
      }));

      const aspirationsFirst = (extraction.CAREER_ASPIRATIONS || [])[0] || {};
      const trajectory = Object.keys(aspirationsFirst).length ? {
        currentRole: undefined,
        targetRole: aspirationsFirst.target_role || undefined,
        timeframe: aspirationsFirst.timeframe_hint || undefined
      } : undefined;

      // Build knowledge items
      const knowledgeItems = [];
      (extraction.SUMMARY?.key_themes || []).forEach(theme => {
        knowledgeItems.push({
          insight: theme,
          source: journalEntryId,
          confidence: 0.7,
          category: 'learning',
          actionable: false
        });
      });
      (extraction.SUMMARY?.action_items || []).forEach(act => {
        knowledgeItems.push({
          insight: act,
          source: journalEntryId,
          confidence: 0.8,
          category: 'skills',
          actionable: true
        });
      });

      // Apply updates
      const update = {};
      if (normalizedSkills.length) update['careerProfile.currentSkills'] = normalizedSkills;
      if (skillGaps.length) update['careerProfile.skillGaps'] = skillGaps;
      if (frustrations.length) update['careerProfile.careerFrustrations'] = frustrations;
      if (trajectory) update['careerProfile.careerTrajectory'] = trajectory;
      if (knowledgeItems.length) update['knowledgeItems'] = knowledgeItems;
      update['lastUpdated'] = new Date();

      await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: update, $push: {
            analysisHistory: {
              source: 'journal',
              journal_entry_id: journalEntryId,
              summary_sentiment: extraction.SUMMARY?.sentiment ?? 0,
              extracted_at: new Date(),
              model: this._getModel()
            }
          }
        },
        { upsert: true }
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Career profile update failed:', e?.message || e);
    }
  }

  // Basic skill normalization toward ONET naming (placeholder for future mapping)
  normalizeSkillToONET(name) {
    if (!name) return '';
    const s = String(name).trim().toLowerCase();
    const map = {
      'ml': 'machine learning',
      'ai': 'artificial intelligence',
      'llm': 'natural language processing',
      'reactjs': 'react',
      'nodejs': 'node.js'
    };
    return (map[s] || s).replace(/\s+/g, ' ').trim();
  }

  // ==================== ENHANCED GOAL SETTING ====================
  async setCareerGoals(userId, careerGoals) {
    try {
      console.log('Received career goals:', JSON.stringify(careerGoals, null, 2));

      // Transform frontend format to match schema
      // Frontend sends: { title, description, target_date, priority, specific_actions, market_relevance }
      // Schema expects: { goal, timeline, priority }
      const transformGoal = (goal) => {
        // If already in correct format, return as-is
        if (goal.goal && goal.timeline !== undefined) {
          return {
            goal: goal.goal,
            timeline: goal.timeline,
            priority: goal.priority || 5
          };
        }
        // Transform from frontend format
        return {
          goal: goal.title || goal.goal || '',
          timeline: goal.description || goal.timeline || goal.target_date || '',
          priority: goal.priority || 5
        };
      };

      const goalsToSave = {
        short_term: (careerGoals.short_term || []).map(transformGoal),
        long_term: (careerGoals.long_term || []).map(transformGoal),
        priority_areas: (careerGoals.priority_areas || []).map(area => {
          if (typeof area === 'string') {
            return { area, weight: 50 };
          }
          return area;
        }),
        timeline: careerGoals.timeline || null
      };

      // Update user profile directly with the provided goals
      const updatedProfile = await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            'career_goals': goalsToSave,
            'last_activity': new Date()
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log('Updated profile with goals:', JSON.stringify(updatedProfile.career_goals, null, 2));

      // Try to enhance goals with market context in the background
      // but don't let it block the response
      this.enhanceGoalsWithMarketContext(careerGoals, userId)
        .then(enhancedGoals => {
          // Update with enhanced goals if successful
          return UserCareerProfile.findOneAndUpdate(
            { user_id: userId },
            {
              $set: {
                'career_goals.enhanced': enhancedGoals,
                'last_activity': new Date()
              }
            }
          );
        })
        .catch(error => {
          console.error('Background goal enhancement failed:', error);
          // Non-critical error, just log it
        });

      return {
        success: true,
        goals: goalsToSave,
        message: 'Career goals saved successfully. Market analysis will be updated shortly.'
      };

    } catch (error) {
      console.error('Error in setCareerGoals:', error);
      throw new Error(`Failed to set career goals: ${error.message}`);
    }
  }

  async enhanceGoalsWithMarketContext(goals, userId) {
    try {
      // Get user's current skills and experience
      const userProfile = await this.getUserCareerProfile(userId);
      const skills = Object.keys(userProfile?.resume_analysis?.skills_heat_map || {});

      // Get market data for goal validation
      const marketData = await this.marketIntelligence.getSkillsDemand(skills);

      const response = await this.openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: `You are a professional career coach helping users set realistic, market-aligned career goals. 
            Consider current market trends, skill demand, and the user's background. 
            Enhance goals with specific timelines, measurable outcomes, and market relevance. Return JSON format.`
          },
          {
            role: "user",
            content: `Enhance these career goals with market context and return JSON with:
            {
              "short_term": [{"goal": "string", "timeline": "string", "priority": number, "market_relevance": "high|medium|low", "specific_actions": [string]}],
              "long_term": [{"goal": "string", "timeline": "string", "priority": number, "market_relevance": "high|medium|low", "specific_actions": [string]}],
              "priority_areas": [{"area": "string", "weight": number, "market_demand": "high|medium|low"}],
              "timeline": "6-months|1-year|2-years|5-years",
              "market_alignment": {"overall_score": number, "in_demand_skills_to_learn": [string], "growth_areas": [string]}
            }
            
            Original Goals: ${JSON.stringify(goals, null, 2)}
            User Skills: ${skills.join(', ')}
            Market Data: ${JSON.stringify(marketData, null, 2)}`
          }
        ],
        temperature: 0.6,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Goal enhancement error:', error);
      return goals; // Return original goals if enhancement fails
    }
  }

  // ==================== PROACTIVE RECOMMENDATIONS ====================
  async generateProactiveRecommendations(userId, type = 'daily') {
    try {
      // Respect consent
      const user = await User.findById(userId).select('aiCoachConsent').lean();
      const consent = user?.aiCoachConsent || {};
      if (!consent.enabled) {
        return { success: false, recommendations: [], count: 0, reason: 'consent_disabled' };
      }

      // Get comprehensive user data
      const userProfile = consent.scopes?.goals || consent.scopes?.resume
        ? await this.getUserCareerProfile(userId)
        : {};

      // Ensure user_id is set in profile
      if (!userProfile.user_id && !userProfile._id && !userProfile.userId) {
        userProfile.user_id = userId;
      }

      const recentEntries = consent.scopes?.journals
        ? await this.getRecentJournalEntries(userId, 5)
        : [];
      const marketData = await this.getRelevantMarketData(userProfile);

      // Generate recommendations using enhanced LLM
      const recommendations = await this.generateRecommendationsWithMarketContext({
        userProfile,
        recentEntries,
        marketData,
        type
      });

      // Check if recommendations were generated
      if (!recommendations || recommendations.length === 0) {
        console.warn(`[Generate Recommendations] No recommendations generated for user ${userId}, type: ${type}`);
        return {
          success: true,
          recommendations: [],
          count: 0,
          message: 'No recommendations generated. Try updating your profile, goals, or journal entries.',
          market_context: marketData.length > 0
        };
      }

      // Store recommendations and vectorize (if consent allows tasks)
      const savedRecommendations = await AIRecommendation.insertMany(recommendations);
      try {
        if (consent.scopes?.tasks) {
          // Ensure vectorDB is initialized before using it
          if (!this._vectorDB) {
            await this._getVectorDB();
          }
          if (this.vectorDB) {
            await this.vectorDB.storeRecommendations(userId, recommendations);
          }
        }
      } catch (vectorError) {
        console.warn('[Generate Recommendations] Failed to vectorize recommendations:', vectorError?.message || vectorError);
      }

      // Log generation event
      try {
        const { WebhookLog } = await import('../../models/aiCareerCoach.model.js');
        await WebhookLog.create({
          webhook_id: `gen_${Date.now()}`,
          user_id: userId,
          event_type: 'recommendation_generation',
          payload: { type, count: savedRecommendations.length },
          status: 'completed',
          response: { ok: true },
        });
      } catch (e) {
        console.warn('Failed to log recommendation generation:', e?.message || e);
      }

      return {
        success: true,
        recommendations: savedRecommendations,
        count: savedRecommendations.length,
        market_context: marketData.length > 0
      };
    } catch (error) {
      console.error('Generate proactive recommendations error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Fetch stored AI recommendations for a user.
   * This does NOT call the LLM; it only reads from Mongo.
   */
  async getRecommendations({ userId, type = 'all', limit = 50 }) {
    try {
      const query = { user_id: userId };
      if (type && type !== 'all') {
        query.type = type;
      }

      const recommendations = await AIRecommendation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        recommendations,
        total_count: recommendations.length
      };
    } catch (error) {
      console.error('Get recommendations error (enhanced):', error);
      throw new Error('Failed to retrieve recommendations');
    }
  }

  async getDashboardOverview(userId) {
    try {
      await this._ensureDependencies();

      // 1. Fetch recent applications
      const recentApplications = await Application.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean();

      // 2. Fetch recent journal entries
      const recentJournals = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(5)
        .lean();

      // 3. Fetch user profile for roadmap milestones
      const userProfile = await UserCareerProfile.findOne({ user_id: userId }).lean();
      let upcomingMilestones = [];
      let nextTasks = [];

      // Check if user has a roadmap
      const roadmap = userProfile?.progress_roadmap;
      const hasRoadmap = roadmap && roadmap.phases && roadmap.phases.length > 0;

      if (hasRoadmap) {
        // Extract milestones
        if (roadmap.milestones) {
          upcomingMilestones = roadmap.milestones
            .filter(m => m.status === 'upcoming' || m.status === 'in_progress')
            .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
            .slice(0, 3);
        }

        // Generate tasks from current phase
        const currentPhase = roadmap.phases.find(p => !p.completed) || roadmap.phases[0];
        if (currentPhase) {
          const taskList = [];

          // 1. Use explicit tasks if available
          if (currentPhase.tasks && Array.isArray(currentPhase.tasks) && currentPhase.tasks.length > 0) {
            currentPhase.tasks.slice(0, 4).forEach((task, i) => {
              const taskText = typeof task === 'string' ? task : (task.title || task.description || task);
              taskList.push({
                id: `roadmap_task_${i}`,
                title: taskText,
                description: currentPhase.description || `From ${currentPhase.title} phase`,
                completed: false,
                priority: 'high',
                duration: currentPhase.weeks ? `${currentPhase.weeks} weeks` : '1-2h',
                action: () => { } // Will be handled by frontend navigation
              });
            });
          }

          // 2. Convert goals to tasks if no explicit tasks
          if (taskList.length === 0 && currentPhase.goals && Array.isArray(currentPhase.goals)) {
            currentPhase.goals.slice(0, 4).forEach((goal, i) => {
              const goalText = typeof goal === 'string' ? goal : (goal.title || goal.description || goal);
              taskList.push({
                id: `roadmap_goal_${i}`,
                title: goalText,
                description: `Key objective from ${currentPhase.title}`,
                completed: false,
                priority: 'high',
                duration: currentPhase.weeks ? `${currentPhase.weeks} weeks` : '2-3h',
                action: () => { }
              });
            });
          }

          // 3. Use skills as learning tasks if still no tasks
          if (taskList.length === 0 && currentPhase.skills && Array.isArray(currentPhase.skills)) {
            currentPhase.skills.slice(0, 4).forEach((skill, i) => {
              const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || skill);
              taskList.push({
                id: `roadmap_skill_${i}`,
                title: `Learn ${skillName}`,
                description: `Develop this skill for ${currentPhase.title}`,
                completed: false,
                priority: 'medium',
                duration: '3-5h',
                action: () => { }
              });
            });
          }

          nextTasks = taskList;
        }
      } else {
        // No roadmap - show onboarding tasks
        const hasProfile = userProfile?.persona_profile?.target_role;
        const hasResume = userProfile?.resume_analysis?.skills_heat_map &&
          Object.keys(userProfile.resume_analysis.skills_heat_map).length > 0;

        nextTasks = [
          {
            id: 'onboard_profile',
            title: 'Complete your profile',
            description: 'Add your skills, experience, and education',
            completed: hasProfile,
            priority: 'high',
            duration: '5 min',
            action: () => { }
          },
          {
            id: 'onboard_resume',
            title: 'Upload your resume',
            description: 'Let AI analyze your resume for insights',
            completed: hasResume,
            priority: 'high',
            duration: '2 min',
            action: () => { }
          },
          {
            id: 'onboard_goal',
            title: 'Set your career goal',
            description: 'Define where you want to be',
            completed: hasProfile,
            priority: 'medium',
            duration: '3 min',
            action: () => { }
          },
          {
            id: 'onboard_jobs',
            title: 'Explore job recommendations',
            description: 'Find jobs matching your profile',
            completed: false,
            priority: 'medium',
            duration: '10 min',
            action: () => { }
          }
        ].filter(t => !t.completed).slice(0, 4);
      }

      // Combine Activities (Applications + Journals)
      // Note: We don't include future milestones in "Recent Activity" usually, only past actions
      const activities = [
        ...recentApplications.map(app => ({
          type: 'application',
          title: `Applied to ${app.jobTitle}`, // cleaner title
          description: `at ${app.companyName} • Status: ${app.status.replace(/_/g, ' ')}`,
          timestamp: app.updatedAt,
          id: app._id,
          metadata: { status: app.status }
        })),
        ...recentJournals.map(entry => ({
          type: 'journal',
          title: entry.metadata?.title || 'Journal Entry', // Will be sanitized on frontend
          description: entry.content ? entry.content.substring(0, 100) : '',
          timestamp: entry.metadata?.date || entry.createdAt,
          id: entry._id,
          mood: entry.metadata?.sentiment > 0.3 ? 'Positive' : (entry.metadata?.sentiment < -0.3 ? 'Negative' : 'Neutral')
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      return {
        activities,
        nextTasks,
        stats: {
          applicationsCount: recentApplications.length,
          journalCount: recentJournals.length
        }
      };

    } catch (error) {
      console.error('Get dashboard overview error:', error);
      return { activities: [], nextTasks: [], stats: {} };
    }
  }

  async generateRecommendationsWithMarketContext({ userProfile, recentEntries, marketData, type, persona, timeBudget }) {
    try {
      await this._ensureDependencies();

      // Log what data we have for debugging
      console.log(`[Generate Recommendations] Type: ${type}, Profile keys: ${Object.keys(userProfile || {}).join(', ')}, Entries: ${recentEntries?.length || 0}, Market data: ${marketData?.length || 0}`);

      const weeklyHours = timeBudget
        || userProfile?.learning_preferences?.weekly_hours
        || userProfile?.learning_preferences?.weekly_time
        || 6; // conservative default

      const skillEffortText = await this._buildSkillEffortSummary(
        Object.keys(userProfile?.resume_analysis?.skills_heat_map || {}).slice(0, 10)
      );

      // Build a more informative prompt even with minimal data
      const hasProfileData = userProfile && Object.keys(userProfile).length > 0;
      const hasJournalData = recentEntries && recentEntries.length > 0;
      const hasMarketData = marketData && marketData.length > 0;

      if (!hasProfileData && !hasJournalData && !hasMarketData) {
        console.warn('[Generate Recommendations] Insufficient data: no profile, journal entries, or market data');
        // Return some default recommendations even with minimal data
        return [{
          user_id: userProfile?.user_id || userProfile?._id || userProfile?.userId,
          recommendation_id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          priority: 'medium',
          title: 'Complete Your Career Profile',
          description: 'Add your career goals, skills, and preferences to receive personalized recommendations.',
          action_items: [{ item: 'Update your career profile', completed: false }],
          category: 'career_planning',
          estimated_time: '15 minutes',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ai_generated: true,
          generation_reason: 'Insufficient profile data to generate personalized recommendations',
          relevance_score: 0.5,
          market_relevance: '',
          success_metrics: []
        }];
      }

      const response = await this.openai.chat.completions.create({
        model: this._getModel(),
        messages: [
          {
            role: "system",
            content: `You are a professional career coach with deep analytical skills and extensive knowledge of job market trends. 
            Generate proactive, personalized career recommendations based on user data and current market intelligence. 
            Be specific, actionable, and forward-thinking. Consider market demand, skill trends, career growth opportunities, and respect the user's weekly time budget. 
            Do not over-schedule: keep weekly workload within 0.7x - 1.1x of the provided hours/week. If a task is too large, break it down or extend the timeline.
            IMPORTANT: Output pure, valid JSON only. Do not include chain-of-thought traces or <think> tags in your response.`
          },
          {
            role: "user",
            content: `Generate ${type} career recommendations based on this comprehensive data:
            
            USER PROFILE:
            ${JSON.stringify(userProfile, null, 2)}
            
            RECENT JOURNAL ENTRIES:
            ${recentEntries.map(entry => entry.content).join('\n\n')}
            
            MARKET DATA:
            ${JSON.stringify(marketData, null, 2)}

            PERSONA (optional):
            ${JSON.stringify(persona || {}, null, 2)}

            LEARNING BUDGET (hours per week): ${weeklyHours}

            SKILL EFFORT ESTIMATES (hours to competency):
            ${skillEffortText || 'none available'}
            
            Return JSON array of recommendations:
            [{
              "title": "string",
              "description": "string",
              "action_items": ["item1", "item2"],
              "category": "skills|networking|portfolio|learning|job_search|career_planning",
              "priority": "low|medium|high|urgent",
              "estimated_time": "string",
              "due_date": "ISO date string",
              "market_relevance": "string",
              "reasoning": "string (include why this fits the user's weekly time budget)",
              "success_metrics": ["metric1", "metric2"]
            }]`
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      });

      let content = response.choices[0].message.content;

      // Sanitize: Remove <think> tags and markdown code blocks
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      content = content.replace(/```json\n?|```/g, '').trim();

      // Sometimes models add a prefix like "Here is the JSON:"
      const jsonStartIndex = content.indexOf('[');
      const jsonEndIndex = content.lastIndexOf(']');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        content = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      let recommendations;
      try {
        recommendations = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse recommendations JSON:', parseError);
        console.error('Raw content:', content);
        return [];
      }

      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        console.warn('[Generate Recommendations] LLM returned empty or invalid recommendations array');
        return [];
      }

      return recommendations.map(rec => ({
        user_id: userProfile?.user_id || userProfile?._id || userProfile?.userId,
        recommendation_id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        priority: rec.priority || 'medium',
        title: rec.title || 'Untitled Recommendation',
        description: rec.description || '',
        action_items: (rec.action_items || []).map(item => ({ item, completed: false })),
        category: rec.category || 'career_planning',
        estimated_time: rec.estimated_time || '1-2 weeks',
        due_date: rec.due_date ? new Date(rec.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ai_generated: true,
        generation_reason: rec.reasoning || '',
        relevance_score: this.calculateRelevanceScore(rec),
        market_relevance: rec.market_relevance || '',
        success_metrics: rec.success_metrics || []
      }));
    } catch (error) {
      console.error('Generate recommendations with market context error:', error);
      return [];
    }
  }

  // ==================== MARKET CONTEXT INTEGRATION ====================
  async getMarketContextForSkills(skills) {
    try {
      const marketIntel = this._marketIntelligence;
      const marketData = await MarketDataCache.getSkillDemand(
        skills,
        () => marketIntel.getSkillsDemand(skills)
      );
      return marketData;
    } catch (error) {
      console.error('Get market context error:', error);
      return { results: [], metadatas: [], distances: [] };
    }
  }

  async getRelevantMarketData(userProfile) {
    try {
      // Extract key terms from user profile
      const vectorDB = await this._getVectorDB();
      const profileText = vectorDB.createUserProfileText(userProfile);
      const keyTerms = vectorDB.extractKeyTerms(profileText);

      // Search for relevant market data
      const marketIntel = this._marketIntelligence;
      const marketData = await marketIntel.getMarketInsights(
        keyTerms.join(' '),
        10
      );

      return marketData.results || [];
    } catch (error) {
      console.error('Get relevant market data error:', error);
      return [];
    }
  }

  // ==================== KNOWLEDGE SHELF AGGREGATOR ====================
  async getKnowledgeShelfData(userId) {
    try {
      const [
        journalEntries,
        uploadSummaries,
        journalRecommendations,
        kbItems,
        profile
      ] = await Promise.all([
        // 1. Processed Insights (Journals)
        JournalEntry.find({
          user_id: userId
        })
          .sort({ 'metadata.date': -1 })
          .limit(10)
          .lean(),

        // 1b. Processed Insights (Upload Summaries from KnowledgeBase)
        KnowledgeBase.find({
          content_id: { $regex: new RegExp(`^kb_${userId.toString()}_upload_summary_`) },
          source_url: { $regex: /^internal:\/\/document\// }
        })
          .sort({ last_updated: -1 })
          .limit(10)
          .lean(),

        // 1c. Processed Insights (Journal Recommendations - moved from Document Feedback)
        CareerRecommendation.find({
          user: userId,
          source: 'journal',
          isArchived: false
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        // 2. Research Deck (External KB) - Only user-specific research items
        KnowledgeBase.find({
          // Only show user-specific research items - no global fallback
          content_id: { $regex: new RegExp(`^kb_${userId.toString()}_research_`) }
        })
          .sort({ last_updated: -1 })
          .limit(10)
          .lean(),

        // 3. Progress (Roadmap)
        UserCareerProfile.findOne({ user_id: userId }).select('progress_roadmap').lean()
      ]);

      // Transform Processed Insights - combine journals and upload summaries
      // Only show summaries/insights, NOT raw entries
      const journalProcessed = journalEntries
        .filter(entry => entry.ai_insights?.summary || entry.ai_insights?.key_themes?.length > 0) // Only entries with analysis
        .map(entry => ({
          id: entry._id,
          title: entry.metadata?.title || `Journal Insight: ${new Date(entry.metadata?.date || entry.createdAt).toLocaleDateString()}`,
          content: '', // Don't show raw content
          summary: entry.ai_insights?.summary ||
            (entry.ai_insights?.key_themes?.length > 0
              ? `Key themes: ${entry.ai_insights.key_themes.join(', ')}`
              : 'Analyzed entry'),
          sentiment: entry.metadata?.sentiment,
          topics: entry.ai_insights?.key_themes || [],
          tags: entry.metadata?.tags || entry.metadata?.topics || [],
          updatedAt: entry.metadata?.date || entry.createdAt,
          type: 'journal'
        }));

      const uploadProcessed = uploadSummaries.map(item => {
        // Parse content to extract structured data if available
        let parsedContent = item.content;
        let skills = [];
        let summary = item.content?.substring(0, 200) || 'Upload summary';

        // Try to extract skills from content if it's structured
        if (typeof item.content === 'string') {
          // Check if content contains Skills: line
          const skillsMatch = item.content.match(/Skills:\s*(.+?)(?:\n|$)/i);
          if (skillsMatch) {
            const skillsText = skillsMatch[1].trim();
            if (skillsText !== 'N/A') {
              skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
            }
          }

          // Try to parse as JSON if it looks like structured data
          if (item.content.trim().startsWith('{') || item.content.trim().startsWith('[')) {
            try {
              parsedContent = JSON.parse(item.content);
              if (parsedContent.skills) {
                skills = Array.isArray(parsedContent.skills)
                  ? parsedContent.skills.map(s => typeof s === 'string' ? s : (s?.name || s?.skill || s?.keyword))
                  : [];
              }
              if (parsedContent.summary) {
                summary = typeof parsedContent.summary === 'string'
                  ? parsedContent.summary
                  : JSON.stringify(parsedContent.summary);
              }
            } catch (e) {
              // Not JSON, keep as string
            }
          }
        }

        return {
          id: item._id,
          title: item.title || 'Upload Analysis',
          content: typeof parsedContent === 'string' ? parsedContent.substring(0, 150) + '...' : JSON.stringify(parsedContent).substring(0, 150) + '...',
          summary: summary,
          skills: skills, // Add extracted skills
          topics: item.relevance_tags?.filter(tag => tag !== 'upload' && tag !== 'processed_insight') || [],
          tags: item.relevance_tags || [],
          updatedAt: item.last_updated,
          type: 'upload'
        };
      });

      // Transform journal recommendations (moved from Document Feedback)
      const journalRecProcessed = journalRecommendations.map(rec => ({
        id: rec._id,
        title: rec.content?.suggestions?.[0]?.title || 'Career Insight',
        content: '',
        summary: rec.content?.summary ||
          (rec.content?.suggestions?.length > 0
            ? rec.content.suggestions.map(s => s.title).join(', ')
            : 'Journal-based career insight'),
        topics: rec.content?.skills || [],
        tags: ['journal', 'career_suggestion', ...(rec.content?.suggestions?.map(s => s.title) || [])],
        updatedAt: rec.createdAt,
        type: 'journal_recommendation'
      }));

      // Combine and sort by date (newest first)
      const allProcessed = [...journalProcessed, ...uploadProcessed, ...journalRecProcessed].sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0);
        const dateB = new Date(b.updatedAt || 0);
        return dateB - dateA;
      });

      const processed = {
        entries: allProcessed.slice(0, 20) // Limit to 20 most recent
      };

      // Transform Research Deck - include URL for clickable links
      console.log(`[KB Shelf] Found ${kbItems.length} research items for user ${userId}`);
      const research = {
        entries: kbItems.map(item => {
          // Extract URL from source_url if available
          let url = null;
          if (item.source_url && item.source_url.startsWith('external://')) {
            // Try to reconstruct URL from stored data or use source_url
            url = item.url || item.source_url.replace('external://', 'https://');
          }

          return {
            id: item._id,
            title: item.title,
            summary: item.content?.substring(0, 200) + '...',
            content: item.content, // Full content for display
            type: item.content_type,
            tags: item.relevance_tags,
            url: url, // Add URL for clickable links
            source: item.source || extractSourceFromUrl(url),
            updatedAt: item.last_updated
          };
        })
      };

      // If no research items, trigger research refresh in background
      if (research.entries.length === 0) {
        console.log(`[KB Shelf] No research items found, triggering research refresh for user ${userId}`);
        // Trigger research in background (don't wait)
        setImmediate(() => {
          this.refreshKnowledgeBase(userId).catch(err => {
            console.warn('[KB Shelf] Failed to trigger research refresh:', err.message);
          });
        });
      }

      // Helper to extract source name from URL
      function extractSourceFromUrl(url) {
        if (!url) return 'External Source';
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

      // Transform Progress Trail - FIXED: Connect to milestones_completed, show full info, individual dates
      const roadmap = profile?.progress_roadmap || {};
      const milestones = roadmap.milestones || [];
      const completedMilestones = profile?.progress_tracking?.milestones_completed || [];

      // Create a map of completed milestones for quick lookup
      const completedMap = new Map();
      completedMilestones.forEach(completed => {
        completedMap.set(completed.milestone, completed.completed_at);
      });

      // Calculate progress percentage
      const totalMilestones = milestones.length;
      const completedCount = milestones.filter(ms =>
        ms.status === 'completed' || completedMap.has(ms.milestone_id)
      ).length;
      const progressPercentage = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

      // Transform milestones with full information
      const progressEntries = milestones.map(ms => {
        const isCompleted = ms.status === 'completed' || completedMap.has(ms.milestone_id);
        const completedAt = completedMap.get(ms.milestone_id) || (isCompleted ? ms.updatedAt || roadmap.generated_at : null);

        return {
          id: ms.milestone_id,
          title: ms.title,
          description: ms.description || '',
          outcome: ms.outcome || '',
          summary: ms.description ? `${ms.description.substring(0, 150)}...` : `Status: ${ms.status} | Priority: ${ms.priority}`,
          status: isCompleted ? 'completed' : ms.status || 'upcoming',
          priority: ms.priority || 'medium',
          week_span: ms.week_span || 1,
          due_date: ms.due_date ? new Date(ms.due_date).toISOString() : null,
          estimated_hours: ms.estimated_hours || 0,
          skills: ms.skills || [],
          prerequisites: ms.prerequisites || [],
          checkpoints: ms.checkpoints || [],
          success_metrics: ms.success_metrics || [],
          resources: ms.resources || [],
          confidence: ms.confidence || 0.7,
          evidence: ms.evidence || '',
          completedAt: completedAt ? new Date(completedAt).toISOString() : null,
          tags: [ms.status || 'upcoming', ms.priority || 'medium', ...(ms.skills || []).slice(0, 2)],
          updatedAt: completedAt || ms.updatedAt || roadmap.generated_at || new Date()
        };
      });

      // Sort: completed first (by completion date), then by priority, then by due date
      progressEntries.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        if (a.status === 'completed' && b.status === 'completed') {
          return new Date(b.completedAt) - new Date(a.completedAt);
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        return 0;
      });

      const progress = {
        entries: progressEntries.slice(0, 20), // Show more milestones
        stats: {
          total: totalMilestones,
          completed: completedCount,
          in_progress: milestones.filter(ms => ms.status === 'in_progress').length,
          upcoming: milestones.filter(ms => ms.status === 'upcoming').length,
          blocked: milestones.filter(ms => ms.status === 'blocked').length,
          progressPercentage
        },
        roadmapSummary: roadmap.summary || '',
        generatedAt: roadmap.generated_at ? new Date(roadmap.generated_at).toISOString() : null,
        nextCheckIn: roadmap.next_check_in ? new Date(roadmap.next_check_in).toISOString() : null
      };

      // Transform Signals (Document Feedback) - FIXED: Show structured recommendations with categories, match scores, status
      // First, try to find by content_id pattern
      let documentFeedbackItems = await KnowledgeBase.find({
        content_id: { $regex: new RegExp(`^kb_${userId.toString()}_doc_feedback_`) }
      })
        .sort({ last_updated: -1 })
        .limit(20)
        .lean();

      // If no results, try broader search (in case relevance_tags weren't set correctly)
      if (documentFeedbackItems.length === 0) {
        documentFeedbackItems = await KnowledgeBase.find({
          $or: [
            { content_id: { $regex: new RegExp(`^kb_${userId.toString()}_doc_feedback_`) } },
            {
              source_url: { $regex: /^internal:\/\/document\// },
              $or: [
                { relevance_tags: { $in: ['document_feedback'] } },
                { relevance_tags: { $in: ['resume', 'cover_letter', 'portfolio'] } }
              ]
            }
          ]
        })
          .sort({ last_updated: -1 })
          .limit(20)
          .lean();
      }

      console.log(`[KB Shelf] Found ${documentFeedbackItems.length} document feedback items for user ${userId}`);

      const signalEntries = documentFeedbackItems.map(item => {
        // Parse structured recommendations from content
        let parsedContent = item.content;
        let recommendations = [];
        let overallAssessment = null;
        let documentType = 'resume';
        let documentId = null;

        // Try to parse JSON content
        if (typeof item.content === 'string' && (item.content.trim().startsWith('{') || item.content.trim().startsWith('['))) {
          try {
            parsedContent = JSON.parse(item.content);
            if (parsedContent.recommendations) {
              recommendations = Array.isArray(parsedContent.recommendations) ? parsedContent.recommendations : [];
            }
            if (parsedContent.overall_assessment) {
              overallAssessment = parsedContent.overall_assessment;
            }
          } catch (e) {
            // If parsing fails, treat as string
            parsedContent = item.content;
          }
        }

        // Extract document info from metadata or source_url
        const sourceMatch = item.source_url?.match(/internal:\/\/document\/([^\/]+)/);
        if (sourceMatch) {
          documentId = sourceMatch[1];
        }

        // Determine document type from tags or content
        if (item.relevance_tags?.includes('cover_letter')) documentType = 'cover_letter';
        else if (item.relevance_tags?.includes('portfolio')) documentType = 'portfolio';
        else documentType = 'resume';

        // Get status from metadata (new, reviewed, addressed, dismissed)
        const status = item.metadata?.feedback_status || 'new';

        // Calculate overall match score from recommendations or assessment
        let matchScore = null;
        if (overallAssessment?.keyword_match_score !== undefined) {
          matchScore = overallAssessment.keyword_match_score;
        } else if (overallAssessment?.ats_compatibility_score !== undefined) {
          matchScore = overallAssessment.ats_compatibility_score;
        } else if (recommendations.length > 0) {
          // Calculate average match score from recommendations
          const scores = recommendations
            .filter(r => r.match_score !== undefined)
            .map(r => r.match_score);
          if (scores.length > 0) {
            matchScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          }
        }

        // Group recommendations by category
        const recommendationsByCategory = {
          keyword_gap: recommendations.filter(r => r.category === 'keyword_gap'),
          content_enhancement: recommendations.filter(r => r.category === 'content_enhancement'),
          formatting: recommendations.filter(r => r.category === 'formatting'),
          career_gap: recommendations.filter(r => r.category === 'career_gap')
        };

        // Count by priority
        const priorityCounts = {
          high: recommendations.filter(r => r.priority === 'high').length,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length
        };

        return {
          id: item._id,
          title: item.title || 'Document Feedback',
          documentType,
          documentId,
          summary: overallAssessment?.summary ||
            (recommendations.length > 0
              ? `${recommendations.length} recommendations across ${Object.keys(recommendationsByCategory).filter(k => recommendationsByCategory[k].length > 0).length} categories`
              : (typeof parsedContent === 'string' ? parsedContent.substring(0, 200) : 'No feedback available')),
          content: parsedContent, // Full structured content
          recommendations: recommendations, // Structured recommendations array
          recommendationsByCategory, // Grouped by category
          overallAssessment, // Overall scores and summary
          matchScore, // Overall match score (0-100)
          priorityCounts, // Count of high/medium/low priority items
          status, // new, reviewed, addressed, dismissed
          skills: recommendations
            .flatMap(r => r.missing_keywords || [])
            .filter((v, i, a) => a.indexOf(v) === i) // Unique skills
            .slice(0, 10),
          tags: [
            documentType,
            ...item.relevance_tags?.filter(tag => tag !== 'document_feedback') || [],
            ...(matchScore !== null ? [`match_${matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : 'low'}`] : []),
            status
          ],
          updatedAt: item.last_updated,
          createdAt: item.createdAt || item.last_updated
        };
      });

      // REMOVED: Fake fallback entry - instead show empty state message
      // If no feedback exists, the frontend will show "Upload document for feedback"

      const signals = {
        entries: signalEntries,
        stats: {
          total: signalEntries.length,
          byStatus: {
            new: signalEntries.filter(e => e.status === 'new').length,
            reviewed: signalEntries.filter(e => e.status === 'reviewed').length,
            addressed: signalEntries.filter(e => e.status === 'addressed').length,
            dismissed: signalEntries.filter(e => e.status === 'dismissed').length
          },
          byType: {
            resume: signalEntries.filter(e => e.documentType === 'resume').length,
            cover_letter: signalEntries.filter(e => e.documentType === 'cover_letter').length,
            portfolio: signalEntries.filter(e => e.documentType === 'portfolio').length
          },
          byPriority: {
            high: signalEntries.reduce((sum, e) => sum + (e.priorityCounts?.high || 0), 0),
            medium: signalEntries.reduce((sum, e) => sum + (e.priorityCounts?.medium || 0), 0),
            low: signalEntries.reduce((sum, e) => sum + (e.priorityCounts?.low || 0), 0)
          }
        }
      };

      return {
        processed,
        research,
        progress,
        signals
      };

    } catch (error) {
      console.error('Get knowledge shelf data error:', error);
      // Return empty structure on error to prevent UI crash
      return {
        processed: { entries: [] },
        research: { entries: [] },
        progress: { entries: [] },
        signals: { entries: [] }
      };
    }
  }

  // ==================== PERSONA & ROADMAP BUILDER ====================
  async setPersonaAssessment(userId, assessment = {}) {
    try {
      const persona = this._sanitizePersonaAssessment(assessment);
      const update = {
        persona_profile: persona,
        onboarding_completed: true,
        'progress_tracking.last_activity': new Date()
      };

      if (persona.weekly_time) {
        update['learning_preferences.weekly_hours'] = persona.weekly_time;
      }
      if (persona.learning_style) {
        update['learning_preferences.frequency'] = persona.learning_style === 'structured' ? 'weekly' : 'bi-weekly';
      }

      const profile = await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        persona: profile?.persona_profile,
        weekly_hours: profile?.learning_preferences?.weekly_hours || persona.weekly_time || 6
      };
    } catch (error) {
      console.error('Set persona assessment error:', error);
      throw new Error(`Failed to save assessment: ${error.message}`);
    }
  }

  async getPersonaProfile(userId) {
    const profile = await UserCareerProfile.findOne({ user_id: userId }).lean();
    return profile?.persona_profile || null;
  }

  async getCareerRoadmap(userId) {
    const profile = await UserCareerProfile.findOne({ user_id: userId }).lean();
    return profile?.progress_roadmap || null;
  }

  async generateAdaptiveRoadmap(userId, options = {}) {
    await this._ensureDependencies();
    const profile = await this.getUserCareerProfile(userId);
    const persona = profile?.persona_profile;

    if (!persona || !persona.stage) {
      throw new Error('persona_required');
    }

    const weeklyHours = persona.weekly_time
      || profile?.learning_preferences?.weekly_hours
      || this._clampHours(options.timeBudget)
      || 6;

    const recentEntries = await this.getRecentJournalEntries(userId, 8);
    const marketData = await this.getRelevantMarketData(profile);
    const focusSkills = [
      persona.focus_area,
      persona.target_role,
      ...Object.keys(profile?.resume_analysis?.skills_heat_map || {})
    ].filter(Boolean);
    const skillEffortText = await this._buildSkillEffortSummary(focusSkills);

    const response = await this.openai.chat.completions.create({
      model: this._getModel(),
      temperature: 0.3, // Lower temp for more deterministic JSON
      max_tokens: 8000,
      messages: [
        {
          role: 'system',
          content: `You are an elite AI career coach. You MUST return valid JSON only. Do not output any conversational text, markdown formatting, or explanations. 
          Your response must start with { and end with }. 
          Design a highly personalized roadmap for ${profile.name || 'the user'} targeting the role of "${persona.target_role || 'their dream job'}".
          Fit the plan within ${weeklyHours} hours/week.
          
          ADJUSTMENT INSTRUCTION: ${options.reason === 'extend_timeline' ? 'The user feels the previous timeline was too compressed. Extend the duration of phases, reduce weekly load, and focus on foundational depth.' : options.reason === 'intensify_timeline' ? 'The user wants a challenge. Increase the pace, add advanced topics, and slightly aggressively impactful projects.' : ''}

          JSON SCHEMA:
          {
            "userId": "string",
            "targetRole": "${persona.target_role}",
            "title": "Roadmap to becoming a ${persona.target_role}",
            "summary": "Personalized summary addressing ${profile.name || 'the user'}",
            "rationale": "Explanation of why this pace and structure fits the user",
            "horizon_weeks": 12,
            "next_check_in": "YYYY-MM-DD",
            "phases": [{
              "title": "Phase Title",
              "description": "Description",
              "weeks": 4,
              "hours": 10,
              "goals": ["Goal 1"],
              "tasks": ["Task 1"],
              "skills": ["Skill 1"],
              "checkpoints": ["Checkpoint 1"],
              "prerequisites": [],
              "evidence": "Why this is needed",
              "resources": [
                { "title": "Resource Title", "type": "course|book|video|article", "url": "URL if known or null" }
              ]
            }],
            "milestones": []
          }`
        },
        {
          role: 'user',
          content: `Build a ${options.horizon || '6-8'} week roadmap for this user.
          
Persona:
${JSON.stringify(persona, null, 2)}

Weekly Hours Available: ${weeklyHours}

User Profile Snapshot:
${JSON.stringify({
            resume_analysis: profile?.resume_analysis || {},
            career_goals: profile?.career_goals || {}
          }, null, 2)}

Recent Journal Highlights:
${recentEntries.map(entry => entry.content).join('\n\n')}

Market Signals:
${JSON.stringify(marketData, null, 2)}

Skill Effort Estimates:
${skillEffortText || 'Not available'}

Constraints:
- CRITICAL: Generate 3-4 phases minimum for a ${options.horizon || '6-8'} week roadmap. Each phase should be 2-3 weeks long.
- Do not exceed 1.1x the weekly hours budget in any phase.
- Include evidence or reasoning for each phase/milestone referencing market data or skill effort.
- Ensure prerequisites precede dependent work.
- CRITICAL: Provide at least 2 specific learning resources (courses, books, videos, articles) for EVERY phase. Be specific with titles.
- Each phase must have: title, description, weeks (2-3), goals (2-3), tasks (3-5), skills (3-5), and resources.

RETURN JSON ONLY.`
        }
      ]
    });

    let content = response.choices?.[0]?.message?.content || '{}';

    // Robust parsing: Find the first '{' and last '}'
    const firstOpen = content.indexOf('{');
    const lastClose = content.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      content = content.substring(firstOpen, lastClose + 1);
    } else {
      // Fallback for cleaning markdown if braces aren't clear
      content = content.replace(/```json\n?|```/g, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error('Roadmap JSON parse failed:', error?.message || error);
      // Try one more cleanup: aggressive escape of newlines inside strings might be needed, but usually the substring fix is enough.
      console.error('Raw content (extracted):', content);
      throw new Error('roadmap_parse_failed');
    }

    const normalized = this._normalizeRoadmapResponse(parsed, {
      persona,
      weeklyHours,
      previousVersion: profile?.progress_roadmap?.version || 0
    });

    await UserCareerProfile.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          progress_roadmap: normalized,
          'progress_tracking.last_activity': new Date()
        }
      },
      { new: true }
    );

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'aiCoachState.lastRoadmapRefreshAt': new Date(),
          'aiCoachState.roadmapVersion': normalized.version
        }
      });

    // Enrich roadmap with skill requirement validation (async, non-blocking)
    this._enrichRoadmapWithSkillValidation(userId, normalized).catch(err => {
      console.warn('[Roadmap] Skill validation enrichment failed (non-blocking):', err.message);
    });

    return normalized;
  }

  /**
   * Enrich roadmap with skill requirement validation using Lightcast and Serper
   * @private
   */
  async _enrichRoadmapWithSkillValidation(userId, roadmap) {
    try {
      const { default: SkillRequirementChecker } = await import('../../services/SkillRequirementChecker.service.js');
      const checker = new SkillRequirementChecker(process.env.SERPER_API_KEY);

      const enrichedRoadmap = await checker.checkRoadmapSkills(roadmap);

      // Update roadmap in database with skill validation data
      await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            'progress_roadmap.skillValidation': enrichedRoadmap.skillValidation,
            'progress_roadmap.phases': enrichedRoadmap.phases
          }
        }
      );

      return enrichedRoadmap;
    } catch (error) {
      console.error('[Roadmap] Skill validation error:', error);
      // Don't throw - this is enrichment, not critical
      return roadmap;
    }
  }

  _normalizeRoadmapResponse(raw, { persona, weeklyHours, previousVersion }) {
    const now = new Date();
    const version = (previousVersion || 0) + 1;
    const phases = Array.isArray(raw?.phases) ? raw.phases : [];
    const normalizedPhases = phases.map((phase, idx) => ({
      title: phase.title || `Phase ${idx + 1}`,
      duration: phase.duration || `${phase.weeks || 1} week${(phase.weeks || 1) > 1 ? 's' : ''}`,
      description: phase.description || phase.summary || '',
      goals: this._flattenToStrings(phase.goals || phase.outcomes),
      tasks: this._flattenToStrings(phase.tasks || phase.steps),
      skills: this._flattenToStrings(phase.skills || phase.focus_skills),
      checkpoints: this._flattenToStrings(phase.checkpoints),
      hours_planned: this._clampHours(Number(phase.hours || phase.estimated_hours) || weeklyHours) || weeklyHours,
      evidence: phase.evidence || phase.reasoning || ''
    }));

    const sourceMilestones = Array.isArray(raw?.milestones) && raw.milestones.length > 0
      ? raw.milestones
      : normalizedPhases;

    const normalizedMilestones = sourceMilestones.map((milestone, idx) => ({
      milestone_id: milestone.milestone_id || milestone.id || `ms_${Date.now()}_${idx} `,
      title: milestone.title || normalizedPhases[idx]?.title || `Milestone ${idx + 1} `,
      description: milestone.description || milestone.summary || '',
      outcome: milestone.outcome || milestone.goal || '',
      priority: milestone.priority || 'medium',
      estimated_hours: this._clampHours(Number(milestone.hours || milestone.estimated_hours) || weeklyHours),
      week_span: milestone.weeks || milestone.week_span || normalizedPhases[idx]?.weeks || 1,
      due_date: milestone.due_date ? new Date(milestone.due_date) : new Date(now.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000),
      prerequisites: this._flattenToStrings(milestone.prerequisites),
      skills: this._flattenToStrings(milestone.skills || normalizedPhases[idx]?.skills),
      checkpoints: this._flattenToStrings(milestone.checkpoints),
      success_metrics: this._flattenToStrings(milestone.success_metrics),
      confidence: typeof milestone.confidence === 'number' ? milestone.confidence : 0.7,
      evidence: milestone.evidence || milestone.reasoning || '',
      status: 'upcoming',
      resources: Array.isArray(milestone.resources)
        ? milestone.resources.slice(0, 4).map(res => ({
          title: res.title || res.name || 'Suggested resource',
          link: res.link || res.url || '',
          type: res.type || 'course',
          estimated_hours: this._clampHours(res.estimated_hours || res.hours || weeklyHours / 2),
          source: res.source || 'serper'
        }))
        : []
    }));

    return {
      version,
      persona_stage: persona.stage,
      targetRole: persona.target_role || '',
      summary: raw?.summary || `Roadmap toward ${persona.target_role || 'your goal'} `,
      horizon_weeks: raw?.horizon_weeks || this._computeHorizonWeeks(normalizedPhases),
      weekly_hours_budget: weeklyHours,
      generated_at: now,
      next_check_in: raw?.next_check_in ? new Date(raw.next_check_in) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      milestones: normalizedMilestones,
      phases: normalizedPhases
    };
  }

  // ==================== KNOWLEDGE BASE BUILDER ====================
  async refreshKnowledgeBase(userId) {
    // Requires consent: knowledgeBase plus at least one of resume/journals/goals
    const user = await (await import('../../models/user.model.js')).User.findById(userId).select('aiCoachConsent aiCoachState').lean();
    const consent = user?.aiCoachConsent || {};
    if (!consent.enabled || !consent.scopes?.knowledgeBase) {
      return { success: false, reason: 'consent_disabled' };
    }
    const canUseUserData = !!(consent.scopes?.resume || consent.scopes?.journals || consent.scopes?.goals);
    if (!canUseUserData) {
      return { success: false, reason: 'no_user_data_scope' };
    }

    await this._ensureDependencies();

    // Collect deltas since last refresh
    const lastAt = user?.aiCoachState?.lastKbRefreshAt ? new Date(user.aiCoachState.lastKbRefreshAt) : new Date(0);
    const profile = await this.getUserCareerProfile(userId);
    const recentEntries = await this.getRecentJournalEntries(userId, 20);
    const changedEntries = recentEntries.filter(e => new Date(e.updatedAt || e.createdAt) > lastAt);

    // Build source text corpus
    const profileText = canUseUserData ? this.vectorDB.createUserProfileText(profile) : '';
    const journalText = consent.scopes?.journals ? changedEntries.map(e => e.content).join('\n\n') : '';

    // External market intel
    const marketData = await this.getRelevantMarketData(profile);
    const marketText = (marketData || []).map(r => typeof r === 'string' ? r : JSON.stringify(r)).join('\n');

    // External research via Serper API (enhanced) or Wikipedia fallback
    let researchData = [];
    try {
      const { searchCareerGrowthResources, saveResearchToKnowledgeBase } = await import('./enhancedResearch.service.js');
      const vectorDB = this._vectorDB;
      const keyTerms = vectorDB.extractKeyTerms(vectorDB.createUserProfileText(profile));

      // Get user skills, target role, and industry from profile
      // Priority: persona_profile > userProfile > derived from target_role
      const skills = Object.keys(profile?.resume_analysis?.skills_heat_map || {});
      const targetRole = profile?.persona_profile?.target_role ||
        profile?.career_goals?.target_role ||
        '';

      // Get industry: from persona_profile, or userProfile, or derive from target_role
      let industry = profile?.persona_profile?.industry ||
        profile?.industry ||
        '';

      // If still no industry, derive it from target_role
      if (!industry && targetRole) {
        industry = this._mapRoleToIndustry(targetRole);
        // Optionally save the derived industry back to persona_profile
        if (profile?.persona_profile && !profile.persona_profile.industry) {
          try {
            await UserCareerProfile.updateOne(
              { user_id: userId },
              { $set: { 'persona_profile.industry': industry } }
            );
          } catch (e) {
            console.warn('[Research] Failed to save derived industry:', e.message);
          }
        }
      }

      // Use scheduler to determine which categories to query today
      const { ResearchScheduler } = await import('./researchScheduler.service.js');
      const scheduler = new ResearchScheduler();
      const categoriesToQuery = scheduler.getCategoriesForToday();

      // Check if we should refresh (avoid too frequent updates)
      const lastRefresh = user?.aiCoachState?.lastResearchRefreshAt;
      const shouldRefresh = !lastRefresh || scheduler.shouldRefresh(lastRefresh, 24); // 24 hour threshold

      // Search for career growth resources using Serper API with scheduled categories
      const researchItems = shouldRefresh ? await searchCareerGrowthResources({
        skills: skills.slice(0, 5),
        targetRole,
        industry,
        limit: 10,
        categories: categoriesToQuery // Use scheduler-determined categories
      }) : [];

      // Save to KnowledgeBase for Research Deck
      if (researchItems.length > 0) {
        await saveResearchToKnowledgeBase(userId, researchItems);
        researchData = researchItems.map(item => ({
          title: item.title,
          source: item.source,
          content: item.content,
          url: item.url
        }));

        // Update last refresh timestamp
        await (await import('../../models/user.model.js')).User.updateOne(
          { _id: userId },
          { $set: { 'aiCoachState.lastResearchRefreshAt': new Date() } }
        );
      } else {
        // Fallback to Wikipedia if Serper fails
        const { getExternalResearchData } = await import('./research.service.js');
        researchData = await getExternalResearchData({ profileTerms: keyTerms, limit: 5 });
      }
    } catch (e) {
      console.warn('External research fetch failed:', e?.message || e);
    }

    const corpus = [profileText, journalText, marketText].filter(Boolean).join('\n\n');
    if (!corpus.trim()) {
      await (await import('../../models/user.model.js')).User.updateOne({ _id: userId }, { $set: { 'aiCoachState.lastKbRefreshAt': new Date() } });
      return { success: true, updated: 0 };
    }

    // Ask LLM to extract concise knowledge items
    // LLM call with timeout and basic retry
    const createWithTimeout = async (payload, timeoutMs = 20000) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await this.openai.chat.completions.create({ ...payload, signal: ctrl.signal });
      } finally {
        clearTimeout(t);
      }
    };

    let response;
    let attempts = 0;
    const maxAttempts = 2;
    let lastErr;

    while (attempts < maxAttempts) {
      try {
        response = await createWithTimeout({
          model: this._getModel(),
          messages: [
            { role: 'system', content: 'Extract concise knowledge items to aid a career coach. Return JSON array of items: [{"title":"","content":"","tags":[""],"category":"skills|industry|learning|job_market","source":"profile|journal|market"}]' },
            { role: 'user', content: `Source corpus: \n${corpus} \n\nExternal research(summarized): \n${researchData.map(r => `- ${r.title} (${r.source}): ${r.content}`).join('\n')} \n\nReturn 5 - 15 high - value items.Prefer items aligned with the user's goals and market.` }
          ],
          temperature: 0.3,
          max_tokens: 1200
        }, 20000);
        break;
      } catch (e) {
        lastErr = e;
        attempts++;
        if (attempts >= maxAttempts) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    let items = [];
    try { items = JSON.parse(response.choices[0].message.content); } catch (_) { items = []; }
    if (!Array.isArray(items)) items = [];

    // Upsert into KnowledgeBase with embeddings
    const { KnowledgeBase } = await import('../../models/aiCareerCoach.model.js');
    let updated = 0;
    for (const it of items) {
      try {
        const title = it.title?.slice(0, 140) || 'Insight';
        const text = it.content || JSON.stringify(it);
        const vec = await this.vectorDB.generateEmbedding(text);
        const contentId = `kb_${userId}_${Buffer.from(title).toString('base64').slice(0, 24)}`;
        await KnowledgeBase.updateOne(
          { content_id: contentId },
          {
            $set: {
              content_vector: vec,
              source_url: it.source || 'internal://kb',
              content_type: 'article',
              title,
              content: text,
              relevance_tags: Array.isArray(it.tags) ? it.tags : [],
              category: it.category && ['skills', 'interview', 'networking', 'salary', 'industry', 'leadership'].includes(it.category) ? it.category : 'industry',
              last_updated: new Date()
            }
          },
          { upsert: true }
        );
        updated += 1;
      } catch (e) {
        console.warn('KB upsert failed:', e?.message || e);
      }
    }

    await (await import('../../models/user.model.js')).User.updateOne({ _id: userId }, { $set: { 'aiCoachState.lastKbRefreshAt': new Date() } });
    return { success: true, updated };
  }

  // ==================== UTILITY METHODS ====================
  enhanceAnalysisWithMarketData(analysis, marketContext) {
    // Enhance skills with market demand data
    if (analysis.skills_heat_map && marketContext.results) {
      const marketSkills = marketContext.results.reduce((acc, result) => {
        // Extract skills from market data
        return acc;
      }, {});

      // Update skills heat map with market context
      Object.keys(analysis.skills_heat_map).forEach(skill => {
        if (marketSkills[skill]) {
          analysis.skills_heat_map[skill] = {
            proficiency: analysis.skills_heat_map[skill],
            market_demand: marketSkills[skill]
          };
        }
      });
    }

    return analysis;
  }

  calculateRelevanceScore(recommendation) {
    // Calculate relevance score based on various factors
    let score = 0.5; // Base score

    if (recommendation.priority === 'urgent') score += 0.3;
    else if (recommendation.priority === 'high') score += 0.2;
    else if (recommendation.priority === 'medium') score += 0.1;

    if (recommendation.market_relevance === 'high') score += 0.2;
    else if (recommendation.market_relevance === 'medium') score += 0.1;

    return Math.min(score, 1.0);
  }

  async vectorizeUserProfile(userId, profileData) {
    try {
      await this.vectorDB.vectorizeUserProfile(userId, profileData);
    } catch (error) {
      console.error('Vectorize user profile error:', error);
    }
  }

  async triggerProactiveAnalysis(userId) {
    try {
      // Trigger immediate proactive analysis for significant insights
      await this.generateProactiveRecommendations(userId, 'proactive');
    } catch (error) {
      console.error('Trigger proactive analysis error:', error);
    }
  }

  async generateGoalBasedRecommendations(userId, goals) {
    try {
      // Generate initial recommendations based on new goals
      const recommendations = await this.generateRecommendationsWithMarketContext({
        userProfile: { career_goals: goals },
        recentEntries: [],
        marketData: [],
        type: 'milestone'
      });

      await this.vectorDB.storeRecommendations(userId, recommendations);
    } catch (error) {
      console.error('Generate goal-based recommendations error:', error);
    }
  }

  // ==================== JOURNAL ENTRY METHODS ====================
  async getJournalEntries({ userId, limit = 50, skip = 0, sort = { 'metadata.date': -1 }, filter = {} }) {
    const query = { user_id: userId, ...filter };

    const entries = await JournalEntry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return entries.map(entry => ({
      id: entry._id,
      entry_id: entry.entry_id,
      content: entry.content,
      entry_date: entry.metadata?.date || entry.createdAt,
      tags: entry.metadata?.tags || [],
      word_count: entry.metadata?.word_count,
      reading_time: entry.metadata?.reading_time,
      sentiment: entry.metadata?.sentiment,
      topics: entry.metadata?.topics || [],
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
      ai_insights: entry.ai_insights || {}
    }));
  }

  async countJournalEntries({ userId, filter = {} }) {
    const query = { user_id: userId, ...filter };
    return JournalEntry.countDocuments(query);
  }

  async updateJournalEntry(entryId, updateData) {
    try {
      const updatedEntry = await JournalEntry.findOneAndUpdate(
        { entry_id: entryId },
        { $set: updateData },
        { new: true }
      );

      if (!updatedEntry) {
        throw new Error('Journal entry not found');
      }

      return updatedEntry;
    } catch (error) {
      console.error('Update journal entry error:', error);
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }
  }

  // ==================== EXISTING METHODS (ENHANCED) ====================
  async getUserCareerProfile(userId) {
    try {
      let profile = await UserCareerProfile.findOne({ user_id: userId }).lean();

      if (!profile) {
        profile = new UserCareerProfile({
          user_id: userId,
          resume_analysis: {},
          career_goals: {},
          learning_preferences: {
            content_types: ['article', 'course'],
            frequency: 'weekly',
            notification_settings: {
              email: true,
              push: false,
              sms: false,
              timezone: 'UTC'
            }
          },
          progress_tracking: {
            milestones_completed: [],
            skill_improvements: new Map(),
            journal_consistency: 0,
            last_activity: new Date()
          }
        });
        await profile.save();
        profile = profile.toObject(); // Convert to plain object if newly created
      }

      // Fetch user knowledge base questions from User model
      const { User } = await import('../../models/user.model.js');
      const user = await User.findById(userId).select('aiCoachProfile.knowledge_base_questions').lean();
      if (user?.aiCoachProfile?.knowledge_base_questions) {
        profile.knowledge_base_questions = user.aiCoachProfile.knowledge_base_questions;
      }

      return profile;
    } catch (error) {
      console.error('Get career profile error:', error);
      throw new Error('Failed to retrieve career profile');
    }
  }

  async getRecentJournalEntries(userId, limit = 5) {
    try {
      const entries = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(limit);

      return entries;
    } catch (error) {
      console.error('Get recent journal entries error:', error);
      return [];
    }
  }

  async updateJournalConsistency(userId) {
    try {
      const entries = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(30);

      if (entries.length === 0) return;

      const days = 30;
      const entryCount = entries.length;
      const consistency = Math.min(entryCount / (days / 7), 1);

      await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            'progress_tracking.journal_consistency': consistency,
            'progress_tracking.last_activity': new Date()
          }
        }
      );
    } catch (error) {
      console.error('Update journal consistency error:', error);
    }
  }

  // ==================== MARKET INSIGHTS (CAREER PATHS / SKILL GAPS / TRENDS) ====================
  async getCareerPaths(userId, targetRoleInput) {
    await this._ensureDependencies();

    const profile = await UserCareerProfile.findOne({ user_id: userId }).lean();
    // Priority: 1. Input parameter, 2. Roadmap target role, 3. Persona profile target role, 4. Default
    const targetRole = (targetRoleInput || profile?.progress_roadmap?.targetRole || profile?.persona_profile?.target_role || 'Software Engineer').trim();
    const industry = profile?.persona_profile?.industry || this._mapRoleToIndustry(targetRole);

    const baseSkills = Object.keys(profile?.resume_analysis?.skills_heat_map || {});
    // Top skills the user actually has
    const skillsHave = baseSkills.slice(0, 15);

    const cacheKey = `${CACHE_KEYS.CAREER_PATHWAYS}:${userId}:${targetRole.toLowerCase()}:v2`;

    return cache.getOrCreate(cacheKey, async () => {
      try {
        console.log(`Generating AI career path for ${targetRole} with skills: ${skillsHave.join(', ')}`);

        const prompt = `
          As an expert AI Career Coach using Lightcast-grade market data, generate a career path tree for a user targeting the role of "${targetRole}".
          
          User's Current Top Skills: ${JSON.stringify(skillsHave)}
          Target Industry: ${industry}

          Requirements:
          1. Create a hierarchical career path starting from the user's potential entry/current point up to the "${targetRole}" and beyond (to executive levels).
          2. The tree should have at least 3 levels of depth and multiple branches where relevant (e.g. IC track vs Management track).
          3. Crucial: For each node, include "skills_needed" (key skills for that role).
          4. "unlocked" should be true if the user has > 60% of the skills needed.
          5. Include valid "children" arrays for the tree structure.
          
          Return ONLY valid JSON matching this structure:
          {
            "name": "Root Role Name",
            "proficiency": "Entry/Junior/Senior",
            "skills_needed": ["Skill A", "Skill B"],
            "skills_have": ["Skill A"],
            "unlocked": true,
            "children": [ ... ]
          }
        `;

        const completion = await this.openai.chat.completions.create({
          model: this._getModel(), // Use configured model (defaults to deepseek/deepseek-r1-distill-qwen-32b)
          messages: [
            { role: "system", content: "You are a precise data engine for career pathing. Output JSON only." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        });

        const data = JSON.parse(completion.choices[0].message.content);
        return data;
      } catch (error) {
        console.error('Error generating AI career path:', error);
        // Fallback to role-aware tree if AI fails
        const gaps = (profile?.resume_analysis?.identified_gaps || []).map(s => s.skill).filter(Boolean);
        const skillsNeeded = gaps.length ? gaps : ['System Design', 'Cloud Architecture', 'Leadership'];

        // Determine role progression based on target role
        const roleWords = targetRole.toLowerCase().split(' ');
        const isEngineer = roleWords.some(w => ['engineer', 'developer', 'programmer'].includes(w));
        const isManager = roleWords.some(w => ['manager', 'director', 'lead', 'head'].includes(w));
        const isScientist = roleWords.some(w => ['scientist', 'researcher', 'analyst'].includes(w));
        const isDesigner = roleWords.some(w => ['designer', 'architect'].includes(w));

        // Generate role-appropriate progression paths
        let nextLevelRoles = [];
        let executiveRoles = [];

        if (isEngineer) {
          nextLevelRoles = [`Senior ${targetRole}`, `Lead ${targetRole}`];
          executiveRoles = ['Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'Director of Engineering'];
        } else if (isManager) {
          nextLevelRoles = [`Senior ${targetRole}`, `VP ${targetRole}`];
          executiveRoles = ['Director', 'VP', 'Chief Operating Officer'];
        } else if (isScientist) {
          nextLevelRoles = [`Senior ${targetRole}`, `Principal ${targetRole}`];
          executiveRoles = ['Research Lead', 'Principal Researcher', 'Research Director', 'Chief Scientist'];
        } else if (isDesigner) {
          nextLevelRoles = [`Senior ${targetRole}`, `Lead ${targetRole}`];
          executiveRoles = ['Principal Designer', 'Design Director', 'Head of Design', 'Chief Design Officer'];
        } else {
          // Generic progression
          nextLevelRoles = [`Senior ${targetRole}`, `Lead ${targetRole}`];
          executiveRoles = [`Principal ${targetRole}`, `${targetRole} Director`, `Head of ${targetRole}`, `VP ${targetRole}`];
        }

        const makeNode = (name, depth, extra = {}) => ({
          name,
          unlocked: depth <= 1,
          skills_have: skillsHave.slice(0, Math.max(2, 6 - depth)),
          skills_needed: skillsNeeded.slice(0, Math.max(2, 4 - depth)),
          children: [],
          ...extra
        });

        return {
          name: targetRole,
          unlocked: true,
          skills_have: skillsHave,
          skills_needed: skillsNeeded,
          children: [
            makeNode(nextLevelRoles[0] || `Senior ${targetRole}`, 1, {
              children: executiveRoles.slice(0, 2).map(role => makeNode(role, 2))
            }),
            nextLevelRoles[1] ? makeNode(nextLevelRoles[1], 1, {
              children: executiveRoles.slice(2, 4).map(role => makeNode(role, 2))
            }) : null
          ].filter(Boolean)
        };
      }
    }, CACHE_TTL.MARKET_DATA || 3600);
  }

  async getSkillGaps(userId, targetRoleInput) {
    await this._ensureDependencies();

    const profile = await UserCareerProfile.findOne({ user_id: userId }).lean();
    // Priority: 1. Input parameter, 2. Roadmap target role, 3. Persona profile target role, 4. Default
    const targetRole = (targetRoleInput || profile?.progress_roadmap?.targetRole || profile?.persona_profile?.target_role || 'Software Engineer').trim();
    const currentSkills = Object.entries(profile?.resume_analysis?.skills_heat_map || {})
      .sort(([, a], [, b]) => b - a)
      .map(([skill, proficiency]) => ({ name: skill, proficiency }));

    // Expanded role-to-skills mapping with categories and importance
    const roleSkillMap = {
      'software engineer': [
        { name: 'System Design', importance: 5, category: 'Technical' },
        { name: 'TypeScript', importance: 4, category: 'Technical' },
        { name: 'Cloud Architecture', importance: 5, category: 'Technical' },
        { name: 'Security', importance: 4, category: 'Technical' },
        { name: 'Data Structures', importance: 5, category: 'Technical' },
        { name: 'Algorithms', importance: 5, category: 'Technical' },
        { name: 'Observability', importance: 4, category: 'Technical' },
        { name: 'Docker', importance: 4, category: 'Tools' },
        { name: 'Kubernetes', importance: 3, category: 'Tools' },
        { name: 'AWS', importance: 4, category: 'Tools' },
        { name: 'CI/CD', importance: 4, category: 'Tools' },
        { name: 'Git', importance: 5, category: 'Tools' },
        { name: 'Code Review', importance: 4, category: 'Soft Skills' },
        { name: 'Mentoring', importance: 3, category: 'Soft Skills' },
        { name: 'Agile', importance: 4, category: 'Soft Skills' }
      ],
      'data scientist': [
        { name: 'Python', importance: 5, category: 'Technical' },
        { name: 'Machine Learning', importance: 5, category: 'Technical' },
        { name: 'SQL', importance: 5, category: 'Technical' },
        { name: 'Statistics', importance: 5, category: 'Technical' },
        { name: 'MLOps', importance: 4, category: 'Technical' },
        { name: 'Deep Learning', importance: 4, category: 'Technical' },
        { name: 'Experimentation', importance: 4, category: 'Technical' },
        { name: 'Pandas', importance: 5, category: 'Tools' },
        { name: 'NumPy', importance: 4, category: 'Tools' },
        { name: 'Scikit-learn', importance: 4, category: 'Tools' },
        { name: 'TensorFlow', importance: 3, category: 'Tools' },
        { name: 'PyTorch', importance: 3, category: 'Tools' },
        { name: 'Jupyter', importance: 4, category: 'Tools' },
        { name: 'Data Visualization', importance: 4, category: 'Technical' },
        { name: 'A/B Testing', importance: 3, category: 'Technical' }
      ],
      'product manager': [
        { name: 'Product Strategy', importance: 5, category: 'Domain' },
        { name: 'Roadmapping', importance: 5, category: 'Domain' },
        { name: 'Stakeholder Management', importance: 5, category: 'Soft Skills' },
        { name: 'Analytics', importance: 4, category: 'Technical' },
        { name: 'User Research', importance: 5, category: 'Domain' },
        { name: 'Agile', importance: 4, category: 'Soft Skills' },
        { name: 'SQL', importance: 3, category: 'Technical' },
        { name: 'A/B Testing', importance: 4, category: 'Technical' },
        { name: 'Wireframing', importance: 3, category: 'Tools' },
        { name: 'Figma', importance: 3, category: 'Tools' },
        { name: 'Presentation Skills', importance: 4, category: 'Soft Skills' },
        { name: 'Negotiation', importance: 4, category: 'Soft Skills' }
      ],
      'ai researcher': [
        { name: 'Python', importance: 5, category: 'Technical' },
        { name: 'Machine Learning', importance: 5, category: 'Technical' },
        { name: 'Deep Learning', importance: 5, category: 'Technical' },
        { name: 'Neural Networks', importance: 5, category: 'Technical' },
        { name: 'Research Methodology', importance: 5, category: 'Domain' },
        { name: 'Academic Writing', importance: 5, category: 'Domain' },
        { name: 'PyTorch', importance: 5, category: 'Tools' },
        { name: 'TensorFlow', importance: 4, category: 'Tools' },
        { name: 'JAX', importance: 3, category: 'Tools' },
        { name: 'CUDA', importance: 3, category: 'Tools' },
        { name: 'LaTeX', importance: 4, category: 'Tools' },
        { name: 'Statistical Analysis', importance: 5, category: 'Technical' },
        { name: 'Experimental Design', importance: 5, category: 'Domain' },
        { name: 'Paper Review', importance: 4, category: 'Domain' },
        { name: 'Grant Writing', importance: 3, category: 'Domain' },
        { name: 'Collaboration', importance: 4, category: 'Soft Skills' },
        { name: 'Problem Solving', importance: 5, category: 'Soft Skills' },
        { name: 'Critical Thinking', importance: 5, category: 'Soft Skills' }
      ],
      'ai engineer': [
        { name: 'Python', importance: 5, category: 'Technical' },
        { name: 'Machine Learning', importance: 5, category: 'Technical' },
        { name: 'Deep Learning', importance: 5, category: 'Technical' },
        { name: 'MLOps', importance: 5, category: 'Technical' },
        { name: 'Model Deployment', importance: 5, category: 'Technical' },
        { name: 'PyTorch', importance: 5, category: 'Tools' },
        { name: 'TensorFlow', importance: 4, category: 'Tools' },
        { name: 'Hugging Face', importance: 4, category: 'Tools' },
        { name: 'Docker', importance: 4, category: 'Tools' },
        { name: 'Kubernetes', importance: 3, category: 'Tools' },
        { name: 'Cloud Platforms', importance: 4, category: 'Tools' },
        { name: 'Data Engineering', importance: 4, category: 'Technical' },
        { name: 'Model Monitoring', importance: 4, category: 'Technical' },
        { name: 'A/B Testing', importance: 3, category: 'Technical' },
        { name: 'System Design', importance: 4, category: 'Technical' }
      ],
      'finance analyst': [
        { name: 'Financial Analysis', importance: 5, category: 'Technical' },
        { name: 'Financial Modeling', importance: 5, category: 'Technical' },
        { name: 'Excel', importance: 5, category: 'Tools' },
        { name: 'Financial Statements', importance: 5, category: 'Technical' },
        { name: 'Ratio Analysis', importance: 5, category: 'Technical' },
        { name: 'Budgeting', importance: 4, category: 'Technical' },
        { name: 'Forecasting', importance: 4, category: 'Technical' },
        { name: 'SQL', importance: 4, category: 'Technical' },
        { name: 'Data Analysis', importance: 4, category: 'Technical' },
        { name: 'Power BI', importance: 3, category: 'Tools' },
        { name: 'Tableau', importance: 3, category: 'Tools' },
        { name: 'Accounting Principles', importance: 4, category: 'Domain' },
        { name: 'Financial Reporting', importance: 4, category: 'Technical' },
        { name: 'Risk Analysis', importance: 4, category: 'Technical' },
        { name: 'Presentation Skills', importance: 4, category: 'Soft Skills' },
        { name: 'Communication', importance: 4, category: 'Soft Skills' }
      ],
      'financial analyst': [
        { name: 'Financial Analysis', importance: 5, category: 'Technical' },
        { name: 'Financial Modeling', importance: 5, category: 'Technical' },
        { name: 'Excel', importance: 5, category: 'Tools' },
        { name: 'Financial Statements', importance: 5, category: 'Technical' },
        { name: 'Ratio Analysis', importance: 5, category: 'Technical' },
        { name: 'Budgeting', importance: 4, category: 'Technical' },
        { name: 'Forecasting', importance: 4, category: 'Technical' },
        { name: 'SQL', importance: 4, category: 'Technical' },
        { name: 'Data Analysis', importance: 4, category: 'Technical' },
        { name: 'Power BI', importance: 3, category: 'Tools' },
        { name: 'Tableau', importance: 3, category: 'Tools' },
        { name: 'Accounting Principles', importance: 4, category: 'Domain' },
        { name: 'Financial Reporting', importance: 4, category: 'Technical' },
        { name: 'Risk Analysis', importance: 4, category: 'Technical' },
        { name: 'Presentation Skills', importance: 4, category: 'Soft Skills' },
        { name: 'Communication', importance: 4, category: 'Soft Skills' }
      ]
    };

    // Normalize target role for lookup
    const normalizedRole = targetRole.toLowerCase();
    const roleKey = Object.keys(roleSkillMap).find(key =>
      normalizedRole.includes(key) || key.includes(normalizedRole.split(' ')[0])
    );

    // If role doesn't match any known role, return empty skills with a message
    if (!roleKey) {
      return {
        targetRole,
        currentSkills: currentSkills.map(s => ({ ...s, category: s.category || this._categorizeSkill(s.name) })),
        requiredSkills: [],
        gapSkills: [],
        skillCategories: {},
        message: `We don't have a predefined skill set for "${targetRole}". Please update your target role or contact support to add this role.`
      };
    }

    const requiredSkills = roleSkillMap[roleKey];

    // Normalize skill names for comparison (handle synonyms)
    const normalizeSkillName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const haveNames = new Set(currentSkills.map(s => normalizeSkillName(s.name)));

    // Find gaps - check both exact match and normalized match
    const gapSkills = requiredSkills
      .filter(s => {
        const normalized = normalizeSkillName(s.name);
        return !Array.from(haveNames).some(have =>
          have === normalized ||
          have.includes(normalized) ||
          normalized.includes(have)
        );
      })
      .map(s => ({
        ...s,
        priority: s.importance >= 5 ? 'critical' : s.importance >= 4 ? 'high' : 'medium'
      }));

    // Calculate category coverage
    const skillCategories = {};
    requiredSkills.forEach(skill => {
      const cat = skill.category || 'Other';
      if (!skillCategories[cat]) {
        skillCategories[cat] = { have: 0, needed: 0 };
      }
      skillCategories[cat].needed++;

      const hasSkill = currentSkills.some(cs =>
        normalizeSkillName(cs.name) === normalizeSkillName(skill.name) ||
        normalizeSkillName(cs.name).includes(normalizeSkillName(skill.name)) ||
        normalizeSkillName(skill.name).includes(normalizeSkillName(cs.name))
      );
      if (hasSkill) {
        skillCategories[cat].have++;
      }
    });

    Object.keys(skillCategories).forEach(cat => {
      const catData = skillCategories[cat];
      catData.coverage = catData.needed > 0
        ? Math.round((catData.have / catData.needed) * 100)
        : 0;
    });

    return {
      targetRole,
      currentSkills: currentSkills.map(s => ({ ...s, category: s.category || this._categorizeSkill(s.name) })),
      requiredSkills,
      gapSkills,
      skillCategories
    };
  }

  _categorizeSkill(skillName) {
    if (!skillName) return 'Other';
    const name = skillName.toLowerCase();
    if (name.includes('python') || name.includes('javascript') || name.includes('java') ||
      name.includes('algorithm') || name.includes('data structure') || name.includes('system design') ||
      name.includes('machine learning') || name.includes('deep learning') || name.includes('neural network') ||
      name.includes('sql') || name.includes('statistics') || name.includes('security') ||
      name.includes('cloud') || name.includes('architecture')) {
      return 'Technical';
    }
    if (name.includes('docker') || name.includes('kubernetes') || name.includes('aws') ||
      name.includes('git') || name.includes('ci/cd') || name.includes('pytorch') ||
      name.includes('tensorflow') || name.includes('jax') || name.includes('cuda') ||
      name.includes('latex') || name.includes('hugging face') || name.includes('pandas') ||
      name.includes('numpy') || name.includes('jupyter') || name.includes('figma')) {
      return 'Tools';
    }
    if (name.includes('communication') || name.includes('leadership') || name.includes('mentor') ||
      name.includes('collaboration') || name.includes('presentation') || name.includes('problem solving') ||
      name.includes('critical thinking') || name.includes('stakeholder') || name.includes('negotiation')) {
      return 'Soft Skills';
    }
    return 'Domain';
  }

  async getIndustryTrends() {
    await this._ensureDependencies();
    try {
      const trends = await this._marketIntelligence.analyzeIndustryTrends();
      const formatted = Object.entries(trends || {}).map(([industry, data]) => ({
        industry,
        job_postings_change: `${data?.growth_trend ?? 0}%`,
        growth_rate: data?.growth_trend ?? 0,
        top_skills: (data?.top_skills || []).slice(0, 5)
      }));

      if (formatted.length === 0) {
        return {
          last_updated: new Date().toISOString(),
          trends: [
            { industry: 'technology', job_postings_change: '+18%', growth_rate: 18, top_skills: ['AI', 'Cloud', 'Security'] },
            { industry: 'finance', job_postings_change: '+9%', growth_rate: 9, top_skills: ['Risk', 'Python', 'Analytics'] },
            { industry: 'healthcare', job_postings_change: '+7%', growth_rate: 7, top_skills: ['Data', 'Compliance', 'Telehealth'] },
            { industry: 'marketing', job_postings_change: '+4%', growth_rate: 4, top_skills: ['SEO', 'Content', 'Performance'] },
          ]
        };
      }

      return {
        last_updated: new Date().toISOString(),
        trends: formatted
      };
    } catch (error) {
      console.warn('Industry trends fallback triggered:', error?.message || error);
      return {
        last_updated: new Date().toISOString(),
        trends: [
          { industry: 'technology', job_postings_change: '+18%', growth_rate: 18, top_skills: ['AI', 'Cloud', 'Security'] },
          { industry: 'finance', job_postings_change: '+9%', growth_rate: 9, top_skills: ['Risk', 'Python', 'Analytics'] },
          { industry: 'healthcare', job_postings_change: '+7%', growth_rate: 7, top_skills: ['Data', 'Compliance', 'Telehealth'] },
          { industry: 'marketing', job_postings_change: '+4%', growth_rate: 4, top_skills: ['SEO', 'Content', 'Performance'] },
        ]
      };
    }
  }

  async getProgressMetrics(userId, fallbackService) {
    await this._ensureDependencies();

    // Fetch all necessary data sources
    const [profile, journalEntries, recommendations, kbItems] = await Promise.all([
      UserCareerProfile.findOne({ user_id: userId }).lean(),
      JournalEntry.find({ user_id: userId }).select('metadata').lean(),
      AIRecommendation.find({ user_id: userId }).lean(),
      KnowledgeBase.find({ user_id: userId }).countDocuments() // Assuming user_id field or ownership logic exists
    ]);

    // --- Helper Calculations ---

    // 1. Technical Skills: Coverage of heatmap vs gaps
    const skillsMap = profile?.resume_analysis?.skills_heat_map || {};
    const skillCount = Object.keys(skillsMap).length;
    // Start at 0 for new users, add 2 per skill, capped at 95
    const techScore = skillCount === 0 ? 0 : Math.min(95, skillCount * 2);

    // 2. Soft Skills: Influenced by journal sentiment and specific tasks
    const softSkillTasks = recommendations.filter(r =>
      r.category === 'soft_skills' && r.status === 'completed'
    ).length;
    // Calculate average sentiment (-1 to 1) mapped to 0-100
    const sentimentSum = journalEntries.reduce((acc, entry) => acc + (entry.metadata?.sentiment || 0), 0);
    const avgSentiment = journalEntries.length ? (sentimentSum / journalEntries.length) : 0;
    // Start at 0 for new users, sentiment -1 maps to 0, 0 maps to 50, 1 maps to 100
    const sentimentScore = journalEntries.length === 0 ? 0 : 50 + (avgSentiment * 50);
    const softScore = journalEntries.length === 0 && softSkillTasks === 0 ? 0 : Math.min(100, Math.round((sentimentScore * 0.7) + (softSkillTasks * 5)));

    // 3. Experience: Based on level and completed milestones
    const levelMap = { 'student': 10, 'entry': 20, 'mid': 40, 'senior': 60, 'lead': 80, 'executive': 90 };
    const currentLevel = profile?.persona_profile?.current_level;
    // Start at 0 if no level set, otherwise use level-based score
    const baseExp = currentLevel ? (levelMap[currentLevel.toLowerCase()] || 0) : 0;
    const completedMilestones = profile?.progress_tracking?.milestones_completed?.length || 0;
    const expScore = baseExp === 0 && completedMilestones === 0 ? 0 : Math.min(100, baseExp + (completedMilestones * 2));

    // 4. Education: Based on resume analysis or default to 0 for new users
    // Check if user has education data in resume analysis
    const hasEducation = profile?.resume_analysis?.education?.length > 0 ||
      profile?.resume_analysis?.certifications?.length > 0 ||
      (profile?.resume_analysis?.content &&
        /(bachelor|master|phd|degree|certification|diploma)/i.test(profile.resume_analysis.content));
    const eduScore = hasEducation ? 60 : 0; // Start at 0 for new users, 60 if they have education data

    // 5. Network: Networking tasks completed
    const networkTasks = recommendations.filter(r =>
      r.category === 'networking' && r.status === 'completed'
    ).length;
    // Start at 0 for new users
    const networkScore = networkTasks === 0 ? 0 : Math.min(95, networkTasks * 8);

    // 6. Industry Knowledge: KB items and 'learning' tasks
    const learningTasks = recommendations.filter(r =>
      r.category === 'learning' && r.status === 'completed'
    ).length;
    const kbCount = typeof kbItems === 'number' ? kbItems : 0;
    // Start at 0 for new users
    const industryScore = kbCount === 0 && learningTasks === 0 ? 0 : Math.min(95, (kbCount * 5) + (learningTasks * 5));

    return {
      dimensions: [
        { axis: 'Technical Skills', current: techScore, target: 90, description: 'Coding, Architecture, Tools' },
        { axis: 'Soft Skills', current: softScore, target: 85, description: 'Communication, Leadership' },
        { axis: 'Experience', current: expScore, target: 80, description: 'Years, Projects, Impact' },
        { axis: 'Education', current: eduScore, target: 60, description: 'Degrees, Certifications' },
        { axis: 'Network', current: networkScore, target: 75, description: 'Connections, Outreach' },
        { axis: 'Industry Knowledge', current: industryScore, target: 85, description: 'Trends, Market Awareness' }
      ],
      // Legacy fields for backward compatibility if needed
      journal_entries: journalEntries.length,
      completed_recommendations: recommendations.filter(r => r.status === 'completed').length,
      milestones_completed: completedMilestones
    };
  }

  // ==================== HEALTH CHECK ====================
  async healthCheck() {
    try {
      await this._ensureDependencies();
      const vectorDBHealth = await this.vectorDB.healthCheck();
      const marketIntelligenceHealth = await this.marketIntelligence.getMarketInsights('test', 1);

      return {
        status: 'healthy',
        vector_database: vectorDBHealth.status,
        market_intelligence: marketIntelligenceHealth.results ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new EnhancedAICareerCoachService();

// Lightweight helper for dev chat with timeout
export async function aiCoachSimpleChat(prompt) {
  const timeoutMs = 25000; // 25 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('[aiCoachSimpleChat] Starting chat request...');
    const svc = new EnhancedAICareerCoachService();
    await svc._ensureDependencies();

    if (!svc.openai) {
      console.error('[aiCoachSimpleChat] OpenAI client not initialized');
      return { text: 'I apologize, but the AI service is not properly configured. Please check the server settings.', error: 'openai_not_initialized' };
    }

    console.log('[aiCoachSimpleChat] Making LLM request to model:', svc._getModel());

    const res = await svc.openai.chat.completions.create({
      model: svc._getModel(),
      messages: [
        { role: 'system', content: 'You are a professional AI Career Coach. Your domain is strictly limited to career development, job search strategies, resume optimization, interview preparation, and professional growth. If a user asks about topics outside this domain (e.g., politics, entertainment, general life advice not related to work), politely decline and redirect them to career topics. Do not show your private internal thinking or reasoning process in the final output.' },
        { role: 'user', content: String(prompt || 'Say hello') }
      ],
      temperature: 0.6,
      max_tokens: 500
    }, { signal: controller.signal });

    clearTimeout(timeoutId);

    let responseText = res.choices?.[0]?.message?.content || '';

    // Clean up chain-of-thought tags if they leak through
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    console.log('[aiCoachSimpleChat] Got response, length:', responseText.length);

    return { text: responseText };
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('[aiCoachSimpleChat] Error:', e?.message || e);

    // Provide user-friendly error messages
    if (e?.name === 'AbortError' || e?.message?.includes('abort')) {
      return { text: 'The request took too long. Please try again with a simpler question.', error: 'timeout' };
    }
    if (e?.message?.includes('API key')) {
      return { text: 'The AI service is not properly configured. Please contact support.', error: 'api_key_error' };
    }
    if (e?.message?.includes('rate limit') || e?.status === 429) {
      return { text: 'The AI service is busy right now. Please try again in a moment.', error: 'rate_limit' };
    }

    return { text: 'I encountered an error processing your request. Please try again.', error: e?.message || 'chat_failed' };
  }
}

