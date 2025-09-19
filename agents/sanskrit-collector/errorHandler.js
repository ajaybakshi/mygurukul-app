const logger = require('./logger');
const { CollectorError, createErrorFromStatusCode } = require('./errors');

/**
 * Global error handler middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(error, req, res, next) {
  const correlationId = req.correlationId;
  
  // Log the error
  logger.logError(error, {
    correlationId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle different types of errors
  if (error instanceof CollectorError) {
    // Custom application errors
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      correlationId,
      timestamp: error.timestamp,
      ...(error.details && { details: error.details }),
      ...(error.retryAfter && { retryAfter: error.retryAfter })
    });
  }

  // Handle Joi validation errors
  if (error.isJoi) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })),
      correlationId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle HTTP errors
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    const httpError = createErrorFromStatusCode(statusCode, error.message, error);
    
    return res.status(statusCode).json({
      error: httpError.code,
      message: httpError.message,
      correlationId,
      timestamp: httpError.timestamp
    });
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Malformed JSON in request body',
      correlationId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    return res.status(408).json({
      error: 'REQUEST_TIMEOUT',
      message: 'Request timeout',
      correlationId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'External service unavailable',
      correlationId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle rate limiting errors
  if (error.status === 429) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      correlationId,
      timestamp: new Date().toISOString(),
      retryAfter: error.retryAfter || 60
    });
  }

  // Handle uncaught exceptions and other errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    correlationId,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && {
      stack: error.stack,
      name: error.name
    })
  });
}

/**
 * 404 handler for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  const correlationId = req.correlationId;
  
  logger.warn('Route not found', {
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} not found`,
    correlationId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error boundary for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
});

/**
 * Error boundary for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // Exit gracefully
  process.exit(1);
});

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
