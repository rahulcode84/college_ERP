// server/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// Authentication middleware - verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie-based auth)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!user) {
        return errorResponse(res, 'Token is valid but user not found', 401);
      }

      if (user.status !== 'active') {
        return errorResponse(res, 'User account is inactive', 401);
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired', 401);
      } else if (tokenError.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid token', 401);
      } else {
        return errorResponse(res, 'Token verification failed', 401);
      }
    }

  } catch (error) {
    logger.error('Authentication error:', error);
    return errorResponse(res, 'Authentication failed', 500);
  }
};

// Authorization middleware - check user roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      // If no roles specified, allow all authenticated users
      if (roles.length === 0) {
        return next();
      }

      // Ensure user is authenticated first
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      // Check if user role is in allowed roles
      if (!roles.includes(req.user.role)) {
        return errorResponse(res, 'Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      return errorResponse(res, 'Authorization failed', 500);
    }
  };
};

// Optional: Rate limiting middleware
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requests.has(identifier)) {
      const userRequests = requests.get(identifier).filter(time => time > windowStart);
      requests.set(identifier, userRequests);
    }

    // Check current request count
    const currentRequests = requests.get(identifier) || [];
    
    if (currentRequests.length >= maxRequests) {
      return errorResponse(res, 'Too many requests. Please try again later.', 429);
    }

    // Add current request
    currentRequests.push(now);
    requests.set(identifier, currentRequests);

    next();
  };
};

// Admin-only middleware (shorthand)
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }
  
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }
  
  next();
};

// Faculty or Admin middleware (shorthand)
const facultyOrAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }
  
  if (!['faculty', 'admin'].includes(req.user.role)) {
    return errorResponse(res, 'Faculty or Admin access required', 403);
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  rateLimit,
  adminOnly,
  facultyOrAdmin
};