import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  // Reference to the user who uploaded the document
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Original file information
  originalName: {
    type: String,
    required: true
  },
  
  // Stored file path (if stored on disk) or reference (if stored in GridFS)
  filePath: String,
  fileId: mongoose.Schema.Types.ObjectId, // For GridFS
  
  // Document metadata
  mimeType: String,
  size: Number,
  
  // Document type (resume, cv, transcript, etc.)
  documentType: {
    type: String,
    enum: ['resume', 'cv', 'transcript', 'certificate', 'other'],
    required: true
  },
  
  // Extracted content
  textContent: String,
  
  // Structured data (extracted by AI)
  structuredData: {
    skills: [{
      name: String,
      confidence: Number,
      context: String
    }],
    experiences: [{
      title: String,
      company: String,
      startDate: Date,
      endDate: Date,
      description: String,
      skills: [String]
    }],
    education: [{
      degree: String,
      institution: String,
      fieldOfStudy: String,
      startDate: Date,
      endDate: Date,
      description: String
    }]
  },
  
  // Processing status
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'error'],
    default: 'pending'
  },
  
  // Error information (if processing failed)
  error: {
    message: String,
    stack: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search
documentSchema.index({ 'textContent': 'text' });

// Add compound indexes for common queries
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ status: 1, updatedAt: -1 });

// Virtual for document URL
documentSchema.virtual('url').get(function() {
  if (this.fileId) {
    return `/api/documents/${this._id}/file`;
  }
  return null;
});

// Pre-save hook to update timestamps
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
