/**
 * Custom error classes for Spiritual Synthesizer Service
 */

/**
 * Base Synthesizer Error
 */
class SynthesizerError extends Error {
  constructor(code, message, originalError = null, statusCode = 500) {
    super(message);
    this.name = 'SynthesizerError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SynthesizerError);
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
class ValidationError extends SynthesizerError {
  constructor(message, details = null) {
    super('VALIDATION_ERROR', message, null, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Narrative Generation Error
 */
class NarrativeGenerationError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('NARRATIVE_GENERATION_FAILED', message, originalError, 500);
    this.name = 'NarrativeGenerationError';
  }
}

/**
 * Verse Processing Error
 */
class VerseProcessingError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('VERSE_PROCESSING_FAILED', message, originalError, 500);
    this.name = 'VerseProcessingError';
  }
}

/**
 * Conversation State Error
 */
class ConversationStateError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('CONVERSATION_STATE_FAILED', message, originalError, 500);
    this.name = 'ConversationStateError';
  }
}

/**
 * Collector Integration Error
 */
class CollectorIntegrationError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('COLLECTOR_INTEGRATION_FAILED', message, originalError, 502);
    this.name = 'CollectorIntegrationError';
  }
}

/**
 * Service Unavailable Error
 */
class ServiceUnavailableError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('SERVICE_UNAVAILABLE', message, originalError, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends SynthesizerError {
  constructor(message, retryAfter = null) {
    super('RATE_LIMIT_EXCEEDED', message, null, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Authentication Error
 */
class AuthenticationError extends SynthesizerError {
  constructor(message) {
    super('AUTHENTICATION_FAILED', message, null, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
class AuthorizationError extends SynthesizerError {
  constructor(message) {
    super('AUTHORIZATION_FAILED', message, null, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends SynthesizerError {
  constructor(message) {
    super('NOT_FOUND', message, null, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Timeout Error
 */
class TimeoutError extends SynthesizerError {
  constructor(message, originalError = null) {
    super('REQUEST_TIMEOUT', message, originalError, 408);
    this.name = 'TimeoutError';
  }
}

/**
 * Session Not Found Error
 */
class SessionNotFoundError extends NotFoundError {
  constructor(sessionId) {
    super(`Conversation session ${sessionId} not found`);
    this.name = 'SessionNotFoundError';
    this.sessionId = sessionId;
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
 * @returns {SynthesizerError} Appropriate error instance
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
      return new SynthesizerError(code, message, originalError, statusCode);
  }
}

module.exports = {
  SynthesizerError,
  ValidationError,
  NarrativeGenerationError,
  VerseProcessingError,
  ConversationStateError,
  CollectorIntegrationError,
  ServiceUnavailableError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  SessionNotFoundError,
  ERROR_CODES,
  createErrorFromStatusCode
};
