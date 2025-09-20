# Spiritual Synthesizer Agent

## Overview

The **Spiritual Synthesizer Agent** is Phase 3 of the My Gurukul multi-agent architecture. It transforms raw verse data from the Sanskrit Collector into conversational wisdom narratives that feel like talking with a knowledgeable, humble spiritual guide.

## Primary Role

Transform raw verse data from Sanskrit Collector into conversational wisdom narratives with:

- **Grounding**: Authoritative spiritual guidance with scriptural backing
- **Transparency**: Always shows scripture sources and verse references
- **Narrative Flow**: Natural, engaging conversational tone
- **Conversation State**: Tracks dialogue history for contextual follow-ups

## Core Architecture

### Services

1. **NarrativeSynthesizer** (`services/NarrativeSynthesizer.js`)
   - Processes collector verse data
   - Validates scriptural grounding
   - Builds narrative structure
   - Generates conversational responses
   - Embeds natural source citations

2. **ConversationManager** (`services/ConversationManager.js`)
   - Manages dialogue state and history
   - Tracks conversation context
   - Detects topic shifts
   - Generates optimized collector queries
   - Handles follow-up logic

### API Endpoints

- `POST /api/v1/synthesize-wisdom` - Initial wisdom synthesis
- `POST /api/v1/continue-conversation` - Follow-up conversations
- `GET /api/v1/conversation/:sessionId` - Retrieve conversation history
- `GET /health` - Service health check

## Response Format

The synthesizer produces conversational responses with:

```
Natural opening → Scriptural wisdom (with sources) → Practical guidance → Invitation for deeper exploration
```

Example:
```
"Your question about handling difficult relationships touches the very heart of dharmic living. The Mahabharata offers profound guidance here... [verse with source] ... This wisdom suggests that... Would you like to explore how this applies to your specific situation?"
```

## Installation & Setup

1. **Navigate to the service directory:**
   ```bash
   cd agents/spiritual-synthesizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=3002
   NODE_ENV=development
   LOG_LEVEL=info
   SANSKRIT_COLLECTOR_URL=http://localhost:3001
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Start the service:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Integration with Sanskrit Collector

The synthesizer integrates seamlessly with the Sanskrit Collector:

- **Automatic Querying**: Fetches verse data when needed
- **Contextual Queries**: Optimizes queries based on conversation history
- **Fallback Handling**: Gracefully handles collector unavailability
- **Topic Shift Detection**: Triggers new queries when conversation shifts

## Testing

### Run Integration Tests
```bash
node test-integration.js
```

### Manual Testing
```bash
# Health check
curl http://localhost:3002/health

# Synthesize wisdom
curl -X POST http://localhost:3002/api/v1/synthesize-wisdom \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How can I find inner peace?",
    "verseData": {...},
    "context": {"userId": "test-user"}
  }'

# Continue conversation
curl -X POST http://localhost:3002/api/v1/continue-conversation \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me more about meditation",
    "sessionId": "your-session-id"
  }'
```

## Key Features

### Intelligent Narrative Construction
- **Not just formatting**: Creates meaningful spiritual guidance
- **Relevance assessment**: Prioritizes most applicable verses
- **Theme clustering**: Groups related teachings coherently
- **Tone adaptation**: Adjusts formality based on user preference

### Conversation Flow Management
- **State persistence**: Maintains context across exchanges
- **Topic detection**: Identifies when new verses are needed
- **Follow-up optimization**: Reuses existing context when appropriate
- **Session management**: Automatic cleanup of inactive conversations

### Scriptural Transparency
- **Source citation**: Always references original scriptures
- **Natural embedding**: Citations feel conversational, not academic
- **Grounding validation**: Ensures all claims have scriptural backing
- **Multiple perspectives**: Presents balanced traditional views

## Sankalpa Principles

The synthesizer embodies traditional spiritual guidance principles:

- **Humility** (`vinaya`): Presents wisdom with gentle authority
- **Compassion** (`daya`): Guides seekers with understanding
- **Truthfulness** (`satya`): Always cites sources transparently
- **Non-harm** (`ahimsa`): Offers guidance without exclusion

## Development

### Project Structure
```
agents/spiritual-synthesizer/
├── server.js                 # Main Express server
├── services/
│   ├── NarrativeSynthesizer.js    # Core synthesis logic
│   └── ConversationManager.js     # Dialogue state management
├── logger.js                 # Winston logging configuration
├── errors.js                 # Custom error classes
├── errorHandler.js           # Express error middleware
├── validation.js             # Joi validation schemas
├── test-integration.js       # Integration tests
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

### Adding New Features
1. Extend validation schemas in `validation.js`
2. Add methods to appropriate service classes
3. Update API endpoints in `server.js`
4. Add tests to `test-integration.js`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3002` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `SANSKRIT_COLLECTOR_URL` | Collector service URL | `http://localhost:3001` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |
| `MAX_CONVERSATION_LENGTH` | Max turns per conversation | `50` |
| `CONVERSATION_TIMEOUT_MINUTES` | Session timeout | `60` |

## Monitoring & Logging

The service provides comprehensive logging:

- **Request correlation**: Track requests across services
- **Performance metrics**: Response times and resource usage
- **Business events**: Conversation analytics
- **Error tracking**: Detailed error context and stack traces

## Troubleshooting

### Common Issues

1. **Collector Unavailable**
   - Check if Sanskrit Collector is running on port 3001
   - Verify network connectivity between services

2. **Validation Errors**
   - Ensure request format matches API documentation
   - Check required fields are present

3. **Session Not Found**
   - Verify session ID is correct
   - Check if session has expired (default: 60 minutes)

### Debug Mode
Set `LOG_LEVEL=debug` for detailed logging during development.

## Contributing

1. Follow existing code patterns and error handling
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure all linting passes

## License

MIT License - See package.json for details.
