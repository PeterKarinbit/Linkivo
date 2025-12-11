import mongoose from 'mongoose';

const careerRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  journalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  careerSuggestions: [{
    title: String,
    description: String,
    confidence: Number,
    reason: String,
    skills: [{
      name: String,
      relevance: Number
    }]
  }],
  skills: [{
    name: String,
    relevance: Number,
    category: String
  }],
  metadata: {
    model: String,
    version: String,
    processingTime: Number
  }
}, {
  timestamps: true
});

// Index for faster lookups
careerRecommendationSchema.index({ userId: 1, journalEntryId: 1 });

const CareerRecommendation = mongoose.model('CareerRecommendation', careerRecommendationSchema);

export default CareerRecommendation;
