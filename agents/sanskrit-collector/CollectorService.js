require('dotenv').config({ path: '../../.env.local' });

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();  // Uses default credentials

const logger = require('./logger');
const { CollectorError } = require('./errors');
const fs = require('fs');
const path = require('path');

class CollectorService {
  constructor() {
    this.lemmas = new Map();
    this.amarakoshaDict = new Map();
    this.initializeLemmas();
  }

  // Initialize lemma dictionary and Amarakosha
  async initializeLemmas() {
    try {
      // Load from metadata file
      await this.loadLemmasFromMetadata();

      // Load full Amarakosha
      const amarakoshaDict = await this.parseAmarakoshaFile();

      // Add to lemmas and store separately for query enhancement
      Object.entries(amarakoshaDict).forEach(([term, data]) => {
        if (data && data.synonyms && data.synonyms.length > 0) {
          this.lemmas.set(term.toLowerCase(), data.synonyms);
          this.amarakoshaDict.set(term.toLowerCase(), data);
        }
      });

      logger.info(`Loaded ${this.lemmas.size} lemmas from Amarakosha dictionary`);
    } catch (error) {
      logger.error('Failed to initialize lemmas:', error);
      throw new CollectorError('Lemma initialization failed', 500, error);
    }
  }

  // Enhanced query using Amarakosha synonyms and contextual terms
  enhanceQueryWithAmarakosha(originalQuery) {
    try {
      if (!originalQuery || originalQuery.trim().length === 0) {
        return originalQuery;
      }

      let enhancedQuery = originalQuery;
      const words = originalQuery.toLowerCase().split(/\s+/);
      const synonyms = new Set();

      // Find synonyms for each word using Amarakosha
      for (const word of words) {
        if (this.lemmas.has(word)) {
          const wordSynonyms = this.lemmas.get(word);
          // Add up to 3 most relevant synonyms to avoid query bloat
          wordSynonyms.slice(0, 3).forEach(synonym => {
            if (synonym && synonym.length > 2) {
              synonyms.add(synonym);
            }
          });
        }
      }

      // Add synonyms to query
      if (synonyms.size > 0) {
        const synonymArray = Array.from(synonyms);
        enhancedQuery += ' ' + synonymArray.join(' ');
      }

      // Add generic metadata terms for better retrieval (as per documentation)
      if (originalQuery.length > 5) {
        enhancedQuery += ' characters themes places context sections';
      }

      logger.info(`Query enhanced: "${originalQuery}" -> "${enhancedQuery}"`);
      return enhancedQuery;
    } catch (error) {
      logger.warn('Query enhancement failed, using original query:', error);
      return originalQuery;
    }
  }

