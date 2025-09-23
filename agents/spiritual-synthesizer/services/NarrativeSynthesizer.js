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

// --- Minimal helpers for one-shot synthesis ---

function selectTopVerses(collectorPayload, k = 4) {
  const verses = Array.isArray(collectorPayload?.verses) ? collectorPayload.verses : [];
  const valid = verses
    .filter(v => v && v.content && v.content.sanskrit && v.source)
    .map((v, idx) => ({
      id: v.id || `v${idx + 1}`,
      iast: String(v.content.sanskrit || '').trim(), // Use sanskrit field as IAST
      english: String(v.content.translation || '').trim(), // Include the English translation
      source: v.source,
      score: typeof v.relevanceScore === 'number' ? v.relevanceScore : 0, // Use relevanceScore
    }));
  const sorted = valid.sort((a, b) => b.score - a.score);
  return sorted.slice(0, k);
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
  if (topVerses.length === 0) {
    return {
      markdown: `🙏 Empathetic Opening
A humble note: not enough verse data was available to generate a full synthesis at this time. Please try refining the question or retrying shortly.`,
    };
  }

  const payload = buildOneShotPayload(query, topVerses);

  const system = `
You are the Spiritual Synthesizer. Use ONLY the provided verses.
Do four things in order: empathic opening, per-verse analysis, true synthesis, and reflective prompts.
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
Return markdown in this exact structure:

🙏 Empathetic Opening
2–3 sentences that compassionately attune to the seeker's intent, without repeating their words.

📿 Verse Analysis
- Verse {id}
  IAST: \${IAST_LINE}
  Translation: \${ENGLISH_TRANSLATION}
  Why relevant: One sentence linking this verse to the question.
  Interpretive note: One line moving from literal to deeper meaning.

- Verse {id}
  IAST: \${IAST_LINE}
  Translation: \${ENGLISH_TRANSLATION}
  Why relevant: ...
  Interpretive note: ...

🌸 True Synthesis
- 3–5 bullet insights that integrate the verses into one understanding; reference verse IDs (e.g., v1, v2) instead of re-quoting text.

🕯️ Contemplative Inquiry
- A practical action or reflection tailored to this context.
- A question that invites deeper self-examination.
- A daily-life integration suggestion rooted in the synthesis.
- An optional follow-up pathway for continued exploration.
`.trim();

  const prompt = [
    { role: 'system', content: system },
    user,
    { role: 'assistant', content: assistantInstruction },
    { role: 'user', content: 'Please generate the wisdom synthesis now.' }
  ];

  const result = await llm.chat(prompt);

  if (!result?.content || hasPlaceholders(result.content)) {
    const stricter = [
      { role: 'system', content: system + '\nABSOLUTE: Do not emit placeholders. Provide a brief contextual gloss if exact translation is uncertain.' },
      user,
      { role: 'assistant', content: assistantInstruction },
      { role: 'user', content: 'Please generate the wisdom synthesis now without placeholders.' }
    ];
    const retry = await llm.chat(stricter);
    if (!retry?.content || hasPlaceholders(retry.content)) {
      return {
        markdown: `🙏 Empathetic Opening
A humble, concise response is provided while verse analysis is limited.

📿 Verse Analysis
${topVerses.map(v => `- Verse ${v.id}\n  IAST: [translate:${v.iast}]\n  Source: ${v.source}`).join('\n')}

🌸 True Synthesis
- The verses invite reflection on the theme within the question, emphasizing sincerity and steady practice.

🕯️ Contemplative Inquiry
- Sit quietly for two minutes, reflect on one word from the verses that feels alive today.
- What small action could honor this insight before sunset?
`,
      };
    }
    return { markdown: retry.content };
  }

  return { markdown: result.content };
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
    try {
      logger.info('Processing collector verse data', { correlationId });

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

      const validationResults = {
        hasValidReferences: false,
        hasTranslations: false,
        hasAuthenticSources: false,
        averageRelevance: 0
      };

      // Check reference validity
      const validReferences = verses.filter(verse =>
        verse.reference &&
        (verse.reference.includes('Veda') ||
         verse.reference.includes('Upanishad') ||
         verse.reference.includes('Bhagavad') ||
         verse.reference.includes('Mahabharata') ||
         verse.reference.match(/\d+\.\d+\.\d+/)) // Standard scriptural reference format
      );

      validationResults.hasValidReferences = validReferences.length > 0;

      // Check Sanskrit content availability (Sanskrit-first architecture)
      validationResults.hasSanskritContent = verses.some(verse => verse.sanskrit);

      // Check source authenticity
      validationResults.hasAuthenticSources = verses.some(verse =>
        verse.reference.includes('Veda') ||
        verse.reference.includes('Gita') ||
        verse.reference.includes('Upanishad')
      );

      // Calculate average relevance
      validationResults.averageRelevance = verses.reduce((sum, verse) =>
        sum + (verse.relevance || 0), 0
      ) / verses.length;

      if (!validationResults.hasValidReferences) {
        throw new VerseProcessingError('No valid scriptural references found in verse data');
      }

      if (!validationResults.hasSanskritContent) {
        throw new VerseProcessingError('Missing Sanskrit content in verses');
      }

      logger.info('Scriptural grounding validation completed', {
        correlationId,
        ...validationResults
      });

      return true;

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
          narrative = this.generateSanskritAnchoredNarrative(structure, question, context, correlationId);
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
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 2); // Top 2 supporting themes
  }

  buildIntroduction(primaryTheme, context) {
    return `Your question touches on the profound wisdom of ${primaryTheme.name} in our spiritual tradition.`;
  }

  buildDevelopment(primaryTheme, supportingThemes, verses) {
    let development = `The teachings explore how ${primaryTheme.name}`;

    if (supportingThemes.length > 0) {
      development += ` connects with ${supportingThemes.map(t => t.name).join(' and ')}`;
    }

    development += ', offering deep insights for our spiritual journey.\n\n';

    // Add actual Sanskrit verses (Sanskrit-first architecture)
    const topVerses = verses
      .filter(v => v.sanskrit) // Sanskrit is primary, translations optional
      .slice(0, 2); // Show top 2 verses

    if (topVerses.length > 0) {
      development += '**Sacred Verses:**\n\n';
      topVerses.forEach((verse, index) => {
        development += `**Verse ${index + 1}:**\n`;
        development += `*Sanskrit:* ${verse.sanskrit}\n`;
        if (verse.translation && verse.translation !== 'Translation not available') {
          development += `*Translation:* ${verse.translation}\n`;
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
    const keyVerse = verses.find(v => v.clusterTheme === primaryTheme.name);
    if (keyVerse && keyVerse.sanskrit) {
      let culmination = `The essence of this wisdom is beautifully captured in the Sanskrit verse:

**${keyVerse.sanskrit}**`;

      if (keyVerse.translation && keyVerse.translation !== 'Translation not available') {
        culmination += `\n\n*Translation:* ${keyVerse.translation}`;
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
    return `May this wisdom from our tradition illuminate your path and bring peace to your heart.`;
  }

  extractPracticalGuidance(verses) {
    // Extract actionable insights from verses with Sanskrit content (Sanskrit-first)
    return verses
      .filter(verse => verse.sanskrit) // Sanskrit is primary requirement
      .map(verse => ({
        insight: verse.interpretation || 'Contemplate the deeper meaning of this Sanskrit verse',
        source: verse.reference,
        sanskrit: verse.sanskrit,
        translation: verse.translation && verse.translation !== 'Translation not available' ? verse.translation : null
      }))
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
  generateSanskritAnchoredNarrative(structure, question, context, correlationId) {
    try {
      logger.info('Generating Sanskrit-anchored narrative', { correlationId });

      const { primaryTheme, supportingThemes } = structure;
      const topVerses = primaryTheme.verses
        .filter(verse => verse.sanskrit)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 4); // Get top 3-4 verses for analysis

      // Section 1: Empathic Acknowledgment
      const empathicSection = this.generateEmpathicAcknowledgment(question, context);

      // Section 2: Ancient Wisdom Discovery
      const wisdomDiscoverySection = this.generateAncientWisdomDiscovery(primaryTheme, supportingThemes);

      // Section 3: Ranked Verse Analysis (3-4 verses)
      const verseAnalysisSection = this.generateRankedVerseAnalysis(topVerses, primaryTheme);

      // Section 4: True Synthesis
      const synthesisSection = this.generateTrueSynthesis(topVerses, primaryTheme, question);

      // Section 5: Contemplative Inquiry
      const inquirySection = this.generateContemplativeInquiry(primaryTheme, context);

      // Compose the complete narrative
      const narrative = `${empathicSection}

${wisdomDiscoverySection}

${verseAnalysisSection}

${synthesisSection}

${inquirySection}`;

      logger.info('Sanskrit-anchored narrative generated', {
        correlationId,
        verseCount: topVerses.length,
        sections: 5
      });

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

    discovery += `The ancient Sanskrit tradition offers profound insights into ${primaryTheme.name}`;

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

        if (verse.translation && verse.translation !== 'Translation not available') {
          analysis += `*Translation:* ${verse.translation}\n`;
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
      synthesis += `The true synthesis of wisdom occurs when we recognize that ${primaryTheme.name} is not merely an intellectual concept, but a lived experience of spiritual awareness.`;
    } else {
      synthesis += `When we weave together these sacred verses, a profound unified understanding emerges:\n\n`;

      // Create synthesis from multiple verses
      const themes = [...new Set(verses.map(v => v.clusterTheme))];
      themes.forEach(theme => {
        const themeVerses = verses.filter(v => v.clusterTheme === theme);
        if (themeVerses.length > 0) {
          synthesis += `**${theme}:** `;
          synthesis += `The ${themeVerses.length > 1 ? 'verses' : 'verse'} reveal that ${theme} is both a personal practice and a universal principle, guiding us toward greater spiritual awareness and compassionate action.\n\n`;
        }
      });

      synthesis += `This synthesis shows us that ${primaryTheme.name} is not a destination to reach, but a path to walk with awareness, compassion, and dedication.`;
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

    inquiry += `As you reflect on this wisdom about ${primaryTheme.name}, consider:\n\n`;

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

The ancient Sanskrit texts reveal deep insights about ${primaryTheme.name} and its significance in our spiritual journey.`;

    // Add Sanskrit verses section - this is the core content
    const sanskritVerses = primaryTheme.verses.filter(v => v.sanskrit);
    if (sanskritVerses.length > 0) {
      narrative += `\n\n**Sacred Sanskrit Verses:**\n\n`;
      sanskritVerses.slice(0, 3).forEach((verse, index) => {
        narrative += `**Verse ${index + 1}:**\n`;
        narrative += `*Sanskrit:* ${verse.sanskrit}\n`;
        if (verse.translation && verse.translation !== 'Translation not available') {
          narrative += `*Translation:* ${verse.translation}\n`;
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
