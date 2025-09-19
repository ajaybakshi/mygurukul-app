# Sanskrit Collector Service

A microservice for collecting, analyzing, and clustering Sanskrit verses using advanced RAG (Retrieval-Augmented Generation) techniques.

## Features

- **Semantic Analysis**: Intelligent query understanding and intent extraction
- **Verse Retrieval**: Advanced RAG implementation for relevant verse collection
- **Intelligent Clustering**: Groups verses by themes and relevance
- **Structured Response**: Formatted output with Sanskrit IAST and interpretations
- **Comprehensive Logging**: Structured logging with correlation IDs
- **Input Validation**: Joi-based request validation
- **Error Handling**: Specific error codes and graceful error handling
- **Health Monitoring**: Built-in health check endpoints
- **Docker Support**: Containerized deployment ready

## API Endpoints

### POST /api/v1/collect-verses

Collects and clusters Sanskrit verses based on semantic analysis.

**Request Body:**
```json
{
  "question": "What do the Vedas teach about happiness?",
  "context": {
    "sessionId": "uuid",
    "userId": "user123",
    "preferences": {
      "includeSanskrit": true,
      "maxVerses": 10,
      "detailLevel": "detailed"
    }
  },
  "options": {
    "clusteringStrategy": "thematic",
    "includeMetadata": true,
    "responseFormat": "structured"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What do the Vedas teach about happiness?",
    "clusters": [
      {
        "theme": "happiness",
        "relevance": 0.95,
        "verses": [
          {
            "reference": "Rig Veda, Verse 1.1.1",
            "sanskrit": "agnimīḷe purohitaṃ yajñasya devaṃ ṛtvijam",
            "translation": "I praise Agni, the chosen priest, the divine, the ministrant",
            "interpretation": "This verse invokes Agni as the divine messenger and priest of the sacrifice",
            "relevance": 0.95
          }
        ]
      }
    ],
    "metadata": {
      "totalClusters": 1,
      "totalVerses": 1,
      "processingTime": "2025-09-19T08:35:04.309Z"
    }
  },
  "correlationId": "uuid",
  "timestamp": "2025-09-19T08:35:04.309Z"
}
```

### GET /health

Health check endpoint for service monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "sanskrit-collector",
  "version": "1.0.0",
  "timestamp": "2025-09-19T08:35:04.309Z",
  "correlationId": "uuid",
  "details": {
    "healthy": true,
    "uptime": 123.45,
    "memory": {
      "rss": 12345678,
      "heapTotal": 8765432,
      "heapUsed": 1234567,
      "external": 123456
    }
  }
}
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t sanskrit-collector .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3001:3001 \
     -e NODE_ENV=production \
     -e LOG_LEVEL=info \
     sanskrit-collector
   ```

## Development

### Project Structure

```
sanskrit-collector/
├── server.js              # Main server file
├── CollectorService.js     # Core business logic
├── validation.js          # Request validation schemas
├── logger.js              # Structured logging
├── errors.js              # Custom error classes
├── errorHandler.js        # Error handling middleware
├── Dockerfile             # Container configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/staging/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

### Service Options

- `clusteringStrategy`: thematic, semantic, or relevance
- `responseFormat`: structured, narrative, or minimal
- `detailLevel`: basic, detailed, or comprehensive

## Error Handling

The service uses specific error codes for different failure scenarios:

- `VALIDATION_ERROR`: Request validation failed
- `SEMANTIC_ANALYSIS_FAILED`: Query analysis failed
- `VERSE_RETRIEVAL_FAILED`: Verse collection failed
- `VERSE_CLUSTERING_FAILED`: Clustering failed
- `RESPONSE_FORMATTING_FAILED`: Response formatting failed
- `SERVICE_UNAVAILABLE`: External service unavailable

## Monitoring

- Health check endpoint: `GET /health`
- Structured logging with correlation IDs
- Performance metrics logging
- Error tracking and reporting

## Integration

This service is designed to work as part of the MyGurukul multi-agent architecture:

1. **Sanskrit Collector** (this service) - Verse collection and clustering
2. **Spiritual Synthesizer** - Wisdom synthesis and interpretation
3. **Orchestrator** - Master coordination and response assembly

## License

MIT License - see LICENSE file for details.
