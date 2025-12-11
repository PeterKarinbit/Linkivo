import OpenAI from "openai";
import {
  UserCareerProfile,
  JournalEntry,
  KnowledgeBase,
  AIRecommendation,
  WebhookLog
} from "../../models/aiCareerCoach.model.js";
import { Subscription } from "../../models/subscription.model.js";
import VectorDatabaseService from "./vectorDatabase.service.js";
import { extractTextFromPDF } from "./textExtraction.service.js";

class AICareerCoachService {
  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.AI_RECOMMENDER_MODEL || 'deepseek/deepseek-r1-distill-qwen-32b';
    this.openai = new OpenAI({ apiKey, baseURL });
  }

  // ==================== RESUME ANALYSIS ====================
  async analyzeResume(resumeFile, userId) {
    try {
      // Extract text from resume
      const resumeText = await extractTextFromPDF(resumeFile);

      // Analyze resume with AI
      const analysis = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a career coach analyzing resumes. Extract skills, experience level, career trajectory, and identify gaps. Return JSON format."
          },
          {
            role: "user",
            content: `Analyze this resume and return JSON with:
            {
              "skills_heat_map": {"skill": proficiency_score},
              "experience_level": "entry|mid|senior|lead|executive",
              "career_trajectory": "technical|management|entrepreneurial|consulting|academic",
              "identified_gaps": [{"skill": "string", "importance": number, "learning_path": "string"}]
            }
            
            Resume: ${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysisResult = JSON.parse(analysis.choices[0].message.content);

      // Update or create user career profile
      await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            'resume_analysis': analysisResult,
            'last_activity': new Date()
          }
        },
        { upsert: true, new: true }
      );

      return {
        success: true,
        analysis: analysisResult,
        skills: Object.keys(analysisResult.skills_heat_map || {}),
        experience_level: analysisResult.experience_level,
        career_trajectory: analysisResult.career_trajectory,
        gaps: analysisResult.identified_gaps
      };
    } catch (error) {
      console.error('Resume analysis error:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  // ==================== JOURNAL MANAGEMENT ====================
  async createJournalEntry({ userId, content, entry_date, tags }) {
    try {
      // Generate vector embedding for content
      const contentVector = await VectorDatabaseService.generateEmbedding(content);

      // Analyze sentiment and extract topics
      const analysis = await this.analyzeJournalEntry(content);

      const journalEntry = new JournalEntry({
        user_id: userId,
        entry_id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        content_vector: contentVector,
        metadata: {
          date: entry_date,
          sentiment: analysis.sentiment,
          topics: analysis.topics,
          goals_mentioned: analysis.goals_mentioned,
          word_count: content.split(/\s+/).length,
          reading_time: Math.ceil(content.split(/\s+/).length / 200) // 200 WPM
        },
        ai_insights: {
          key_themes: analysis.key_themes,
          action_items: analysis.action_items,
          mood_analysis: analysis.mood_analysis,
          progress_indicators: analysis.progress_indicators
        }
      });

      await journalEntry.save();

      // Respect consent before creating LLM memory
      try {
        const profile = await UserCareerProfile.findOne({ user_id: userId });
        const allowMemories = profile?.consent_given?.knowledge_base && profile?.consent_given?.proactive_guidance;
        if (allowMemories) {
          // Enforce plan quotas for Career Memories
          const subscription = await Subscription.findOne({ userId: userId });
          if (subscription?.isActive()) {
            subscription.resetMonthlyUsage?.();
            const canUse = subscription.canUseFeature('careerMemories');
            if (!canUse) {
              throw new Error('Career memories quota reached. Upgrade to store more memories.');
            }
          }
          const memory = await this.createKnowledgeMemoryFromJournal({ userId, content, analysis });
          if (memory) {
            if (subscription?.isActive()) {
              await subscription.incrementUsage('careerMemories');
            }
          }
        }
      } catch (e) {
        console.warn('Memory synthesis skipped or failed:', e?.message || e);
      }

      // Update user's journal consistency
      await this.updateJournalConsistency(userId);

      return journalEntry;
    } catch (error) {
      console.error('Journal entry creation error:', error);
      throw new Error('Failed to create journal entry');
    }
  }

  async createKnowledgeMemoryFromJournal({ userId, content, analysis }) {
    try {
      // Ask LLM to produce a concise title and 2-3 sentence memory
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an AI career coach. Convert user journal content into a concise 'Career Memory' note: a short title and 2-3 sentence summary with 1-3 tags. Return strict JSON."
          },
          {
            role: "user",
            content: `Journal: ${content}\n\nAnalysis summary (optional): ${JSON.stringify({
              sentiment: analysis?.sentiment,
              topics: analysis?.topics,
              key_themes: analysis?.key_themes
            })}\n\nRespond JSON: {"title": string, "summary": string, "tags": string[], "category": "skills"|"networking"|"portfolio"|"learning"|"job_search"|"career_planning"}`
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      });

      let parsed;
      try {
        parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
      } catch (_) {
        parsed = {};
      }

      const title = parsed.title || 'Career Memory';
      const summary = parsed.summary || content.slice(0, 400);
      const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      const category = parsed.category || 'career_planning';

      // Vectorize and store in KnowledgeBase
      const vectorized = await VectorDatabaseService.vectorizeKnowledgeItem({
        title,
        content: summary,
        category,
        content_type: 'article'
      });

      const item = new KnowledgeBase({
        content_id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content_vector: vectorized.content_vector,
        source_url: `user://journal`,
        content_type: 'article',
        title,
        content: summary,
        relevance_tags: tags,
        quality_score: 0.8,
        category,
        target_audience: {},
        ai_processed: true
      });
      await item.save();

      return item;
    } catch (error) {
      console.error('Knowledge memory creation error:', error);
      return null;
    }
  }

  async getJournalEntries({ userId, page, limit, search }) {
    try {
      const query = { user_id: userId };

      if (search) {
        query.$or = [
          { content: { $regex: search, $options: 'i' } },
          { 'metadata.topics': { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const journalEntries = await JournalEntry.find(query)
        .sort({ 'metadata.date': -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalCount = await JournalEntry.countDocuments(query);

      return {
        entries: journalEntries,
        total_count: totalCount,
        has_more: (page * limit) < totalCount,
        page,
        limit
      };
    } catch (error) {
      console.error('Get journal entries error:', error);
      throw new Error('Failed to retrieve journal entries');
    }
  }

  async analyzeJournalEntry(content) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a career coach analyzing journal entries. Extract sentiment, topics, goals, themes, and action items. Return JSON format."
          },
          {
            role: "user",
            content: `Analyze this journal entry and return JSON with:
            {
              "sentiment": number (-1 to 1),
              "topics": ["topic1", "topic2"],
              "goals_mentioned": ["goal1", "goal2"],
              "key_themes": ["theme1", "theme2"],
              "action_items": ["action1", "action2"],
              "mood_analysis": "string",
              "progress_indicators": ["indicator1", "indicator2"]
            }
            
            Journal Entry: ${content}`
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Journal analysis error:', error);
      return {
        sentiment: 0,
        topics: [],
        goals_mentioned: [],
        key_themes: [],
        action_items: [],
        mood_analysis: "neutral",
        progress_indicators: []
      };
    }
  }

  // ==================== AI RECOMMENDATIONS ====================
  async getRecommendations({ userId, type, limit }) {
    try {
      const query = { user_id: userId };
      if (type !== 'all') {
        query.type = type;
      }

      const recommendations = await AIRecommendation.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit);

      return {
        recommendations,
        total_count: recommendations.length
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw new Error('Failed to retrieve recommendations');
    }
  }

  async generateProactiveRecommendations({ userId, type = 'daily' }) {
    try {
      // Get user's career profile and recent journal entries
      const profile = await UserCareerProfile.findOne({ user_id: userId });
      const recentEntries = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(5);

      if (!profile) {
        throw new Error('User career profile not found');
      }

      // Generate recommendations based on user data
      const recommendations = await this.generateRecommendationsFromProfile(profile, recentEntries, type);

      // Save recommendations to database
      const savedRecommendations = await AIRecommendation.insertMany(recommendations);

      return {
        success: true,
        recommendations: savedRecommendations,
        count: savedRecommendations.length
      };
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async generateRecommendationsFromProfile(profile, journalEntries, type) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an AI career coach generating personalized recommendations. Create actionable, specific recommendations based on user data."
          },
          {
            role: "user",
            content: `Generate ${type} career recommendations based on this data:
            
            Career Profile: ${JSON.stringify(profile, null, 2)}
            Recent Journal Entries: ${journalEntries.map(entry => entry.content).join('\n\n')}
            
            Return JSON array of recommendations:
            [{
              "title": "string",
              "description": "string",
              "action_items": ["item1", "item2"],
              "category": "skills|networking|portfolio|learning|job_search|career_planning",
              "priority": "low|medium|high|urgent",
              "estimated_time": "string",
              "due_date": "ISO date string",
              "generation_reason": "string"
            }]`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const recommendations = JSON.parse(response.choices[0].message.content);

      return recommendations.map(rec => ({
        user_id: profile.user_id,
        recommendation_id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        action_items: rec.action_items.map(item => ({ item, completed: false })),
        category: rec.category,
        estimated_time: rec.estimated_time,
        due_date: new Date(rec.due_date),
        ai_generated: true,
        generation_reason: rec.generation_reason,
        relevance_score: 0.8 // Default relevance score
      }));
    } catch (error) {
      console.error('Generate recommendations from profile error:', error);
      return [];
    }
  }

  // ==================== KNOWLEDGE BASE ====================
  async getKnowledgeBase({ userId, category, limit, search }) {
    try {
      const query = {};

      if (category !== 'all') {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { relevance_tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const knowledgeItems = await KnowledgeBase.find(query)
        .sort({ quality_score: -1, last_updated: -1 })
        .limit(limit);

      return {
        content_items: knowledgeItems,
        total_count: knowledgeItems.length
      };
    } catch (error) {
      console.error('Get knowledge base error:', error);
      throw new Error('Failed to retrieve knowledge base');
    }
  }

  // ==================== CAREER PROFILE ====================
  async getCareerProfile(userId) {
    try {
      let profile = await UserCareerProfile.findOne({ user_id: userId });

      if (!profile) {
        // Create default profile if none exists
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
      }

      return profile;
    } catch (error) {
      console.error('Get career profile error:', error);
      throw new Error('Failed to retrieve career profile');
    }
  }

  async updateCareerProfile(userId, profileData) {
    try {
      const updatedProfile = await UserCareerProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $set: {
            ...profileData,
            'last_activity': new Date()
          }
        },
        { new: true, upsert: true }
      );

      return updatedProfile;
    } catch (error) {
      console.error('Update career profile error:', error);
      throw new Error('Failed to update career profile');
    }
  }

  // ==================== N8N WEBHOOK HANDLERS ====================
  async triggerInitializationWorkflow({ userId, resumeData, journalEntry, careerGoals, webhookLogId }) {
    try {
      // This would trigger the N8N workflow
      // For now, we'll simulate the workflow
      const webhookUrl = process.env.N8N_AI_CAREER_COACH_WEBHOOK_URL;

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            resumeData,
            journalEntry,
            careerGoals,
            webhookLogId,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error('N8N webhook failed');
        }
      }

      // Update webhook log
      await WebhookLog.findByIdAndUpdate(webhookLogId, {
        status: 'completed',
        response: { success: true, triggered: true }
      });

      return { success: true, webhook_triggered: true };
    } catch (error) {
      console.error('Trigger initialization workflow error:', error);

      // Update webhook log with error
      await WebhookLog.findByIdAndUpdate(webhookLogId, {
        status: 'failed',
        error_message: error.message
      });

      throw new Error('Failed to trigger initialization workflow');
    }
  }

  // ==================== UTILITY METHODS ====================
  async updateJournalConsistency(userId) {
    try {
      const entries = await JournalEntry.find({ user_id: userId })
        .sort({ 'metadata.date': -1 })
        .limit(30); // Last 30 entries

      if (entries.length === 0) return;

      // Calculate consistency based on frequency
      const days = 30;
      const entryCount = entries.length;
      const consistency = Math.min(entryCount / (days / 7), 1); // Weekly consistency

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

  async getProgressMetrics(userId) {
    try {
      const profile = await UserCareerProfile.findOne({ user_id: userId });
      const journalEntries = await JournalEntry.find({ user_id: userId });
      const recommendations = await AIRecommendation.find({ user_id: userId });

      return {
        journal_entries: journalEntries.length,
        completed_recommendations: recommendations.filter(r => r.status === 'completed').length,
        total_recommendations: recommendations.length,
        journal_consistency: profile?.progress_tracking?.journal_consistency || 0,
        last_activity: profile?.progress_tracking?.last_activity,
        milestones_completed: profile?.progress_tracking?.milestones_completed?.length || 0
      };
    } catch (error) {
      console.error('Get progress metrics error:', error);
      throw new Error('Failed to retrieve progress metrics');
    }
  }
}

export default new AICareerCoachService();
