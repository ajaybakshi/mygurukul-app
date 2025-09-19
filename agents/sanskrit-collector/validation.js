const Joi = require('joi');

/**
 * Validation schemas for Sanskrit Collector Service
 */

// Collect verses request validation
const collectVersesSchema = Joi.object({
  question: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Question must be at least 10 characters long',
      'string.max': 'Question must not exceed 1000 characters',
      'any.required': 'Question is required'
    }),
  
  context: Joi.object({
    sessionId: Joi.string().uuid().optional(),
    userId: Joi.string().optional(),
    previousQuestions: Joi.array().items(Joi.string()).max(5).optional(),
    preferences: Joi.object({
      includeSanskrit: Joi.boolean().default(true),
      maxVerses: Joi.number().integer().min(1).max(20).default(10),
      detailLevel: Joi.string().valid('basic', 'detailed', 'comprehensive').default('detailed')
    }).optional()
  }).optional(),
  
  options: Joi.object({
    clusteringStrategy: Joi.string().valid('thematic', 'semantic', 'relevance').default('thematic'),
    includeMetadata: Joi.boolean().default(true),
    responseFormat: Joi.string().valid('structured', 'narrative', 'minimal').default('structured')
  }).optional()
});

// Health check request validation
const healthSchema = Joi.object({
  detailed: Joi.boolean().optional(),
  includeMetrics: Joi.boolean().optional()
});

/**
 * Validate collect verses request
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
function validateCollectVersesRequest(data) {
  return collectVersesSchema.validate(data, {
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
    port: Joi.number().integer().min(1000).max(65535).default(3001),
    environment: Joi.string().valid('development', 'staging', 'production').default('development'),
    logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    maxRequestSize: Joi.string().default('10mb'),
    corsOrigins: Joi.array().items(Joi.string()).default(['http://localhost:3000']),
    healthCheckInterval: Joi.number().integer().min(1000).default(30000)
  });

  return configSchema.validate(config, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

module.exports = {
  validateCollectVersesRequest,
  validateHealthRequest,
  validateCorrelationId,
  validateServiceConfig,
  schemas: {
    collectVerses: collectVersesSchema,
    health: healthSchema
  }
};
