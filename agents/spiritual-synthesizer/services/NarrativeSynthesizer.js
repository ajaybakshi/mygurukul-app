const logger = require('../logger');
const { NarrativeGenerationError, VerseProcessingError } = require('../errors');

// Import new prompt configuration system
const promptsModule = require('../config/prompts/index.js');
const {
  getCompleteSynthesizerConfig,
  getSynthesizerSystemPrompt,
  getNarrativeTemplate,
  composeCustomTemplate,
  getResponseSection
} = promptsModule;

// Helper function to extract scripture names from verses
function extractScriptureNames(verses) {
  if (!verses || verses.length === 0) return 'the sacred texts';

  const sources = verses.map(verse => {
    const ref = verse.reference || verse.source || '';
    // Extract main scripture name (remove chapter/verse numbers and underscores)
    const mainSource = ref.split(/[\d.-:]/)[0].trim();
    return mainSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }).filter(name => name.length > 0);

  const uniqueSources = [...new Set(sources)];
  return uniqueSources.length > 0 ? uniqueSources.join(', ') : 'the sacred texts';
}

// --- Minimal helpers for one-shot synthesis ---

function selectTopVerses(collectorPayload, k = 4) {
  const verses = Array.isArray(collectorPayload?.verseData?.results?.verses) ? collectorPayload.verseData.results.verses : [];
  const valid = verses
    .filter(v => v && v.content && v.source)
    .map((v, idx) => ({
      id: v.id || `v${idx + 1}`,
      iast: String(v.content || '').trim(),
      english: '',
      source: v.source,
      score: typeof v.relevanceScore === 'number' ? v.relevanceScore : 0
    }));
  const sorted = valid.sort((a, b) => b.score - a.score);
  return sorted.slice(0, k);
}

function extractOriginalVerses(collectorPayload) {
  const verses = Array.isArray(collectorPayload?.verseData?.results?.verses) ? collectorPayload.verseData.results.verses : [];
  return verses
    .filter(v => v && v.content)
    .map(v => ({
      id: v.id || 'unknown',
      content: {
        sanskrit: String(v.content || '').trim(),
        transliteration: String(v.content || '').trim(),
        translation: ''
      }
    }));
}

function hasPlaceholders(text) {
  if (!text) return true;
  const bad = [
    'Translation failed',
    'spiritual_wisdom',
    '[Translation failed',
    'Relevance: 50%',
    'Relevance: 49%',
  ];
  return bad.some(s => text.includes(s));
}

function buildOneShotPayload(query, topVerses) {
  return {
    query,
    verses: topVerses.map(v => ({
      id: v.id,
      iast: String(v.iast || '').trim(),
      english: String(v.english || '').trim(),
      source: v.source,
      score: v.score,
    })),
  };
}

