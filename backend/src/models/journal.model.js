import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'grateful', 'tired'],
    default: 'neutral'
  },
  categories: [{
    type: String,
    trim: true
  }],
  sentiment: {
    score: Number,
    label: String
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingError: {
    type: String,
    default: null
  },
  metadata: {
    wordCount: Number,
    characterCount: Number,
    readingTime: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for text search
journalSchema.index({ content: 'text', 'analysis.topics': 1 });

// Virtual for career recommendations
journalSchema.virtual('careerRecommendations', {
  ref: 'CareerRecommendation',
  localField: '_id',
  foreignField: 'journalEntryId',
  justOne: false
});

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;
