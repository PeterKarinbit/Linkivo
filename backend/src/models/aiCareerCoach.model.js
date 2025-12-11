import mongoose, { Schema } from "mongoose";

// User Career Profile Schema (as per markdown specification)
const userCareerProfileSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  resume_analysis: {
    skills_heat_map: {
      type: Map,
      of: Number // skill -> proficiency score
    },
    experience_level: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive']
    },
    career_trajectory: {
      type: String,
      enum: ['technical', 'management', 'entrepreneurial', 'consulting', 'academic']
    },
    identified_gaps: [{
      skill: String,
      importance: Number, // 1-10
      learning_path: String
    }]
  },
  career_goals: {
    short_term: [{
      goal: String,
      timeline: String,
      priority: Number // 1-10
    }],
    long_term: [{
      goal: String,
      timeline: String,
      priority: Number // 1-10
    }],
    priority_areas: [{
      area: String,
      weight: Number // 0-100
    }],
    timeline: {
      type: String,
      enum: ['6-months', '1-year', '2-years', '5-years']
    }
  },
  learning_preferences: {
    content_types: [{
      type: String,
      enum: ['article', 'course', 'video', 'podcast', 'book', 'workshop']
    }],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly']
    },
    weekly_hours: {
      type: Number,
      min: 1,
      max: 40
    },
    notification_settings: {
      email: Boolean,
      push: Boolean,
      sms: Boolean,
      timezone: String
    }
  },
  persona_profile: {
    stage: {
      type: String,
      enum: ['student', 'recent_grad', 'early_career', 'mid_career', 'senior', 'career_switch', 'entrepreneur', 'other']
    },
    current_level: String,
    target_role: String,
    industry: String, // Industry derived from target role or explicitly set
    focus_area: String,
    motivation: [String],
    weekly_time: {
      type: Number,
      min: 1,
      max: 40
    },
    learning_style: {
      type: String,
      enum: ['structured', 'project', 'mixed', 'self_paced'],
      default: 'mixed'
    },
    confidence_map: [{
      skill: String,
      level: {
        type: Number,
        min: 1,
        max: 5
      }
    }],
    updated_at: Date
  },
  progress_roadmap: {
    version: {
      type: Number,
      default: 0
    },
    summary: String,
    persona_stage: String,
    horizon_weeks: Number,
    weekly_hours_budget: Number,
    generated_at: Date,
    next_check_in: Date,
    milestones: [{
      milestone_id: String,
      title: String,
      description: String,
      outcome: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      estimated_hours: Number,
      week_span: Number,
      due_date: Date,
      prerequisites: [String],
      skills: [String],
      checkpoints: [String],
      success_metrics: [String],
      confidence: Number,
      evidence: String,
      status: {
        type: String,
        enum: ['upcoming', 'in_progress', 'blocked', 'completed'],
        default: 'upcoming'
      },
      resources: [{
        title: String,
        link: String,
        type: String,
        estimated_hours: Number,
        source: String
      }]
    }],
    phases: [{
      title: String,
      duration: String,
      description: String,
      goals: [String],
      tasks: [String],
      skills: [String],
      checkpoints: [String],
      hours_planned: Number,
      evidence: String
    }]
  },
  progress_tracking: {
    milestones_completed: [{
      milestone: String,
      completed_at: Date,
      category: String
    }],
    skill_improvements: {
      type: Map,
      of: Number // skill -> improvement score
    },
    journal_consistency: {
      type: Number,
      min: 0,
      max: 1
    },
    last_activity: Date
  },
  onboarding_completed: {
    type: Boolean,
    default: false
  },
  consent_given: {
    data_usage: Boolean,
    knowledge_base: Boolean,
    proactive_guidance: Boolean,
    data_retention: Boolean,
    given_at: Date
  },
  content_vector: {
    type: [Number],
    required: false,
    select: false // Do not return by default
  }
}, {
  timestamps: true
});

// Journal Entry Schema (as per markdown specification)
const journalEntrySchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  entry_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  content: {
    type: String,
    required: [true, 'Journal content is required'],
    minlength: [1, 'Journal content cannot be empty'],
    maxlength: [5000, 'Journal content cannot exceed 5000 characters'],
    trim: true
  },
  content_vector: {
    type: [Number],
    default: () => new Array(1536).fill(0) // Default zero vector for new entries
  },
  metadata: {
    date: {
      type: Date,
      default: Date.now
    },
    sentiment: {
      type: Number,
      min: -1,
      max: 1 // -1 (negative) to 1 (positive)
    },
    topics: [String], // AI-extracted topics
    goals_mentioned: [String], // Career goals mentioned in entry
    word_count: Number,
    reading_time: Number // in minutes
  },
  ai_insights: {
    key_themes: [String],
    action_items: [String],
    mood_analysis: String,
    progress_indicators: [String]
  }
}, {
  timestamps: true
});

