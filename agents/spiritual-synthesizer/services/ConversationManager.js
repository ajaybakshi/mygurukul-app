const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const { ConversationStateError, SessionNotFoundError } = require('../errors');

/**
 * Conversation Manager Service
 * Manages dialogue state, conversation history, and context tracking for spiritual guidance
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map(); // In-memory storage - in production, use Redis/database
    this.sessionTimeouts = new Map();
    this.maxConversationLength = process.env.MAX_CONVERSATION_LENGTH || 50;
    this.conversationTimeoutMinutes = process.env.CONVERSATION_TIMEOUT_MINUTES || 60;

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Store a conversation turn
   * @param {string} sessionId - Conversation session ID
   * @param {string} userQuestion - User's question
   * @param {Object} synthesizedResponse - Synthesized wisdom response
   * @returns {Promise<Object>} Updated conversation state
   */
  async storeConversationTurn(sessionId, userQuestion, synthesizedResponse) {
    try {
      logger.info('Storing conversation turn', {
        sessionId,
        questionLength: userQuestion.length,
        responseLength: synthesizedResponse.narrative?.length || 0
      });

      // Get or create conversation
      let conversation = this.conversations.get(sessionId);
      if (!conversation) {
        conversation = this.createNewConversation(sessionId);
      }

      // Add new turn
      const turn = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userQuestion: {
          text: userQuestion,
          intent: this.analyzeQuestionIntent(userQuestion),
          themes: this.extractQuestionThemes(userQuestion)
        },
        synthesizedResponse: {
          narrative: synthesizedResponse.narrative,
          citations: synthesizedResponse.citations,
          sources: synthesizedResponse.sources,
          metadata: synthesizedResponse.metadata
        },
        context: {
          verseData: synthesizedResponse.verseData,
          primaryTheme: synthesizedResponse.structure?.primaryTheme?.name,
          supportingThemes: synthesizedResponse.structure?.supportingThemes?.map(t => t.name) || []
        }
      };

      conversation.turns.push(turn);
      conversation.lastActivity = new Date().toISOString();
      conversation.metadata.totalTurns = conversation.turns.length;

      // Trim conversation if too long
      if (conversation.turns.length > this.maxConversationLength) {
        conversation.turns = conversation.turns.slice(-this.maxConversationLength);
        logger.info('Trimmed conversation history', {
          sessionId,
          trimmedCount: 1,
          remainingTurns: conversation.turns.length
        });
      }

      // Update conversation metadata
      this.updateConversationMetadata(conversation);

      // Store updated conversation
      this.conversations.set(sessionId, conversation);

      // Reset session timeout
      this.resetSessionTimeout(sessionId);

      logger.info('Conversation turn stored successfully', {
        sessionId,
        totalTurns: conversation.turns.length,
        primaryTheme: turn.context.primaryTheme
      });

      return {
        sessionId,
        turnId: turn.id,
        conversationState: {
          totalTurns: conversation.turns.length,
          primaryThemes: conversation.metadata.primaryThemes,
          lastActivity: conversation.lastActivity
        }
      };

    } catch (error) {
      logger.error('Failed to store conversation turn', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw new ConversationStateError('Failed to store conversation turn', error);
    }
  }

  /**
   * Retrieve conversation history
   * @param {string} sessionId - Conversation session ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Conversation history
   */
  async getConversationHistory(sessionId, options = {}) {
    try {
      logger.info('Retrieving conversation history', {
        sessionId,
        options
      });

      const conversation = this.conversations.get(sessionId);
      if (!conversation) {
        throw new SessionNotFoundError(sessionId);
      }

      // Apply options
      let turns = [...conversation.turns];
      const { limit = 20, offset = 0, includeMetadata = true } = options;

      // Apply pagination
      turns = turns.slice(offset, offset + limit);

      // Format response
      const history = {
        sessionId,
        turns: turns.map(turn => ({
          id: turn.id,
          timestamp: turn.timestamp,
          userQuestion: turn.userQuestion.text,
          synthesizedResponse: {
            narrative: turn.synthesizedResponse.narrative,
            citations: turn.synthesizedResponse.citations,
            sources: turn.synthesizedResponse.sources
          },
          context: turn.context
        })),
        pagination: {
          total: conversation.turns.length,
          limit,
          offset,
          hasMore: (offset + limit) < conversation.turns.length
        }
      };

      if (includeMetadata) {
        history.metadata = {
          ...conversation.metadata,
          lastActivity: conversation.lastActivity,
          createdAt: conversation.createdAt
        };
      }

      logger.info('Conversation history retrieved successfully', {
        sessionId,
        turnCount: turns.length,
        totalTurns: conversation.turns.length
      });

      return history;

    } catch (error) {
      logger.error('Failed to retrieve conversation history', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Detect topic shift between questions
   * @param {string} newQuestion - New user question
   * @param {Array} history - Conversation history
   * @returns {Promise<Object>} Topic shift analysis
   */
  async detectTopicShift(newQuestion, history) {
    try {
      if (!history || history.length === 0) {
        return {
          isTopicShift: true,
          confidence: 1.0,
          reason: 'First question in conversation'
        };
      }

      const lastTurn = history[history.length - 1];
      const previousThemes = lastTurn.context.primaryTheme ?
        [lastTurn.context.primaryTheme, ...lastTurn.context.supportingThemes] : [];
      const newThemes = this.extractQuestionThemes(newQuestion);

      // Calculate theme overlap
      const overlappingThemes = previousThemes.filter(theme =>
        newThemes.some(newTheme => this.themesAreRelated(theme, newTheme))
      );

      const overlapRatio = overlappingThemes.length / Math.max(previousThemes.length, newThemes.length);
      const isTopicShift = overlapRatio < 0.3; // Less than 30% overlap indicates topic shift

      logger.info('Topic shift analysis completed', {
        overlapRatio,
        isTopicShift,
        previousThemes,
        newThemes
      });

      return {
        isTopicShift,
        confidence: Math.abs(overlapRatio - 0.5) * 2, // Higher confidence when clearly shifted or continued
        reason: isTopicShift ?
          'New themes detected with minimal overlap to previous discussion' :
          'Continuing exploration of existing themes',
        overlappingThemes,
        newThemes
      };

    } catch (error) {
      logger.error('Topic shift detection failed', {
        error: error.message
      });
      return {
        isTopicShift: true, // Default to shift on error
        confidence: 0.5,
        reason: 'Analysis failed, assuming topic shift'
      };
    }
  }

  /**
   * Generate optimized query for Sanskrit Collector
   * @param {string} question - User's question
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} Optimized collector query
   */
  async generateCollectorQuery(question, context) {
    try {
      logger.info('Generating optimized collector query', {
        questionLength: question.length,
        hasContext: !!context
      });

      const baseQuery = {
        question,
        context: {
          intent: this.analyzeQuestionIntent(question),
          themes: this.extractQuestionThemes(question),
          timestamp: new Date().toISOString()
        },
        options: {
          clusteringStrategy: 'thematic',
          includeMetadata: true,
          responseFormat: 'structured'
        }
      };

      // Enhance query based on conversation context
      if (context && context.history) {
        const recentThemes = this.extractRecentThemes(context.history);
        const topicShift = await this.detectTopicShift(question, context.history);

        if (!topicShift.isTopicShift) {
          // Continue existing theme exploration
          baseQuery.context.relatedThemes = recentThemes;
          baseQuery.options.focusThemes = recentThemes.slice(0, 3);
        } else {
          // New topic - broaden search
          baseQuery.options.clusteringStrategy = 'semantic';
          baseQuery.context.topicShift = true;
        }

        // Add conversation depth for more nuanced responses
        baseQuery.context.conversationDepth = context.history.length;
        baseQuery.context.previousIntents = context.history
          .slice(-3)
          .map(turn => turn.userQuestion.intent);
      }

      // Optimize for spiritual guidance patterns
      baseQuery.context.spiritualContext = {
        seekingWisdom: this.detectWisdomSeeking(question),
        facingChallenge: this.detectChallenge(question),
        exploringConcept: this.detectConceptExploration(question)
      };

      logger.info('Optimized collector query generated', {
        intent: baseQuery.context.intent,
        themeCount: baseQuery.context.themes.length,
        hasFocusThemes: !!baseQuery.options.focusThemes
      });

      return baseQuery;

    } catch (error) {
      logger.error('Failed to generate collector query', {
        error: error.message
      });
      // Return basic query on error
      return {
        question,
        context: { intent: 'general_inquiry' },
        options: { clusteringStrategy: 'thematic' }
      };
    }
  }

  /**
   * Check if new collector query is needed
   * @param {string} newQuestion - New user question
   * @param {Array} history - Conversation history
   * @returns {Promise<Object>} Query need analysis
   */
  async identifyFollowUpNeed(newQuestion, history) {
    try {
      const topicShift = await this.detectTopicShift(newQuestion, history);

      if (topicShift.isTopicShift) {
        return {
          needsNewQuery: true,
          reason: topicShift.reason,
          confidence: topicShift.confidence
        };
      }

      // Check if we have sufficient verse data for the current topic
      const recentTurns = history.slice(-3);
      const hasSufficientData = recentTurns.some(turn =>
        turn.context.verseData &&
        turn.context.verseData.length > 0
      );

      // Check if question is deepening exploration
      const isDeepening = this.detectDeepeningExploration(newQuestion, history);

      const needsNewQuery = !hasSufficientData || isDeepening;

      return {
        needsNewQuery,
        reason: needsNewQuery ?
          (isDeepening ? 'Deepening exploration requires additional verses' : 'Insufficient verse data for current topic') :
          'Can synthesize from existing conversation context',
        confidence: topicShift.confidence,
        topicShift: topicShift.isTopicShift
      };

    } catch (error) {
      logger.error('Follow-up need identification failed', {
        error: error.message
      });
      return {
        needsNewQuery: true, // Default to new query on error
        reason: 'Analysis failed, requesting fresh data',
        confidence: 0.5
      };
    }
  }

  /**
   * Generate contextual response from existing history
   * @param {string} question - User's question
   * @param {Array} history - Conversation history
   * @returns {Promise<Object>} Contextual response
   */
  async generateContextualResponse(question, history) {
    try {
      logger.info('Generating contextual response from history', {
        questionLength: question.length,
        historyLength: history.length
      });

      const recentTurns = history.slice(-3);
      const relevantVerses = this.extractRelevantVersesFromHistory(recentTurns, question);
      const conversationContext = this.buildConversationContext(recentTurns);

      // Synthesize response from existing data
      const contextualResponse = {
        narrative: this.synthesizeFromContext(question, relevantVerses, conversationContext),
        citations: this.extractCitationsFromHistory(recentTurns),
        sources: this.extractSourcesFromHistory(recentTurns),
        metadata: {
          synthesizedFromHistory: true,
          sourceTurns: recentTurns.length,
          relevantVersesCount: relevantVerses.length,
          generatedAt: new Date().toISOString()
        }
      };

      logger.info('Contextual response generated successfully', {
        relevantVersesCount: relevantVerses.length,
        narrativeLength: contextualResponse.narrative.length
      });

      return contextualResponse;

    } catch (error) {
      logger.error('Contextual response generation failed', {
        error: error.message
      });
      throw new ConversationStateError('Failed to generate contextual response', error);
    }
  }

  // Helper methods

  createNewConversation(sessionId) {
    return {
      sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      turns: [],
      metadata: {
        totalTurns: 0,
        primaryThemes: [],
        intents: [],
        lastIntent: null,
        conversationDepth: 0
      }
    };
  }

  analyzeQuestionIntent(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('what') || lowerQuestion.includes('teach') || lowerQuestion.includes('explain')) {
      return 'knowledge_seeking';
    } else if (lowerQuestion.includes('how') || lowerQuestion.includes('guidance') || lowerQuestion.includes('help')) {
      return 'guidance_seeking';
    } else if (lowerQuestion.includes('why') || lowerQuestion.includes('meaning') || lowerQuestion.includes('purpose')) {
      return 'meaning_seeking';
    } else if (lowerQuestion.includes('should') || lowerQuestion.includes('right') || lowerQuestion.includes('dharma')) {
      return 'ethical_guidance';
    }

    return 'general_inquiry';
  }

  extractQuestionThemes(question) {
    const themes = [];
    const lowerQuestion = question.toLowerCase();

    const themeMap = {
      'dharma': ['dharma', 'duty', 'righteousness', 'moral', 'obligation'],
      'karma': ['karma', 'action', 'consequence', 'deed'],
      'moksha': ['moksha', 'liberation', 'freedom', 'enlightenment', 'salvation'],
      'bhakti': ['bhakti', 'devotion', 'love', 'surrender'],
      'jnana': ['jnana', 'knowledge', 'wisdom', 'understanding', 'awareness'],
      'yoga': ['yoga', 'meditation', 'practice', 'discipline'],
      'peace': ['peace', 'shanti', 'calm', 'tranquility'],
      'relationships': ['relationship', 'love', 'marriage', 'family', 'friend'],
      'work': ['work', 'career', 'profession', 'job', 'duty'],
      'mind': ['mind', 'thought', 'emotion', 'feeling', 'mental']
    };

    for (const [theme, keywords] of Object.entries(themeMap)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general_spiritual'];
  }

  updateConversationMetadata(conversation) {
    const turns = conversation.turns;
    const intents = turns.map(turn => turn.userQuestion.intent);
    const themes = turns.flatMap(turn => turn.userQuestion.themes);

    conversation.metadata.intents = [...new Set(intents)];
    conversation.metadata.primaryThemes = [...new Set(themes)];
    conversation.metadata.lastIntent = intents[intents.length - 1];
    conversation.metadata.conversationDepth = this.calculateConversationDepth(turns);
  }

  calculateConversationDepth(turns) {
    if (turns.length < 2) return 1;

    let depth = 1;
    for (let i = 1; i < turns.length; i++) {
      const currentIntent = turns[i].userQuestion.intent;
      const previousIntent = turns[i-1].userQuestion.intent;

      if (currentIntent === previousIntent) {
        depth += 0.5; // Following up on same intent
      } else if (this.intentsAreRelated(currentIntent, previousIntent)) {
        depth += 0.8; // Related intents
      } else {
        depth += 1; // New direction
      }
    }

    return Math.min(depth, 10); // Cap at 10
  }

  intentsAreRelated(intent1, intent2) {
    const relatedPairs = [
      ['knowledge_seeking', 'meaning_seeking'],
      ['guidance_seeking', 'ethical_guidance'],
      ['meaning_seeking', 'guidance_seeking']
    ];

    return relatedPairs.some(pair =>
      (pair[0] === intent1 && pair[1] === intent2) ||
      (pair[0] === intent2 && pair[1] === intent1)
    );
  }

  themesAreRelated(theme1, theme2) {
    const relatedThemeGroups = [
      ['dharma', 'karma', 'ethical_guidance'],
      ['moksha', 'liberation', 'jnana'],
      ['bhakti', 'devotion', 'love'],
      ['yoga', 'meditation', 'practice'],
      ['peace', 'mind', 'emotion']
    ];

    return relatedThemeGroups.some(group =>
      group.includes(theme1) && group.includes(theme2)
    );
  }

  resetSessionTimeout(sessionId) {
    // Clear existing timeout
    if (this.sessionTimeouts.has(sessionId)) {
      clearTimeout(this.sessionTimeouts.get(sessionId));
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.conversations.delete(sessionId);
      this.sessionTimeouts.delete(sessionId);
      logger.info('Conversation session expired and cleaned up', { sessionId });
    }, this.conversationTimeoutMinutes * 60 * 1000);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  startCleanupInterval() {
    // Clean up expired sessions every 30 minutes
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = this.conversationTimeoutMinutes * 60 * 1000;

      for (const [sessionId, conversation] of this.conversations.entries()) {
        const lastActivity = new Date(conversation.lastActivity).getTime();
        if (now - lastActivity > timeoutMs) {
          this.conversations.delete(sessionId);
          this.sessionTimeouts.delete(sessionId);
          logger.info('Cleaned up expired conversation session', { sessionId });
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  extractRecentThemes(history) {
    const recentTurns = history.slice(-3);
    const themes = recentTurns.flatMap(turn =>
      turn.context.primaryTheme ? [turn.context.primaryTheme] : []
    );
    return [...new Set(themes)];
  }

  detectWisdomSeeking(question) {
    const wisdomKeywords = ['wisdom', 'teach', 'guide', 'understand', 'learn', 'know'];
    return wisdomKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  detectChallenge(question) {
    const challengeKeywords = ['difficult', 'struggle', 'problem', 'challenge', 'hard', 'confused'];
    return challengeKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  detectConceptExploration(question) {
    const conceptKeywords = ['what is', 'meaning of', 'explain', 'tell me about'];
    return conceptKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  detectDeepeningExploration(question, history) {
    const deepeningKeywords = ['deeper', 'more about', 'further', 'elaborate', 'expand'];
    return deepeningKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  extractRelevantVersesFromHistory(turns, question) {
    const questionThemes = this.extractQuestionThemes(question);
    const relevantVerses = [];

    turns.forEach(turn => {
      if (turn.context.verseData) {
        const verseData = turn.context.verseData || [];
        if (Array.isArray(verseData)) {
          verseData.forEach(verse => {
            const verseThemes = [verse.clusterTheme, ...(verse.themes || [])];
            const isRelevant = questionThemes.some(qTheme =>
              verseThemes.some(vTheme => this.themesAreRelated(qTheme, vTheme))
            );

            if (isRelevant) {
              relevantVerses.push({
                ...verse,
                sourceTurn: turn.id,
                relevance: verse.relevance || 0.8
              });
            }
          });
        } else if (verseData.results && Array.isArray(verseData.results.verses)) {
          verseData.results.verses.forEach(verse => {
            const verseThemes = [verse.clusterTheme, ...(verse.themes || [])];
            const isRelevant = questionThemes.some(qTheme =>
              verseThemes.some(vTheme => this.themesAreRelated(qTheme, vTheme))
            );

            if (isRelevant) {
              relevantVerses.push({
                ...verse,
                sourceTurn: turn.id,
                relevance: verse.relevance || 0.8
              });
            }
          });
        }
      }
    });

    return relevantVerses.sort((a, b) => b.relevance - a.relevance);
  }

  buildConversationContext(turns) {
    return {
      primaryThemes: turns.flatMap(turn =>
        turn.context.primaryTheme ? [turn.context.primaryTheme] : []
      ),
      conversationFlow: turns.map(turn => ({
        intent: turn.userQuestion.intent,
        themes: turn.userQuestion.themes,
        timestamp: turn.timestamp
      })),
      depth: turns.length
    };
  }

  synthesizeFromContext(question, relevantVerses, conversationContext) {
    if (relevantVerses.length === 0) {
      return `Based on our previous discussion about ${conversationContext.primaryThemes.join(' and ')}, I can share some related insights from the wisdom we've explored together...`;
    }

    const primaryVerse = relevantVerses[0];
    return `Continuing our exploration of ${conversationContext.primaryThemes.join(' and ')}, the teachings remind us that ${primaryVerse.translation.substring(0, 150)}...

This connects beautifully with what we were discussing earlier about the deeper meaning of our spiritual path.`;
  }

  extractCitationsFromHistory(turns) {
    return turns.flatMap(turn =>
      turn.synthesizedResponse.citations || []
    );
  }

  extractSourcesFromHistory(turns) {
    return turns.flatMap(turn =>
      turn.synthesizedResponse.sources || []
    );
  }
}

module.exports = ConversationManager;
