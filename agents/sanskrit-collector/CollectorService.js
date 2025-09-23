const logger = require('./logger');
const { CollectorError } = require('./errors');
const fs = require('fs');
const path = require('path');

/**
 * Sanskrit Collector Service
 * Handles semantic analysis, verse retrieval, clustering, and response formatting
 */
class CollectorService {
  constructor() {
    this.healthy = true;
    this.lastHealthCheck = new Date();
    this.lemmas = new Map();
    this.initializeLemmas();
  }

  /**
   * Initialize lemma dictionary from metadata file, full Amarakosha, and hardcoded fallback
   */
  async initializeLemmas() {
    try {
      // Load lemmas from metadata file if it exists
      await this.loadLemmasFromMetadata();

      // Load full Amarakosha dictionary
      const amarakoshaDict = await this.parseAmarakoshaFile();

      // Add Amarakosha terms to lemma dictionary
      if (Object.keys(amarakoshaDict).length > 0) {
        let amarakoshaTermsAdded = 0;
        Object.entries(amarakoshaDict).forEach(([term, data]) => {
          if (data && data.synonyms && data.synonyms.length > 0) {
            this.lemmas.set(term, data.synonyms);
            amarakoshaTermsAdded++;
          }
        });

        logger.info(`📚 Added ${amarakoshaTermsAdded} terms from full Amarakosha dictionary`, {
          totalParsed: Object.keys(amarakoshaDict).length,
          totalSynonyms: Object.values(amarakoshaDict).reduce((sum, data) => sum + (data.synonyms ? data.synonyms.length : 0), 0)
        });
      }

      // Add hardcoded Amarakosha dictionary as fallback
      this.addAmarakoshaDictionary();

      logger.info(`✅ Lemma dictionary initialized with ${this.lemmas.size} total entries`);
    } catch (error) {
      logger.warn('Failed to initialize lemma dictionary, using fallback', { error: error.message });
      // Initialize with empty map if loading fails
      this.lemmas = new Map();
    }
  }