// Knowledge Base Schema (as per markdown specification)
const knowledgeBaseSchema = new Schema({
  content_id: {
    type: String,
    required: true,
    unique: true
  },
  content_vector: {
    type: [Number], // Vector embeddings
    required: true
  },
  source_url: {
    type: String,
    required: true
  },
  content_type: {
    type: String,
    enum: ['article', 'tip', 'course', 'job_posting', 'video', 'podcast'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relevance_tags: [String],
  quality_score: {
    type: Number,
    min: 0,
    max: 1
  },
  category: {
    type: String,
    enum: ['skills', 'interview', 'networking', 'salary', 'industry', 'leadership'],
    required: true
  },
  target_audience: {
    experience_level: [String],
    industries: [String],
    roles: [String]
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  scraped_at: {
    type: Date,
    default: Date.now
  },
  ai_processed: {
    type: Boolean,
    default: false
  },
  metadata: {
    feedback_status: {
      type: String,
      enum: ['new', 'reviewed', 'addressed', 'dismissed'],
      default: 'new'
    },
    document_id: String,
    document_type: String,
    match_score: Number,
    overall_assessment: Schema.Types.Mixed // Store structured assessment
  },
  url: String // Store document URL/link
}, {
  timestamps: true
});

// AI Recommendations Schema
const aiRecommendationSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recommendation_id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'milestone', 'proactive'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  action_items: [{
    item: String,
    completed: {
      type: Boolean,
      default: false
    },
    completed_at: Date
  }],
  category: {
    type: String,
    enum: ['skills', 'networking', 'portfolio', 'learning', 'job_search', 'career_planning'],
    required: true
  },
  estimated_time: String,
  due_date: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  ai_generated: {
    type: Boolean,
    default: true
  },
  generation_reason: String, // Why this recommendation was generated
  relevance_score: {
    type: Number,
    min: 0,
    max: 1
  },
  user_feedback: {
    helpful: Boolean,
    completed: Boolean,
    feedback_text: String,
    rated_at: Date
  },
  content_vector: {
    type: [Number],
    required: false,
    select: false
  }
}, {
  timestamps: true
});

// N8N Webhook Log Schema
const webhookLogSchema = new Schema({
  webhook_id: {
    type: String,
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  event_type: {
    type: String,
    enum: ['resume_analysis', 'journal_processing', 'knowledge_scraping', 'recommendation_generation'],
    required: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  response: {
    type: Schema.Types.Mixed
  },
  error_message: String,
  processing_time: Number, // in milliseconds
  n8n_workflow_id: String
}, {
  timestamps: true
});

// Create indexes for better performance
userCareerProfileSchema.index({ user_id: 1 });
journalEntrySchema.index({ user_id: 1, 'metadata.date': -1 });
// Vector indexes should be created in MongoDB Atlas Search configuration
// journalEntrySchema.index({ content_vector: '2dsphere' }); // REMOVED: Incorrect for high-dim vectors
// knowledgeBaseSchema.index({ content_vector: '2dsphere' }); // REMOVED: Incorrect for high-dim vectors
knowledgeBaseSchema.index({ category: 1, content_type: 1 });
aiRecommendationSchema.index({ user_id: 1, type: 1, status: 1 });
webhookLogSchema.index({ user_id: 1, event_type: 1, status: 1 });

// Career Recommendation Schema
const careerRecommendationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: ['journal', 'profile', 'application', 'system']
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['career_suggestion', 'skill_development', 'job_opportunity']
  },
  content: {
    summary: String,
    skills: [String],
    suggestions: [{
      title: String,
      reason: String,
      confidence: Number
    }],
    actionItems: [String]
  },
  metadata: {
    model: String,
    version: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

careerRecommendationSchema.index({ user: 1, isRead: 1 });
careerRecommendationSchema.index({ user: 1, isArchived: 1 });

// Export models
export const UserCareerProfile = mongoose.model("UserCareerProfile", userCareerProfileSchema);
export const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
export const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
export const AIRecommendation = mongoose.model("AIRecommendation", aiRecommendationSchema);
export const WebhookLog = mongoose.model("WebhookLog", webhookLogSchema);
export const CareerRecommendation = mongoose.model("CareerRecommendation", careerRecommendationSchema);
