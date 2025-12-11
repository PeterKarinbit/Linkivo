import path from 'path';
import fs from 'fs';

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path components
  const basename = path.basename(filename);
  
  // Remove any remaining path separators
  const sanitized = basename.replace(/[\/\\]/g, '_');
  
  // Remove null bytes and control characters
  const cleaned = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  
  // Limit length (max 255 chars for most filesystems)
  const truncated = cleaned.length > 200 ? cleaned.substring(0, 200) : cleaned;
  
  // Ensure it's not empty
  return truncated || 'unnamed_file';
}

/**
 * Validate file extension matches MIME type
 * @param {string} filename - Filename
 * @param {string} mimetype - MIME type
 * @returns {boolean} True if valid
 */
export function validateFileExtension(filename, mimetype) {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.zip': ['application/zip', 'application/x-zip-compressed'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png']
  };

  const allowedMimes = mimeMap[ext] || [];
  return allowedMimes.includes(mimetype);
}

/**
 * Validate skill name to prevent injection attacks
 * @param {string} skill - Skill name
 * @returns {boolean} True if valid
 */
export function validateSkillName(skill) {
  if (!skill || typeof skill !== 'string') return false;
  
  // Max length
  if (skill.length > 100) return false;
  
  // Only allow alphanumeric, spaces, hyphens, underscores, and common special chars
  const validPattern = /^[a-zA-Z0-9\s\-_.,()&+/]+$/;
  if (!validPattern.test(skill)) return false;
  
  // No script tags or dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(skill));
}

/**
 * Normalize and clean skill name
 * @param {string} skill - Raw skill name
 * @returns {string|null} Cleaned skill or null if invalid
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return null;
  
  // Trim and normalize whitespace
  let normalized = skill.trim().replace(/\s+/g, ' ');
  
  // Remove leading/trailing special chars
  normalized = normalized.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  
  // Validate
  if (!validateSkillName(normalized)) return null;
  
  return normalized || null;
}

/**
 * Validate file content by checking magic bytes
 * @param {string} filePath - Path to file
 * @param {string} expectedMime - Expected MIME type
 * @returns {Promise<boolean>} True if file content matches expected type
 */
export async function validateFileContent(filePath, expectedMime) {
  try {
    const buffer = fs.readFileSync(filePath, { start: 0, end: 12 });
    const hex = buffer.toString('hex');
    
    // PDF magic bytes: %PDF
    if (expectedMime === 'application/pdf') {
      return hex.startsWith('255044462d') || hex.startsWith('25504446'); // %PDF- or %PDF
    }
    
    // DOCX magic bytes: PK (ZIP format)
    if (expectedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return hex.startsWith('504b0304') || hex.startsWith('504b0506'); // PK..
    }
    
    // DOC magic bytes: Microsoft Office
    if (expectedMime === 'application/msword') {
      return hex.startsWith('d0cf11e0a1b11ae1'); // MS Office legacy
    }
    
    // ZIP magic bytes
    if (expectedMime === 'application/zip' || expectedMime === 'application/x-zip-compressed') {
      return hex.startsWith('504b0304') || hex.startsWith('504b0506');
    }
    
    // JPEG magic bytes
    if (expectedMime === 'image/jpeg') {
      return hex.startsWith('ffd8ff');
    }
    
    // PNG magic bytes
    if (expectedMime === 'image/png') {
      return hex.startsWith('89504e47');
    }
    
    // If we can't validate, allow it (but log warning)
    console.warn(`[SECURITY] Could not validate file content for ${expectedMime}`);
    return true;
  } catch (error) {
    console.error('[SECURITY] Error validating file content:', error);
    return false;
  }
}

/**
 * Check if file size is within limits
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Max size in bytes (default 10MB)
 * @returns {boolean} True if within limits
 */
export function validateFileSize(size, maxSize = 10 * 1024 * 1024) {
  return size > 0 && size <= maxSize;
}

/**
 * Rate limiting key generator for uploads
 * @param {string} userId - User ID
 * @returns {string} Rate limit key
 */
export function getUploadRateLimitKey(userId) {
  return `upload:${userId}`;
}
































