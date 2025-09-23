require('dotenv').config({ path: '../../.env.local' });

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const logger = require('./logger');
const { CollectorError } = require('./errors');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

class CollectorService {
  constructor() {
    this.lemmas = new Map();
    this.amarakoshaDict = new Map();
  }

  async _initialize() {
    try {
      await this.loadLemmasFromMetadata();
      const amarakoshaDict = await this.parseAmarakoshaFile();
      Object.entries(amarakoshaDict).forEach(([term, data]) => {
        if (data && data.synonyms && data.synonyms.length > 0) {
          this.lemmas.set(term.toLowerCase(), data.synonyms);
          this.amarakoshaDict.set(term.toLowerCase(), data);
        }
      });
      logger.info(`Initialization complete: Loaded ${this.lemmas.size} lemmas from Amarakosha.`);
    } catch (error) {
      logger.error('FATAL: Failed to initialize CollectorService:', error);
      process.exit(1);
    }
  }

  static async create() {
    const service = new CollectorService();
    await service._initialize();
    return service;
  }

  enhanceQueryWithAmarakosha(originalQuery) {
    try {
      let enhancedQuery = originalQuery;
      let filter = null; // Filter is null as we do it client-side

      const words = originalQuery.toLowerCase().split(/\s+/);
      const synonyms = new Set();
      for (const word of words) {
        if (this.lemmas.has(word)) {
          const wordSynonyms = this.lemmas.get(word);
          wordSynonyms.slice(0, 3).forEach(synonym => {
            if (synonym && synonym.length > 2) {
              synonyms.add(synonym);
            }
          });
        }
      }
      if (synonyms.size > 0) {
        enhancedQuery += ' ' + Array.from(synonyms).join(' ');
      }
      if (originalQuery.length > 5) {
        enhancedQuery += ' characters themes places context sections';
      }
      logger.info(`Query enhanced: "${originalQuery}" -> "${enhancedQuery}"`);
      return { enhancedQuery, filter };
    } catch (error) {
      logger.warn('Query enhancement failed, using original query:', error);
      return { enhancedQuery: originalQuery, filter: null };
    }
  }

