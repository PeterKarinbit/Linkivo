import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = path.join(logDir, 'app.log');

/**
 * Log levels:
 * 1. ERROR: Something has gone wrong
 * 2. WARN: Something might be wrong, worth investigation
 * 3. INFO: General information about app operation
 * 4. DEBUG: Detailed information for debugging
 */

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Writes a log entry to the console and log file
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level}] ${message}`;

  if (data) {
    if (typeof data === 'object') {
      try {
        logEntry += '\n' + JSON.stringify(data, null, 2);
      } catch (e) {
        logEntry += '\n[Unable to stringify data]';
      }
    } else {
      logEntry += '\n' + data;
    }
  }

  // Log to console with colors
  switch(level) {
    case LogLevel.ERROR:
      console.error(`\x1b[31m${logEntry}\x1b[0m`); // Red
      break;
    case LogLevel.WARN:
      console.warn(`\x1b[33m${logEntry}\x1b[0m`); // Yellow
      break;
    case LogLevel.INFO:
      console.info(`\x1b[36m${logEntry}\x1b[0m`); // Cyan
      break;
    case LogLevel.DEBUG:
      console.debug(`\x1b[90m${logEntry}\x1b[0m`); // Gray
      break;
    default:
      console.log(logEntry);
  }

  // Write to log file
  fs.appendFileSync(logFilePath, logEntry + '\n');
}

export const logger = {
  error: (message, data) => log(LogLevel.ERROR, message, data),
  warn: (message, data) => log(LogLevel.WARN, message, data),
  info: (message, data) => log(LogLevel.INFO, message, data),
  debug: (message, data) => log(LogLevel.DEBUG, message, data),
  LogLevel
};
