import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobUrl: {
      type: String,
    },
    applicationMethod: {
      type: String,
      enum: ['email', 'manual', 'linkedin', 'indeed', 'company_portal'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'under_review', 'interview_scheduled', 'rejected', 'accepted', 'withdrawn'],
      default: 'pending',
    },
    originalResume: {
      type: String,
      required: true,
    },
    refactoredResume: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    skillMatchPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchingSkills: [{
      type: String,
    }],
    missingSkills: [{
      type: String,
    }],
    aiSuggestions: [{
      type: String,
    }],
    appliedAt: {
      type: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailMessageId: {
      type: String,
    },
    emailRecipient: {
      type: String,
    },
    userNotes: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    location: {
      type: String,
    },
    remote: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    nextFollowUp: {
      type: Date,
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    responseReceived: {
      type: Boolean,
      default: false,
    },
    responseDate: {
      type: Date,
    },
    responseType: {
      type: String,
      enum: ['rejection', 'interview_invite', 'offer', 'request_for_info', 'other'],
    },
    responseDetails: {
      type: String,
    },
    interviewScheduled: {
      type: Boolean,
      default: false,
    },
    interviewDate: {
      type: Date,
    },
    interviewType: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'behavioral'],
    },
    interviewNotes: {
      type: String,
    },
    timeToApply: {
      type: Number,
    },
    applicationSource: {
      type: String,
      enum: ['skill_gap_analyzer', 'manual_search', 'recommendation', 'n8n_workflow'],
      default: 'skill_gap_analyzer',
    },
    tags: [{
      type: String,
    }],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ userId: 1, appliedAt: -1 });
applicationSchema.index({ status: 1, nextFollowUp: 1 });
applicationSchema.index({ companyName: 1, jobTitle: 1 });

// Virtual for application age
applicationSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days since last update
applicationSchema.virtual('daysSinceUpdate').get(function() {
  return Math.floor((Date.now() - this.lastUpdated) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update lastUpdated
applicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get application statistics
applicationSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
        interviews: { $sum: { $cond: [{ $eq: ['$status', 'interview_scheduled'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        avgSkillMatch: { $avg: '$skillMatchPercentage' },
        avgTimeToApply: { $avg: '$timeToApply' }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    applied: 0,
    underReview: 0,
    interviews: 0,
    accepted: 0,
    rejected: 0,
    avgSkillMatch: 0,
    avgTimeToApply: 0
  };
};

// Instance method to update status
applicationSchema.methods.updateStatus = async function(newStatus, notes = '') {
  this.status = newStatus;
  this.lastUpdated = new Date();
  
  if (newStatus === 'applied' && !this.appliedAt) {
    this.appliedAt = new Date();
  }
  
  if (newStatus === 'interview_scheduled') {
    this.interviewScheduled = true;
  }
  
  if (notes) {
    this.userNotes = notes;
  }
  
  return this.save();
};

// Instance method to schedule follow-up
applicationSchema.methods.scheduleFollowUp = async function(daysFromNow = 7) {
  this.nextFollowUp = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  this.followUpCount += 1;
  return this.save();
};

// Instance method to mark response received
applicationSchema.methods.markResponseReceived = async function(responseType, details = '') {
  this.responseReceived = true;
  this.responseDate = new Date();
  this.responseType = responseType;
  this.responseDetails = details;
  return this.save();
};

export const Application = mongoose.model("Application", applicationSchema); 