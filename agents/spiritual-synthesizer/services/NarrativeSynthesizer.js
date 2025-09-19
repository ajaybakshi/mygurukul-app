const logger = require('../logger');
const { NarrativeGenerationError, VerseProcessingError } = require('../errors');

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
        throw new VerseProcessingError('Invalid verse data structure: missing clusters array');
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

      // Check translation availability
      validationResults.hasTranslations = verses.every(verse => verse.translation);

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

      if (!validationResults.hasTranslations) {
        throw new VerseProcessingError('Missing translations for verses');
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
      const style = preferences.narrativeStyle || 'teaching';

      // Generate narrative based on style
      let narrative;

      switch (style) {
        case 'storytelling':
          narrative = this.generateStorytellingNarrative(structure, question);
          break;
        case 'dialogue':
          narrative = this.generateDialogueNarrative(structure, question);
          break;
        default:
          narrative = this.generateTeachingNarrative(structure, question);
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
          questionAddressed: question
        }
      };

      logger.info('Wisdom narrative weaving completed', {
        correlationId,
        wordCount: wisdomNarrative.metadata.wordCount,
        tone,
        style
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
        sankalpaPrinciples: this.sankalpaPrinciples
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

    development += ', offering deep insights for our spiritual journey.';
    return development;
  }

  buildCulmination(primaryTheme, verses) {
    const keyVerse = verses.find(v => v.clusterTheme === primaryTheme.name);
    if (keyVerse) {
      return `The essence of this wisdom is beautifully captured in the understanding that ${keyVerse.translation.substring(0, 100)}...`;
    }
    return 'This wisdom invites us to contemplate the deeper meaning of our spiritual path.';
  }

  buildConclusion(primaryTheme, context) {
    return `May this wisdom from our tradition illuminate your path and bring peace to your heart.`;
  }

  extractPracticalGuidance(verses) {
    // Extract actionable insights from verses
    return verses
      .filter(verse => verse.interpretation)
      .map(verse => ({
        insight: verse.interpretation,
        source: verse.reference
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

  generateTeachingNarrative(structure, question) {
    const { narrativeArc } = structure;

    return `${narrativeArc.introduction}

${narrativeArc.development}

${narrativeArc.culmination}

${narrativeArc.conclusion}

Practical guidance:
${narrativeArc.practicalGuidance.map(g => `• ${g.insight}`).join('\n')}

${narrativeArc.followUpSuggestions.join('\n')}`;
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
