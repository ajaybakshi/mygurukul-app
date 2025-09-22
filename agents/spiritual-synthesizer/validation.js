const Joi = require('joi');

/**
 * Validation schemas for Spiritual Synthesizer Service
 */

// Synthesize wisdom request validation
const Verse = Joi.object({
  id: Joi.string().required(),
  iast: Joi.string().required(),
  source: Joi.string().required(),
  score: Joi.number().optional()
});

const SynthRequest = Joi.object({
  question: Joi.string().required(),
  verseData: Joi.object({
    verses: Joi.array().items(Verse).min(1).optional().default([]),
    clusters: Joi.array().optional()
  }).required()
});

const synthesizeWisdomSchema = SynthRequest;

// Continue conversation request validation
const continueConversationSchema = Joi.object({
  question: Joi.string().required(),
  sessionId: Joi.string().uuid().required(),
  verseData: Joi.object({
    verses: Joi.array().items(Verse).min(1).optional(),
    clusters: Joi.array().optional()
  }).optional()
});

// Get conversation request validation
const getConversationSchema = Joi.object({
  sessionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Session ID must be a valid UUID',
      'any.required': 'Session ID is required'
    }),

  options: Joi.object({
    includeMetadata: Joi.boolean().default(true),
    limit: Joi.number().integer().min(1).max(50).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }).optional()
});

// Health check request validation
const healthSchema = Joi.object({
  detailed: Joi.boolean().optional(),
  includeMetrics: Joi.boolean().optional()
});

/**
 * Validate synthesize wisdom request
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
function validateSynthesizeWisdomRequest(data) {
  return synthesizeWisdomSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

/**
 * Validate continue conversation request
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
function validateContinueConversationRequest(data) {
  return continueConversationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

/**
 * Validate get conversation request
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
function validateGetConversationRequest(data) {
  return getConversationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

/**
 * Validate health check request
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
function validateHealthRequest(data) {
  return healthSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

/**
 * Validate correlation ID
 * @param {string} correlationId - Correlation ID to validate
 * @returns {boolean} Validation result
 */
function validateCorrelationId(correlationId) {
  const schema = Joi.string().uuid().required();
  const { error } = schema.validate(correlationId);
  return !error;
}

/**
 * Validate service configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
function validateServiceConfig(config) {
  const configSchema = Joi.object({
    port: Joi.number().integer().min(1000).max(65535).default(3002),
    environment: Joi.string().valid('development', 'staging', 'production').default('development'),
    logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    maxRequestSize: Joi.string().default('10mb'),
    corsOrigins: Joi.array().items(Joi.string()).default(['http://localhost:3000']),
    healthCheckInterval: Joi.number().integer().min(1000).default(30000),
    collectorServiceUrl: Joi.string().uri().default('http://localhost:3001'),
    conversationTimeoutMinutes: Joi.number().integer().min(5).max(1440).default(60), // 1 hour
    maxConversationLength: Joi.number().integer().min(1).max(100).default(50)
  });

  return configSchema.validate(config, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

module.exports = {
  validateSynthesizeWisdomRequest,
  validateContinueConversationRequest,
  validateGetConversationRequest,
  validateHealthRequest,
  validateCorrelationId,
  validateServiceConfig,
  schemas: {
    synthesizeWisdom: synthesizeWisdomSchema,
    continueConversation: continueConversationSchema,
    getConversation: getConversationSchema,
    health: healthSchema
  }
};