  // Main collection function with enhanced query and proper async handling
  async collect(question, sessionId) {
    let timeoutId;

    try {
      logger.info(`Starting collection for session: ${sessionId}`);

      // Set up timeout
      timeoutId = setTimeout(() => {
        throw new CollectorError('Collection timeout exceeded', 408);
      }, 30000);

      // Step 1: Enhance query using Amarakosha
      const enhancedQuery = this.enhanceQueryWithAmarakosha(question);

      // Step 2: Query Vertex AI Discovery Engine with enhanced query
      const discoveryResponse = await this.queryVertexAI(enhancedQuery, sessionId);

      // Step 3: Extract verse IDs from Discovery Engine response
      const verseIds = this.extractVerseIds(discoveryResponse);

      // Step 4: Fetch complete verses from GCS buckets
      const verses = await this.fetchAndFormatVerses(verseIds, sessionId);

      // Step 5: Format final response
      const formattedResponse = this.formatCollectionResponse(verses, enhancedQuery, sessionId);

      logger.info(`Collection completed successfully for session: ${sessionId}`);
      return formattedResponse;

    } catch (error) {
      logger.error(`Collection failed for session ${sessionId}:`, error);
      throw new CollectorError(`Collection failed: ${error.message}`, 500, error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  // Query Vertex AI Discovery Engine
  async queryVertexAI(enhancedQuery, sessionId) {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let timeoutId;

    while (retryCount < MAX_RETRIES) {
      try {
        logger.info(`Querying Vertex AI with enhanced query for session: ${sessionId}`);

        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
        const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT;

        // Validate required environment variables
        if (!projectId || !clientEmail || !privateKey || !apiEndpoint) {
          throw new CollectorError('DISCOVERY_ENGINE_CONFIG_ERROR', 'Google Cloud credentials not configured. Please check environment variables.', new Error('Missing required environment variables'));
        }

        // Use GoogleAuth for authentication (exact working pattern)
        const { GoogleAuth } = require('google-auth-library');

        const credentials = {
          "type": "service_account",
          "project_id": projectId,
          "private_key_id": "env-provided",
          "private_key": privateKey.replace(/\\n/g, '\n'),
          "client_email": clientEmail,
          "client_id": "env-provided",
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
          "universe_domain": "googleapis.com"
        };

        const auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        // Build query from semantics
        let queryText = enhancedQuery;
        if (queryText && queryText.length > 5) {
          queryText += ' characters themes places context sections';
        }

        // Construct the request body (exact working pattern)
        const requestBody = {
          query: { text: queryText },
          answerGenerationSpec: {
            includeCitations: true,
            promptSpec: {
              preamble: "You are a Sanskrit verse retrieval specialist. Find and return relevant verses from the sacred scriptures. Focus on extracting complete Sanskrit verses with proper references."
            }
          }
        };

        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.token}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        logger.info(`Vertex AI returned response for session: ${sessionId}`);
        return data;

      } catch (error) {
        retryCount++;
        logger.warn(`Attempt ${retryCount} failed: ${error.message}. Retrying in ${retryCount * 2}s...`);

        if (retryCount >= MAX_RETRIES) {
          throw new CollectorError(`Vertex AI query failed: ${error.message}`, 500, error);
        }

        await new Promise(resolve => setTimeout(resolve, retryCount * 2000)); // Backoff: 2s, 4s, 6s
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }
  }

  // Extract verse IDs from Discovery Engine response
  extractVerseIds(discoveryResponse) {
    try {
      const verseIds = [];

      if (!discoveryResponse.results || discoveryResponse.results.length === 0) {
        logger.warn('No results found in Discovery Engine response');
        return verseIds;
      }

      for (const result of discoveryResponse.results) {
        if (result.document && result.document.id) {
          // Extract verse ID from document ID or URI
          let verseId = result.document.id;

          // If document has URI, extract verse ID from it
          if (result.document.uri) {
            const uriParts = result.document.uri.split('/');
            const filename = uriParts[uriParts.length - 1];
            if (filename.endsWith('.txt')) {
              verseId = filename.replace('.txt', '');
            }
          }

          verseIds.push(verseId);
        }
      }

      logger.info(`Extracted ${verseIds.length} verse IDs from Discovery response`);
      return verseIds;

    } catch (error) {
      logger.error('Failed to extract verse IDs:', error);
      return [];
    }
  }

  // Fetch complete verses from GCS buckets - FIXED VERSION
  async fetchAndFormatVerses(verseIds, sessionId) {
    try {
      logger.info(`Fetching ${verseIds.length} verses from GCS for session: ${sessionId}`);

      if (!verseIds || verseIds.length === 0) {
        logger.warn('No verse IDs provided for fetching');
        return [];
      }

      const bucketName = process.env.GCS_BUCKET_NAME;
      const verses = [];

      // Process verses in batches to avoid overwhelming GCS
      const batchSize = 5;
      for (let i = 0; i < verseIds.length; i += batchSize) {
        const batch = verseIds.slice(i, i + batchSize);

        // Create promises for batch processing
        const batchPromises = batch.map(async (verseId) => {
          try {
            // Construct file path based on verse ID structure
            const filePath = this.constructGCSFilePath(verseId);
            const file = storage.bucket(bucketName).file(filePath);

            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
              logger.warn(`Verse file not found: ${filePath}`);
              return null;
            }

            // Download and parse verse content
            const [content] = await file.download();
            const verseText = content.toString('utf-8');

            return {
              verseId,
              content: this.parseVerseContent(verseText),
              source: filePath
            };

          } catch (error) {
            logger.warn(`Failed to fetch verse ${verseId}:`, error.message);
            return null;
          }
        });

        // Wait for batch to complete and filter out null results
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        verses.push(...validResults);

        // Brief pause between batches
        if (i + batchSize < verseIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`Successfully fetched ${verses.length} verses from GCS for session: ${sessionId}`);
      return verses;

    } catch (error) {
      logger.error(`Failed to fetch verses from GCS for session ${sessionId}:`, error);
      throw new CollectorError(`GCS fetch failed: ${error.message}`, 500, error);
    }
  }

  // Construct GCS file path from verse ID
  constructGCSFilePath(verseId) {
    try {
      // Handle different verse ID formats
      // Examples: "Vedas_Rg_Veda_verse_8361", "Upanishads_verse_476", etc.

      if (verseId.includes('_verse_')) {
        // Format: Scripture_Type_Name_verse_number
        const parts = verseId.split('_verse_');
        if (parts.length === 2) {
          const scriptureInfo = parts[0];
          const verseNumber = parts[1];

          // Construct path: Scripture/Type/Name/Scripture_Type_Name_verse_number.txt
          const pathParts = scriptureInfo.split('_');
          if (pathParts.length >= 3) {
            const scripture = pathParts[0]; // e.g., "Vedas"
            const type = pathParts[1]; // e.g., "Rg"
            const name = pathParts.slice(2).join('_'); // e.g., "Veda" or "Atharva_Veda"

            return `${scripture}/${type}_${name}/${verseId}.txt`;
          }
        }
      }

      // Fallback: assume direct file path
      return `${verseId}.txt`;

    } catch (error) {
      logger.warn(`Failed to construct GCS path for ${verseId}:`, error);
      return `${verseId}.txt`;
    }
  }

  // Parse verse content from file
  parseVerseContent(verseText) {
    try {
      const lines = verseText.trim().split('\n');
      const verse = {
        sanskrit: '',
        transliteration: '',
        translation: ''
      };

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('Sanskrit Transliteration:')) {
          verse.transliteration = trimmedLine.replace('Sanskrit Transliteration:', '').trim();
        } else if (trimmedLine.startsWith('English Translation:')) {
          verse.translation = trimmedLine.replace('English Translation:', '').trim();
        } else if (trimmedLine && !trimmedLine.includes(':') && !verse.sanskrit) {
          // Assume first non-labeled line is Sanskrit
          verse.sanskrit = trimmedLine;
        }
      }

      return verse;

    } catch (error) {
      logger.warn('Failed to parse verse content:', error);
      return {
        sanskrit: '',
        transliteration: verseText.substring(0, 200),
        translation: 'Translation not available'
      };
    }
  }

  // Format final collection response
  formatCollectionResponse(verses, enhancedQuery, sessionId) {
    try {
      const response = {
        sessionId,
        query: {
          original: enhancedQuery.split(' characters themes places context sections')[0],
          enhanced: enhancedQuery
        },
        results: {
          totalVerses: verses.length,
          verses: verses.map(verse => ({
            id: verse.verseId,
            content: verse.content,
            source: verse.source,
            relevanceScore: this.calculateRelevanceScore(verse, enhancedQuery)
          }))
        },
        metadata: {
          collectionTime: new Date().toISOString(),
          amarakoshaEnhanced: true,
          totalSources: verses.length
        }
      };

      // Sort verses by relevance score
      response.results.verses.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return response;

    } catch (error) {
      logger.error('Failed to format collection response:', error);
      throw new CollectorError('Response formatting failed', 500, error);
    }
  }

  // Calculate basic relevance score for verse ranking
  calculateRelevanceScore(verse, query) {
    try {
      const queryWords = query.toLowerCase().split(/\s+/);
      const verseText = `${verse.content.sanskrit} ${verse.content.transliteration} ${verse.content.translation}`.toLowerCase();

      let score = 0;
      for (const word of queryWords) {
        if (word.length > 2 && verseText.includes(word)) {
          score += 1;
        }
      }

      return score / queryWords.length;

    } catch (error) {
      logger.warn('Failed to calculate relevance score:', error);
      return 0.5; // Default score
    }
  }

  // KEEP EXISTING METHODS FOR BACKWARD COMPATIBILITY

  // Legacy method - maps to new collect method
  async processQuery({ question, correlationId }) {
    return await this.collect(question, correlationId);
  }

  // Legacy method - maps to new enhanceQueryWithAmarakosha method
  expandQueryWithLemmas(question) {
    return this.enhanceQueryWithAmarakosha(question);
  }

  // Keep existing health check method
  getHealthStatus() {
    return {
      status: 'healthy',
      lemmasLoaded: this.lemmas.size,
      timestamp: new Date().toISOString()
    };
  }

  // Load lemmas from metadata file (existing method - kept for compatibility)
  async loadLemmasFromMetadata() {
    try {
      const metadataPath = path.join(__dirname, '../data/verse_metadata_with_lemmas.json');
      if (!fs.existsSync(metadataPath)) {
        logger.warn('Metadata file not found, creating empty lemma set');
        return;
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      Object.values(metadata).forEach(verseData => {
        if (verseData.lemmas) {
          Object.entries(verseData.lemmas).forEach(([lemma, words]) => {
            if (!this.lemmas.has(lemma)) {
              this.lemmas.set(lemma, []);
            }
            this.lemmas.get(lemma).push(...words);
          });
        }
      });

      logger.info(`Loaded lemmas from metadata: ${this.lemmas.size} entries`);
    } catch (error) {
      logger.warn('Failed to load lemmas from metadata:', error);
    }
  }

  // Parse Amarakosha file (existing method - kept for compatibility)
  async parseAmarakoshaFile() {
    try {
      const amarakoshaPath = path.join(__dirname, '../data/amarakosha_dict.json');
      if (!fs.existsSync(amarakoshaPath)) {
        logger.warn('Amarakosha dictionary file not found');
        return {};
      }

      const amarakoshaData = JSON.parse(fs.readFileSync(amarakoshaPath, 'utf8'));
      logger.info(`Loaded Amarakosha dictionary: ${Object.keys(amarakoshaData).length} entries`);
      return amarakoshaData;

    } catch (error) {
      logger.warn('Failed to parse Amarakosha file:', error);
      return {};
    }
  }
}

// Export as class instead of singleton to match new pattern
module.exports = { CollectorService };
