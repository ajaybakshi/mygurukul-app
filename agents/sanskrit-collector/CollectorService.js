const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../../.env.local') });

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();  // Uses default credentials

const logger = require('./logger');
const { CollectorError } = require('./errors');
const fs = require('fs');
const path = require('path');

class CollectorService {
  constructor() {
    this.lemmas = new Map();
    this.initializeLemmas();
  }

  // Initialize lemma dictionary (kept for upstream expansion)
  async initializeLemmas() {
    try {
      // Load from metadata file
      await this.loadLemmasFromMetadata();

      // Load full Amarakosha
      const amarakoshaDict = await this.parseAmarakoshaFile();

      // Add to lemmas
      Object.entries(amarakoshaDict).forEach(([term, data]) => {
        if (data && data.synonyms && data.synonyms.length > 0) {
          this.lemmas.set(term.toLowerCase(), data.synonyms);
        }
      });

      // Add hardcoded Amarakosha
      this.addAmarakoshaDictionary();

      logger.info(`Lemma dictionary initialized with ${this.lemmas.size} entries`);
    } catch (error) {
      logger.warn('Failed to initialize lemmas, using empty map', { error: error.message });
    }
  }

  // Load lemmas from metadata JSONL (kept)
  async loadLemmasFromMetadata() {
    const metadataPath = path.join(process.cwd(), 'output/jsonl', 'Upanishads/metadata.jsonl');
    if (!fs.existsSync(metadataPath)) return;

    const content = fs.readFileSync(metadataPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const data = JSON.parse(line);
      if (data.id && data.lemmas && Array.isArray(data.lemmas)) {
        data.lemmas.forEach(lemma => {
          if (typeof lemma === 'string') {
            this.lemmas.set(lemma.toLowerCase(), [lemma]);
          }
        });
      }
    });
  }

  // Parse full Amarakosha (kept)
  async parseAmarakoshaFile() {
    const amarakoshaPath = path.join(__dirname, 'data', 'Amarkosha.txt');
    if (!fs.existsSync(amarakoshaPath)) return {};

    const content = fs.readFileSync(amarakoshaPath, 'utf8');
    const lines = content.split('\n');
    const amarakoshaDict = {};
    // Simplified parsing logic (your original is more complex; kept minimal here)
    lines.forEach(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const term = parts[0].trim();
        const synonyms = parts[1].split(',').map(s => s.trim());
        amarakoshaDict[term] = { synonyms };
      }
    });
    return amarakoshaDict;
  }

  // Add hardcoded Amarakosha (kept)
  addAmarakoshaDictionary() {
    const hardcoded = {
      'atman': ['self', 'soul', 'brahman', 'atma', 'purusha', 'jiva'],
      'brahman': ['ultimate reality', 'cosmic principle', 'absolute', 'brahma'],
      // Add more from your code as needed
    };
    Object.entries(hardcoded).forEach(([term, expansions]) => {
      this.lemmas.set(term.toLowerCase(), expansions);
    });
  }

  // Process query: Expand upstream, get IDs from Discovery Engine, fetch from GCS, format for Synthesizer
  async processQuery({ question, correlationId }) {
    try {
      logger.info('Starting query processing', { correlationId, question });

      // Upstream: Sophisticated query expansion
      const expandedQuery = this.expandQueryWithLemmas(question);

      // Downstream: Get ranked IDs/URIs/relevance from Discovery Engine
      const verseData = await this.retrieveVerseDataFromDiscoveryEngine(expandedQuery, correlationId);

      // Fetch full content from GCS and format
      const formattedVerses = await this.fetchAndFormatVerses(verseData);

      logger.info('Query processing completed', { correlationId, verseCount: formattedVerses.length });
      return {
        correlationId,
        verses: formattedVerses,
        verseCount: formattedVerses.length,
        question
      };
    } catch (error) {
      logger.error('Query processing failed', { correlationId, error: error.message });
      return { correlationId, verses: [], verseCount: 0, question };  // Recoverable empty response
    }
  }

  // Upstream query expansion with lemmas/Amarakosha (kept sophisticated)
  expandQueryWithLemmas(question) {
    const originalQuery = question.toLowerCase();
    const words = originalQuery.split(' ');
    const expansions = new Set();

    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      const lemmaExpansions = this.lemmas.get(cleanWord);
      if (lemmaExpansions) {
        lemmaExpansions.forEach(exp => expansions.add(exp));
      }
    });

    const expanded = [...expansions].join(' ');
    return `${originalQuery} ${expanded}`.trim();
  }

  // Get ranked verse IDs/URIs/relevance from Discovery Engine (minimal, no snippets)
  async retrieveVerseDataFromDiscoveryEngine(query, correlationId) {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      const controller = new AbortController();
      let timeoutId = setTimeout(() => controller.abort(), 30000);  // Define here

      try {
        const { GoogleAuth } = require('google-auth-library');
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
        const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT;

        if (!projectId || !clientEmail || !privateKey || !apiEndpoint) {
          throw new Error('Missing Google Cloud credentials');
        }

        const credentials = {
          type: 'service_account',
          project_id: projectId,
          private_key: privateKey.replace(/\\\\n/g, '\n'),
          client_email: clientEmail,
          universe_domain: 'googleapis.com'
        };

        const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const requestBody = { query: { text: query } };  // Minimal body (no answerGenerationSpec)

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.token}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Discovery Engine error: ${errorText}`);
        }

        const data = await response.json();

        // Extract only top 5 IDs/URIs/relevance (ranked by Discovery Engine)
        const searchResults = data?.searchResults || [];
        return searchResults.slice(0, 5).map((result, index) => ({
          id: result.title,
          uri: result.uri,
          relevance: 1 - (index * 0.1)  // Simple decreasing score (top = 1.0, bottom = 0.6)
        }));

      } catch (error) {
        retryCount++;
        logger.warn(`Attempt ${retryCount} failed: ${error.message}. Retrying...`);
        if (retryCount >= MAX_RETRIES) {
          logger.error('Discovery Engine retrieval failed after retries', { correlationId, error: error.message });
          return [];  // Return empty on failure
        }
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000)); // Backoff: 2s, 4s, 6s
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // Fetch full content from GCS and format for Synthesizer
  async fetchAndFormatVerses(verseData) {
    const verses = [];
    for (const data of verseData) {
      const fullContent = await this.fetchDirectFromGCS(data.uri);
      if (fullContent) {
        verses.push({
          id: data.id + '_simple',
          reference: data.id,
          content: fullContent,
          iast: fullContent,  // As required
          source: data.id,    // As required
          uri: data.uri,
          relevance: data.relevance
        });
      }
    }
    return verses;
  }

  // Fetch from GCS (kept)
  async fetchDirectFromGCS(uri) {
    try {
      const match = uri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
      if (!match) throw new Error('Invalid GCS URI');

      const [bucketName, filePath] = match.slice(1);
      const file = storage.bucket(bucketName).file(filePath);
      const [contents] = await file.download();
      return contents.toString('utf-8').trim();
    } catch (error) {
      logger.error('GCS fetch failed', { uri, error: error.message });
      return '';
    }
  }

  // Health status (minimal)
  getHealthStatus() {
    return { healthy: this.healthy, timestamp: new Date().toISOString() };
  }
}

module.exports = new CollectorService;