  async collect(question, sessionId) {
    let timeoutId;
    try {
      logger.info(`Starting collection for session: ${sessionId}`);
      timeoutId = setTimeout(() => { throw new CollectorError('Collection timeout exceeded', 408); }, 30000);

      const { enhancedQuery } = this.enhanceQueryWithAmarakosha(question);
      const discoveryResponse = await this.queryVertexAI(enhancedQuery, null, sessionId);
      let candidates = discoveryResponse.results || [];

      const lowerCaseQuery = question.toLowerCase();
      let scriptureToFilterBy = null;
      if (lowerCaseQuery.includes('rg veda')) scriptureToFilterBy = 'Rg_Veda';
      else if (lowerCaseQuery.includes('aitareya upanishad')) scriptureToFilterBy = 'Aitareya_Upanishad';

      if (scriptureToFilterBy) {
        logger.info(`Client-side filtering for scripture: ${scriptureToFilterBy}`);
        candidates = candidates.filter(result =>
          result.document?.derivedStructData?.title?.includes(scriptureToFilterBy)
        );
      }

      const top5Results = candidates.slice(0, 5);
      logger.info(`Selected top ${top5Results.length} verses for the specified scripture.`);

      const verses = await this.fetchAndFormatVerses(top5Results, sessionId);
      const formattedResponse = this.formatCollectionResponse(verses, enhancedQuery, sessionId);
      
      logger.info(`Collection completed successfully for session: ${sessionId}`);
      return formattedResponse;

    } catch (error) {
      logger.error(`Collection failed for session ${sessionId}:`, error);
      throw new CollectorError(`Collection failed: ${error.message}`, 500, error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async queryVertexAI(enhancedQuery, filter, sessionId) {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      try {
        logger.info(`Querying Vertex AI with enhanced query for session: ${sessionId}`);
        const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT;
        const { GoogleAuth } = require('google-auth-library');
        const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const requestBody = { query: enhancedQuery, pageSize: 20 };
        if (filter) requestBody.filter = filter;
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken.token}` },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(`API error ${response.status} - ${JSON.stringify(responseData)}`);
        
        logger.info(`Vertex AI returned response for session: ${sessionId}`);
        return responseData;
      } catch (error) {
        retryCount++;
        logger.warn(`Attempt ${retryCount} failed: ${error.message}. Retrying in ${retryCount * 2}s...`);
        if (retryCount >= MAX_RETRIES) throw new CollectorError(`Vertex AI query failed: ${error.message}`, 500, error);
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      }
    }
  }

  async fetchAndFormatVerses(results, sessionId) {
    try {
      logger.info(`Fetching ${results.length} verses from GCS for session: ${sessionId}`);
      if (!results || results.length === 0) return [];

      const bucketName = process.env.GCS_BUCKET_NAME;
      const versePromises = results.map(async (result) => {
        const link = result.document?.derivedStructData?.link;
        if (!link) {
          logger.warn(`No GCS link found for document ID: ${result.document?.id}`);
          return null;
        }

        try {
          const filePath = link.replace(`gs://${bucketName}/`, '');
          const file = storage.bucket(bucketName).file(filePath);
          const [exists] = await file.exists();
          if (!exists) {
            logger.warn(`Verse file not found in GCS: ${filePath}`);
            return null;
          }

          const [content] = await file.download();
          const verseText = content.toString('utf-8');
          return {
            verseId: result.document.derivedStructData.title,
            content: this.parseVerseContent(verseText),
            source: filePath,
          };
        } catch (error) {
          logger.warn(`Failed to fetch verse from link ${link}:`, error.message);
          return null;
        }
      });

      const verses = (await Promise.all(versePromises)).filter(v => v !== null);
      logger.info(`Successfully fetched ${verses.length} verses from GCS for session: ${sessionId}`);
      return verses;
    } catch (error) {
      logger.error(`Failed to fetch verses from GCS for session ${sessionId}:`, error);
      throw new CollectorError(`GCS fetch failed: ${error.message}`, 500, error);
    }
  }

  parseVerseContent(verseText) {
    const lines = verseText.trim().split('\n');
    const verse = { sanskrit: '', transliteration: '', translation: '' };
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Sanskrit Transliteration:')) verse.transliteration = trimmedLine.replace('Sanskrit Transliteration:', '').trim();
      else if (trimmedLine.startsWith('English Translation:')) verse.translation = trimmedLine.replace('English Translation:', '').trim();
      else if (trimmedLine && !trimmedLine.includes(':') && !verse.sanskrit) verse.sanskrit = trimmedLine;
    }
    return verse;
  }

  formatCollectionResponse(verses, enhancedQuery, sessionId) {
    const response = {
      sessionId,
      query: {
        original: enhancedQuery.split(' characters themes places context sections')[0].trim(),
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
    response.results.verses.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return response;
  }

  calculateRelevanceScore(verse, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const verseText = `${verse.content.sanskrit} ${verse.content.transliteration} ${verse.content.translation}`.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (word.length > 2 && verseText.includes(word)) score += 1;
    }
    return score / queryWords.length;
  }

  async processQuery({ question, correlationId }) {
    return await this.collect(question, correlationId);
  }

  getHealthStatus() {
    return { status: 'healthy', lemmasLoaded: this.lemmas.size, timestamp: new Date().toISOString() };
  }

  async loadLemmasFromMetadata() {
    // This is legacy, kept for compatibility if old files exist.
    // The main loading happens from Amarakosha.xml.
  }

  async parseAmarakoshaFile() {
    try {
      const amarakoshaPath = path.join(__dirname, 'data/Amarkosha.xml');
      if (!fs.existsSync(amarakoshaPath)) {
        logger.warn('Amarakosha.xml file was not found in the data directory.');
        return {};
      }
      const xmlData = fs.readFileSync(amarakoshaPath, 'utf8');
      const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
      const jsonObj = parser.parse(xmlData);
      const amarakoshaDict = {};
      const divs = jsonObj.TEI?.text?.body?.div;
      if (!divs) throw new Error("Could not find the 'div' structure inside the XML body.");
      
      const paragraphs = [];
      const collectParagraphs = (node) => {
        if (node.p) paragraphs.push(...(Array.isArray(node.p) ? node.p : [node.p]));
        if (node.div) (Array.isArray(node.div) ? node.div : [node.div]).forEach(collectParagraphs);
      };
      collectParagraphs({ div: divs });

      for (const p of paragraphs) {
        if (typeof p === 'string' && p.includes(' ')) {
          const synonyms = p.split(/\s+/).map(s => s.toLowerCase());
          if (synonyms.length > 1) {
            for (const word of synonyms) {
              if (word.length > 1) {
                if (!amarakoshaDict[word]) amarakoshaDict[word] = { synonyms: [] };
                const otherSynonyms = synonyms.filter(s => s !== word);
                for (const syn of otherSynonyms) {
                  if (!amarakoshaDict[word].synonyms.includes(syn)) {
                    amarakoshaDict[word].synonyms.push(syn);
                  }
                }
              }
            }
          }
        }
      }
      const entryCount = Object.keys(amarakoshaDict).length;
      if (entryCount > 0) logger.info(`SUCCESS: Loaded Amarakosha dictionary with ${entryCount} unique lemma entries from XML.`);
      else logger.warn('Amarakosha XML was parsed, but 0 synonym entries were extracted.');
      return amarakoshaDict;
    } catch (error) {
      logger.error('CRITICAL: Failed to parse Amarakosha.xml file.', error);
      return {};
    }
  }
}

module.exports = { CollectorService };