const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../../.env.local' });

// Log environment variable status for debugging
console.log('Environment variables loaded:', {
  hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
  hasClientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  hasApiEndpoint: !!process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT
});

const { CollectorService } = require('./CollectorService');
let collectorService;
const { validateCollectVersesRequest, validateHealthRequest } = require('./validation');
const logger = require('./logger');
const { errorHandler } = require('./errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Request logging with correlation ID
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), { service: 'sanskrit-collector' })
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize collector service

/**
 * POST /api/v1/collect-verses
 * Collects and clusters Sanskrit verses based on semantic analysis
 */
app.post('/api/v1/collect-verses', async (req, res, next) => {
  const correlationId = req.correlationId;
  
  try {
    logger.info('Collect verses request received', { 
      correlationId, 
      body: req.body 
    });

    // Validate request
    const { error, value } = validateCollectVersesRequest(req.body);
    if (error) {
      logger.warn('Invalid request validation', { 
        correlationId, 
        error: error.details 
      });
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: error.details,
        correlationId
      });
    }

    const { question, context, options = {} } = value;

    // Process the request
    const result = await collectorService.processQuery({
      question,
      context,
      options,
      correlationId
    });

    logger.info('Collect verses request completed successfully', {
      correlationId,
      verseCount: result.results?.verses?.length || 0,
      clusterCount: 0
    });

    res.json({
      success: true,
      data: result,
      correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Collect verses request failed', { 
      correlationId, 
      error: error.message,
      stack: error.stack 
    });
    next(error);
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (req, res, next) => {
  const correlationId = req.correlationId;
  
  try {
    logger.info('Health check requested', { correlationId });

    // Validate request
    const { error } = validateHealthRequest(req.query);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid health check parameters',
        details: error.details,
        correlationId
      });
    }

    // Check service health
    const healthStatus = await collectorService.getHealthStatus();

    const status = healthStatus.healthy ? 200 : 503;
    
    res.status(status).json({
      status: healthStatus.healthy ? 'healthy' : 'unhealthy',
      service: 'sanskrit-collector',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      correlationId,
      details: healthStatus
    });

  } catch (error) {
    logger.error('Health check failed', { 
      correlationId, 
      error: error.message 
    });
    next(error);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    correlationId: req.correlationId
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

async function initializeApp() {
  collectorService = await CollectorService.create();

  // Now start the server
  app.listen(PORT, () => {
    logger.info(`Collector service running on port ${PORT}`);
  });
}

// Call the async function to start the application
initializeApp();

module.exports = app;
