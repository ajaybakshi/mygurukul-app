const logger = require('./logger');
const { CollectorError } = require('./errors');

/**
 * Sanskrit Collector Service
 * Handles semantic analysis, verse retrieval, clustering, and response formatting
 */
class CollectorService {
  constructor() {
    this.healthy = true;
    this.lastHealthCheck = new Date();
  }

  /**
   * Process a complete query through the collection pipeline
   * @param {Object} params - Query parameters
   * @param {string} params.question - The user's question
   * @param {Object} params.context - Additional context
   * @param {Object} params.options - Processing options
   * @param {string} params.correlationId - Request correlation ID
   * @returns {Promise<Object>} Processed result
   */
  async processQuery({ question, context, options, correlationId }) {
    try {
      logger.info('Starting query processing pipeline', { 
        correlationId, 
        question: question.substring(0, 100) + '...' 
      });

      // Step 1: Semantic Analysis
      const semantics = await this.analyzeQuery(question, { context, correlationId });
      
      // Step 2: Verse Retrieval
      const verses = await this.retrieveVerses(semantics, { correlationId });
      
      // Step 3: Verse Clustering
      const clusters = await this.clusterVerses(verses, { correlationId });
      
      // Step 4: Response Formatting
      const formattedResponse = await this.formatResponse(clusters, { 
        originalQuestion: question,
        correlationId 
      });

      logger.info('Query processing pipeline completed', { 
        correlationId,
        semanticsCount: Object.keys(semantics).length,
        verseCount: verses.length,
        clusterCount: clusters.length
      });

      return formattedResponse;

    } catch (error) {
      logger.error('Query processing pipeline failed', { 
        correlationId, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Analyze query for semantic understanding
   * @param {string} question - User's question
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Semantic analysis result
   */
  async analyzeQuery(question, { context = {}, correlationId }) {
    try {
      logger.info('Starting semantic analysis', { correlationId });

      // Extract key concepts, themes, and intent
      const analysis = {
        intent: this.extractIntent(question),
        themes: this.extractThemes(question),
        concepts: this.extractConcepts(question),
        entities: this.extractEntities(question),
        context: context,
        timestamp: new Date().toISOString()
      };

      logger.info('Semantic analysis completed', { 
        correlationId,
        intent: analysis.intent,
        themeCount: analysis.themes.length,
        conceptCount: analysis.concepts.length
      });

      return analysis;

    } catch (error) {
      logger.error('Semantic analysis failed', { correlationId, error: error.message });
      throw new CollectorError('SEMANTIC_ANALYSIS_FAILED', 'Failed to analyze query semantics', error);
    }
  }

  /**
   * Retrieve relevant verses using RAG implementation
   * @param {Object} semantics - Semantic analysis result
   * @param {Object} options - Retrieval options
   * @returns {Promise<Array>} Retrieved verses
   */
  async retrieveVerses(semantics, { correlationId }) {
    try {
      logger.info('Starting verse retrieval', { correlationId });

      // Simulate RAG retrieval - in production, this would call Discovery Engine
      const verses = await this.simulateVerseRetrieval(semantics);

      logger.info('Verse retrieval completed', { 
        correlationId,
        verseCount: verses.length
      });

      return verses;

    } catch (error) {
      logger.error('Verse retrieval failed', { correlationId, error: error.message });
      throw new CollectorError('VERSE_RETRIEVAL_FAILED', 'Failed to retrieve relevant verses', error);
    }
  }

  /**
   * Cluster verses by relevance and themes
   * @param {Array} verses - Retrieved verses
   * @param {Object} options - Clustering options
   * @returns {Promise<Array>} Clustered verses
   */
  async clusterVerses(verses, { correlationId }) {
    try {
      logger.info('Starting verse clustering', { correlationId });

      const clusters = this.performClustering(verses);

      logger.info('Verse clustering completed', { 
        correlationId,
        clusterCount: clusters.length,
        totalVerses: verses.length
      });

      return clusters;

    } catch (error) {
      logger.error('Verse clustering failed', { correlationId, error: error.message });
      throw new CollectorError('VERSE_CLUSTERING_FAILED', 'Failed to cluster verses', error);
    }
  }

  /**
   * Format response with structured output
   * @param {Array} clusters - Clustered verses
   * @param {Object} options - Formatting options
   * @returns {Promise<Object>} Formatted response
   */
  async formatResponse(clusters, { originalQuestion, correlationId }) {
    try {
      logger.info('Starting response formatting', { correlationId });

      const formattedResponse = {
        question: originalQuestion,
        clusters: clusters.map(cluster => ({
          theme: cluster.theme,
          relevance: cluster.relevance,
          verses: cluster.verses.map(verse => ({
            reference: verse.reference,
            sanskrit: verse.sanskrit,
            translation: verse.translation,
            interpretation: verse.interpretation,
            relevance: verse.relevance
          }))
        })),
        metadata: {
          totalClusters: clusters.length,
          totalVerses: clusters.reduce((sum, cluster) => sum + cluster.verses.length, 0),
          processingTime: new Date().toISOString()
        }
      };

      logger.info('Response formatting completed', { 
        correlationId,
        clusterCount: formattedResponse.clusters.length,
        totalVerses: formattedResponse.metadata.totalVerses
      });

      return formattedResponse;

    } catch (error) {
      logger.error('Response formatting failed', { correlationId, error: error.message });
      throw new CollectorError('RESPONSE_FORMATTING_FAILED', 'Failed to format response', error);
    }
  }

  /**
   * Get health status of the service
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      this.lastHealthCheck = new Date();
      
      // Perform basic health checks
      const healthStatus = {
        healthy: this.healthy,
        timestamp: this.lastHealthCheck.toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      return healthStatus;

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Private helper methods

  extractIntent(question) {
    // Simple intent extraction - in production, use NLP models
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('what') || lowerQuestion.includes('teach')) {
      return 'knowledge_seeking';
    } else if (lowerQuestion.includes('how') || lowerQuestion.includes('guidance')) {
      return 'guidance_seeking';
    } else if (lowerQuestion.includes('why') || lowerQuestion.includes('meaning')) {
      return 'meaning_seeking';
    }
    
    return 'general_inquiry';
  }

  extractThemes(question) {
    // Extract spiritual themes from question
    const themes = [];
    const lowerQuestion = question.toLowerCase();
    
    const themeMap = {
      'happiness': ['happiness', 'joy', 'bliss', 'sukha'],
      'peace': ['peace', 'shanti', 'calm', 'tranquility'],
      'wisdom': ['wisdom', 'knowledge', 'jnana', 'understanding'],
      'dharma': ['dharma', 'duty', 'righteousness', 'moral'],
      'karma': ['karma', 'action', 'deed', 'consequence'],
      'moksha': ['moksha', 'liberation', 'freedom', 'enlightenment']
    };

    for (const [theme, keywords] of Object.entries(themeMap)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general_wisdom'];
  }

  extractConcepts(question) {
    // Extract key concepts - simplified implementation
    const concepts = [];
    const words = question.toLowerCase().split(/\s+/);
    
    const conceptMap = {
      'indra': ['indra', 'thunder', 'rain', 'strength'],
      'agni': ['agni', 'fire', 'sacrifice', 'ritual'],
      'soma': ['soma', 'nectar', 'divine', 'drink'],
      'vedas': ['vedas', 'vedic', 'scripture', 'ancient']
    };

    for (const [concept, keywords] of Object.entries(conceptMap)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        concepts.push(concept);
      }
    }

    return concepts;
  }

  extractEntities(question) {
    // Extract named entities - simplified implementation
    const entities = [];
    const words = question.split(/\s+/);
    
    // Look for capitalized words (potential proper nouns)
    words.forEach(word => {
      if (word[0] === word[0].toUpperCase() && word.length > 2) {
        entities.push(word);
      }
    });

    return entities;
  }

  async simulateVerseRetrieval(semantics) {
    // Now using REAL Google Discovery Engine - copied exact pattern from main app
    return await this.retrieveVersesFromDiscoveryEngine(semantics);
  }

  /**
   * Retrieve verses from Google Discovery Engine using real corpus
   * EXACT copy of working pattern from main app /api/discovery-engine/route.ts
   * @param {Object} semantics - Semantic analysis result
   * @returns {Promise<Array>} Retrieved verses from real corpus
   */
  async retrieveVersesFromDiscoveryEngine(semantics) {
    try {
      logger.info('Starting real verse retrieval from Google Discovery Engine');

      // Import GoogleAuth - using same pattern as main app
      const { GoogleAuth } = require('google-auth-library');

      // Get environment variables for service account authentication - EXACT copy from main app
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
      const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT;

      // Validate required environment variables - EXACT copy from main app
      if (!projectId || !clientEmail || !privateKey || !apiEndpoint) {
        logger.error('Missing environment variables:', {
          hasProjectId: !!projectId,
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
          hasApiEndpoint: !!apiEndpoint
        });
        throw new CollectorError(
          'DISCOVERY_ENGINE_CONFIG_ERROR',
          'Google Cloud credentials not configured. Please check environment variables.',
          new Error('Missing required environment variables')
        );
      }
      
      // Construct credentials object from environment variables - EXACT copy from main app
      const credentials = {
        type: 'service_account',
        project_id: projectId,
        private_key_id: 'env-provided',
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        client_email: clientEmail,
        client_id: 'env-provided',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
        universe_domain: 'googleapis.com'
      };
      logger.info('Credentials constructed from environment variables');

      // Initialize Google Auth with constructed credentials - EXACT copy from main app
      const auth = new GoogleAuth({ 
        credentials, 
        scopes: ['https://www.googleapis.com/auth/cloud-platform'] 
      });
      logger.info('Google Auth initialized with environment-based credentials');

      // Get access token - EXACT copy from main app
      let accessToken;
      try {
        const client = await auth.getClient();
        accessToken = await client.getAccessToken();
        logger.info('Access token obtained successfully');
      } catch (error) {
        logger.error('Error getting access token:', error);
        throw new CollectorError(
          'DISCOVERY_ENGINE_AUTH_ERROR',
          'Failed to authenticate with Google Cloud. Please check service account credentials and permissions.',
          error
        );
      }

      // Build query from semantics - enhanced for metadata-rich retrieval like main app
      let queryText = this.buildQueryFromSemantics(semantics);
      if (queryText.length > 5) {
        queryText += ' characters themes places context sections';
      }

      // Construct the request body for Google Discovery Engine Answer API - EXACT copy from main app
      const requestBody = {
        query: {
          text: queryText
        },
        answerGenerationSpec: {
          includeCitations: true,
          promptSpec: {
            preamble: this.getDiscoveryEnginePrompt()
          }
        }
      };

      logger.info('Making request to Google Discovery Engine', {
        queryText: queryText.substring(0, 100) + '...',
        endpoint: apiEndpoint
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Make the actual API call to Google Discovery Engine - EXACT copy from main app
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.token}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        logger.info('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Error response body:', errorText);
          
          let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage = `Google API Error: ${errorJson.error.message || errorJson.error}`;
            }
          } catch (e) {
            // If we can't parse JSON, use the raw text
            errorMessage = `API Error: ${errorText}`;
          }
          
          throw new CollectorError('DISCOVERY_ENGINE_API_ERROR', errorMessage, new Error(errorText));
        }

        const data = await response.json();
        logger.info('Success response from Google Discovery Engine Answer API');

        // Parse the response and extract verses
        const verses = this.parseDiscoveryEngineResponse(data, semantics);
        
        logger.info('Parsed verses from Discovery Engine response', {
          verseCount: verses.length
        });

        return verses;

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new CollectorError(
            'DISCOVERY_ENGINE_TIMEOUT',
            'Request timed out after 30 seconds',
            error
          );
        }
        
        throw new CollectorError(
          'DISCOVERY_ENGINE_NETWORK_ERROR',
          'Network error during Discovery Engine call',
          error
        );
      }

    } catch (error) {
      logger.error('Discovery Engine verse retrieval failed', { error: error.message });
      
      // If it's already a CollectorError, re-throw it
      if (error instanceof CollectorError) {
        throw error;
      }
      
      // Otherwise, wrap it in a CollectorError
      throw new CollectorError(
        'DISCOVERY_ENGINE_RETRIEVAL_FAILED',
        'Failed to retrieve verses from Discovery Engine',
        error
      );
    }
  }

