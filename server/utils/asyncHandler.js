// server/utils/asyncHandler.js

/**
 * Async handler wrapper to catch errors in async route handlers
 * This eliminates the need for try-catch blocks in every async controller
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any promise rejections
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;