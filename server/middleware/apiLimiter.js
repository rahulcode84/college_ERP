const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/responseHelper');

// Create different limiters for different endpoints
const createLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      return sendError(res, message, 429);
    }
  });
};

// General API limiter
const generalLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later.'
);

// Strict limiter for sensitive operations
const strictLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many attempts, please try again later.',
  true // Skip successful requests
);

// Password reset limiter
const passwordResetLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 requests per hour
  'Too many password reset attempts, please try again in an hour.'
);

// Login limiter
const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many login attempts, please try again later.',
  true // Skip successful requests
);

module.exports = {
  generalLimiter,
  strictLimiter,
  passwordResetLimiter,
  loginLimiter
};