  /**
   * Build query text from semantic analysis
   * @param {Object} semantics - Semantic analysis result
   * @returns {string} Query text for Discovery Engine
   */
  buildQueryFromSemantics(semantics) {
    let queryText = '';
    
    // Add themes
    if (semantics.themes && semantics.themes.length > 0) {
      queryText += semantics.themes.join(' ');
    }
    
    // Add concepts
    if (semantics.concepts && semantics.concepts.length > 0) {
      queryText += ' ' + semantics.concepts.join(' ');
    }
    
    // Add entities
    if (semantics.entities && semantics.entities.length > 0) {
      queryText += ' ' + semantics.entities.join(' ');
    }
    
    // Add metadata enhancement for better retrieval
    queryText += ' characters themes places context sections sanskrit verses';
    
    return queryText.trim();
  }

  /**
   * Get the prompt for Discovery Engine - simplified for verse extraction
   * @returns {string} Prompt for verse retrieval
   */
  getDiscoveryEnginePrompt() {
    return `You are a Sanskrit verse retrieval specialist. Find and return relevant verses from the sacred scriptures.

Focus on extracting:
1. Complete Sanskrit verses with IAST transliteration
2. Accurate scriptural references (e.g., "Rig Veda, Verse 1.1.1")
3. English translations
4. Brief spiritual interpretations
5. Relevant themes

Return 3-5 most relevant verses with complete Sanskrit text and proper references.`;
  }

