import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getLocalEmbedding } from '../utils/ai/localEmbedding.service.js';
import Document from '../models/document.model.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const pipelineAsync = promisify(pipeline);

class DocumentProcessor {
  constructor() {
    this.supportedMimeTypes = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'text/markdown': 'md'
    };
  }

  /**
   * Save uploaded file to disk
   */
  async saveFile(file, userId) {
    try {
      // Create uploads directory if it doesn't exist
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      
      // Generate unique filename
      const fileExt = this.supportedMimeTypes[file.mimetype] || 'bin';
      const filename = `${userId}_${uuidv4()}.${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      
      // Save file
      await pipelineAsync(file, createWriteStream(filePath));
      
      return {
        originalName: file.originalname,
        filePath,
        mimeType: file.mimetype,
        size: file.size
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save uploaded file');
    }
  }

  /**
   * Extract text from different file types
   */
  async extractText(fileInfo) {
    try {
      let text = '';
      
      switch (fileInfo.mimeType) {
        case 'application/pdf':
          text = await this.extractTextFromPdf(fileInfo.filePath);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          text = await this.extractTextFromDocx(fileInfo.filePath);
          break;
        case 'text/plain':
        case 'text/markdown':
          text = await fs.readFile(fileInfo.filePath, 'utf-8');
          break;
        default:
          throw new Error(`Unsupported file type: ${fileInfo.mimeType}`);
      }
      
      return text.trim();
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  async extractTextFromPdf(filePath) {
    const { default: pdf } = await import('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from DOCX using mammoth
   */
  async extractTextFromDocx(filePath) {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Process document with AI to extract structured data
   */
  async analyzeWithAI(textContent, documentType) {
    // In a real implementation, this would call an AI service
    // For now, we'll return a simple analysis
    
    // Generate embeddings for the full text
    const embedding = await getLocalEmbedding(textContent);
    
    // Simple keyword extraction (in a real app, use NLP here)
    const skills = this.extractSkills(textContent);
    
    return {
      embedding,
      structuredData: {
        skills,
        experiences: [],
        education: []
      },
      summary: this.generateSummary(textContent)
    };
  }

  /**
   * Simple skill extraction (placeholder - replace with actual NLP)
   */
  extractSkills(text) {
    // This is a very basic implementation
    // In a real app, you'd use NLP to extract skills more accurately
    const commonSkills = [
      'JavaScript', 'Python', 'Node.js', 'React', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL'
    ];
    
    return commonSkills
      .filter(skill => 
        new RegExp(`\\b${skill}\\b`, 'i').test(text)
      )
      .map(skill => ({
        name: skill,
        confidence: 0.8, // Placeholder
        context: 'Resume/CV content'
      }));
  }

  /**
   * Generate a summary of the document
   */
  generateSummary(text) {
    // In a real app, use an AI model to generate a summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  /**
   * Process an uploaded document
   */
  async processDocument(file, userId, documentType) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Create document record
      const document = new Document({
        userId,
        documentType,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: 'processing'
      });
      
      await document.save({ session });
      
      // 2. Save file to disk
      const fileInfo = await this.saveFile(file, userId);
      document.filePath = fileInfo.filePath;
      
      // 3. Extract text
      const textContent = await this.extractText(fileInfo);
      document.textContent = textContent;
      
      // 4. Analyze with AI
      const analysis = await this.analyzeWithAI(textContent, documentType);
      document.structuredData = analysis.structuredData;
      document.embedding = analysis.embedding;
      document.summary = analysis.summary;
      
      // 5. Mark as processed
      document.status = 'processed';
      await document.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      return document.toObject();
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      // Update document with error
      if (document) {
        document.status = 'error';
        document.error = {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
        await document.save();
      }
      
      throw error;
    }
  }
}

export default new DocumentProcessor();
