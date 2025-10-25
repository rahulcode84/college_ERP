// server/utils/responseHelper.js

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };

  // Add pagination info if data has pagination
  if (data && data.pagination) {
    response.pagination = data.pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} error - Error details
 */
const errorResponse = (res, message = 'Error occurred', statusCode = 400, error = null) => {
  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const validationErrorResponse = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Paginated response format
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items count
 * @param {String} message - Success message
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  
  const response = {
    success: true,
    message: message,
    data: data,
    pagination: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

/**
 * No content response (for DELETE operations)
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 */
const noContentResponse = (res, message = 'Operation completed successfully') => {
  return res.status(204).json({
    success: true,
    message: message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Created response (for POST operations)
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Created resource data
 */
const createdResponse = (res, message = 'Resource created successfully', data = null) => {
  return successResponse(res, message, data, 201);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

/**
 * Internal server error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} error - Error object
 */
const serverErrorResponse = (res, message = 'Internal server error', error = null) => {
  return errorResponse(res, message, 500, error);
};

/**
 * Too many requests response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return errorResponse(res, message, 429);
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  noContentResponse,
  createdResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  tooManyRequestsResponse
};