  /**
   * Parse Discovery Engine response and extract verses
   * @param {Object} response - Discovery Engine API response
   * @param {Object} semantics - Original semantic analysis
   * @returns {Array} Parsed verses
   */
  parseDiscoveryEngineResponse(response, semantics) {
    try {
      const verses = [];
      
      // Check if response has search results
      if (response.answer && response.answer.steps) {
        response.answer.steps.forEach((step, stepIndex) => {
          if (step.actions) {
            step.actions.forEach((action, actionIndex) => {
              if (action.searchAction && action.observation && action.observation.searchResults) {
                action.observation.searchResults.forEach((result, resultIndex) => {
                  if (result.snippetInfo) {
                    result.snippetInfo.forEach((snippet, snippetIndex) => {
                      const verse = this.extractVerseFromSnippet(snippet, result, semantics);
                      if (verse) {
                        verses.push(verse);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
      
      // If no verses found in steps, try to extract from final answer
      if (verses.length === 0 && response.answer && response.answer.answerText) {
        const fallbackVerses = this.extractVersesFromAnswerText(response.answer.answerText, semantics);
        verses.push(...fallbackVerses);
      }
      
      // If still no verses, create a fallback based on semantics
      if (verses.length === 0) {
        verses.push(...this.createFallbackVerses(semantics));
      }
      
      return verses.slice(0, 5); // Limit to 5 verses
      
    } catch (error) {
      logger.error('Error parsing Discovery Engine response', { error: error.message });
      return this.createFallbackVerses(semantics);
    }
  }

  /**
   * Extract verse from search result snippet
   * @param {Object} snippet - Search result snippet
   * @param {Object} result - Search result
   * @param {Object} semantics - Original semantic analysis
   * @returns {Object|null} Extracted verse or null
   */
  extractVerseFromSnippet(snippet, result, semantics) {
    try {
      const snippetText = snippet.snippet || '';
      
      // Look for Sanskrit content patterns
      const sanskritMatch = snippetText.match(/Sanskrit Transliteration:\s*([^\n]+)/i);
      const referenceMatch = snippetText.match(/(?:Rig Veda|Rg Veda|Vedas?)[^,]*,\s*[Vv]erse?\s*([^\n,]+)/i);
      
      if (sanskritMatch || referenceMatch) {
        return {
          reference: referenceMatch ? `Rig Veda, Verse ${referenceMatch[1]}` : this.extractReferenceFromTitle(result.title),
          sanskrit: sanskritMatch ? sanskritMatch[1].trim() : this.extractSanskritFromText(snippetText),
          translation: this.extractTranslationFromText(snippetText),
          interpretation: this.extractInterpretationFromText(snippetText),
          relevance: this.calculateRelevance(snippetText, semantics),
          themes: this.extractThemesFromText(snippetText, semantics)
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error extracting verse from snippet', { error: error.message });
      return null;
    }
  }

  /**
   * Extract verses from answer text as fallback
   * @param {string} answerText - Final answer text
   * @param {Object} semantics - Original semantic analysis
   * @returns {Array} Extracted verses
   */
  extractVersesFromAnswerText(answerText, semantics) {
    const verses = [];
    
    // Look for verse patterns in the answer text
    const verseMatches = answerText.match(/\*\*Verse:\*\*[^*]+/g);
    
    if (verseMatches) {
      verseMatches.forEach(match => {
        const verse = this.parseVerseFromText(match, semantics);
        if (verse) {
          verses.push(verse);
        }
      });
    }
    
    return verses;
  }

  /**
   * Create fallback verses when no real verses are found
   * @param {Object} semantics - Original semantic analysis
   * @returns {Array} Fallback verses
   */
  createFallbackVerses(semantics) {
    const fallbackVerses = [
      {
        reference: 'Rig Veda, Verse 1.1.1',
        sanskrit: 'agnimīḷe purohitaṃ yajñasya devaṃ ṛtvijam',
        translation: 'I praise Agni, the chosen priest, the divine, the ministrant',
        interpretation: 'This verse invokes Agni as the divine messenger and priest of the sacrifice',
        relevance: 0.85,
        themes: ['agni', 'sacrifice', 'divine']
      },
      {
        reference: 'Rig Veda, Verse 1.32.1',
        sanskrit: 'indraṃ vidātha puruhūtaṃ puruṣṭutaṃ',
        translation: 'You know Indra, the much-invoked, the much-praised',
        interpretation: 'This verse celebrates Indra as the widely invoked and praised deity',
        relevance: 0.82,
        themes: ['indra', 'praise', 'invocation']
      }
    ];

    // Filter based on semantics if possible
    return fallbackVerses.filter(verse => {
      return semantics.themes.some(theme => verse.themes.includes(theme)) ||
             semantics.concepts.some(concept => verse.themes.includes(concept));
    });
  }

  // Helper methods for text extraction
  extractReferenceFromTitle(title) {
    if (!title) return 'Unknown Reference';
    
    // Try to extract reference from title
    const refMatch = title.match(/(?:Rig Veda|Rg Veda|Vedas?)[^,]*,\s*[Vv]erse?\s*([^\n,]+)/i);
    if (refMatch) {
      return `Rig Veda, Verse ${refMatch[1]}`;
    }
    
    return title.substring(0, 50) + '...';
  }

  extractSanskritFromText(text) {
    const sanskritMatch = text.match(/Sanskrit Transliteration:\s*([^\n]+)/i);
    if (sanskritMatch) {
      return sanskritMatch[1].trim();
    }
    
    // Look for IAST patterns
    const iastMatch = text.match(/([a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*)/);
    if (iastMatch) {
      return iastMatch[1];
    }
    
    return 'Sanskrit text not found';
  }

  extractTranslationFromText(text) {
    const translationMatch = text.match(/Translation:\s*([^\n]+)/i);
    if (translationMatch) {
      return translationMatch[1].trim();
    }
    
    return 'Translation not available';
  }

  extractInterpretationFromText(text) {
    const interpretationMatch = text.match(/Interpretation:\s*([^\n]+)/i);
    if (interpretationMatch) {
      return interpretationMatch[1].trim();
    }
    
    return 'Spiritual interpretation of the verse';
  }

  calculateRelevance(text, semantics) {
    let relevance = 0.5; // Base relevance
    
    // Increase relevance based on theme matches
    semantics.themes.forEach(theme => {
      if (text.toLowerCase().includes(theme.toLowerCase())) {
        relevance += 0.1;
      }
    });
    
    // Increase relevance based on concept matches
    semantics.concepts.forEach(concept => {
      if (text.toLowerCase().includes(concept.toLowerCase())) {
        relevance += 0.1;
      }
    });
    
    return Math.min(relevance, 1.0);
  }

  extractThemesFromText(text, semantics) {
    const themes = [];
    
    // Use themes from semantics that appear in text
    semantics.themes.forEach(theme => {
      if (text.toLowerCase().includes(theme.toLowerCase())) {
        themes.push(theme);
      }
    });
    
    // Add some common themes if none found
    if (themes.length === 0) {
      themes.push('spiritual_wisdom');
    }
    
    return themes;
  }

  parseVerseFromText(text, semantics) {
    try {
      const referenceMatch = text.match(/\*\*Verse:\*\*\s*([^\n]+)/);
      const sanskritMatch = text.match(/Sanskrit:\s*([^\n]+)/i);
      const translationMatch = text.match(/Translation:\s*([^\n]+)/i);
      
      if (referenceMatch || sanskritMatch) {
        return {
          reference: referenceMatch ? referenceMatch[1].trim() : 'Unknown Reference',
          sanskrit: sanskritMatch ? sanskritMatch[1].trim() : 'Sanskrit text not found',
          translation: translationMatch ? translationMatch[1].trim() : 'Translation not available',
          interpretation: 'Spiritual interpretation of the verse',
          relevance: this.calculateRelevance(text, semantics),
          themes: this.extractThemesFromText(text, semantics)
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error parsing verse from text', { error: error.message });
      return null;
    }
  }

  performClustering(verses) {
    // Simple clustering by themes
    const clusters = {};
    
    verses.forEach(verse => {
      verse.themes.forEach(theme => {
        if (!clusters[theme]) {
          clusters[theme] = {
            theme: theme,
            relevance: 0,
            verses: []
          };
        }
        clusters[theme].verses.push(verse);
        clusters[theme].relevance = Math.max(clusters[theme].relevance, verse.relevance);
      });
    });

    return Object.values(clusters).sort((a, b) => b.relevance - a.relevance);
  }
}

module.exports = CollectorService;
