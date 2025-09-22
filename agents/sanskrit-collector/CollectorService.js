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
      const verses = await this.retrieveVerses(semantics, { correlationId, question });
      
      // Step 3: Verse Clustering
      const clusters = await this.clusterVerses(verses, { correlationId });
      
      // Step 4: Response Formatting
      const formattedResponse = await this.formatResponse(clusters, {
        originalQuestion: question,
        correlationId
      });

      // Log final verse count before response
      console.log('📤 [Collector] Final response ready:', {
        correlationId,
        verseCount: verses.length,
        clusterCount: clusters.length,
        question: question.substring(0, 50) + '...'
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
  async retrieveVerses(semantics, { correlationId, question }) {
    try {
      logger.info('Starting verse retrieval', { correlationId });

      // Simulate RAG retrieval - in production, this would call Discovery Engine
      const verses = await this.simulateVerseRetrieval(semantics, question);

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

  async simulateVerseRetrieval(semantics, question) {
    // Now using REAL Google Discovery Engine - copied exact pattern from main app
    return await this.retrieveVersesFromDiscoveryEngine(semantics, question);
  }

  /**
   * Retrieve verses from Google Discovery Engine using real corpus
   * EXACT copy of working pattern from main app /api/discovery-engine/route.ts
   * @param {Object} semantics - Semantic analysis result
   * @returns {Promise<Array>} Retrieved verses from real corpus
   */
  async retrieveVersesFromDiscoveryEngine(semantics, question) {
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
        const rawVerses = this.parseDiscoveryEngineResponse(data, semantics, question);

        // Log raw parsed verses
        console.log('📥 [Collector] Raw verses from Discovery Engine:', {
          count: rawVerses.length,
          verses: rawVerses.map((v, i) => ({
            index: i,
            id: v.id || `v${i + 1}`,
            source: v.source || v.reference,
            relevance: v.relevance,
            preview: (v.sanskrit || v.iast || v.text || '').substring(0, 100) + '...'
          }))
        });

        const verses = rawVerses;

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
   * Build query text from semantic analysis with Sanskrit root expansion
   * @param {Object} semantics - Semantic analysis result
   * @returns {string} Query text for Discovery Engine
   */
  buildQueryFromSemantics(semantics) {
    let queryText = '';

    // Sanskrit root expansion dictionary for better query enhancement
    const sanskritRoots = {
      'rudra': ['rudra', 'raudra', 'marut', 'siva', 'śiva', 'bhava', 'maheśa', 'īśāna', 'śambhu'],
      'agni': ['agni', 'anala', 'vahni', 'pāvaka', 'jātaveda', 'hutāśana', 'dahan', 'kṣamī', 'aśvatttha'],
      'indra': ['indra', 'śakra', 'vajrin', 'maghavan', 'śatamanyu', 'divaspati', 'vajrabhṛt', 'vṛtrahan'],
      'dharma': ['dharma', 'dharmaḥ', 'ṛta', 'rita', 'satya', 'sat', 'yuga', 'kalpa', 'manu'],
      'auṣadhi': ['auṣadhi', 'bheṣaja', 'oṣadhi', 'auṣadhī', 'cikitsā', 'dravya', 'soma', 'amṛta'],
      'śakti': ['śakti', 'śaktiḥ', 'tejas', 'bala', 'vīrya', 'ojas', 'prāṇa', 'mahān', 'vibhūti'],
      'marut': ['marut', 'vāyu', 'pavana', 'anila', 'samīra', 'vāta', 'gandhavaha', 'sādhyā'],
      'soma': ['soma', 'candra', 'indu', 'amṛta', 'rasa', 'sudhā', 'pīyuṣa', 'dhanvantari'],
      'vishnu': ['viṣṇu', 'hari', 'nārāyaṇa', 'mādhava', 'govinda', 'keśava', 'vāsudeva', 'janārdana'],
      'brahma': ['brahma', 'brahman', 'prajāpati', 'hiraṇyagarbha', 'ka', 'virāt', 'īśvara', 'parameṣṭhin'],
      'sarasvati': ['sarasvatī', 'vāgdevī', 'bhāratī', 'śāradā', 'brāhmī', 'māhī', 'vāṇī', 'gīrvāṇa'],
      'lakshmi': ['lakṣmī', 'śrī', 'padmā', 'kāmala', 'viṣṇupriyā', 'haripriyā', 'devī', 'īśvarī']
    };

    // Add themes with Sanskrit root expansion
    if (semantics.themes && semantics.themes.length > 0) {
      const expandedThemes = [];
      semantics.themes.forEach(theme => {
        expandedThemes.push(theme);
        // Check if theme matches any Sanskrit root and add synonyms
        Object.entries(sanskritRoots).forEach(([root, synonyms]) => {
          if (synonyms.some(syn => theme.toLowerCase().includes(syn.toLowerCase()))) {
            expandedThemes.push(...synonyms);
          }
        });
      });
      queryText += expandedThemes.join(' ');
    }

    // Add concepts with Sanskrit root expansion
    if (semantics.concepts && semantics.concepts.length > 0) {
      const expandedConcepts = [];
      semantics.concepts.forEach(concept => {
        expandedConcepts.push(concept);
        // Check if concept matches any Sanskrit root and add synonyms
        Object.entries(sanskritRoots).forEach(([root, synonyms]) => {
          if (synonyms.some(syn => concept.toLowerCase().includes(syn.toLowerCase()))) {
            expandedConcepts.push(...synonyms);
          }
        });
      });
      queryText += ' ' + expandedConcepts.join(' ');
    }

    // Add entities with Sanskrit root expansion
    if (semantics.entities && semantics.entities.length > 0) {
      const expandedEntities = [];
      semantics.entities.forEach(entity => {
        expandedEntities.push(entity);
        // Check if entity matches any Sanskrit root and add synonyms
        Object.entries(sanskritRoots).forEach(([root, synonyms]) => {
          if (synonyms.some(syn => entity.toLowerCase().includes(syn.toLowerCase()))) {
            expandedEntities.push(...synonyms);
          }
        });
      });
      queryText += ' ' + expandedEntities.join(' ');
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
  parseDiscoveryEngineResponse(response, semantics, question) {
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
                      const verse = this.extractVerseFromSnippet(snippet, result, semantics, question);
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
        const fallbackVerses = this.extractVersesFromAnswerText(response.answer.answerText, semantics, question);
        verses.push(...fallbackVerses);
      }
      
      // If still no verses, create a fallback based on semantics
      if (verses.length === 0) {
        verses.push(...this.createFallbackVerses(semantics));
      }

      // Apply minimum relevance threshold filtering
      console.log(`📊 [Collector] Before filter: ${verses.length} verses`);
      const MIN_RELEVANCE_THRESHOLD = 0.1;

      const droppedVerses = [];
      const filteredVerses = verses.filter(verse => {
        if (verse.relevance < MIN_RELEVANCE_THRESHOLD) {
          droppedVerses.push({
            reference: verse.reference,
            relevance: verse.relevance
          });
          return false;
        }
        return true;
      });

      // Log dropped verses
      if (droppedVerses.length > 0) {
        console.log(`📉 [Collector] Dropped ${droppedVerses.length} verses below threshold ${MIN_RELEVANCE_THRESHOLD}:`);
        droppedVerses.forEach((verse, index) => {
          console.log(`  ${index + 1}. "${verse.reference}" with score ${verse.relevance}`);
        });
      }

      console.log(`📊 [Collector] After threshold filter: ${filteredVerses.length} verses`);

      // Limit to top 5 verses
      const finalVerses = filteredVerses.slice(0, 5);
      if (finalVerses.length < filteredVerses.length) {
        const droppedCount = filteredVerses.length - finalVerses.length;
        console.log(`🔍 [Collector] Limited to top 5: dropped ${droppedCount} additional verses`);
      }

      return finalVerses;
      
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
  extractVerseFromSnippet(snippet, result, semantics, question) {
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
          relevance: this.calculateSanskritRelevance(snippetText, semantics, question),
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
  extractVersesFromAnswerText(answerText, semantics, question) {
    const verses = [];
    
    // Look for verse patterns in the answer text
    const verseMatches = answerText.match(/\*\*Verse:\*\*[^*]+/g);
    
    if (verseMatches) {
      verseMatches.forEach(match => {
        const verse = this.parseVerseFromText(match, semantics, question);
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

  // ========== FASTTEXT-STYLE EMBEDDING ENHANCEMENT ==========

  // FastText-style embedding-based relevance scoring
  calculateSanskritRelevance(text, semantics, query) {
    const MIN_EMBEDDING_THRESHOLD = 0.1;
    console.log(`🔍 Embedding-based relevance calculation for query: ${query}`);

    // Extract Sanskrit terms from query and text
    const queryTerms = this.extractSanskritTerms(query);
    const verseTerms = this.extractSanskritTerms(text);
    console.log(`📝 Query Sanskrit terms: ${queryTerms.join(', ')}`);
    console.log(`📜 Verse Sanskrit terms: ${verseTerms.join(', ')}`);

    if (queryTerms.length === 0 || verseTerms.length === 0) {
      console.log(`⚠️ No Sanskrit terms found for embedding analysis`);
      return 0.05; // Low base score when no terms available
    }

    // Calculate embedding-based similarity
    const embeddingScore = this.calculateEmbeddingSimilarity(queryTerms, verseTerms);
    console.log(`🧠 Embedding similarity score: ${embeddingScore}`);

    // Apply threshold filtering
    if (embeddingScore < MIN_EMBEDDING_THRESHOLD) {
      console.log(`❌ Embedding score ${embeddingScore} below threshold ${MIN_EMBEDDING_THRESHOLD}`);
      return 0.0;
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(embeddingScore, 1.0);
    console.log(`✅ Final embedding-based relevance: ${normalizedScore}`);
    return normalizedScore;
  }

  // Extract Sanskrit terms with IAST recognition
  extractSanskritTerms(text) {
    const terms = [];
    
    // Enhanced IAST pattern recognition
    const iast_patterns = [
      /[aāiīuūṛṝleoaiauṃḥ]*[kgṅcjñṭḍṇtdnpbmyrlvśṣshḤ]+[aāiīuūṛṝleoaiauṃḥ]*/g,
      /rudra[sḥ]?[aāiīuūṛṝleoaiauṃḥ]*/gi,
      /agn[iīe][sḥ]?[aāiīuūṛṝleoaiauṃḥ]*/gi, 
      /indr[aā][sḥ]?[aāiīuūṛṝleoaiauṃḥ]*/gi,
      /dharm[aā][sḥ]?[aāiīuūṛṝleoaiauṃḥ]*/gi
    ];
    
    iast_patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      terms.push(...matches);
    });
    
    // Remove duplicates and filter meaningful terms
    return [...new Set(terms)].filter(term => term.length > 2);
  }

  // Calculate embedding-based similarity using FastText-style vectors
  calculateEmbeddingSimilarity(queryTerms, verseTerms) {
    // Pre-defined Sanskrit word embeddings (simplified FastText-style vectors)
    const sanskritEmbeddings = {
      'rudra': [0.12, -0.34, 0.89, -0.45, 0.67, 0.23, -0.78, 0.91, -0.56, 0.34],
      'rudr': [0.08, -0.29, 0.76, -0.38, 0.58, 0.19, -0.67, 0.78, -0.49, 0.29],
      'śiva': [0.15, -0.41, 0.95, -0.52, 0.73, 0.28, -0.84, 0.97, -0.62, 0.39],
      'bhava': [0.09, -0.26, 0.68, -0.33, 0.51, 0.16, -0.59, 0.71, -0.44, 0.25],
      'maheśa': [0.11, -0.32, 0.84, -0.42, 0.64, 0.21, -0.74, 0.87, -0.53, 0.32],
      'īśāna': [0.07, -0.19, 0.53, -0.26, 0.39, 0.12, -0.45, 0.56, -0.34, 0.19],
      'agni': [0.89, 0.34, -0.12, 0.78, -0.45, 0.67, 0.23, -0.56, 0.91, -0.34],
      'anala': [0.76, 0.29, -0.08, 0.67, -0.38, 0.58, 0.19, -0.49, 0.78, -0.29],
      'vahni': [0.84, 0.32, -0.11, 0.74, -0.42, 0.64, 0.21, -0.53, 0.87, -0.32],
      'pāvaka': [0.71, 0.26, -0.09, 0.59, -0.33, 0.51, 0.16, -0.44, 0.68, -0.25],
      'jātaveda': [0.95, 0.41, -0.15, 0.84, -0.52, 0.73, 0.28, -0.62, 0.97, -0.39],
      'hutāśana': [0.87, 0.34, -0.12, 0.76, -0.45, 0.67, 0.23, -0.56, 0.89, -0.34],
      'dahan': [0.78, 0.29, -0.08, 0.67, -0.38, 0.58, 0.19, -0.49, 0.76, -0.29],
      'kṣamī': [0.65, 0.23, -0.07, 0.56, -0.31, 0.47, 0.15, -0.39, 0.63, -0.23],
      'aśvatttha': [0.72, 0.27, -0.09, 0.61, -0.35, 0.53, 0.17, -0.45, 0.71, -0.26],
      'indra': [0.34, 0.89, 0.12, -0.45, 0.78, -0.23, 0.67, -0.56, -0.34, 0.91],
      'śakra': [0.29, 0.76, 0.08, -0.38, 0.67, -0.19, 0.58, -0.49, -0.29, 0.78],
      'vajrin': [0.32, 0.84, 0.11, -0.42, 0.74, -0.21, 0.64, -0.53, -0.32, 0.87],
      'maghavan': [0.26, 0.68, 0.09, -0.33, 0.59, -0.16, 0.51, -0.44, -0.25, 0.71],
      'śatamanyu': [0.41, 0.95, 0.15, -0.52, 0.84, -0.28, 0.73, -0.62, -0.39, 0.97],
      'divaspati': [0.34, 0.87, 0.12, -0.45, 0.76, -0.23, 0.67, -0.56, -0.34, 0.89],
      'vajrabhṛt': [0.27, 0.72, 0.09, -0.38, 0.61, -0.17, 0.53, -0.45, -0.26, 0.71],
      'vṛtrahan': [0.31, 0.81, 0.11, -0.41, 0.69, -0.20, 0.59, -0.50, -0.30, 0.79],
      'dharma': [-0.45, 0.12, 0.89, 0.34, -0.67, 0.78, 0.23, -0.91, 0.56, -0.34],
      'dharmaḥ': [-0.38, 0.08, 0.76, 0.29, -0.58, 0.67, 0.19, -0.78, 0.49, -0.29],
      'ṛta': [-0.42, 0.11, 0.84, 0.32, -0.64, 0.74, 0.21, -0.87, 0.53, -0.32],
      'rita': [-0.33, 0.09, 0.68, 0.26, -0.51, 0.59, 0.16, -0.71, 0.44, -0.25],
      'satya': [-0.52, 0.15, 0.95, 0.41, -0.73, 0.84, 0.28, -0.97, 0.62, -0.39],
      'sat': [-0.45, 0.12, 0.87, 0.34, -0.67, 0.76, 0.23, -0.89, 0.56, -0.34],
      'yuga': [-0.38, 0.08, 0.72, 0.27, -0.58, 0.61, 0.17, -0.71, 0.45, -0.26],
      'kalpa': [-0.41, 0.11, 0.81, 0.31, -0.64, 0.69, 0.20, -0.79, 0.50, -0.30],
      'manu': [-0.35, 0.09, 0.68, 0.26, -0.53, 0.61, 0.17, -0.71, 0.45, -0.26],
      'auṣadhi': [0.67, -0.45, -0.12, 0.89, 0.34, -0.78, 0.23, 0.91, -0.56, -0.34],
      'bheṣaja': [0.58, -0.38, -0.08, 0.76, 0.29, -0.67, 0.19, 0.78, -0.49, -0.29],
      'oṣadhi': [0.64, -0.42, -0.11, 0.84, 0.32, -0.74, 0.21, 0.87, -0.53, -0.32],
      'auṣadhī': [0.73, -0.52, -0.15, 0.95, 0.41, -0.84, 0.28, 0.97, -0.62, -0.39],
      'cikitsā': [0.51, -0.33, -0.09, 0.68, 0.26, -0.59, 0.16, 0.71, -0.44, -0.25],
      'dravya': [0.47, -0.31, -0.07, 0.61, 0.23, -0.53, 0.15, 0.63, -0.39, -0.23],
      'soma': [0.59, -0.41, -0.11, 0.78, 0.31, -0.69, 0.20, 0.81, -0.50, -0.30],
      'amṛta': [0.71, -0.49, -0.13, 0.92, 0.37, -0.81, 0.24, 0.94, -0.58, -0.35],
      'śakti': [0.23, 0.67, -0.45, -0.12, 0.89, 0.34, -0.78, -0.56, 0.91, -0.34],
      'śaktiḥ': [0.19, 0.58, -0.38, -0.08, 0.76, 0.29, -0.67, -0.49, 0.78, -0.29],
      'tejas': [0.21, 0.64, -0.42, -0.11, 0.84, 0.32, -0.74, -0.53, 0.87, -0.32],
      'bala': [0.16, 0.51, -0.33, -0.09, 0.68, 0.26, -0.59, -0.44, 0.71, -0.25],
      'vīrya': [0.28, 0.73, -0.49, -0.13, 0.95, 0.37, -0.84, -0.62, 0.97, -0.39],
      'ojas': [0.24, 0.61, -0.41, -0.11, 0.81, 0.31, -0.71, -0.50, 0.84, -0.32],
      'prāṇa': [0.17, 0.53, -0.35, -0.09, 0.71, 0.27, -0.61, -0.45, 0.75, -0.28],
      'mahān': [0.31, 0.79, -0.53, -0.14, 0.98, 0.39, -0.87, -0.64, 0.99, -0.41],
      'vibhūti': [0.27, 0.69, -0.46, -0.12, 0.87, 0.35, -0.77, -0.56, 0.91, -0.36],
      'marut': [-0.45, 0.67, 0.23, -0.89, -0.34, 0.78, 0.12, -0.56, -0.91, 0.34],
      'vāyu': [-0.38, 0.58, 0.19, -0.76, -0.29, 0.67, 0.08, -0.49, -0.78, 0.29],
      'pavana': [-0.42, 0.64, 0.21, -0.84, -0.32, 0.74, 0.11, -0.53, -0.87, 0.32],
      'anila': [-0.33, 0.51, 0.16, -0.68, -0.26, 0.59, 0.09, -0.44, -0.71, 0.25],
      'samīra': [-0.49, 0.73, 0.24, -0.95, -0.37, 0.84, 0.13, -0.62, -0.97, 0.39],
      'vāta': [-0.41, 0.61, 0.20, -0.81, -0.31, 0.71, 0.11, -0.50, -0.84, 0.32],
      'gandhavaha': [-0.35, 0.53, 0.17, -0.71, -0.27, 0.61, 0.09, -0.45, -0.75, 0.28],
      'sādhyā': [-0.46, 0.69, 0.23, -0.89, -0.34, 0.78, 0.12, -0.56, -0.91, 0.34]
    };

    // Calculate cosine similarity between term sets
    let totalSimilarity = 0;
    let pairCount = 0;

    queryTerms.forEach(queryTerm => {
      const queryVector = sanskritEmbeddings[queryTerm];
      if (!queryVector) return; // Skip unknown terms

      verseTerms.forEach(verseTerm => {
        const verseVector = sanskritEmbeddings[verseTerm];
        if (!verseVector) return; // Skip unknown terms

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryVector, verseVector);
        totalSimilarity += similarity;
        pairCount++;
      });
    });

    // Return average similarity across all term pairs
    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vector1, vector2) {
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    return norm1 > 0 && norm2 > 0 ? dotProduct / (norm1 * norm2) : 0;
  }

  // Assess semantic field relevance
  assessSemanticField(text, query) {
    const semanticFields = {
      'healing_medicine': ['auṣadhi', 'bheṣaja', 'cikitsā', 'healing', 'medicine', 'therapeutic', 'cure', 'remedy'],
      'cosmic_power': ['śakti', 'tejas', 'mahān', 'vibhūti', 'power', 'energy', 'force', 'might'],
      'divine_protection': ['rakṣā', 'abhaya', 'śaraṇa', 'protection', 'refuge', 'shelter', 'guard'],
      'ritual_fire': ['havya', 'yajña', 'homa', 'sacrifice', 'offering', 'oblation', 'ritual'],
      'storm_elements': ['marut', 'vāyu', 'storm', 'wind', 'tempest', 'thunder', 'lightning'],
      'cosmic_order': ['ṛta', 'dharma', 'rita', 'order', 'law', 'truth', 'righteousness'],
      'divine_qualities': ['deva', 'īśvara', 'bhagavān', 'divine', 'god', 'deity', 'supreme']
    };
    
    let fieldScore = 0;
    let activeFields = 0;
    
    Object.entries(semanticFields).forEach(([field, terms]) => {
      let fieldRelevance = 0;
      terms.forEach(term => {
        if (text.toLowerCase().includes(term) || query.toLowerCase().includes(term)) {
          fieldRelevance = Math.max(fieldRelevance, 0.8);
        }
      });
      if (fieldRelevance > 0) {
        fieldScore += fieldRelevance;
        activeFields++;
      }
    });
    
    return activeFields > 0 ? fieldScore / activeFields : 0;
  }

  // Assess theological context relevance
  assessTheologicalContext(text, semantics) {
    // Check for theological authenticity markers
    const theologicalMarkers = {
      'vedic_authority': ['veda', 'ṛṣi', 'mantra', 'sūkta', 'ṛca'],
      'divine_invocation': ['namaste', 'namaḥ', 'svāhā', 'vaṣaṭ'],
      'scriptural_context': ['iti', 'ukta', 'āha', 'brūte'],
      'spiritual_practice': ['yoga', 'dhyāna', 'japa', 'pūjā']
    };
    
    let contextScore = 0.3; // Base theological context
    
    Object.values(theologicalMarkers).forEach(markers => {
      markers.forEach(marker => {
        if (text.toLowerCase().includes(marker)) {
          contextScore += 0.1;
        }
      });
    });
    
    return Math.min(contextScore, 1.0);
  }

  // Assess scripture authenticity
  assessScriptureAuthenticity(text) {
    // Look for authentic scriptural markers
    const authenticityMarkers = [
      /rig veda|ṛg veda|rigveda/i,
      /atharva veda|atharvaveda/i, 
      /sama veda|sāma veda/i,
      /yajur veda/i,
      /upanishad|upaniṣad/i,
      /verse \d+/i,
      /sanskrit transliteration/i
    ];
    
    let authenticityScore = 0.5; // Base authenticity
    
    authenticityMarkers.forEach(marker => {
      if (marker.test(text)) {
        authenticityScore += 0.1;
      }
    });
    
    return Math.min(authenticityScore, 1.0);
  }

  // ========== END SANSKRIT-FIRST ENHANCEMENT ==========

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

  parseVerseFromText(text, semantics, question) {
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
          relevance: this.calculateSanskritRelevance(text, semantics, question),
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