  /**
   * Load lemmas from Upanishads metadata JSONL file with detailed test logging
   * Handles actual structure: entries with "id" and "lemmas" array
   * Loads all lemmas into a flat set for query expansion
   */
  async loadLemmasFromMetadata() {
    try {
      const metadataPath = path.join(process.cwd(), 'output_jsonl', 'Upanishads_metadata.jsonl');

      // Enhanced test logging: Check if file exists
      const fileExists = fs.existsSync(metadataPath);
      logger.info('🧪 Testing Upanishads metadata file loading', {
        path: metadataPath,
        exists: fileExists
      });

      if (!fileExists) {
        logger.error('❌ Upanishads metadata file not found - falling back to hardcoded dictionary', {
          expectedPath: metadataPath,
          currentDirectory: process.cwd()
        });
        return;
      }

      // File exists - get stats
      const stats = fs.statSync(metadataPath);
      logger.info('✅ Upanishads metadata file found', {
        path: metadataPath,
        size: stats.size,
        modified: stats.mtime
      });

      const content = fs.readFileSync(metadataPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      logger.info('📝 Processing metadata file lines', {
        totalLines: lines.length,
        sampleLine: lines[0]?.substring(0, 100) + (lines[0]?.length > 100 ? '...' : '')
      });

      let processedCount = 0;
      let errorCount = 0;
      let firstEntry = null;
      let totalLemmasLoaded = 0;
      const loadedSamples = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const data = JSON.parse(lines[i]);
          processedCount++;

          // Store first entry for test logging
          if (!firstEntry && data) {
            firstEntry = data;
          }

          // Extract lemmas from metadata - matches actual structure: entries with "id" and "lemmas" array
          if (data.id && data.lemmas && Array.isArray(data.lemmas)) {
            logger.info(`📚 Processing entry "${data.id}" with ${data.lemmas.length} lemmas`);

            data.lemmas.forEach((lemma, lemmaIndex) => {
              try {
                // Handle different possible lemma structures
                let term = null;
                let expansions = [];

                // Check if lemma is a simple string (term only)
                if (typeof lemma === 'string') {
                  term = lemma;
                  expansions = [lemma]; // Use the term itself as expansion
                }
                // Check if lemma has term/expansion structure
                else if (lemma && typeof lemma === 'object') {
                  term = lemma.term || lemma.word || lemma.lemma || lemma.name;
                  expansions = lemma.expansions || lemma.synonyms || lemma.meanings || [];

                  // If no expansions found, try to use other fields as single expansion
                  if (!expansions || expansions.length === 0) {
                    if (lemma.translation) expansions = [lemma.translation];
                    else if (lemma.meaning) expansions = [lemma.meaning];
                    else if (lemma.definition) expansions = [lemma.definition];
                    else expansions = [term]; // Fallback to term itself
                  }

                  // Ensure expansions is an array
                  if (!Array.isArray(expansions)) {
                    expansions = [expansions];
                  }
                }

                // Add to lemma dictionary if we have a valid term
                if (term && term.trim()) {
                  const cleanTerm = term.toLowerCase().trim();
                  this.lemmas.set(cleanTerm, expansions);
                  totalLemmasLoaded++;

                  // Collect sample for logging
                  if (loadedSamples.length < 5) {
                    loadedSamples.push({
                      term: cleanTerm,
                      expansionCount: expansions.length,
                      firstExpansion: expansions[0]?.substring(0, 30)
                    });
                  }
                }
              } catch (lemmaError) {
                logger.warn('Failed to process individual lemma', {
                  error: lemmaError.message,
                  entryId: data.id,
                  lemmaIndex: lemmaIndex,
                  lemmaData: JSON.stringify(lemma).substring(0, 100)
                });
              }
            });
          } else {
            logger.warn('Entry missing id or lemmas field', {
              entryId: data.id || 'no-id',
              hasLemmas: !!(data.lemmas && Array.isArray(data.lemmas)),
              lemmaCount: data.lemmas ? data.lemmas.length : 0,
              lineNumber: i + 1
            });
          }
        } catch (parseError) {
          errorCount++;
          logger.warn('Failed to parse metadata line', {
            error: parseError.message,
            lineNumber: i + 1,
            linePreview: lines[i]?.substring(0, 100)
          });
        }
      }

      // Enhanced test logging: Log first entry details
      if (firstEntry) {
        logger.info('📋 First entry sample from metadata file', {
          id: firstEntry.id || 'no-id',
          uri: firstEntry.uri ? firstEntry.uri.substring(0, 50) + '...' : 'no-uri',
          hasLemmas: !!(firstEntry.lemmas && firstEntry.lemmas.length > 0),
          lemmaCount: firstEntry.lemmas ? firstEntry.lemmas.length : 0,
          entryType: firstEntry.type || 'no-type'
        });
      }

      // Debug logging: Show loaded lemma statistics
      logger.info('🔍 Debug: Loaded lemma statistics', {
        totalEntriesProcessed: processedCount,
        totalLemmasLoaded: totalLemmasLoaded,
        uniqueTerms: this.lemmas.size,
        errorCount: errorCount,
        successRate: `${processedCount - errorCount}/${processedCount}`
      });

      // Show sample of loaded lemmas
      if (loadedSamples.length > 0) {
        logger.info('📝 Sample loaded lemmas', {
          count: loadedSamples.length,
          samples: loadedSamples.map(sample => ({
            term: sample.term,
            expansions: sample.expansionCount,
            first: sample.firstExpansion
          }))
        });
      }

      logger.info('✅ Metadata file processing completed', {
        totalLines: lines.length,
        processedSuccessfully: processedCount,
        errors: errorCount,
        lemmasLoaded: totalLemmasLoaded,
        uniqueTerms: this.lemmas.size,
        success: errorCount === 0
      });

      if (errorCount > 0) {
        logger.warn('⚠️ Some lines failed to parse during metadata loading', {
          errorRate: `${errorCount}/${lines.length} (${Math.round(errorCount/lines.length*100)}%)`
        });
      }

    } catch (error) {
      logger.error('❌ Failed to load lemmas from metadata file', {
        error: error.message,
        stack: error.stack,
        path: path.join(process.cwd(), 'output_jsonl', 'Upanishads_metadata.jsonl')
      });
      throw error;
    }
  }

  /**
   * Parse full Amarakosha from text file into term: [synonyms] dictionary
   * @returns {Object} Dictionary of terms with their synonyms
   */
  async parseAmarakoshaFile() {
    try {
      const amarakoshaPath = path.join(__dirname, 'data', 'Amarkosha.txt');

      // Check if file exists
      if (!fs.existsSync(amarakoshaPath)) {
        logger.warn('Amarakosha file not found, skipping full dictionary loading', { path: amarakoshaPath });
        return {};
      }

      const content = fs.readFileSync(amarakoshaPath, 'utf8');
      const lines = content.split('\n');

      const amarakoshaDict = {};
      let currentSection = '';
      let verseNumber = '';
      let collectingSynonyms = false;
      const processedTerms = new Set();

      logger.info('🧮 Parsing Amarakosha file', {
        totalLines: lines.length,
        fileSize: content.length
      });

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Skip header section (first 45 lines contain metadata)
        if (lineNumber <= 45) continue;

        // Skip empty lines
        if (!line) continue;

        // Check for section headers like "## shiva 52 ##"
        if (line.startsWith('## ') && line.endsWith(' ##')) {
          const sectionMatch = line.match(/##\s*(.+?)\s*\d*\s*##/);
          if (sectionMatch) {
            currentSection = sectionMatch[1].toLowerCase().trim();
            collectingSynonyms = false;
            logger.info(`📚 Processing section: ${currentSection}`);
          }
          continue;
        }

        // Check for verse references like "(1.0.1) "
        const verseMatch = line.match(/^\(\d+\.\d+\.\d+\)\s*(.+)/);
        if (verseMatch) {
          const synonymsText = verseMatch[1];
          verseNumber = verseMatch[0];
          collectingSynonyms = true;

          // Parse synonyms from the verse
          this.parseSynonymsFromVerse(synonymsText, amarakoshaDict, currentSection, verseNumber, processedTerms);
          continue;
        }

        // Continue collecting synonyms from subsequent lines
        if (collectingSynonyms && line) {
          this.parseSynonymsFromVerse(line, amarakoshaDict, currentSection, verseNumber, processedTerms);
        }
      }

      // Calculate total synonyms count
      let totalSynonyms = 0;
      let sectionsProcessed = 0;

      Object.values(amarakoshaDict).forEach(entry => {
        if (entry && entry.synonyms) {
          totalSynonyms += entry.synonyms.length;
          if (entry.section) {
            sectionsProcessed++;
          }
        }
      });

      logger.info('✅ Amarakosha parsing completed', {
        termsFound: Object.keys(amarakoshaDict).length,
        totalSynonyms: totalSynonyms,
        sectionsProcessed: sectionsProcessed,
        averageSynonymsPerTerm: Math.round(totalSynonyms / Object.keys(amarakoshaDict).length * 100) / 100
      });

      return amarakoshaDict;

    } catch (error) {
      logger.error('❌ Failed to parse Amarakosha file', {
        error: error.message,
        stack: error.stack
      });
      return {};
    }
  }

  /**
   * Parse synonyms from a verse line
   * @param {string} verseText - Text containing synonyms
   * @param {Object} amarakoshaDict - Dictionary to populate
   * @param {string} section - Current section name
   * @param {string} verseNumber - Verse reference
   * @param {Set} processedTerms - Set of already processed terms
   */
  parseSynonymsFromVerse(verseText, amarakoshaDict, section, verseNumber, processedTerms) {
    try {
      // Remove verse numbers and references
      let cleanText = verseText.replace(/^\(\d+\.\d+\.\d+\)\s*/, '');

      // Split by common delimiters (spaces, pipes, etc.)
      const words = cleanText.split(/\s+/);

      let currentTerm = '';
      const synonyms = [];

      for (const word of words) {
        // Skip empty words and common particles
        if (!word || word.length < 2 || ['tu', 'ca', 'eva', 'api', 'iti', 'syāt'].includes(word.toLowerCase())) {
          continue;
        }

        // Check if this is a term (ends with common term markers or is followed by synonyms)
        if (word.includes(':')) {
          // Save previous term if exists
          if (currentTerm && synonyms.length > 0) {
            this.addToAmarakoshaDict(amarakoshaDict, currentTerm, synonyms, section, verseNumber, processedTerms);
          }

          // Extract new term
          const termMatch = word.match(/^([^:]+):/);
          if (termMatch) {
            currentTerm = termMatch[1].trim();
            synonyms.length = 0; // Reset synonyms
          }
        } else {
          // Add to synonyms
          if (word && word.length > 1) {
            synonyms.push(word.trim());
          }
        }
      }

      // Save final term
      if (currentTerm && synonyms.length > 0) {
        this.addToAmarakoshaDict(amarakoshaDict, currentTerm, synonyms, section, verseNumber, processedTerms);
      }

    } catch (error) {
      logger.warn('Failed to parse verse line', {
        error: error.message,
        verseText: verseText.substring(0, 100),
        section: section
      });
    }
  }

  /**
   * Add term and synonyms to Amarakosha dictionary
   * @param {Object} amarakoshaDict - Dictionary to update
   * @param {string} term - Main term
   * @param {Array} synonyms - Array of synonyms
   * @param {string} section - Section name
   * @param {string} verseNumber - Verse reference
   * @param {Set} processedTerms - Set of processed terms
   */
  addToAmarakoshaDict(amarakoshaDict, term, synonyms, section, verseNumber, processedTerms) {
    try {
      const cleanTerm = term.toLowerCase().trim();

      // Skip if already processed
      if (processedTerms.has(cleanTerm)) {
        return;
      }

      // Filter out invalid synonyms
      const validSynonyms = synonyms.filter(syn =>
        syn && syn.length > 1 && !syn.includes('(') && !syn.includes(')')
      );

      if (cleanTerm && validSynonyms.length > 0) {
        // Use top 15-20 synonyms for enhanced coverage
        const topSynonyms = validSynonyms.slice(0, 18); // Top 18 synonyms for maximum coverage

        amarakoshaDict[cleanTerm] = {
          synonyms: topSynonyms,
          section: section,
          verse: verseNumber,
          count: validSynonyms.length,
          fullCount: validSynonyms.length,
          frequency: validSynonyms.length, // Use synonym count as frequency indicator
          relevance: 0.8 // Base relevance score
        };
        processedTerms.add(cleanTerm);
      }

    } catch (error) {
      logger.warn('Failed to add term to dictionary', {
        error: error.message,
        term: term,
        synonyms: synonyms
      });
    }
  }

  /**
   * Add hardcoded Amarakosha dictionary for Sanskrit term expansion
   * Contains key Sanskrit terms and their English/IAST equivalents
   * Used for expanding queries to improve search relevance
   * Example: 'atman' -> ['self', 'soul', 'brahman', 'atma', 'puruṣa', 'jīva', 'ātmā', 'brahman', 'paramātman']
   */
  addAmarakoshaDictionary() {
    const amarakoshaDict = {
      'atman': ['self', 'soul', 'brahman', 'atma', 'puruṣa', 'jīva', 'ātmā', 'brahman', 'paramātman'],
      'brahman': ['ultimate reality', 'cosmic principle', 'absolute', 'brahma', 'paramātman', 'brahman', 'īśvara'],
      'dharma': ['duty', 'righteousness', 'law', 'moral order', 'virtue', 'dharmaḥ', 'ṛta'],
      'karma': ['action', 'deed', 'work', 'consequence', 'karmaṇ', 'kriyā', 'karman'],
      'moksha': ['liberation', 'freedom', 'enlightenment', 'mukti', 'kaivalya', 'nirvāṇa'],
      'samsara': ['cycle of birth and death', 'transmigration', 'saṃsāra', 'bhava', 'punarjanma'],
      'maya': ['illusion', 'cosmic illusion', 'māyā', 'avidyā', 'ajñāna'],
      'jñana': ['knowledge', 'wisdom', 'understanding', 'jñāna', 'vidyā', 'prajñā'],
      'bhakti': ['devotion', 'love', 'worship', 'bhaktiḥ', 'īśvarapraṇidhāna'],
      'yoga': ['union', 'discipline', 'spiritual practice', 'yogaḥ', 'abhyāsa'],
      'veda': ['sacred knowledge', 'scripture', 'vedic text', 'vedaḥ', 'śruti'],
      'upanishad': ['philosophical teaching', 'upaniṣad', 'vedānta', 'brahmasūtra'],
      'guru': ['teacher', 'spiritual guide', 'guruḥ', 'ācārya', 'upādhyāya'],
      'shanti': ['peace', 'tranquility', 'śāntiḥ', 'śama', 'dama'],
      'sukha': ['happiness', 'pleasure', 'sukhaṃ', 'ānanda', 'paramānanda'],
      'duhkha': ['suffering', 'pain', 'duḥkhaṃ', 'kleśa', 'upadrava'],
      'ahimsa': ['non-violence', 'harmlessness', 'ahiṃsā', 'dayā', 'karuṇā'],
      'satya': ['truth', 'reality', 'satyaṃ', 'tattva', 'yathārtha'],
      'dana': ['giving', 'charity', 'generosity', 'dānaṃ', 'tyāga'],
      'tapa': ['austerity', 'penance', 'discipline', 'tapaḥ', 'tapasya'],
      'shraddha': ['faith', 'trust', 'śraddhā', 'viśvāsa', 'bhakti']
    };

    // Add all Amarakosha entries to lemma dictionary
    Object.entries(amarakoshaDict).forEach(([term, expansions]) => {
      this.lemmas.set(term.toLowerCase(), expansions);
    });

    logger.info(`Added ${Object.keys(amarakoshaDict).length} Amarakosha dictionary entries`);
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
      let queryText = this.buildQueryFromSemantics(semantics, question);
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
   * Extract multi-word phrases from query for enhanced phrase matching
   * @param {string} query - Original query
   * @returns {Array} Array of phrases
   */
  extractPhrases(query) {
    try {
      const phrases = [];
      const words = query.toLowerCase().split(/\s+/);
      const cleanWords = words.map(word => word.replace(/[^\w\sāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g, ''));

      // Extract 2-word phrases
      for (let i = 0; i < cleanWords.length - 1; i++) {
        const phrase = `${cleanWords[i]} ${cleanWords[i + 1]}`;
        if (phrase.length > 2) {
          phrases.push(phrase.trim());
        }
      }

      // Extract 3-word phrases for longer queries
      if (cleanWords.length > 2) {
        for (let i = 0; i < cleanWords.length - 2; i++) {
          const phrase = `${cleanWords[i]} ${cleanWords[i + 1]} ${cleanWords[i + 2]}`;
          if (phrase.length > 3) {
            phrases.push(phrase.trim());
          }
        }
      }

      // Remove duplicates and return
      return [...new Set(phrases)];
    } catch (error) {
      logger.warn('Error extracting phrases', { error: error.message });
      return [];
    }
  }

  /**
   * Cross-reference query with Aitareya Upanishad terms for enhanced coverage
   * @param {string} query - Original query
   * @param {boolean} isUpanishadQuery - Whether this is an Upanishad query
   * @returns {Array} Array of relevant expansions
   */
  crossReferenceWithAitareya(query, isUpanishadQuery) {
    try {
      const expansions = new Set();
      const queryLower = query.toLowerCase();

      // Aitareya-specific terms and concepts from the attached text
      const aitareyaTerms = {
        'ātman': ['self', 'soul', 'individual self', 'inner self', 'consciousness', 'spiritual essence'],
        'brahman': ['ultimate reality', 'cosmic principle', 'absolute', 'supreme being', 'universal consciousness'],
        'prāṇa': ['life force', 'vital breath', 'energy', 'life energy', 'vital principle'],
        'prajñāna': ['consciousness', 'awareness', 'intelligence', 'knowledge', 'wisdom'],
        'sūrya': ['sun', 'solar deity', 'light', 'illumination', 'spiritual light'],
        'ātmā': ['self', 'soul', 'essence', 'true nature', 'inner being'],
        'manas': ['mind', 'mental faculty', 'thought', 'consciousness', 'intellect'],
        'hṛdaya': ['heart', 'core', 'center', 'essence', 'spiritual center'],
        'vāk': ['speech', 'voice', 'expression', 'word', 'utterance'],
        'jñāna': ['knowledge', 'wisdom', 'understanding', 'realization', 'insight'],
        'vidyā': ['knowledge', 'learning', 'wisdom', 'spiritual knowledge', 'sacred learning'],
        'mukti': ['liberation', 'freedom', 'release', 'salvation', 'enlightenment'],
        'mokṣa': ['liberation', 'freedom', 'release', 'final emancipation', 'ultimate liberation'],
        'upaniṣad': ['sacred text', 'spiritual teaching', 'esoteric doctrine', 'hidden knowledge'],
        'vedānta': ['end of vedas', 'vedic conclusion', 'ultimate knowledge', 'supreme wisdom'],
        'nirvāṇa': ['extinction', 'cessation', 'liberation', 'enlightenment', 'ultimate peace'],
        'saṃsāra': ['cycle of birth and death', 'transmigration', 'worldly existence', 'cyclic existence'],
        'karman': ['action', 'deed', 'ritual action', 'moral action', 'consequential action'],
        'dharma': ['duty', 'righteousness', 'moral order', 'cosmic law', 'ethical principle'],
        'karma': ['action', 'consequence', 'moral causation', 'deed', 'moral action'],
        'yajña': ['sacrifice', 'ritual', 'offering', 'sacred ceremony', 'ritual worship'],
        'tapas': ['austerity', 'spiritual practice', 'discipline', 'penance', 'ascetic practice'],
        'dhyāna': ['meditation', 'contemplation', 'concentration', 'mindful awareness'],
        'samādhi': ['absorption', 'superconscious state', 'meditative absorption', 'enlightened state'],
        'bhakti': ['devotion', 'loving devotion', 'divine love', 'surrender', 'spiritual love'],
        'yoga': ['union', 'spiritual discipline', 'meditative practice', 'path of realization'],
        'guru': ['spiritual teacher', 'master', 'preceptor', 'guide', 'enlightened being'],
        'śiṣya': ['disciple', 'student', 'seeker', 'spiritual aspirant', 'pupil'],
        'jīva': ['individual soul', 'living being', 'embodied self', 'incarnated consciousness'],
        'puruṣa': ['cosmic man', 'universal being', 'spiritual essence', 'divine person'],
        'pradhāna': ['primordial matter', 'cosmic substance', 'material principle', 'nature'],
        'māyā': ['illusion', 'cosmic illusion', 'divine power', 'creative energy'],
        'avidyā': ['ignorance', 'spiritual ignorance', 'lack of knowledge', 'delusion'],
        'vijñāna': ['specialized knowledge', 'discriminative awareness', 'higher knowledge'],
        'medhā': ['intelligence', 'mental power', 'intellectual capacity', 'wisdom'],
        'dṛṣṭi': ['vision', 'insight', 'perception', 'spiritual vision', 'inner sight'],
        'śruti': ['revealed text', 'sacred scripture', 'divine word', 'vedic revelation'],
        'smṛti': ['remembered tradition', 'sacred memory', 'traditional knowledge', 'scripture'],
        'mantra': ['sacred formula', 'incantation', 'divine word', 'spiritual sound'],
        'brahmā': ['creator', 'supreme creator', 'cosmic creator', 'divine architect'],
        'viṣṇu': ['preserver', 'sustainer', 'universal maintainer', 'divine preserver'],
        'śiva': ['auspicious one', 'transformer', 'divine destroyer', 'supreme being'],
        'indrā': ['king of gods', 'divine king', 'celestial ruler', 'heavenly sovereign'],
        'agni': ['fire', 'sacred fire', 'divine fire', 'ritual fire', 'purifying fire'],
        'vāyu': ['wind', 'vital air', 'life breath', 'divine wind', 'cosmic breath'],
        'āditya': ['sun god', 'solar deity', 'divine sun', 'celestial light'],
        'candra': ['moon', 'lunar deity', 'divine moon', 'celestial light'],
        'mṛtyu': ['death', 'mortality', 'divine death', 'cosmic transition'],
        'apāna': ['downward breath', 'excretory function', 'vital air', 'life force'],
        'prāṇā': ['vital airs', 'life forces', 'vital energies', 'cosmic breaths'],
        'oṃ': ['primal sound', 'sacred syllable', 'cosmic vibration', 'divine word'],
        'śānti': ['peace', 'tranquility', 'divine peace', 'inner peace', 'cosmic harmony'],
        'satya': ['truth', 'reality', 'divine truth', 'ultimate reality', 'cosmic truth'],
        'dama': ['self-control', 'restraint', 'discipline', 'inner control'],
        'śama': ['mental peace', 'tranquility', 'inner calm', 'spiritual peace'],
        'dāna': ['charity', 'giving', 'generosity', 'spiritual giving', 'divine gift'],
        'dayā': ['compassion', 'mercy', 'kindness', 'divine compassion'],
        'ahimsā': ['non-violence', 'harmlessness', 'peaceful conduct', 'divine non-violence'],
        'satyaṃ': ['truth', 'reality', 'divine truth', 'ultimate reality'],
        'dharman': ['righteousness', 'moral order', 'cosmic law', 'ethical principle'],
        'brahmaṇ': ['brahmin', 'priestly class', 'spiritual knowledge', 'divine knowledge']
      };

      // Check for Aitareya terms in query
      Object.entries(aitareyaTerms).forEach(([term, synonyms]) => {
        if (queryLower.includes(term)) {
          synonyms.forEach(synonym => expansions.add(synonym));
        }
      });

      // For Upanishad queries, include additional spiritual terms
      if (isUpanishadQuery) {
        const upanishadTerms = [
          'spiritual enlightenment', 'divine wisdom', 'sacred knowledge', 'inner realization',
          'transcendental consciousness', 'ultimate truth', 'cosmic unity', 'divine essence',
          'spiritual awakening', 'higher consciousness', 'divine light', 'sacred teaching',
          'eternal truth', 'universal consciousness', 'divine revelation', 'sacred scripture',
          'spiritual guidance', 'inner peace', 'divine grace', 'cosmic harmony'
        ];
        upanishadTerms.forEach(term => expansions.add(term));
      }

      return Array.from(expansions);
    } catch (error) {
      logger.warn('Error cross-referencing with Aitareya terms', { error: error.message });
      return [];
    }
  }

  /**
   * Expand query with enhanced lemma-based Sanskrit term expansion using full Amarakosha
   * Loads lemmas from 'output_jsonl/Upanishads_metadata.jsonl' and parses full Amarakosha dictionary
   * Uses top 15-20 synonyms per term with phrase and partial word matching for broader coverage
   * Merges expansions inclusively for multi-word queries, removes duplicates, ranks by relevance/frequency
   * If query mentions 'Upanishad', appends expansions to Vertex query for 'upanishads_pilot' store
   * @param {string} question - Original user question
   * @param {Object} semantics - Semantic analysis result
   * @returns {Object} Query expansion result with original and expanded queries
   */
  expandQueryWithLemmas(question, semantics) {
    const originalQuery = question.toLowerCase();
    const words = originalQuery.split(/\s+/);
    const expansions = new Map(); // Use Map to track sources and rankings
    const expansionSources = new Map(); // Track where each expansion comes from

    logger.info('🚀 Starting enhanced lemma-based query expansion', {
      originalQuery: originalQuery.substring(0, 100),
      wordCount: words.length,
      availableTerms: this.lemmas.size,
      lemmaSample: Array.from(this.lemmas.keys()).slice(0, 5)
    });

    // Check if query mentions Upanishad for special handling
    const isUpanishadQuery = originalQuery.includes('upanishad') || originalQuery.includes('upaniṣad');

    // Enhanced expansion with phrase and partial word matching
    const expandedWords = new Set();

    // First pass: Direct term matching
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w\sāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g, '').toLowerCase();
      const lemmaExpansions = this.lemmas.get(cleanWord);

      if (lemmaExpansions && lemmaExpansions.length > 0) {
        // Use top 15-20 synonyms for maximum coverage
        const topSynonyms = lemmaExpansions.slice(0, 18);

        logger.info(`📚 Direct match: "${cleanWord}" -> [${topSynonyms.slice(0, 8).join(', ')}${topSynonyms.length > 8 ? '...' : ''}]`, {
          totalSynonyms: lemmaExpansions.length,
          usingTop: topSynonyms.length,
          frequency: lemmaExpansions.frequency || 1,
          relevance: lemmaExpansions.relevance || 0.8
        });

        expandedWords.add(cleanWord);
        topSynonyms.forEach((expansion, index) => {
          const rank = index + 1;
          expansions.set(expansion, {
            rank: rank,
            source: `direct:${cleanWord}:${rank}`,
            relevance: (lemmaExpansions.relevance || 0.8) * (1 - (rank / 20)), // Decay relevance by rank
            frequency: lemmaExpansions.frequency || 1
          });
        });
      }
    });

    // Second pass: Partial word matching for broader coverage
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w\sāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g, '').toLowerCase();

      // Skip if already matched directly
      if (expandedWords.has(cleanWord)) return;

      // Partial matching - check if word is part of any term
      for (const [term, data] of this.lemmas.entries()) {
        if (term.includes(cleanWord) || cleanWord.includes(term)) {
          const topSynonyms = data.synonyms.slice(0, 15); // Use 15 synonyms for partial matches

          logger.info(`🔍 Partial match: "${cleanWord}" ~ "${term}" -> [${topSynonyms.slice(0, 6).join(', ')}${topSynonyms.length > 6 ? '...' : ''}]`, {
            totalSynonyms: data.synonyms.length,
            usingTop: topSynonyms.length,
            partialMatch: true
          });

          topSynonyms.forEach((expansion, index) => {
            const rank = index + 1;
            const partialRelevance = (data.relevance || 0.6) * (1 - (rank / 20)) * 0.7; // Lower relevance for partial matches
            expansions.set(expansion, {
              rank: rank,
              source: `partial:${cleanWord}~${term}:${rank}`,
              relevance: partialRelevance,
              frequency: data.frequency || 1
            });
          });
          break; // Only match first partial match to avoid duplicates
        }
      }
    });

    // Third pass: Phrase matching for multi-word queries
    const phrases = this.extractPhrases(originalQuery);
    phrases.forEach(phrase => {
      for (const [term, data] of this.lemmas.entries()) {
        if (term.includes(phrase) || phrase.includes(term)) {
          const topSynonyms = data.synonyms.slice(0, 20); // Use 20 synonyms for phrase matches

          logger.info(`📝 Phrase match: "${phrase}" ~ "${term}" -> [${topSynonyms.slice(0, 8).join(', ')}${topSynonyms.length > 8 ? '...' : ''}]`, {
            totalSynonyms: data.synonyms.length,
            usingTop: topSynonyms.length,
            phraseMatch: true
          });

          topSynonyms.forEach((expansion, index) => {
            const rank = index + 1;
            const phraseRelevance = (data.relevance || 0.9) * (1 - (rank / 25)) * 1.2; // Higher relevance for phrase matches
            expansions.set(expansion, {
              rank: rank,
              source: `phrase:${phrase}~${term}:${rank}`,
              relevance: phraseRelevance,
              frequency: data.frequency || 1
            });
          });
        }
      }
    });

    // Fourth pass: Semantic analysis themes with enhanced coverage
    if (semantics.themes && semantics.themes.length > 0) {
      semantics.themes.forEach(theme => {
        const themeExpansions = this.lemmas.get(theme.toLowerCase());
        if (themeExpansions && themeExpansions.synonyms.length > 0) {
          const topThemeSynonyms = themeExpansions.synonyms.slice(0, 18); // Top 18 for themes

          logger.info(`🎭 Semantic theme: "${theme}" -> [${topThemeSynonyms.slice(0, 8).join(', ')}${topThemeSynonyms.length > 8 ? '...' : ''}]`, {
            totalSynonyms: themeExpansions.synonyms.length,
            usingTop: topThemeSynonyms.length
          });

          topThemeSynonyms.forEach((expansion, index) => {
            const rank = index + 1;
            const themeRelevance = (themeExpansions.relevance || 0.9) * (1 - (rank / 20)) * 1.3; // Higher relevance for themes
            expansions.set(expansion, {
              rank: rank,
              source: `theme:${theme}:${rank}`,
              relevance: themeRelevance,
              frequency: themeExpansions.frequency || 1
            });
          });
        }
      });
    }

    // Fifth pass: Semantic analysis concepts with enhanced coverage
    if (semantics.concepts && semantics.concepts.length > 0) {
      semantics.concepts.forEach(concept => {
        const conceptExpansions = this.lemmas.get(concept.toLowerCase());
        if (conceptExpansions && conceptExpansions.synonyms.length > 0) {
          const topConceptSynonyms = conceptExpansions.synonyms.slice(0, 15); // Top 15 for concepts

          logger.info(`💡 Semantic concept: "${concept}" -> [${topConceptSynonyms.slice(0, 6).join(', ')}${topConceptSynonyms.length > 6 ? '...' : ''}]`, {
            totalSynonyms: conceptExpansions.synonyms.length,
            usingTop: topConceptSynonyms.length
          });

          topConceptSynonyms.forEach((expansion, index) => {
            const rank = index + 1;
            const conceptRelevance = (conceptExpansions.relevance || 0.85) * (1 - (rank / 20)) * 1.1; // Higher relevance for concepts
            expansions.set(expansion, {
              rank: rank,
              source: `concept:${concept}:${rank}`,
              relevance: conceptRelevance,
              frequency: conceptExpansions.frequency || 1
            });
          });
        }
      });
    }

    // Sixth pass: Cross-reference with Aitareya Upanishad terms
    const aitareyaExpansions = this.crossReferenceWithAitareya(originalQuery, isUpanishadQuery);
    aitareyaExpansions.forEach((expansion, index) => {
      const rank = index + 1;
      expansions.set(expansion, {
        rank: rank,
        source: `aitareya:${rank}`,
        relevance: 0.95 * (1 - (rank / 20)), // High relevance for Aitareya terms
        frequency: 5 // High frequency score
      });
    });

    if (aitareyaExpansions.length > 0) {
      logger.info(`🕉️ Aitareya cross-reference: ${aitareyaExpansions.length} terms -> [${aitareyaExpansions.slice(0, 8).join(', ')}${aitareyaExpansions.length > 8 ? '...' : ''}]`);
    }

    // Build expanded query with ranked and deduplicated expansions
    let expandedQuery = originalQuery;
    let expansionDetails = [];
    let expansionArray = [];

    if (expansions.size > 0) {
      // Sort expansions by relevance and frequency for better ranking
      const sortedExpansions = Array.from(expansions.entries()).sort((a, b) => {
        const [, aData] = a;
        const [, bData] = b;

        // Primary sort: relevance score (higher is better)
        const relevanceDiff = bData.relevance - aData.relevance;
        if (Math.abs(relevanceDiff) > 0.01) {
          return relevanceDiff;
        }

        // Secondary sort: frequency (higher is better)
        return bData.frequency - aData.frequency;
      });

      // Take top 50 expansions to avoid query length issues
      const topExpansions = sortedExpansions.slice(0, 50);
      const expansionArray = topExpansions.map(([expansion]) => expansion);

      // Create detailed expansion breakdown for logging
      topExpansions.forEach(([expansion, data]) => {
        expansionDetails.push({
          expansion: expansion,
          source: data.source || 'unknown',
          relevance: data.relevance,
          frequency: data.frequency,
          rank: data.rank
        });
      });

      // Add expansions to query
      expandedQuery += ' ' + expansionArray.join(' ');

      logger.info('🌟 Query expanded with enhanced lemma terms', {
        originalLength: originalQuery.length,
        expandedLength: expandedQuery.length,
        expansionCount: expansions.size,
        usedExpansions: expansionArray.length,
        uniqueSources: [...new Set(expansionDetails.map(d => d.source))].length,
        topExpansions: expansionArray.slice(0, 15),
        expansionRelevanceStats: {
          min: Math.min(...expansionDetails.map(d => d.relevance)),
          max: Math.max(...expansionDetails.map(d => d.relevance)),
          avg: expansionDetails.reduce((sum, d) => sum + d.relevance, 0) / expansionDetails.length
        }
      });

      // Log detailed expansion breakdown
      logger.info('📊 Detailed expansion breakdown (top 20)', {
        breakdown: expansionDetails.slice(0, 20).map(d => ({
          term: d.expansion.substring(0, 30),
          source: d.source,
          relevance: d.relevance.toFixed(3),
          frequency: d.frequency
        }))
      });
    }

    // Handle Upanishad-specific query expansion for 'upanishads_pilot' store
    if (isUpanishadQuery && expansions.size > 0) {
      const upanishadExpansions = Array.from(expansions.keys()).slice(0, 25); // Top 25 for pilot store
      expandedQuery += ' upanishads_pilot ' + upanishadExpansions.join(' ');

      logger.info('🕉️ Upanishad query detected, adding pilot store expansions', {
        upanishadExpansions: upanishadExpansions.slice(0, 10),
        additionalTerms: upanishadExpansions.length,
        finalLength: expandedQuery.length,
        pilotStoreTargeted: true,
        totalAvailable: expansions.size
      });
    }

    // Log full expansion details for debugging
    logger.info('📋 Full lemma expansion summary', {
      original: originalQuery,
      expanded: expandedQuery.substring(0, 200) + (expandedQuery.length > 200 ? '...' : ''),
      expansionCount: expansions.size,
      isUpanishadQuery: isUpanishadQuery,
      totalLength: expandedQuery.length,
      expansionSources: [...new Set(expansionDetails.map(d => d.source))],
      topTerms: expansionDetails.slice(0, 20).map(d => ({
        term: d.expansion.substring(0, 30),
        source: d.source,
        relevance: d.relevance.toFixed(3)
      })),
      expansionStats: {
        uniqueSources: [...new Set(expansionDetails.map(d => d.source))].length,
        averageRelevance: expansionDetails.reduce((sum, d) => sum + d.relevance, 0) / expansionDetails.length,
        maxRelevance: Math.max(...expansionDetails.map(d => d.relevance)),
        totalExpansionLength: expansionArray?.length || 0
      }
    });

    return {
      originalQuery: originalQuery,
      expandedQuery: expandedQuery.trim(),
      expansionCount: expansions.size,
      isUpanishadQuery: isUpanishadQuery,
      expansionSources: expansionDetails,
      lemmaCount: this.lemmas.size,
      expansionStats: {
        totalExpansions: expansions.size,
        usedExpansions: expansionArray?.length || 0,
        relevanceRange: {
          min: Math.min(...expansionDetails.map(d => d.relevance)),
          max: Math.max(...expansionDetails.map(d => d.relevance)),
          avg: expansionDetails.reduce((sum, d) => sum + d.relevance, 0) / expansionDetails.length
        }
      }
    };
  }

  /**
   * Build query text from semantic analysis with Sanskrit root expansion
   * Now includes lemma-based query expansion for enhanced Sanskrit term coverage
   * @param {Object} semantics - Semantic analysis result
   * @param {string} question - Original user question
   * @returns {string} Query text for Discovery Engine
   */
  buildQueryFromSemantics(semantics, question) {
    let queryText = '';

    // Apply lemma-based query expansion first
    const expansionResult = this.expandQueryWithLemmas(question, semantics);

    // Use expanded query as base for further processing
    queryText = expansionResult.expandedQuery;

    // Log the expansion result
    logger.info('Query expansion completed', {
      originalLength: expansionResult.originalQuery.length,
      expandedLength: expansionResult.expandedQuery.length,
      expansionCount: expansionResult.expansionCount,
      isUpanishadQuery: expansionResult.isUpanishadQuery
    });

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
   * Parse Discovery Engine response and extract verses with new verse-level structure
   * Handles multi-line content split by lines with metadata IDs (e.g., 'Upanishads_verse_X')
   * Assigns metadata like uri/gcs_path and integrates with expansions/ranking
   * @param {Object} response - Discovery Engine API response
   * @param {Object} semantics - Original semantic analysis
   * @param {string} question - Original user question
   * @returns {Array} Parsed verses with metadata and proper IDs
   */
  /**
   * Parse verse-level content from Discovery Engine response
   * Handles multi-line content split by lines with metadata mapping
   * @param {Object} result - Search result containing verse content
   * @param {Object} semantics - Original semantic analysis
   * @param {string} question - Original user question
   * @returns {Array} Array of parsed verses
   */
  parseVerseLevelContent(result, semantics, question) {
    const verses = [];

    try {
      // Extract multi-line content from result
      const contentText = result.content || result.text || result.snippet || '';

      if (!contentText) {
        logger.warn('No content found in search result');
        return verses;
      }

      // Split multi-line content by lines
      const lines = contentText.split('\n').filter(line => line.trim());

      logger.info('📖 Parsing verse-level content', {
        totalLines: lines.length,
        preview: lines.slice(0, 3).join(' | ')
      });

      // Process each line as a potential verse
      lines.forEach((line, lineIndex) => {
        const verse = this.createVerseFromLine(line, lineIndex, result, semantics, question);
        if (verse) {
          verses.push(verse);
        }
      });

      logger.info('✅ Verse-level parsing completed', {
        linesProcessed: lines.length,
        versesCreated: verses.length,
        averageLength: Math.round(lines.reduce((sum, line) => sum + line.length, 0) / lines.length)
      });

    } catch (error) {
      logger.error('Error parsing verse-level content', {
        error: error.message,
        resultTitle: result.title || 'unknown'
      });
    }

    return verses;
  }

  /**
   * Create a verse object from a single line with metadata mapping
   * @param {string} line - Single line of text
   * @param {number} lineIndex - Index of the line
   * @param {Object} result - Search result containing metadata
   * @param {Object} semantics - Original semantic analysis
   * @param {string} question - Original user question
   * @returns {Object|null} Verse object or null if invalid
   */
  createVerseFromLine(line, lineIndex, result, semantics, question) {
    try {
      const trimmedLine = line.trim();

      // Skip empty or very short lines
      if (trimmedLine.length < 5) {
        return null;
      }

      // Generate verse ID from metadata (e.g., 'Upanishads_verse_X')
      const verseId = this.generateVerseId(result, lineIndex);

      // Extract metadata from result
      const metadata = this.extractMetadataFromResult(result);

      // Determine if this is an Upanishad query for special handling
      const isUpanishadQuery = question.toLowerCase().includes('upanishad') ||
                               question.toLowerCase().includes('upaniṣad');

      // Create verse object with proper structure
      const verse = {
        id: verseId,
        reference: metadata.reference || this.generateReferenceFromMetadata(metadata),
        sanskrit: trimmedLine, // The line itself is the Sanskrit text
        translation: this.generateTranslationFromLine(trimmedLine),
        interpretation: this.generateInterpretationFromLine(trimmedLine, semantics),
        relevance: this.calculateVerseRelevance(trimmedLine, semantics, question),
        themes: this.extractThemesFromLine(trimmedLine, semantics),
        metadata: {
          uri: metadata.uri,
          gcs_path: metadata.gcs_path,
          source: metadata.source,
          verse_number: lineIndex + 1,
          is_upanishad: isUpanishadQuery,
          pilot_store_target: isUpanishadQuery ? 'upanishads_pilot' : null
        },
        ranking: {
          position: lineIndex + 1,
          score: this.calculateVerseRelevance(trimmedLine, semantics, question),
          expansion_boost: this.calculateExpansionBoost(trimmedLine, question)
        }
      };

      // Add Upanishad-specific enhancements
      if (isUpanishadQuery) {
        verse.upanishad_enhancements = {
          philosophical_context: this.extractPhilosophicalContext(trimmedLine),
          doctrinal_alignment: this.calculateDoctrinalAlignment(trimmedLine, semantics),
          spiritual_significance: this.assessSpiritualSignificance(trimmedLine)
        };
      }

      return verse;

    } catch (error) {
      logger.warn('Error creating verse from line', {
        error: error.message,
        lineIndex: lineIndex,
        linePreview: line.substring(0, 50)
      });
      return null;
    }
  }

  /**
   * Generate verse ID from metadata (e.g., 'Upanishads_verse_X')
   * @param {Object} result - Search result
   * @param {number} lineIndex - Line index
   * @returns {string} Generated verse ID
   */
  generateVerseId(result, lineIndex) {
    try {
      const source = result.title || result.source || 'Unknown';
      const cleanSource = source.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return `${cleanSource}_verse_${lineIndex + 1}`;
    } catch (error) {
      return `verse_${lineIndex + 1}`;
    }
  }

  /**
   * Extract metadata from search result
   * @param {Object} result - Search result
   * @returns {Object} Extracted metadata
   */
  extractMetadataFromResult(result) {
    return {
      uri: result.uri || result.link || '',
      gcs_path: result.gcsPath || result.storagePath || '',
      reference: result.reference || result.citation || '',
      source: result.title || result.source || 'Unknown',
      type: result.type || 'verse',
      collection: this.detectCollectionFromResult(result)
    };
  }

  /**
   * Detect collection from result (e.g., 'upanishads', 'vedas')
   * @param {Object} result - Search result
   * @returns {string} Detected collection
   */
  detectCollectionFromResult(result) {
    const title = (result.title || '').toLowerCase();
    const source = (result.source || '').toLowerCase();

    if (title.includes('upanishad') || source.includes('upanishad')) {
      return 'upanishads';
    } else if (title.includes('veda') || source.includes('veda')) {
      return 'vedas';
    } else if (title.includes('brahma') || source.includes('brahma')) {
      return 'brahmanas';
    } else {
      return 'general';
    }
  }

  /**
   * Generate reference from metadata
   * @param {Object} metadata - Verse metadata
   * @returns {string} Generated reference
   */
  generateReferenceFromMetadata(metadata) {
    const parts = [];
    if (metadata.collection) parts.push(metadata.collection.charAt(0).toUpperCase() + metadata.collection.slice(1));
    if (metadata.source) parts.push(metadata.source);
    if (metadata.verse_number) parts.push(`Verse ${metadata.verse_number}`);

    return parts.join(', ') || 'Unknown Reference';
  }

  /**
   * Generate translation from line (simplified for now)
   * @param {string} line - Sanskrit line
   * @returns {string} Generated translation
   */
  generateTranslationFromLine(line) {
    // This would be enhanced with actual translation logic
    return `Translation of: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`;
  }

  /**
   * Extract themes from a Sanskrit line based on semantic analysis
   * @param {string} line - Sanskrit line to analyze
   * @param {Object} semantics - Semantic analysis result
   * @returns {Array} Array of theme objects
   */
  extractThemesFromLine(line, semantics) {
    try {
      const themes = [];
      const lineLower = line.toLowerCase();

      // Core themes from semantics
      if (semantics && semantics.themes) {
        semantics.themes.forEach(theme => {
          if (typeof theme === 'string') {
            if (lineLower.includes(theme.toLowerCase())) {
              themes.push({
                name: theme,
                confidence: 0.8,
                source: 'semantic_analysis'
              });
            }
          }
        });
      }

      // Sanskrit-specific theme detection
      const sanskritThemes = {
        'ātman': { name: 'self_realization', confidence: 0.9, concepts: ['ātman', 'self', 'soul'] },
        'brahman': { name: 'ultimate_reality', confidence: 0.9, concepts: ['brahman', 'ultimate', 'reality', 'cosmic'] },
        'dharma': { name: 'moral_order', confidence: 0.85, concepts: ['dharma', 'righteousness', 'law'] },
        'karma': { name: 'action_consequence', confidence: 0.85, concepts: ['karma', 'action', 'consequence'] },
        'moksha': { name: 'liberation', confidence: 0.85, concepts: ['moksha', 'liberation', 'freedom'] },
        'jñāna': { name: 'knowledge', confidence: 0.8, concepts: ['jñāna', 'knowledge', 'wisdom'] },
        'yoga': { name: 'union', confidence: 0.8, concepts: ['yoga', 'union', 'discipline'] },
        'bhakti': { name: 'devotion', confidence: 0.8, concepts: ['bhakti', 'devotion', 'love'] },
        'veda': { name: 'sacred_knowledge', confidence: 0.8, concepts: ['veda', 'sacred', 'knowledge'] }
      };

      // Check for Sanskrit themes
      Object.entries(sanskritThemes).forEach(([term, themeData]) => {
        const found = themeData.concepts.some(concept =>
          lineLower.includes(concept.toLowerCase())
        );

        if (found) {
          themes.push({
            name: themeData.name,
            confidence: themeData.confidence,
            source: 'sanskrit_analysis',
            sanskrit_term: term
          });
        }
      });

      // Deduplicate themes
      const uniqueThemes = themes.filter((theme, index, self) =>
        index === self.findIndex(t => t.name === theme.name)
      );

      return uniqueThemes;
    } catch (error) {
      logger.warn('Error extracting themes from line', {
        error: error.message,
        line: line.substring(0, 50),
        semantics: semantics ? 'present' : 'null'
      });
      return [];
    }
  }

  /**
   * Generate interpretation from line and semantics
   * @param {string} line - Sanskrit line
   * @param {Object} semantics - Semantic analysis
   * @returns {string} Generated interpretation
   */
  generateInterpretationFromLine(line, semantics) {
    return `Spiritual interpretation of Sanskrit verse: "${line.substring(0, 30)}..."`;
  }

  /**
   * Calculate verse relevance score
   * @param {string} line - Sanskrit line
   * @param {Object} semantics - Semantic analysis
   * @param {string} question - Original question
   * @returns {number} Relevance score
   */
  calculateVerseRelevance(line, semantics, question) {
    let relevance = 0.5; // Base relevance

    // Boost for semantic theme matches
    if (semantics.themes) {
      semantics.themes.forEach(theme => {
        if (line.toLowerCase().includes(theme.toLowerCase())) {
          relevance += 0.2;
        }
      });
    }

    // Boost for semantic concept matches
    if (semantics.concepts) {
      semantics.concepts.forEach(concept => {
        if (line.toLowerCase().includes(concept.toLowerCase())) {
          relevance += 0.2;
        }
      });
    }

    return Math.min(relevance, 1.0);
  }

  /**
   * Calculate expansion boost based on lemma matches
   * @param {string} line - Sanskrit line
   * @param {string} question - Original question
   * @returns {number} Expansion boost score
   */
  calculateExpansionBoost(line, question) {
    let boost = 0;

    // Check for lemma matches in the line
    const lineWords = line.toLowerCase().split(/\s+/);
    const queryWords = question.toLowerCase().split(/\s+/);

    lineWords.forEach(lineWord => {
      const cleanLineWord = lineWord.replace(/[^\wāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g, '');
      queryWords.forEach(queryWord => {
        const cleanQueryWord = queryWord.replace(/[^\wāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g, '');
        if (cleanLineWord === cleanQueryWord && cleanLineWord.length > 2) {
          boost += 0.1;
        }
      });
    });

    return Math.min(boost, 0.5); // Cap at 0.5
  }

  /**
   * Extract philosophical context from line
   * @param {string} line - Sanskrit line
   * @returns {string} Philosophical context
   */
  extractPhilosophicalContext(line) {
    const context = [];

    if (line.includes('ātman') || line.includes('brahman')) {
      context.push('self-realization');
    }
    if (line.includes('dharma')) {
      context.push('moral_order');
    }
    if (line.includes('moksha')) {
      context.push('liberation');
    }

    return context.length > 0 ? context.join(', ') : 'general_spiritual';
  }

  /**
   * Calculate doctrinal alignment score
   * @param {string} line - Sanskrit line
   * @param {Object} semantics - Semantic analysis
   * @returns {number} Alignment score
   */
  calculateDoctrinalAlignment(line, semantics) {
    let alignment = 0.5; // Base alignment

    if (semantics.themes) {
      semantics.themes.forEach(theme => {
        if (line.toLowerCase().includes(theme.toLowerCase())) {
          alignment += 0.2;
        }
      });
    }

    return Math.min(alignment, 1.0);
  }

  /**
   * Assess spiritual significance
   * @param {string} line - Sanskrit line
   * @returns {string} Significance level
   */
  assessSpiritualSignificance(line) {
    const length = line.length;
    const hasKeyTerms = /\b(ātman|brahman|dharma|moksha|karma|jñāna)\b/i.test(line);

    if (length > 100 && hasKeyTerms) {
      return 'high';
    } else if (length > 50 || hasKeyTerms) {
      return 'medium';
    } else {
      return 'basic';
    }
  }

  /**
   * Parse Discovery Engine response and extract verses with new verse-level structure
   * @param {Object} response - Discovery Engine API response
   * @param {Object} semantics - Original semantic analysis
   * @param {string} question - Original user question
   * @returns {Array} Parsed verses with metadata and proper IDs
   */
  parseDiscoveryEngineResponse(response, semantics, question) {
    try {
      const verses = [];

      // Check if response has search results with new verse-level structure
      if (response.answer && response.answer.steps) {
        response.answer.steps.forEach((step, stepIndex) => {
          if (step.actions) {
            step.actions.forEach((action, actionIndex) => {
              if (action.searchAction && action.observation && action.observation.searchResults) {
                action.observation.searchResults.forEach((result, resultIndex) => {
                  // Use new verse-level parsing for multi-line content
                  if (result.content || result.text) {
                    const verseLevelVerses = this.parseVerseLevelContent(result, semantics, question);
                    verses.push(...verseLevelVerses);
                  }
                  // Fallback to snippet parsing for older structure
                  else if (result.snippetInfo) {
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

      // Log parsed verse count and sample
      if (verses.length > 0) {
        logger.info('📖 Parsed verses from Discovery Engine response', {
          totalVerses: verses.length,
          sampleVerses: verses.slice(0, 3).map((v, i) => ({
            id: v.id,
            reference: v.reference,
            preview: v.sanskrit.substring(0, 50) + '...',
            relevance: v.relevance,
            metadata: v.metadata
          })),
          upanishadVerses: verses.filter(v => v.metadata?.is_upanishad).length,
          pilotStoreTargeted: verses.filter(v => v.metadata?.pilot_store_target === 'upanishads_pilot').length
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

      // Apply adaptive relevance threshold filtering with enhanced verse-level ranking
      console.log(`📊 [Collector] Before filter: ${verses.length} verses`);

      let currentThreshold = 0.1; // Start with 0.1 threshold
      let filteredVerses = [];
      let allDroppedVerses = [];

      // Enhanced adaptive filtering with ranking integration
      for (let attempt = 1; attempt <= 3; attempt++) {
        const droppedVerses = [];

        // Enhanced filtering considering ranking and metadata
        filteredVerses = verses.filter(verse => {
          // Check base relevance score
          if (verse.relevance < currentThreshold) {
            droppedVerses.push({
              reference: verse.reference,
              relevance: verse.relevance,
              threshold: currentThreshold,
              ranking: verse.ranking,
              metadata: verse.metadata
            });
            return false;
          }

          // For Upanishad queries, boost relevance for pilot store targeting
          if (verse.metadata?.is_upanishad && verse.metadata?.pilot_store_target === 'upanishads_pilot') {
            verse.relevance += 0.1; // Boost by 0.1 for pilot store targeting
          }

          return true;
        });

        allDroppedVerses.push(...droppedVerses);

        console.log(`📊 [Collector] Attempt ${attempt}: threshold ${currentThreshold}, got ${filteredVerses.length} verses`);

        // Log dropped verses with enhanced metadata
        if (droppedVerses.length > 0) {
          console.log(`📉 [Collector] Dropped ${droppedVerses.length} verses below threshold ${currentThreshold}:`);
          droppedVerses.forEach((verse, index) => {
            console.log(`  ${index + 1}. "${verse.reference}" (score: ${verse.relevance}, ranking: ${verse.ranking?.position || 'N/A'})`);
          });
        }

        // If we have at least 3 verses, we're good
        if (filteredVerses.length >= 3) {
          console.log(`✅ [Collector] Found sufficient verses (${filteredVerses.length}) at threshold ${currentThreshold}`);

          // Sort by enhanced relevance score
          filteredVerses.sort((a, b) => b.relevance - a.relevance);

          break;
        }

        // If this was the last attempt and we still have < 3 verses, use what we have
        if (attempt === 3) {
          console.log(`⚠️ [Collector] Using ${filteredVerses.length} verses despite low count (final attempt)`);
          break;
        }

        // Lower threshold for next attempt
        currentThreshold = Math.max(0.01, currentThreshold - 0.03); // Lower by 0.03, minimum 0.01
        console.log(`🔄 [Collector] Lowering threshold to ${currentThreshold} for next attempt`);
      }

      console.log(`📊 [Collector] Final count after adaptive filtering: ${filteredVerses.length} verses`);

      // Enhanced ranking and integration with expansions
      const finalVerses = filteredVerses.slice(0, 5);

      // Log final verse ranking with expansion integration
      console.log('🏆 [Collector] Final verse ranking with expansion integration:');
      finalVerses.forEach((verse, index) => {
        const expansionBoost = verse.ranking?.expansion_boost || 0;
        const pilotStoreBonus = verse.metadata?.pilot_store_target === 'upanishads_pilot' ? 0.1 : 0;
        const finalScore = verse.relevance + expansionBoost + pilotStoreBonus;

        console.log(`  ${index + 1}. "${verse.reference}" (base: ${verse.relevance}, boost: ${expansionBoost}, pilot: ${pilotStoreBonus}, final: ${finalScore.toFixed(3)}) [${verse.id}]`);
      });

      if (finalVerses.length < filteredVerses.length) {
        const droppedCount = filteredVerses.length - finalVerses.length;
        console.log(`🔍 [Collector] Limited to top 5: dropped ${droppedCount} additional verses`);
      }

      // If no verses found, create fallback using top clusters from original verses
      if (finalVerses.length === 0) {
        console.log(`⚠️ [Collector] No verses found, creating cluster-based fallback`);

        // Sort original verses by enhanced relevance
        const sortedVerses = verses.sort((a, b) => {
          const aScore = a.relevance + (a.ranking?.expansion_boost || 0) + (a.metadata?.pilot_store_target === 'upanishads_pilot' ? 0.1 : 0);
          const bScore = b.relevance + (b.ranking?.expansion_boost || 0) + (b.metadata?.pilot_store_target === 'upanishads_pilot' ? 0.1 : 0);
          return bScore - aScore;
        });

        // Create fallback verses from top clusters
        const fallbackVerses = [];
        const usedReferences = new Set();

        for (const verse of sortedVerses) {
          if (fallbackVerses.length >= 5) break;

          // Avoid duplicates
          if (usedReferences.has(verse.reference)) continue;

          // Create a fallback verse with relaxed relevance
          const fallbackVerse = {
            ...verse,
            relevance: Math.max(verse.relevance, 0.05) // Ensure minimum relevance
          };

          fallbackVerses.push(fallbackVerse);
          usedReferences.add(verse.reference);
        }

        console.log(`🔄 [Collector] Created ${fallbackVerses.length} fallback verses from top clusters`);
        return fallbackVerses;
      }

      return finalVerses;

    } catch (error) {
      logger.error('Error parsing Discovery Engine response', {
        error: error.message,
        stack: error.stack,
        question: question.substring(0, 100)
      });
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
