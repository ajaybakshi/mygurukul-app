const Joi = require('joi');

/**
 * Validation schemas for Spiritual Synthesizer Service
 */

// Synthesize wisdom request validation
const synthesizeWisdomSchema = Joi.object({
  question: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Question must be at least 10 characters long',
      'string.max': 'Question must not exceed 1000 characters',
      'any.required': 'Question is required'
    }),

  sessionId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Session ID must be a valid UUID'
    }),

  context: Joi.object({
    userId: Joi.string().optional(),
    previousQuestions: Joi.array().items(Joi.string()).max(5).optional(),
    preferences: Joi.object({
      tone: Joi.string().valid('formal', 'conversational', 'meditative').default('conversational'),
      detailLevel: Joi.string().valid('concise', 'balanced', 'comprehensive').default('balanced'),
      includeSanskrit: Joi.boolean().default(true),
      maxVerses: Joi.number().integer().min(1).max(10).default(5),
      narrativeStyle: Joi.string().valid('storytelling', 'teaching', 'dialogue').default('teaching')
    }).optional()
  }).optional(),

  verseData: Joi.object({
    clusters: Joi.array().items(Joi.object({
      theme: Joi.string().required(),
      relevance: Joi.number().min(0).max(1).required(),
      verses: Joi.array().items(Joi.object({
        reference: Joi.string().required(),
        sanskrit: Joi.string().optional(),
        translation: Joi.string().required(),
        interpretation: Joi.string().optional(),
        relevance: Joi.number().min(0).max(1).required()
      })).required()
    })).required(),
    metadata: Joi.object({
      totalClusters: Joi.number().integer().min(0).required(),
      totalVerses: Joi.number().integer().min(0).required(),
      processingTime: Joi.string().optional()
    }).optional()
  }).required().messages({
    'any.required': 'Verse data from Sanskrit Collector is required'
  }),

  options: Joi.object({
    skipCollectorQuery: Joi.boolean().default(false),
    forceNewQuery: Joi.boolean().default(false),
    includeFollowUpSuggestions: Joi.boolean().default(true)
  }).optional()
});

// Continue conversation request validation
const continueConversationSchema = Joi.object({
  question: Joi.string()
    .min(5)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Question must be at least 5 characters long',
      'string.max': 'Question must not exceed 1000 characters',
      'any.required': 'Question is required'
    }),

  sessionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Session ID must be a valid UUID',
      'any.required': 'Session ID is required for continuing conversation'
    }),

  context: Joi.object({
    userId: Joi.string().optional(),
    preferences: Joi.object({
      tone: Joi.string().valid('formal', 'conversational', 'meditative').default('conversational'),
      detailLevel: Joi.string().valid('concise', 'balanced', 'comprehensive').default('balanced'),
      includeSanskrit: Joi.boolean().default(true),
      narrativeStyle: Joi.string().valid('storytelling', 'teaching', 'dialogue').default('teaching')
    }).optional()
  }).optional(),

  verseData: Joi.object({
    clusters: Joi.array().items(Joi.object({
      theme: Joi.string().required(),
      relevance: Joi.number().min(0).max(1).required(),
      verses: Joi.array().items(Joi.object({
        reference: Joi.string().required(),
        sanskrit: Joi.string().optional(),
        translation: Joi.string().required(),
        interpretation: Joi.string().optional(),
        relevance: Joi.number().min(0).max(1).required()
      })).required()
    })).required(),
    metadata: Joi.object({
      totalClusters: Joi.number().integer().min(0).required(),
      totalVerses: Joi.number().integer().min(0).required(),
      processingTime: Joi.string().optional()
    }).optional()
  }).optional(), // Optional for continue conversation - may reuse existing data

  options: Joi.object({
    skipCollectorQuery: Joi.boolean().default(false),
    forceNewQuery: Joi.boolean().default(false),
    includeFollowUpSuggestions: Joi.boolean().default(true)
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
