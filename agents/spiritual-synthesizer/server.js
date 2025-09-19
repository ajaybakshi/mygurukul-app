const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const NarrativeSynthesizer = require('./services/NarrativeSynthesizer');
const ConversationManager = require('./services/ConversationManager');
const {
  validateSynthesizeWisdomRequest,
  validateContinueConversationRequest,
  validateGetConversationRequest,
  validateHealthRequest
} = require('./validation');
const logger = require('./logger');
const { errorHandler, asyncErrorHandler, handleAxiosError } = require('./errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize services
const synthesizer = new NarrativeSynthesizer();
const conversationManager = new ConversationManager();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
}));

// Request logging with correlation ID
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), { service: 'spiritual-synthesizer' })
  },
  skip: (req) => req.url === '/health' // Skip health check logging in production
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * POST /api/v1/synthesize-wisdom
 * Synthesize wisdom narrative from verse data and user question
 */
app.post('/api/v1/synthesize-wisdom', async (req, res) => {
  console.log("DEBUG: Endpoint hit with body:", req.body);
  const correlationId = req.correlationId;

  logger.info('Synthesize wisdom request received', {
    correlationId,
    hasSessionId: !!req.body.sessionId,
    questionLength: req.body.question?.length || 0
  });

  // Validate request
  const { error, value } = validateSynthesizeWisdomRequest(req.body);
  if (error) {
    logger.warn('Invalid synthesize wisdom request', {
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

  const { question, sessionId, context = {}, verseData, options = {} } = value;

  try {
    // Generate or use session ID
    const finalSessionId = sessionId || uuidv4();

    // Determine if we need to query collector or can use existing context
    let finalVerseData = verseData;
    let collectorResponse = null;

    if (!verseData || options.forceNewQuery) {
      // Query Sanskrit Collector
      logger.info('Querying Sanskrit Collector for verse data', { correlationId });

      const collectorQuery = await conversationManager.generateCollectorQuery(question, {
        history: sessionId ? await getConversationHistorySafe(sessionId) : []
      });

      try {
        const collectorUrl = process.env.SANSKRIT_COLLECTOR_URL || 'http://localhost:3001';
        collectorResponse = await axios.post(`${collectorUrl}/api/v1/collect-verses`, collectorQuery, {
          headers: {
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        finalVerseData = collectorResponse.data.data;
        logger.info('Sanskrit Collector query successful', {
          correlationId,
          verseCount: finalVerseData.verses?.length || 0,
          clusterCount: finalVerseData.clusters?.length || 0
        });

      } catch (collectorError) {
        logger.error('Sanskrit Collector query failed', {
          correlationId,
          error: collectorError.message
        });

        if (collectorError.response?.status === 503) {
          return res.status(503).json({
            error: 'SERVICE_UNAVAILABLE',
            message: 'Sanskrit Collector service is temporarily unavailable',
            correlationId
          });
        }

        throw handleAxiosError(collectorError);
      }
    }

    // Synthesize wisdom narrative
    console.log("DEBUG: About to call synthesizeWisdom with:", { 
      finalVerseData, 
      question, 
      context: {...context, sessionId: finalSessionId}, 
      correlationId 
    });
    const wisdomResponse = await synthesizer.synthesizeWisdom(finalVerseData, question, {
      ...context,
      sessionId: finalSessionId
    }, correlationId);

    // Store conversation turn
    await conversationManager.storeConversationTurn(finalSessionId, question, {
      ...wisdomResponse,
      verseData: finalVerseData
    });

    logger.info('Wisdom synthesis completed successfully', {
      correlationId,
      sessionId: finalSessionId,
      narrativeLength: wisdomResponse.narrative?.length || 0
    });

    res.json({
      success: true,
      data: {
        sessionId: finalSessionId,
        narrative: wisdomResponse.narrative,
        citations: wisdomResponse.citations,
        sources: wisdomResponse.sources,
        structure: wisdomResponse.structure,
        metadata: {
          ...wisdomResponse.metadata,
          collectorQueryPerformed: !!collectorResponse,
          conversationTurn: await getConversationTurnCount(finalSessionId)
        }
      },
      correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Synthesize wisdom request failed', {
      correlationId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});

/**
 * POST /api/v1/continue-conversation
 * Continue existing conversation with follow-up questions
 */
app.post('/api/v1/continue-conversation', asyncErrorHandler(async (req, res) => {
  const correlationId = req.correlationId;

  logger.info('Continue conversation request received', {
    correlationId,
    sessionId: req.body.sessionId,
    questionLength: req.body.question?.length || 0
  });

  // Validate request
  const { error, value } = validateContinueConversationRequest(req.body);
  if (error) {
    logger.warn('Invalid continue conversation request', {
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

  const { question, sessionId, context = {}, verseData, options = {} } = value;

  try {
    // Get conversation history
    const history = await conversationManager.getConversationHistory(sessionId, {
      limit: 10,
      includeMetadata: false
    });

    // Analyze follow-up need
    const followUpNeed = await conversationManager.identifyFollowUpNeed(question, history.turns);

    let wisdomResponse;
    let collectorResponse = null;

    if (followUpNeed.needsNewQuery && !options.skipCollectorQuery) {
      // Query collector for new data
      logger.info('Querying collector for follow-up data', {
        correlationId,
        reason: followUpNeed.reason
      });

      const collectorQuery = await conversationManager.generateCollectorQuery(question, {
        history: history.turns
      });

      try {
        const collectorUrl = process.env.SANSKRIT_COLLECTOR_URL || 'http://localhost:3001';
        collectorResponse = await axios.post(`${collectorUrl}/api/v1/collect-verses`, collectorQuery, {
          headers: {
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        const newVerseData = collectorResponse.data.data;
        wisdomResponse = await synthesizer.synthesizeWisdom(newVerseData, question, {
          ...context,
          sessionId
        }, correlationId);

      } catch (collectorError) {
        logger.warn('Collector query failed for follow-up, using existing context', {
          correlationId,
          error: collectorError.message
        });

        // Fall back to contextual response
        wisdomResponse = await conversationManager.generateContextualResponse(question, history.turns);
      }
    } else {
      // Generate response from existing context
      logger.info('Generating response from existing conversation context', {
        correlationId,
        reason: followUpNeed.reason
      });

      wisdomResponse = await conversationManager.generateContextualResponse(question, history.turns);
    }

    // Store conversation turn
    await conversationManager.storeConversationTurn(sessionId, question, {
      ...wisdomResponse,
      verseData: collectorResponse?.data?.data || verseData
    });

    logger.info('Conversation continuation completed successfully', {
      correlationId,
      sessionId,
      usedExistingContext: !collectorResponse,
      narrativeLength: wisdomResponse.narrative?.length || 0
    });

    res.json({
      success: true,
      data: {
        sessionId,
        narrative: wisdomResponse.narrative,
        citations: wisdomResponse.citations,
        sources: wisdomResponse.sources,
        metadata: {
          ...wisdomResponse.metadata,
          followUpAnalysis: followUpNeed,
          collectorQueryPerformed: !!collectorResponse,
          conversationTurn: await getConversationTurnCount(sessionId)
        }
      },
      correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Continue conversation request failed', {
      correlationId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}));

/**
 * GET /api/v1/conversation/:sessionId
 * Retrieve conversation history
 */
app.get('/api/v1/conversation/:sessionId', asyncErrorHandler(async (req, res) => {
  const correlationId = req.correlationId;
  const { sessionId } = req.params;

  logger.info('Get conversation request received', {
    correlationId,
    sessionId
  });

  // Validate request
  const { error, value } = validateGetConversationRequest({
    sessionId,
    ...req.query
  });

  if (error) {
    logger.warn('Invalid get conversation request', {
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

  const { options } = value;

  try {
    const history = await conversationManager.getConversationHistory(sessionId, options);

    logger.info('Conversation history retrieved successfully', {
      correlationId,
      sessionId,
      turnCount: history.turns.length
    });

    res.json({
      success: true,
      data: history,
      correlationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.name === 'SessionNotFoundError') {
      logger.warn('Conversation session not found', {
        correlationId,
        sessionId
      });
      return res.status(404).json({
        error: 'SESSION_NOT_FOUND',
        message: `Conversation session ${sessionId} not found`,
        correlationId
      });
    }

    logger.error('Get conversation request failed', {
      correlationId,
      sessionId,
      error: error.message
    });
    throw error;
  }
}));

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', asyncErrorHandler(async (req, res) => {
  const correlationId = req.correlationId;

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

  try {
    // Get service health status
    const synthesizerHealth = await synthesizer.getHealthStatus();
    const conversationHealth = {
      healthy: conversationManager.conversations.size >= 0, // Basic health check
      activeConversations: conversationManager.conversations.size,
      timestamp: new Date().toISOString()
    };

    const overallHealth = synthesizerHealth.healthy && conversationHealth.healthy;
    const status = overallHealth ? 200 : 503;

    const healthResponse = {
      status: overallHealth ? 'healthy' : 'unhealthy',
      service: 'spiritual-synthesizer',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      correlationId,
      services: {
        synthesizer: synthesizerHealth,
        conversationManager: conversationHealth
      }
    };

    res.status(status).json(healthResponse);

  } catch (error) {
    logger.error('Health check failed', {
      correlationId,
      error: error.message
    });
    throw error;
  }
}));

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

// Helper functions
async function getConversationHistorySafe(sessionId) {
  try {
    const history = await conversationManager.getConversationHistory(sessionId, {
      limit: 5,
      includeMetadata: false
    });
    return history.turns;
  } catch (error) {
    return [];
  }
}

async function getConversationTurnCount(sessionId) {
  try {
    const history = await conversationManager.getConversationHistory(sessionId, {
      limit: 1,
      includeMetadata: true
    });
    return history.metadata?.totalTurns || 0;
  } catch (error) {
    return 0;
  }
}

// Start server
app.listen(PORT, () => {
  logger.info(`Spiritual Synthesizer Service started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    service: 'spiritual-synthesizer',
    collectorUrl: process.env.SANSKRIT_COLLECTOR_URL || 'http://localhost:3001'
  });
});

module.exports = app;
