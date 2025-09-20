/**
 * Custom error classes for Sanskrit Collector Service
 */

/**
 * Base Collector Error
 */
class CollectorError extends Error {
  constructor(code, message, originalError = null, statusCode = 500) {
    super(message);
    this.name = 'CollectorError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CollectorError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.originalError && { originalError: this.originalError.message })
    };
  }
}

/**
 * Validation Error
 */
class ValidationError extends CollectorError {
  constructor(message, details = null) {
    super('VALIDATION_ERROR', message, null, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Semantic Analysis Error
 */
class SemanticAnalysisError extends CollectorError {
  constructor(message, originalError = null) {
    super('SEMANTIC_ANALYSIS_FAILED', message, originalError, 500);
    this.name = 'SemanticAnalysisError';
  }
}

/**
 * Verse Retrieval Error
 */
class VerseRetrievalError extends CollectorError {
  constructor(message, originalError = null) {
    super('VERSE_RETRIEVAL_FAILED', message, originalError, 500);
    this.name = 'VerseRetrievalError';
  }
}

/**
 * Clustering Error
 */
class ClusteringError extends CollectorError {
  constructor(message, originalError = null) {
    super('VERSE_CLUSTERING_FAILED', message, originalError, 500);
    this.name = 'ClusteringError';
  }
}

/**
 * Response Formatting Error
 */
class ResponseFormattingError extends CollectorError {
  constructor(message, originalError = null) {
    super('RESPONSE_FORMATTING_FAILED', message, originalError, 500);
    this.name = 'ResponseFormattingError';
  }
}

/**
 * Service Unavailable Error
 */
class ServiceUnavailableError extends CollectorError {
  constructor(message, originalError = null) {
    super('SERVICE_UNAVAILABLE', message, originalError, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends CollectorError {
  constructor(message, retryAfter = null) {
    super('RATE_LIMIT_EXCEEDED', message, null, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Authentication Error
 */
class AuthenticationError extends CollectorError {
  constructor(message) {
    super('AUTHENTICATION_FAILED', message, null, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
class AuthorizationError extends CollectorError {
  constructor(message) {
    super('AUTHORIZATION_FAILED', message, null, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends CollectorError {
  constructor(message) {
    super('NOT_FOUND', message, null, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Timeout Error
 */
class TimeoutError extends CollectorError {
  constructor(message, originalError = null) {
    super('REQUEST_TIMEOUT', message, originalError, 408);
    this.name = 'TimeoutError';
  }
}

/**
 * Error code mappings for HTTP status codes
 */
const ERROR_CODES = {
  // 4xx Client Errors
  400: 'BAD_REQUEST',
  401: 'AUTHENTICATION_FAILED',
  403: 'AUTHORIZATION_FAILED',
  404: 'NOT_FOUND',
  408: 'REQUEST_TIMEOUT',
  429: 'RATE_LIMIT_EXCEEDED',
  
  // 5xx Server Errors
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT'
};

/**
 * Create error from HTTP status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Error} originalError - Original error if any
 * @returns {CollectorError} Appropriate error instance
 */
function createErrorFromStatusCode(statusCode, message, originalError = null) {
  const code = ERROR_CODES[statusCode] || 'UNKNOWN_ERROR';
  
  switch (statusCode) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError(message);
    case 408:
      return new TimeoutError(message, originalError);
    case 429:
      return new RateLimitError(message);
    case 503:
      return new ServiceUnavailableError(message, originalError);
    default:
      return new CollectorError(code, message, originalError, statusCode);
  }
}

module.exports = {
  CollectorError,
  ValidationError,
  SemanticAnalysisError,
  VerseRetrievalError,
  ClusteringError,
  ResponseFormattingError,
  ServiceUnavailableError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  ERROR_CODES,
  createErrorFromStatusCode
};
