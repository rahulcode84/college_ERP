// server/utils/logger.js

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get current log level from environment
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaString}`;
};

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const writeToFile = (level, message, meta = {}) => {
  try {
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const formattedMessage = formatMessage(level, message, meta);
    
    fs.appendFileSync(logFile, formattedMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

/**
 * Write to console with colors
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const writeToConsole = (level, message, meta = {}) => {
  const formattedMessage = formatMessage(level, message, meta);
  
  switch (level.toLowerCase()) {
    case 'error':
      console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
      break;
    case 'warn':
      console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
      break;
    case 'info':
      console.info('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan
      break;
    case 'debug':
      console.log('\x1b[90m%s\x1b[0m', formattedMessage); // Gray
      break;
    default:
      console.log(formattedMessage);
  }
};

/**
 * Generic log function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const log = (level, message, meta = {}) => {
  const levelValue = LOG_LEVELS[level.toUpperCase()];
  
  // Only log if current level allows it
  if (levelValue <= currentLogLevel) {
    // Always write to console in development
    if (process.env.NODE_ENV !== 'production') {
      writeToConsole(level, message, meta);
    }
    
    // Write to file in production or if FILE_LOGGING is enabled
    if (process.env.NODE_ENV === 'production' || process.env.FILE_LOGGING === 'true') {
      writeToFile(level, message, meta);
    }
  }
};

/**
 * Error logging
 * @param {string} message - Error message
 * @param {Error|object} error - Error object or metadata
 */
const error = (message, error = {}) => {
  const meta = error instanceof Error ? {
    stack: error.stack,
    name: error.name,
    message: error.message
  } : error;
  
  log('error', message, meta);
};

/**
 * Warning logging
 * @param {string} message - Warning message
 * @param {object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  log('warn', message, meta);
};

/**
 * Info logging
 * @param {string} message - Info message
 * @param {object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  log('info', message, meta);
};

/**
 * Debug logging
 * @param {string} message - Debug message
 * @param {object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  log('debug', message, meta);
};

/**
 * HTTP request logging middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    if (req.user) {
      logData.userId = req.user._id;
      logData.userRole = req.user.role;
    }
    
    // Log as error if status >= 400, warn if >= 300, otherwise info
    if (res.statusCode >= 400) {
      error(`HTTP ${req.method} ${req.originalUrl}`, logData);
    } else if (res.statusCode >= 300) {
      warn(`HTTP ${req.method} ${req.originalUrl}`, logData);
    } else {
      info(`HTTP ${req.method} ${req.originalUrl}`, logData);
    }
  });
  
  next();
};

/**
 * Clean up old log files (keep last 30 days)
 */
const cleanup = () => {
  try {
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        info(`Cleaned up old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Failed to cleanup log files:', error);
  }
};

// Run cleanup on startup and then daily
cleanup();
setInterval(cleanup, 24 * 60 * 60 * 1000);

module.exports = {
  error,
  warn,
  info,
  debug,
  httpLogger,
  cleanup
};