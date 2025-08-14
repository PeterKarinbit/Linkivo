import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { Document, Packer } from 'docx';
import mammoth from 'mammoth';

/**
 * Extract text from a PDF file buffer
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<string>} - The extracted text
 */
export async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer) throw new Error('No PDF buffer provided');
  const data = await pdfParse(pdfBuffer);
  return data.text;
}

/**
 * Extract text from a DOCX file buffer
 * @param {Buffer} docxBuffer - The DOCX file buffer
 * @returns {Promise<string>} - The extracted text
 */
export async function extractTextFromDOCX(docxBuffer) {
  if (!docxBuffer) throw new Error('No DOCX buffer provided');
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    console.log('[DOCX EXTRACTION] mammoth result:', JSON.stringify(result).slice(0, 500));
    return result.value;
  } catch (err) {
    console.error('[DOCX EXTRACTION] Error extracting DOCX:', err);
    throw new Error('DOCX extraction failed: ' + err.message);
  }
}

/**
 * Clean and normalize extracted text
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  if (!text) return '';
  // Remove excessive whitespace, normalize line breaks, etc.
  return text.replace(/\r\n|\r|\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from a file buffer, auto-detecting file type (PDF/DOCX/TXT)
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(fileBuffer, filename) {
  if (!fileBuffer || !filename) throw new Error('File buffer and filename required');
  const ext = path.extname(filename).toLowerCase();
  let text = '';
  try {
    if (ext === '.pdf') {
      text = await extractTextFromPDF(fileBuffer);
      console.log('[EXTRACTION] PDF text length:', text.length);
    } else if (ext === '.docx') {
      text = await extractTextFromDOCX(fileBuffer);
      console.log('[EXTRACTION] DOCX text length:', text.length);
    } else if (ext === '.txt') {
      text = fileBuffer.toString('utf-8');
      console.log('[EXTRACTION] TXT text length:', text.length);
    } else {
      throw new Error('Unsupported file type: ' + ext);
    }
    const cleaned = cleanText(text);
    console.log('[EXTRACTION] Cleaned text length:', cleaned.length);
    return cleaned;
  } catch (err) {
    console.error('[EXTRACTION] Failed to extract text from', filename, ':', err);
    throw new Error('Failed to extract text: ' + err.message);
  }
} 