import Document from '../models/document.model.js';
import documentProcessor from '../services/documentProcessor.service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Upload a new document
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { documentType = 'other' } = req.body;
    const userId = req.user._id; // Assuming user is authenticated and attached to req.user

    // Process the document
    const document = await documentProcessor.processDocument(
      req.file, 
      userId, 
      documentType
    );

    res.status(201).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

/**
 * Get all documents for the authenticated user
 */
export const getDocuments = async (req, res, next) => {
  try {
    const { documentType } = req.query;
    const userId = req.user._id;
    
    const query = { userId };
    if (documentType) {
      query.documentType = documentType;
    }
    
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single document by ID
 */
export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const document = await Document.findOne({
      _id: id,
      userId
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find and delete the document
    const document = await Document.findOneAndDelete({
      _id: id,
      userId
    }).session(session);
    
    if (!document) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete the file if it exists
    if (document.filePath) {
      try {
        await fs.promises.unlink(document.filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Search documents by content
 */
export const searchDocuments = async (req, res, next) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Simple text search (can be enhanced with vector search)
    const documents = await Document.find(
      { 
        $text: { $search: query },
        userId
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();
    
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get file content (for downloading/viewing)
 */
export const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const document = await Document.findOne({
      _id: id,
      userId
    });
    
    if (!document || !document.filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    next(error);
  }
};
