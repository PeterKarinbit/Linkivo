/**
 * Encryption Service for Secure Knowledge Base
 * Provides end-to-end encryption for sensitive career data
 */

import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    this.algorithm = 'AES';
    this.keySize = 256;
    this.iterations = 10000;
    this.salt = 'linkivo-career-coach-salt';
  }

  /**
   * Generate encryption key from password
   * @param {string} password - User password
   * @returns {string} - Generated encryption key
   */
  generateKey(password) {
    return CryptoJS.PBKDF2(password, this.salt, {
      keySize: this.keySize / 32,
      iterations: this.iterations
    }).toString();
  }

  /**
   * Encrypt text data
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted text
   */
  encrypt(text, key) {
    try {
      return CryptoJS.AES.encrypt(text, key).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt text data
   * @param {string} encryptedText - Encrypted text
   * @param {string} key - Decryption key
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText, key) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt knowledge base item
   * @param {Object} item - Knowledge base item
   * @param {string} key - Encryption key
   * @returns {Object} - Encrypted item
   */
  encryptKnowledgeItem(item, key) {
    return {
      ...item,
      encryptedTitle: this.encrypt(item.title, key),
      encryptedContent: this.encrypt(item.content, key),
      encryptedTags: this.encrypt(JSON.stringify(item.tags || []), key),
      isEncrypted: true,
      // Remove original unencrypted fields
      title: undefined,
      content: undefined,
      tags: undefined
    };
  }

  /**
   * Decrypt knowledge base item
   * @param {Object} encryptedItem - Encrypted knowledge base item
   * @param {string} key - Decryption key
   * @returns {Object} - Decrypted item
   */
  decryptKnowledgeItem(encryptedItem, key) {
    try {
      return {
        ...encryptedItem,
        title: this.decrypt(encryptedItem.encryptedTitle, key),
        content: this.decrypt(encryptedItem.encryptedContent, key),
        tags: JSON.parse(this.decrypt(encryptedItem.encryptedTags, key)),
        isDecrypted: true,
        // Remove encrypted fields
        encryptedTitle: undefined,
        encryptedContent: undefined,
        encryptedTags: undefined
      };
    } catch (error) {
      console.error('Failed to decrypt knowledge item:', error);
      return {
        ...encryptedItem,
        title: 'Encrypted Content',
        content: 'This content is encrypted and cannot be decrypted with the current key.',
        tags: [],
        isDecrypted: false,
        decryptionError: true
      };
    }
  }

  /**
   * Encrypt multiple knowledge base items
   * @param {Array} items - Array of knowledge base items
   * @param {string} key - Encryption key
   * @returns {Array} - Array of encrypted items
   */
  encryptKnowledgeItems(items, key) {
    return items.map(item => this.encryptKnowledgeItem(item, key));
  }

  /**
   * Decrypt multiple knowledge base items
   * @param {Array} encryptedItems - Array of encrypted items
   * @param {string} key - Decryption key
   * @returns {Array} - Array of decrypted items
   */
  decryptKnowledgeItems(encryptedItems, key) {
    return encryptedItems.map(item => this.decryptKnowledgeItem(item, key));
  }

  /**
   * Encrypt journal entry
   * @param {Object} entry - Journal entry
   * @param {string} key - Encryption key
   * @returns {Object} - Encrypted entry
   */
  encryptJournalEntry(entry, key) {
    return {
      ...entry,
      encryptedContent: this.encrypt(entry.content, key),
      encryptedTopics: this.encrypt(JSON.stringify(entry.topics || []), key),
      encryptedAiInsights: this.encrypt(JSON.stringify(entry.aiInsights || []), key),
      isEncrypted: true,
      // Remove original unencrypted fields
      content: undefined,
      topics: undefined,
      aiInsights: undefined
    };
  }

  /**
   * Decrypt journal entry
   * @param {Object} encryptedEntry - Encrypted journal entry
   * @param {string} key - Decryption key
   * @returns {Object} - Decrypted entry
   */
  decryptJournalEntry(encryptedEntry, key) {
    try {
      return {
        ...encryptedEntry,
        content: this.decrypt(encryptedEntry.encryptedContent, key),
        topics: JSON.parse(this.decrypt(encryptedEntry.encryptedTopics, key)),
        aiInsights: JSON.parse(this.decrypt(encryptedEntry.encryptedAiInsights, key)),
        isDecrypted: true,
        // Remove encrypted fields
        encryptedContent: undefined,
        encryptedTopics: undefined,
        encryptedAiInsights: undefined
      };
    } catch (error) {
      console.error('Failed to decrypt journal entry:', error);
      return {
        ...encryptedEntry,
        content: 'This entry is encrypted and cannot be decrypted with the current key.',
        topics: [],
        aiInsights: [],
        isDecrypted: false,
        decryptionError: true
      };
    }
  }

  /**
   * Generate secure random key
   * @returns {string} - Random encryption key
   */
  generateRandomKey() {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Hash password for storage
   * @param {string} password - Password to hash
   * @returns {string} - Hashed password
   */
  hashPassword(password) {
    return CryptoJS.SHA256(password + this.salt).toString();
  }

  /**
   * Verify password against hash
   * @param {string} password - Password to verify
   * @param {string} hash - Stored hash
   * @returns {boolean} - Whether password matches
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  /**
   * Check if data is encrypted
   * @param {Object} data - Data to check
   * @returns {boolean} - Whether data is encrypted
   */
  isEncrypted(data) {
    return data.isEncrypted === true || 
           data.encryptedContent !== undefined || 
           data.encryptedTitle !== undefined;
  }

  /**
   * Get encryption status
   * @returns {Object} - Encryption status information
   */
  getEncryptionStatus() {
    const hasKey = !!localStorage.getItem('linkivo_kb_encryption_key');
    const keyStrength = this.getKeyStrength();
    
    return {
      isEncrypted: hasKey,
      hasKey,
      keyStrength,
      algorithm: this.algorithm,
      keySize: this.keySize,
      iterations: this.iterations
    };
  }

  /**
   * Get key strength assessment
   * @returns {string} - Key strength level
   */
  getKeyStrength() {
    const key = localStorage.getItem('linkivo_kb_encryption_key');
    if (!key) return 'none';
    
    // Simple strength assessment based on key length and complexity
    if (key.length >= 64) return 'strong';
    if (key.length >= 32) return 'medium';
    return 'weak';
  }

  /**
   * Clear encryption key
   */
  clearKey() {
    localStorage.removeItem('linkivo_kb_encryption_key');
  }

  /**
   * Export encrypted data
   * @param {Array} data - Data to export
   * @param {string} key - Encryption key
   * @returns {string} - JSON string of encrypted data
   */
  exportEncryptedData(data, key) {
    const encryptedData = data.map(item => this.encryptKnowledgeItem(item, key));
    return JSON.stringify(encryptedData, null, 2);
  }

  /**
   * Import encrypted data
   * @param {string} jsonData - JSON string of encrypted data
   * @param {string} key - Decryption key
   * @returns {Array} - Decrypted data
   */
  importEncryptedData(jsonData, key) {
    try {
      const encryptedData = JSON.parse(jsonData);
      return this.decryptKnowledgeItems(encryptedData, key);
    } catch (error) {
      console.error('Failed to import encrypted data:', error);
      throw new Error('Failed to import encrypted data');
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
export default EncryptionService;
