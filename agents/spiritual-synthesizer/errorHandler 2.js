const logger = require('./logger');
const { createErrorFromStatusCode } = require('./errors');

/**
 * Global error handler middleware for Express
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(error, req, res, next) {
  // Get correlation ID from request
  const correlationId = req.correlationId || 'unknown';

  // Log the error
  logger.logError(error, {
    correlationId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    service: 'spiritual-synthesizer'
  });

  // Determine status code
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_SERVER_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTHENTICATION_FAILED';
    message = 'Authentication failed';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'AUTHORIZATION_FAILED';
    message = 'Access forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = error.message;
  } else if (error.name === 'TimeoutError') {
    statusCode = 408;
    code = 'REQUEST_TIMEOUT';
    message = 'Request timeout';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = error.message;
  }

  // Create structured error response
  const errorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      correlationId,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalError: error.originalError?.message
      })
    }
  };

  // Add retry-after header for rate limiting
  if (statusCode === 429 && error.retryAfter) {
    res.set('Retry-After', error.retryAfter);
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason?.message || reason,
    stack: reason?.stack,
    service: 'spiritual-synthesizer'
  });

  // In production, you might want to exit the process
  // process.exit(1);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    service: 'spiritual-synthesizer'
  });

  // Gracefully shutdown
  process.exit(1);
});

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Route handler function
 * @returns {Function} Wrapped route handler
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    const fnReturn = fn(req, res, next);
    return Promise.resolve(fnReturn).catch(next);
  };
}

/**
 * Create custom error for operational errors
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @returns {Error} Custom error object
 */
function createOperationalError(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}

/**
 * Handle axios errors specifically
 * @param {Error} error - Axios error
 * @returns {Error} Formatted error
 */
function handleAxiosError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    const { status, data } = error.response;
    const message = data?.message || `Request failed with status ${status}`;

    return createErrorFromStatusCode(status, message, error);
  } else if (error.request) {
    // The request was made but no response was received
    return createOperationalError('No response received from service', 503, 'SERVICE_UNAVAILABLE');
  } else {
    // Something happened in setting up the request
    return createOperationalError('Request setup failed', 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = {
  errorHandler,
  asyncErrorHandler,
  createOperationalError,
  handleAxiosError
};