async function generateOneShotNarrative({ query, collectorPayload, llm }) {
  const topVerses = selectTopVerses(collectorPayload, 4);
  const originalVerses = extractOriginalVerses(collectorPayload);

  if (topVerses.length === 0) {
    return {
      narrative_guidance: `A humble note: not enough verse data was available to generate a full synthesis at this time. Please try refining the question or retrying shortly.`,
      original_verses: originalVerses
    };
  }

  const payload = buildOneShotPayload(query, topVerses);

  const system = `
I am the Spiritual Synthesizer. I will use ONLY the provided verses.
I will do four things in order: empathic opening, per-verse analysis, true synthesis, and reflective prompts.
Rules:
- Do not echo user words.
- Exactly one faithful translation per verse; if uncertain, provide a brief contextual gloss (no "translation failed").
- If an English translation is provided, use it. If it is missing or empty, generate a new faithful translation from the provided IAST (Sanskrit) text.
- Do not invent verses or sources; reference verse IDs in synthesis.
- Avoid percentages; do not show "Relevance:" text.
- Keep sections concise, insightful, and non-repetitive.
  `.trim();

  const user = { role: 'user', content: JSON.stringify(payload, null, 2) };

  const assistantInstruction = `
Return a cohesive narrative in exactly three paragraphs, separated by double newlines (\n\n). Do not use any Markdown formatting, bullet points, emoji prefixes, or section headings.

When referencing a verse for the first time in the narrative, use this EXACT inline format:
{Verse [Source]: [IAST_Sanskrit] - [One_sentence_English_translation]}

For example:
{Verse Bhagavad Gita 2.47: karmaṇy evādhikāras te mā phaleṣu kadācana - You have the right to perform action, but never to the fruits of that action}

This format should be embedded naturally within the narrative flow, not as separate sections or bullet points.

Paragraph 1 (Introduction): Write a warm, introductory paragraph that compassionately attunes to the seeker's intent without repeating their words, drawing from the compassionate opening style.

Paragraph 2 (Verse Analysis): Weave the verse analysis into a flowing narrative. For each verse, present it using the inline verse format and explain its relevance and interpretive meaning, creating a seamless narrative flow that connects the verses thematically.

Paragraph 3 (Synthesis & Contemplation): Combine key insights from the true synthesis with reflective questions from contemplative inquiry into a single, concluding paragraph that offers both wisdom integration and gentle guidance for further reflection.
`.trim();

  const prompt = [
    { role: 'system', content: system },
    user,
    { role: 'assistant', content: assistantInstruction },
    { role: 'user', content: 'Please generate the wisdom synthesis now.' }
  ];

  const result = await llm.chat(prompt);

  let narrativeContent = result.content;

  // Inject verses into the narrative
  if (result.content && !hasPlaceholders(result.content)) {
    originalVerses.forEach(verse => {
      const placeholder = `[VERSE:${verse.id}]`;
      const replacement = `[${verse.content.transliteration} - ${verse.id}]`;
      narrativeContent = narrativeContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    // Add concluding sentence
    narrativeContent += '\n\nI invite you to explore these verses further to deepen your understanding.';
  }

  if (!narrativeContent || hasPlaceholders(narrativeContent)) {
    const stricter = [
      { role: 'system', content: system + '\nABSOLUTE: Do not emit placeholders. Provide a brief contextual gloss if exact translation is uncertain.' },
      user,
      { role: 'assistant', content: assistantInstruction },
      { role: 'user', content: 'Please generate the wisdom synthesis now without placeholders.' }
    ];
    const retry = await llm.chat(stricter);

    let retryNarrativeContent = retry.content;

    // Inject verses into retry narrative
    if (retry.content && !hasPlaceholders(retry.content)) {
      originalVerses.forEach(verse => {
        const placeholder = `[VERSE:${verse.id}]`;
        const replacement = `[${verse.content.transliteration} - ${verse.id}]`;
        retryNarrativeContent = retryNarrativeContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      });

      // Add concluding sentence
      retryNarrativeContent += '\n\nI invite you to explore these verses further to deepen your understanding.';
    }

    if (!retryNarrativeContent || hasPlaceholders(retryNarrativeContent)) {
      return {
        narrative_guidance: `I offer a humble, concise response while verse analysis is limited. I invite you to reflect on the theme within the question, emphasizing sincerity and steady practice. Sit quietly for two minutes, reflect on one word from the verses that feels alive today, and consider what small action could honor this insight before sunset.`,
        original_verses: originalVerses
      };
    }
    return { narrative_guidance: retryNarrativeContent, original_verses: originalVerses };
  }

  return { narrative_guidance: narrativeContent, original_verses: originalVerses };
}

async function generateSanskritAnchoredNarrative({ query, collectorPayload, llm }) {
  const correlationId = `standalone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info('[TRACE] Entering standalone generateSanskritAnchoredNarrative', { query: query?.substring(0, 50), correlationId });

    // Extract top verses from collector payload
    const topVerses = selectTopVerses(collectorPayload, 4);
    if (topVerses.length === 0) {
      return {
        narrative_guidance: `A humble note: not enough verse data was available to generate a full synthesis at this time. Please try refining the question or retrying shortly.`,
        original_verses: []
      };
    }

    // Extract scripture names dynamically
    const scriptureNames = extractScriptureNames(topVerses);

    // Build prompt with verses and question
    const versesText = topVerses.map((verse, idx) =>
      `Verse ${idx + 1}: ${verse.sanskrit} (Source: ${verse.reference})`
    ).join('\n\n');

    const prompt = [
      {
        role: 'system',
        content: `I am your spiritual guide. I will share the verses I have found from the sacred scriptures that have deep relevance to your question. Generate a compassionate, insightful response that synthesizes ancient wisdom with modern understanding. Use the provided Sanskrit verses to answer the user's spiritual question with depth and authenticity.`
      },
      {
        role: 'user',
        content: `Question: ${query}

Sanskrit Verses:
${versesText}

Instructions:

Structure your response as follows:
1. First paragraph: Begin with "The verses I have found from ${scriptureNames} have deep relevance to your question." Then provide a warm, contextual introduction to the topic without repeating the user's words.
2. Second paragraph: Present each verse with complete IAST and translation, explaining their relevance.
3. Third paragraph: Synthesize the insights and provide contemplative guidance.

Always provide the complete IAST Sanskrit text for each verse, never truncate with '...'

Always provide full, complete English translations, not brief summaries

When mentioning each verse for the first time, use this exact format: {Verse [Source]: [Complete_IAST] - [Complete_Translation]}

Use first-person language throughout ("I have found", "I observe", etc.)

Embed the verse format naturally within the narrative flow

Write in a warm, accessible tone for sincere spiritual seekers.`
      }
    ];

    // Get LLM-generated narrative
    const result = await llm.chat(prompt);
    const narrative = result.content || 'The ancient wisdom guides us toward deeper understanding.';

    logger.info('[TRACE] Exiting standalone generateSanskritAnchoredNarrative', { verseCount: topVerses.length, correlationId });

    return {
      narrative_guidance: narrative,
      original_verses: extractOriginalVerses(collectorPayload)
    };

  } catch (error) {
    logger.error('Standalone generateSanskritAnchoredNarrative failed', {
      correlationId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Narrative Synthesizer Service
 * Transforms raw verse data from Sanskrit Collector into conversational wisdom narratives
 */
class NarrativeSynthesizer {
  constructor() {
    this.healthy = true;
    this.lastHealthCheck = new Date();
    this.sankalpaPrinciples = {
      humility: 'Present wisdom with gentle authority, acknowledging the vastness of tradition',
      compassion: 'Frame teachings to support seekers on their journey',
      truthfulness: 'Always cite sources transparently and accurately',
      nonHarm: 'Guide without judgment or exclusion'
    };

    // Initialize prompt system
    this.initializePromptSystem();
  }

  /**
   * Process collector data and generate wisdom narrative
   * @param {Object} verseData - Structured verse data from Sanskrit Collector
   * @param {string} question - User's question
   * @param {Object} context - Conversation context and preferences
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Synthesized wisdom narrative
   */
  async synthesizeWisdom(verseData, question, context, correlationId) {
    try {
      logger.info('Starting wisdom synthesis', {
        correlationId,
        verseCount: verseData.clusters?.reduce((sum, cluster) => sum + cluster.verses.length, 0) || 0,
        clusterCount: verseData.clusters?.length || 0
      });

      // Step 1: Process and validate verse data
      const processedVerses = await this.processCollectorData(verseData, question, correlationId);

      // Step 2: Validate scriptural grounding
      await this.validateScripturalGrounding(processedVerses, correlationId);
      
      logger.info('[TRACE] LLM input verses', { verseCount: processedVerses.length, correlationId });

      // Step 3: Build narrative structure
      const narrativeStructure = await this.buildNarrativeStructure(processedVerses, context, correlationId);

      // Step 4: Generate conversational response
      const wisdomNarrative = await this.weaveWisdomNarrative(narrativeStructure, question, context, correlationId);

      // Step 5: Embed source citations naturally
      const citedNarrative = await this.embedSourceCitations(wisdomNarrative, processedVerses, correlationId);

      logger.info('Wisdom synthesis completed successfully', {
        correlationId,
        narrativeLength: citedNarrative.narrative?.length || 0,
        verseCount: processedVerses.length
      });

      return citedNarrative;

    } catch (error) {
      logger.error('Wisdom synthesis failed', {
        correlationId,
        error: error.message,
        stack: error.stack
      });
      throw new NarrativeGenerationError('Failed to synthesize wisdom narrative', error);
    }
  }

  /**
   * Process structured verse data from collector
   * @param {Object} verseData - Raw verse data from collector
   * @param {string} question - User's question for relevance calculation
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Array>} Processed verses with enhanced metadata
   */
  async processCollectorData(verseData, question, correlationId) {
    console.log('[STARTUP-DEBUG] processCollectorData called with clusters:', verseData?.clusters);
    try {
      logger.info('Processing collector verse data', { correlationId });

      // Flat verses fallback (no clusters, no translations; relevance from list order)
      console.log('[DEBUG] Cluster check:', { 
        clusters: verseData?.clusters, 
        isArray: Array.isArray(verseData?.clusters),
        length: verseData?.clusters?.length
      });
      const noClusters = !verseData?.clusters || !Array.isArray(verseData.clusters) || verseData.clusters.length === 0;
      if (noClusters) {
        console.log('[FLAT-DEBUG] Input verses:', verseData?.results?.verses?.length || 0);
        const flat = Array.isArray(verseData?.results?.verses) ? verseData.results.verses : [];
        console.log('[FLAT-DEBUG] Extracted flat verses:', flat.length);

        const processedVerses = flat.map((v, idx) => {
          const iast = String(v?.content || '').trim();
          const reference = String(v?.source || '').trim();
          // Derive relevance strictly from order: first is highest
          const derivedRelevance = (flat.length > 0) ? (flat.length - idx) / flat.length : 0;

          return {
            id: v?.id || `v${idx + 1}`,
            // Sanskrit only; translation must be produced by LLM later
            sanskrit: iast,
            translation: '', // intentionally blank
            reference,       // preserve for transparency
            relevance: derivedRelevance,
            clusterTheme: 'general',
            processingMetadata: {
              narrativeRelevance: derivedRelevance,
              processedAt: new Date().toISOString(),
              sourceCluster: 'general',
              origin: 'flat-fallback'
            },
            citationStyle: (typeof this?.determineCitationStyle === 'function')
              ? this.determineCitationStyle({ reference })
              : 'inline'
          };
        });

        // Sort high to low
        processedVerses.sort((a, b) => {
          const ar = (typeof a.processingMetadata?.narrativeRelevance === 'number') ? a.processingMetadata.narrativeRelevance : (a.relevance || 0);
          const br = (typeof b.processingMetadata?.narrativeRelevance === 'number') ? b.processingMetadata.narrativeRelevance : (b.relevance || 0);
          return br - ar;
        });

        console.log('[FLAT-DEBUG] Processed verses count:', processedVerses.length);
        console.log('[FLAT-DEBUG] First processed verse:', processedVerses[0]);
        logger.info('[TRACE] processCollectorData output', { verseCount: processedVerses.length, correlationId });
        return processedVerses;
      }

      if (!verseData.clusters || !Array.isArray(verseData.clusters)) {
        logger.warn('Missing clusters array, creating empty array', { correlationId });
        verseData.clusters = [];
      }

      const processedVerses = [];

      // Flatten verses from clusters and enhance with processing metadata
      for (const cluster of verseData.clusters) {
        if (!cluster.verses || !Array.isArray(cluster.verses)) {
          logger.warn('Skipping cluster with invalid verses structure', {
            correlationId,
            clusterTheme: cluster.theme
          });
          continue;
        }

        for (const verse of cluster.verses) {
          const processedVerse = {
            ...verse,
            clusterTheme: cluster.theme,
            clusterRelevance: cluster.relevance,
            processingMetadata: {
              processedAt: new Date().toISOString(),
              sourceCluster: cluster.theme,
              narrativeRelevance: this.calculateNarrativeRelevance(verse, question),
              citationStyle: this.determineCitationStyle(verse)
            }
          };

          processedVerses.push(processedVerse);
        }
      }

      // Sort by narrative relevance
      processedVerses.sort((a, b) => b.processingMetadata.narrativeRelevance - a.processingMetadata.narrativeRelevance);

      logger.info('Verse data processing completed', {
        correlationId,
        processedCount: processedVerses.length
      });

      logger.info('[TRACE] processCollectorData output', { verseCount: processedVerses.length, correlationId });
      return processedVerses;

    } catch (error) {
      logger.error('Verse data processing failed', {
        correlationId,
        error: error.message
      });
      throw new VerseProcessingError('Failed to process collector verse data', error);
    }
  }

  /**
   * Validate scriptural grounding of verses
   * @param {Array} verses - Processed verses
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<boolean>} Validation result
   */
  async validateScripturalGrounding(verses, correlationId) {
    try {
      logger.info('Validating scriptural grounding', {
        correlationId,
        verseCount: verses.length
      });

      const hasSanskrit = Array.isArray(verses) && verses.some(v => typeof v?.sanskrit === 'string' && v.sanskrit.trim().length > 0);
      const hasAnyReference = Array.isArray(verses) && verses.some(v => typeof v?.reference === 'string' && v.reference.trim().length > 0);

      const avgRelevance = (Array.isArray(verses) && verses.length > 0)
        ? verses.reduce((acc, v) => {
            const r = (typeof v?.relevance === 'number') ? v.relevance
              : (typeof v?.processingMetadata?.narrativeRelevance === 'number') ? v.processingMetadata.narrativeRelevance
              : 0;
            return acc + r;
          }, 0) / verses.length
        : 0;

      // Do not fail on missing or non-canonical reference format; warn only
      if (!hasAnyReference) {
        logger.warn('[validate] No references detected; continuing with caution', { correlationId });
      }
      if (!hasSanskrit) {
        throw new VerseProcessingError('No Sanskrit content found after normalization', { correlationId });
      }

      // Since relevance is derived from order, use permissive threshold
      const minAvg = 0.2;
      if (avgRelevance < minAvg) {
        logger.warn('[validate] Low average relevance; proceeding due to flat fallback mode', { correlationId, avgRelevance });
      }

      const result = {
        ok: true,
        diagnostics: { hasSanskrit, hasAnyReference, avgRelevance }
      };
      
      logger.info('[TRACE] validateScripturalGrounding result', { ok: result.ok, diagnostics: result.diagnostics, correlationId });
      return result;

    } catch (error) {
      logger.error('Scriptural grounding validation failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build narrative structure from verse themes
   * @param {Array} verses - Processed verses
   * @param {Object} context - User context and preferences
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Narrative structure
   */
  async buildNarrativeStructure(verses, context, correlationId) {
    try {
      logger.info('[TRACE] Entering buildNarrativeStructure', { inputVerseCount: verses.length, correlationId });
      
      logger.info('Building narrative structure', {
        correlationId,
        verseCount: verses.length
      });

      // Group verses by thematic clusters
      const thematicGroups = this.groupVersesByTheme(verses);

      // Identify primary and supporting themes
      const primaryTheme = this.identifyPrimaryTheme(thematicGroups);
      const supportingThemes = this.identifySupportingThemes(thematicGroups, primaryTheme);

      // Create narrative arc
      const narrativeArc = {
        introduction: this.buildIntroduction(primaryTheme, context),
        development: this.buildDevelopment(primaryTheme, supportingThemes, verses),
        culmination: this.buildCulmination(primaryTheme, verses),
        conclusion: this.buildConclusion(primaryTheme, context),
        practicalGuidance: this.extractPracticalGuidance(verses),
        followUpSuggestions: this.generateFollowUpSuggestions(primaryTheme, context)
      };

      const structure = {
        primaryTheme,
        supportingThemes,
        thematicGroups,
        narrativeArc,
        metadata: {
          totalVerses: verses.length,
          themeCount: Object.keys(thematicGroups).length,
          structureBuiltAt: new Date().toISOString()
        }
      };

      logger.info('Narrative structure built successfully', {
        correlationId,
        primaryTheme: primaryTheme.name,
        supportingThemeCount: supportingThemes.length
      });

      logger.info('[TRACE] Exiting buildNarrativeStructure', { outputVerseCount: structure?.verses?.length || 0, correlationId });
      return structure;

    } catch (error) {
      logger.error('Narrative structure building failed', {
        correlationId,
        error: error.message
      });
      throw new NarrativeGenerationError('Failed to build narrative structure', error);
    }
  }

  /**
   * Generate flowing conversational response
   * @param {Object} structure - Narrative structure
   * @param {string} question - User's question
   * @param {Object} context - User context and preferences
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Wisdom narrative
   */
  async weaveWisdomNarrative(structure, question, context, correlationId) {
    try {
      logger.info('Weaving wisdom narrative', { correlationId });

      const preferences = context.preferences || {};
      const tone = preferences.tone || 'conversational';
      const style = preferences.narrativeStyle || 'sanskrit-anchored'; // Default to new structure

      // Generate narrative based on style
      let narrative;

      switch (style) {
        case 'storytelling':
          narrative = this.generateStorytellingNarrative(structure, question);
          break;
        case 'dialogue':
          narrative = this.generateDialogueNarrative(structure, question);
          break;
        case 'teaching':
          narrative = this.generateTeachingNarrative(structure, question);
          break;
        case 'sanskrit-anchored':
        default:
          narrative = await this.generateSanskritAnchoredNarrative(structure, question, context, correlationId);
          break;
      }

      // Apply tone adjustments
      const tonedNarrative = this.applyToneAdjustments(narrative, tone);

      const wisdomNarrative = {
        narrative: tonedNarrative,
        structure: structure,
        metadata: {
          tone,
          style,
          generatedAt: new Date().toISOString(),
          wordCount: tonedNarrative.split(' ').length,
          questionAddressed: question,
          promptSystem: {
            version: this.promptConfig.version,
            templateUsed: style,
            sanskritAnchored: style === 'sanskrit-anchored'
          }
        }
      };

      logger.info('Wisdom narrative weaving completed', {
        correlationId,
        wordCount: wisdomNarrative.metadata.wordCount,
        tone,
        style,
        promptVersion: this.promptConfig.version
      });

      return wisdomNarrative;

    } catch (error) {
      logger.error('Wisdom narrative weaving failed', {
        correlationId,
        error: error.message
      });
      throw new NarrativeGenerationError('Failed to weave wisdom narrative', error);
    }
  }

  /**
   * Embed source citations naturally in narrative
   * @param {Object} wisdomNarrative - Generated narrative
   * @param {Array} verses - Source verses
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Cited narrative with sources
   */
  async embedSourceCitations(wisdomNarrative, verses, correlationId) {
    try {
      logger.info('Embedding source citations', {
        correlationId,
        verseCount: verses.length
      });

      const narrative = wisdomNarrative.narrative;
      const citations = [];

      // Extract key verses for citation
      const keyVerses = verses
        .filter(verse => verse.processingMetadata.narrativeRelevance > 0.7)
        .slice(0, 3); // Limit to top 3 most relevant

      // Generate natural citation language
      const citationTemplates = [
        "As the {source} teaches us in {reference}",
        "The {source} beautifully expresses this in {reference}",
        "In the wisdom of the {source}, {reference}, we find",
        "The ancient {source} reveals in {reference}",
        "Drawing from the {source} at {reference}"
      ];

      for (const verse of keyVerses) {
        const citationStyle = verse.processingMetadata.citationStyle;
        const template = citationTemplates[Math.floor(Math.random() * citationTemplates.length)];

        const source = this.extractSourceName(verse.reference);
        const citation = {
          verse: verse,
          naturalLanguage: template
            .replace('{source}', source)
            .replace('{reference}', verse.reference),
          placement: this.determineCitationPlacement(verse, narrative),
          context: verse.clusterTheme
        };

        citations.push(citation);
      }

      const citedNarrative = {
        ...wisdomNarrative,
        citations,
        sources: verses.map(verse => ({
          reference: verse.reference,
          theme: verse.clusterTheme,
          relevance: verse.relevance
        }))
      };

      logger.info('Source citations embedded successfully', {
        correlationId,
        citationCount: citations.length
      });

      return citedNarrative;

    } catch (error) {
      logger.error('Source citation embedding failed', {
        correlationId,
        error: error.message
      });
      throw new NarrativeGenerationError('Failed to embed source citations', error);
    }
  }

  /**
   * Initialize prompt system
   * @private
   */
  async initializePromptSystem() {
    try {
      // Load the prompt modules (already loaded at startup in index.js)
      // await promptsModule.loadModules(); // Already loaded at startup

      // Get configuration
      this.promptConfig = promptsModule.getCompleteSynthesizerConfig();

      logger.info('Synthesizer prompt system initialized', {
        version: this.promptConfig.version,
        templates: Object.keys(this.promptConfig.templates).length,
        sanskritConcepts: Object.keys(this.promptConfig.sanskrit.coreConcepts).length
      });
    } catch (error) {
      logger.error('Failed to initialize prompt system', { error: error.message });
      throw error;
    }
  }

  /**
   * Get health status of the synthesizer service
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      this.lastHealthCheck = new Date();

      return {
        healthy: this.healthy,
        timestamp: this.lastHealthCheck.toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        sankalpaPrinciples: this.sankalpaPrinciples,
        promptSystem: {
          version: this.promptConfig?.version || 'unknown',
          initialized: !!this.promptConfig,
          availableStyles: this.getAvailableNarrativeStyles(),
          sanskritAnchored: true
        }
      };

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available narrative styles
   * @returns {Array} Available narrative style options
   */
  getAvailableNarrativeStyles() {
    return [
      'sanskrit-anchored', // New default: Empathic + Discovery + Analysis + Synthesis + Inquiry
      'teaching',          // Traditional teaching style
      'storytelling',      // Narrative storytelling approach
      'dialogue'           // Conversational dialogue style
    ];
  }

  // Helper methods

  calculateNarrativeRelevance(verse, question) {
    // Simple relevance calculation - in production, use NLP similarity
    let relevance = verse.relevance || 0.5;

    // Boost relevance for direct scriptural references
    if (verse.reference.includes('Gita') || verse.reference.includes('Veda')) {
      relevance += 0.2;
    }

    return Math.min(relevance, 1.0);
  }

  determineCitationStyle(verse) {
    if (verse.reference.includes('Gita')) {
      return 'bhagavad-gita';
    } else if (verse.reference.includes('Veda')) {
      return 'vedic';
    } else if (verse.reference.includes('Upanishad')) {
      return 'upanishadic';
    }
    return 'general-scripture';
  }

  groupVersesByTheme(verses) {
    const groups = {};
    verses.forEach(verse => {
      const theme = verse.clusterTheme || 'general';
      if (!groups[theme]) {
        groups[theme] = [];
      }
      groups[theme].push(verse);
    });
    return groups;
  }

  identifyPrimaryTheme(thematicGroups) {
    let primaryTheme = { name: 'general', verses: [] };
    let maxRelevance = 0;

    for (const [theme, verses] of Object.entries(thematicGroups)) {
      const avgRelevance = verses.reduce((sum, v) => sum + v.relevance, 0) / verses.length;
      if (avgRelevance > maxRelevance) {
        maxRelevance = avgRelevance;
        primaryTheme = { name: theme, verses, relevance: avgRelevance };
      }
    }

    return primaryTheme;
  }

  identifySupportingThemes(thematicGroups, primaryTheme) {
    return Object.entries(thematicGroups)
      .filter(([theme]) => theme !== primaryTheme.name)
      .map(([theme, verses]) => ({
        name: theme,
        verses,
        relevance: verses.reduce((sum, v) => sum + v.relevance, 0) / verses.length
      }))
      .sort((a, b) => {
        const ar = (typeof a.relevance === 'number') ? a.relevance
          : (typeof a.processingMetadata?.narrativeRelevance === 'number') ? a.processingMetadata.narrativeRelevance
          : 0;
        const br = (typeof b.relevance === 'number') ? b.relevance
          : (typeof b.processingMetadata?.narrativeRelevance === 'number') ? b.processingMetadata.narrativeRelevance
          : 0;
        return br - ar;
      })
      .slice(0, 2); // Top 2 supporting themes
  }

  buildIntroduction(primaryTheme, context) {
    return `Your question touches on the profound wisdom of ${primaryTheme.name} in our spiritual tradition.`;
  }

  buildDevelopment(primaryTheme, supportingThemes, verses) {
    let development = `I have found that the teachings explore how ${primaryTheme.name}`;

    if (supportingThemes.length > 0) {
      development += ` connects with ${supportingThemes.map(t => t.name).join(' and ')}`;
    }

    development += ', offering deep insights for our spiritual journey.\n\n';

    // Add actual Sanskrit verses (Sanskrit-first architecture)
    const usable = verses.filter(v => typeof v?.sanskrit === 'string' && v.sanskrit.trim());
    const topVerses = usable.slice(0, 2); // Show top 2 verses

    if (topVerses.length > 0) {
      development += '**Sacred Verses:**\n\n';
      topVerses.forEach((verse, index) => {
        development += `**Verse ${index + 1}:**\n`;
        development += `*Sanskrit:* ${verse.sanskrit}\n`;
        const translation = (typeof verse?.translation === 'string') ? verse.translation.trim() : '';
        if (translation && translation !== 'Translation not available') {
          development += `*Translation:* ${translation}\n`;
        }
        if (verse.interpretation && verse.interpretation !== 'Spiritual interpretation of the verse') {
          development += `*Interpretation:* ${verse.interpretation}\n`;
        }
        development += `*Source:* ${verse.reference}\n\n`;
      });
    }

    return development;
  }

  buildCulmination(primaryTheme, verses) {
    const usable = verses.filter(v => typeof v?.sanskrit === 'string' && v.sanskrit.trim());
    const keyVerse = usable.find(v => v.clusterTheme === primaryTheme.name) || usable[0];
    if (keyVerse && keyVerse.sanskrit) {
      let culmination = `I believe the essence of this wisdom is beautifully captured in the Sanskrit verse:

**${keyVerse.sanskrit}**`;

      const translation = (typeof keyVerse?.translation === 'string') ? keyVerse.translation.trim() : '';
      if (translation && translation !== 'Translation not available') {
        culmination += `\n\n*Translation:* ${translation}`;
      }

      if (keyVerse.interpretation && keyVerse.interpretation !== 'Spiritual interpretation of the verse') {
        culmination += `\n\n*Interpretation:* ${keyVerse.interpretation}`;
      }

      culmination += `\n\n*Source:* ${keyVerse.reference}`;
      return culmination;
    }
    return 'This wisdom invites us to contemplate the deeper meaning of our spiritual path.';
  }

  buildConclusion(primaryTheme, context) {
    return `I hope this wisdom from our tradition illuminates your path and brings peace to your heart.`;
  }

  extractPracticalGuidance(verses) {
    // Extract actionable insights from verses with Sanskrit content (Sanskrit-first)
    const usable = verses.filter(v => typeof v?.sanskrit === 'string' && v.sanskrit.trim());
    return usable
      .map(verse => {
        const translation = (typeof verse?.translation === 'string') ? verse.translation.trim() : '';
        return {
          insight: verse.interpretation || 'Contemplate the deeper meaning of this Sanskrit verse',
          source: verse.reference,
          sanskrit: verse.sanskrit,
          translation: translation && translation !== 'Translation not available' ? translation : null
        };
      })
      .slice(0, 3);
  }

  generateFollowUpSuggestions(primaryTheme, context) {
    const suggestions = [
      `How might you apply this wisdom of ${primaryTheme.name} in your daily life?`,
      `Would you like to explore related teachings from other scriptures?`,
      `Shall we examine how this wisdom relates to specific challenges you're facing?`
    ];
    return suggestions;
  }

  /**
   * Generate Sanskrit-anchored English narrative with the new structure
   * @param {Object} structure - Narrative structure
   * @param {string} question - User's question
   * @param {Object} context - User context and preferences
   * @param {string} correlationId - Request correlation ID
   * @returns {string} Sanskrit-anchored narrative
   */
  async generateSanskritAnchoredNarrative(structure, question, context, correlationId) {
    try {
      logger.info('[TRACE] Entering generateSanskritAnchoredNarrative', { inputVerseCount: structure?.primaryTheme?.verses?.length || 0, correlationId });
      
      logger.info('Generating Sanskrit-anchored narrative', { correlationId });

      const { primaryTheme, supportingThemes } = structure;
      const topVerses = primaryTheme.verses
        .filter(verse => typeof verse?.sanskrit === 'string' && verse.sanskrit.trim())
        .sort((a, b) => {
        const ar = (typeof a.relevance === 'number') ? a.relevance
          : (typeof a.processingMetadata?.narrativeRelevance === 'number') ? a.processingMetadata.narrativeRelevance
          : 0;
        const br = (typeof b.relevance === 'number') ? b.relevance
          : (typeof b.processingMetadata?.narrativeRelevance === 'number') ? b.processingMetadata.narrativeRelevance
          : 0;
        return br - ar;
      })
        .slice(0, 4); // Get top 3-4 verses for analysis

      // Initialize LLM client
      const { getLLMClient } = require('../server');
      const llm = getLLMClient();

      // Build prompt with verses and question
      const versesText = topVerses.map((verse, idx) => 
        `Verse ${idx + 1}: ${verse.sanskrit} (Source: ${verse.reference})`
      ).join('\n\n');

      // Extract scripture names dynamically
      const scriptureNames = extractScriptureNames(topVerses);

      const prompt = [
        {
          role: 'system',
          content: `I am your spiritual guide. I will share the verses I have found from the sacred scriptures that have deep relevance to your question. Generate a compassionate, insightful response that synthesizes ancient wisdom with modern understanding. Use the provided Sanskrit verses to answer the user's spiritual question with depth and authenticity.`
        },
        {
          role: 'user',
          content: `Question: ${question}

Sanskrit Verses:
${versesText}

Instructions:

Structure your response as follows:
1. First paragraph: Begin with "The verses I have found from ${scriptureNames} have deep relevance to your question." Then provide a warm, contextual introduction to the topic without repeating the user's words.
2. Second paragraph: Present each verse with complete IAST and translation, explaining their relevance.
3. Third paragraph: Synthesize the insights and provide contemplative guidance.

Always provide the complete IAST Sanskrit text for each verse, never truncate with '...'

Always provide full, complete English translations, not brief summaries

When mentioning each verse for the first time, use this exact format: {Verse [Source]: [Complete_IAST] - [Complete_Translation]}

Use first-person language throughout ("I have found", "I observe", etc.)

Embed the verse format naturally within the narrative flow

Write in a warm, accessible tone for sincere spiritual seekers.`
        }
      ];

      // Get LLM-generated narrative
      const result = await llm.chat(prompt);
      const narrative = result.content || 'The ancient wisdom guides us toward deeper understanding.';

      logger.info('Sanskrit-anchored narrative generated', {
        correlationId,
        verseCount: topVerses.length,
        sections: 5
      });

      logger.info('[TRACE] Exiting generateSanskritAnchoredNarrative', { outputVerseCount: topVerses.length, correlationId });
      return narrative;

    } catch (error) {
      logger.error('Sanskrit-anchored narrative generation failed', {
        correlationId,
        error: error.message
      });
      throw new NarrativeGenerationError('Failed to generate Sanskrit-anchored narrative', error);
    }
  }

  /**
   * Generate Empathic Acknowledgment section
   * @param {string} question - User's question
   * @param {Object} context - User context
   * @returns {string} Empathic acknowledgment
   */
  generateEmpathicAcknowledgment(question, context) {
    const preferences = context.preferences || {};
    const seekerLevel = preferences.spiritualLevel || 'seeker';

    let acknowledgment = `🙏 **Empathetic Opening**\n\n`;

    // Adapt acknowledgment based on context
    if (question.toLowerCase().includes('struggle') || question.toLowerCase().includes('difficult')) {
      acknowledgment += `I sense the depth of your current challenge, and I want you to know that countless souls throughout history have walked similar paths of questioning and seeking. The ancient wisdom of our tradition offers gentle guidance for exactly these moments of uncertainty.`;
    } else if (question.toLowerCase().includes('purpose') || question.toLowerCase().includes('meaning')) {
      acknowledgment += `Your question touches on one of life's most profound inquiries - the search for deeper meaning and purpose. This is the sacred quest that has drawn countless spiritual seekers to the wisdom of the ages, and our tradition holds precious insights for this very journey.`;
    } else {
      acknowledgment += `Your inquiry reflects a beautiful sincerity in seeking spiritual understanding. This openness to wisdom is itself a form of spiritual practice that our tradition deeply honors and supports.`;
    }

    return acknowledgment;
  }

  /**
   * Generate Ancient Wisdom Discovery section
   * @param {Object} primaryTheme - Primary theme
   * @param {Array} supportingThemes - Supporting themes
   * @returns {string} Ancient wisdom discovery
   */
  generateAncientWisdomDiscovery(primaryTheme, supportingThemes) {
    let discovery = `📿 **Ancient Wisdom Discovery**\n\n`;

    discovery += `I have found that the ancient Sanskrit tradition offers profound insights into ${primaryTheme.name}`;

    if (supportingThemes && supportingThemes.length > 0) {
      discovery += `, beautifully complemented by teachings on ${supportingThemes.map(t => t.name).join(' and ')}. `;
      discovery += `These interconnected wisdom streams create a comprehensive understanding that has guided spiritual seekers for millennia.`;
    } else {
      discovery += `, providing timeless guidance that continues to illuminate the spiritual path for modern seekers.`;
    }

    discovery += `\n\nThis wisdom emerges not from a single voice, but from the collective spiritual experience of countless sages, scholars, and practitioners who have walked this path before us.`;

    return discovery;
  }

  /**
   * Generate Ranked Verse Analysis section (3-4 verses)
   * @param {Array} verses - Top verses to analyze
   * @param {Object} primaryTheme - Primary theme
   * @returns {string} Ranked verse analysis
   */
  generateRankedVerseAnalysis(verses, primaryTheme) {
    let analysis = `📿 **Ranked Verse Analysis**\n\n`;

    if (verses.length === 0) {
      analysis += `While I searched through the sacred texts for verses related to ${primaryTheme.name}, I found that the wisdom is better expressed through the synthesized understanding that follows.`;
    } else {
      analysis += `Here are the most relevant Sanskrit verses, ranked by their direct relevance to your inquiry:\n\n`;

      verses.forEach((verse, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📿';

        analysis += `${rankEmoji} **Verse ${rank}** (Relevance: ${Math.round(verse.relevance * 100)}%)\n`;
        analysis += `*Sanskrit:* ${verse.sanskrit}\n`;

        const translation = (typeof verse?.translation === 'string') ? verse.translation.trim() : '';
        if (translation && translation !== 'Translation not available') {
          analysis += `*Translation:* ${translation}\n`;
        }

        if (verse.interpretation && verse.interpretation !== 'Spiritual interpretation of the verse') {
          analysis += `*Spiritual Insight:* ${verse.interpretation}\n`;
        }

        analysis += `*Source:* ${verse.reference}\n`;
        analysis += `*Theme Connection:* ${verse.clusterTheme}\n\n`;
      });
    }

    return analysis;
  }

  /**
   * Generate True Synthesis section
   * @param {Array} verses - Verses to synthesize
   * @param {Object} primaryTheme - Primary theme
   * @param {string} question - User's question
   * @returns {string} True synthesis
   */
  generateTrueSynthesis(verses, primaryTheme, question) {
    let synthesis = `🌸 **True Synthesis**\n\n`;

    if (verses.length === 0) {
      synthesis += `I believe the true synthesis of wisdom occurs when we recognize that ${primaryTheme.name} is not merely an intellectual concept, but a lived experience of spiritual awareness.`;
    } else {
      synthesis += `When I weave together these sacred verses, a profound unified understanding emerges:\n\n`;

      // Create synthesis from multiple verses
      const themes = [...new Set(verses.map(v => v.clusterTheme))];
      themes.forEach(theme => {
        const themeVerses = verses.filter(v => v.clusterTheme === theme);
        if (themeVerses.length > 0) {
          synthesis += `**${theme}:** `;
          synthesis += `The ${themeVerses.length > 1 ? 'verses' : 'verse'} reveal that ${theme} is both a personal practice and a universal principle, guiding us toward greater spiritual awareness and compassionate action.\n\n`;
        }
      });

      synthesis += `I believe this synthesis shows us that ${primaryTheme.name} is not a destination to reach, but a path to walk with awareness, compassion, and dedication.`;
    }

    return synthesis;
  }

  /**
   * Generate Contemplative Inquiry section
   * @param {Object} primaryTheme - Primary theme
   * @param {Object} context - User context
   * @returns {string} Contemplative inquiry
   */
  generateContemplativeInquiry(primaryTheme, context) {
    let inquiry = `🕯️ **Contemplative Inquiry**\n\n`;

    inquiry += `As you reflect on this wisdom about ${primaryTheme.name} that I have shared, consider:\n\n`;

    const inquiryQuestions = [
      `How might these ancient teachings guide your daily choices and actions?`,
      `What aspects of this wisdom resonate most deeply with your current life experience?`,
      `How could you begin to integrate one of these insights into your spiritual practice?`,
      `What questions does this wisdom raise for your own spiritual journey?`
    ];

    inquiryQuestions.forEach((question, index) => {
      inquiry += `${index + 1}. ${question}\n`;
    });

    inquiry += `\nThese questions are not meant to be answered immediately, but to deepen your contemplation of the sacred teachings.`;

    return inquiry;
  }

  generateTeachingNarrative(structure, question) {
    const { primaryTheme } = structure;

    // Generate completely Sanskrit-first narrative
    let narrative = `Your question about ${primaryTheme.name} touches on profound wisdom from our spiritual tradition.

I have found that the ancient Sanskrit texts reveal deep insights about ${primaryTheme.name} and its significance in our spiritual journey.`;

    // Add Sanskrit verses section - this is the core content
    const sanskritVerses = primaryTheme.verses.filter(v => typeof v?.sanskrit === 'string' && v.sanskrit.trim());
    if (sanskritVerses.length > 0) {
      narrative += `\n\n**Sacred Sanskrit Verses:**\n\n`;
      sanskritVerses.slice(0, 3).forEach((verse, index) => {
        narrative += `**Verse ${index + 1}:**\n`;
        narrative += `*Sanskrit:* ${verse.sanskrit}\n`;
        const translation = (typeof verse?.translation === 'string') ? verse.translation.trim() : '';
        if (translation && translation !== 'Translation not available') {
          narrative += `*Translation:* ${translation}\n`;
        }
        if (verse.interpretation && verse.interpretation !== 'Spiritual interpretation of the verse') {
          narrative += `*Interpretation:* ${verse.interpretation}\n`;
        }
        narrative += `*Source:* ${verse.reference}\n\n`;
      });
    }

    // Add practical guidance based on Sanskrit content
    if (sanskritVerses.length > 0) {
      narrative += `**Practical guidance:**\n`;
      sanskritVerses.slice(0, 2).forEach(verse => {
        narrative += `• Contemplate the deeper meaning of this Sanskrit verse: ${verse.sanskrit.substring(0, 50)}...\n`;
        narrative += `  *Source:* ${verse.reference}\n\n`;
      });
    }

    // Add reflection questions
    narrative += `**Reflection questions:**\n`;
    narrative += `• How might you apply this Sanskrit wisdom in your daily life?\n`;
    narrative += `• What insights do these ancient verses offer for your spiritual journey?\n`;
    narrative += `• Would you like to explore more teachings from these sacred texts?\n`;

    return narrative;
  }

  generateStorytellingNarrative(structure, question) {
    // More narrative, story-like format
    return `Let me share with you a beautiful teaching from our tradition...

${structure.narrativeArc.introduction} There was a time when seekers just like you pondered similar questions about ${structure.primaryTheme.name}.

${structure.narrativeArc.development} The ancient wisdom reveals...

${structure.narrativeArc.culmination}

And so, ${structure.narrativeArc.conclusion}

This is the living wisdom that continues to guide us today.`;
  }

  generateDialogueNarrative(structure, question) {
    return `Ah, your question about ${structure.primaryTheme.name} is so important for our spiritual growth.

${structure.narrativeArc.introduction}

${structure.narrativeArc.development}

Tell me, have you experienced moments where ${structure.primaryTheme.name} has touched your life?

${structure.narrativeArc.culmination}

Yes, ${structure.narrativeArc.conclusion}`;
  }

  applyToneAdjustments(narrative, tone) {
    switch (tone) {
      case 'formal':
        return narrative.replace(/Ah,/g, 'Indeed,').replace(/Tell me/g, 'Consider');
      case 'meditative':
        return narrative.replace(/!/g, '.').replace(/your question/g, 'this inquiry');
      default:
        return narrative;
    }
  }

  extractSourceName(reference) {
    if (reference.includes('Bhagavad')) return 'Bhagavad Gita';
    if (reference.includes('Rig')) return 'Rig Veda';
    if (reference.includes('Yajur')) return 'Yajur Veda';
    if (reference.includes('Sama')) return 'Sama Veda';
    if (reference.includes('Atharva')) return 'Atharva Veda';
    if (reference.includes('Upanishad')) return 'Upanishads';
    if (reference.includes('Mahabharata')) return 'Mahabharata';
    return 'ancient scriptures';
  }

  determineCitationPlacement(verse, narrative) {
    // Determine where in the narrative this citation should be placed
    if (verse.clusterTheme.includes('dharma') || verse.clusterTheme.includes('duty')) {
      return 'development';
    } else if (verse.clusterTheme.includes('peace') || verse.clusterTheme.includes('bliss')) {
      return 'culmination';
    }
    return 'development';
  }
}

module.exports = NarrativeSynthesizer;
module.exports.generateOneShotNarrative = generateOneShotNarrative;
module.exports.generateSanskritAnchoredNarrative = generateSanskritAnchoredNarrative;
module.exports.extractScriptureNames = extractScriptureNames;
