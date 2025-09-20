/**
 * Sanskrit Integration Configuration
 *
 * This file contains specialized prompts and guidelines for handling Sanskrit concepts,
 * terminology, and wisdom within the synthesizer system. It ensures respectful and
 * accurate integration of Sanskrit spiritual elements.
 */

/**
 * Sanskrit Core Concepts Library
 * Essential Sanskrit spiritual concepts with explanations and usage guidelines
 */
export const sanskritCoreConcepts = {
  // Basic Spiritual Concepts
  dharma: {
    sanskrit: 'धर्म',
    iast: 'dharma',
    meaning: 'righteous duty, moral order, spiritual path',
    usage: 'Refers to one\'s sacred duty and the moral order of the universe',
    context: 'Personal duty, universal law, ethical conduct'
  },

  karma: {
    sanskrit: 'कर्म',
    iast: 'karma',
    meaning: 'action and its consequences, law of cause and effect',
    usage: 'Describes the spiritual principle of action and reaction',
    context: 'Personal responsibility, life patterns, spiritual growth'
  },

  moksha: {
    sanskrit: 'मोक्ष',
    iast: 'mokṣa',
    meaning: 'liberation, spiritual freedom, ultimate release',
    usage: 'The goal of spiritual practice and ultimate liberation',
    context: 'Enlightenment, freedom from suffering, spiritual completion'
  },

  // Consciousness and Self
  atman: {
    sanskrit: 'आत्मन्',
    iast: 'ātman',
    meaning: 'true self, soul, eternal consciousness',
    usage: 'Refers to the individual soul and universal consciousness',
    context: 'Self-realization, spiritual identity, divine nature'
  },

  brahman: {
    sanskrit: 'ब्रह्मन्',
    iast: 'brahman',
    meaning: 'universal consciousness, ultimate reality',
    usage: 'The supreme, unchanging reality underlying all existence',
    context: 'God, ultimate truth, cosmic consciousness'
  },

  maya: {
    sanskrit: 'माया',
    iast: 'māyā',
    meaning: 'illusion, cosmic illusion, divine play',
    usage: 'The illusory nature of material existence',
    context: 'Material world, spiritual understanding, enlightenment'
  },

  // States of Consciousness
  samadhi: {
    sanskrit: 'समाधि',
    iast: 'samādhi',
    meaning: 'complete absorption, spiritual ecstasy, enlightenment',
    usage: 'The highest state of meditative consciousness',
    context: 'Meditation, spiritual realization, transcendent states'
  },

  nirvana: {
    sanskrit: 'निर्वाण',
    iast: 'nirvāṇa',
    meaning: 'extinction of suffering, enlightenment, liberation',
    usage: 'The state of complete spiritual freedom',
    context: 'Buddhist enlightenment, end of suffering, spiritual peace'
  },

  // Paths and Practices
  yoga: {
    sanskrit: 'योग',
    iast: 'yoga',
    meaning: 'union, spiritual discipline, path to enlightenment',
    usage: 'Various spiritual paths and practices for self-realization',
    context: 'Spiritual practice, meditation, disciplined living'
  },

  bhakti: {
    sanskrit: 'भक्ति',
    iast: 'bhakti',
    meaning: 'devotion, loving devotion to the divine',
    usage: 'The path of love and devotion in spiritual practice',
    context: 'Devotional practice, spiritual love, divine relationship'
  },

  jnana: {
    sanskrit: 'ज्ञान',
    iast: 'jñāna',
    meaning: 'knowledge, wisdom, spiritual understanding',
    usage: 'The path of knowledge and spiritual discrimination',
    context: 'Spiritual wisdom, philosophical understanding, enlightenment'
  },

  // Divine Principles
  ahimsa: {
    sanskrit: 'अहिंसा',
    iast: 'ahiṁsā',
    meaning: 'non-violence, harmlessness, compassion',
    usage: 'The principle of doing no harm to any living being',
    context: 'Ethics, compassion, peaceful living'
  },

  satya: {
    sanskrit: 'सत्य',
    iast: 'satya',
    meaning: 'truth, reality, divine truth',
    usage: 'Truthfulness and alignment with ultimate reality',
    context: 'Honesty, spiritual integrity, divine truth'
  }
};

/**
 * Sanskrit Integration Guidelines
 * Rules and best practices for incorporating Sanskrit in responses
 */
export const sanskritIntegrationGuidelines = `**Guidelines for Sanskrit Integration:**

1. **When to Use Sanskrit:**
   - Use Sanskrit terms when they add spiritual depth or precision
   - Include Sanskrit when discussing traditional spiritual concepts
   - Present Sanskrit to honor cultural and spiritual authenticity

2. **How to Present Sanskrit:**
   - Always provide IAST transliteration for pronunciation
   - Include both Devanagari script and Roman transliteration
   - Offer clear, accessible explanations of Sanskrit terms
   - Show spiritual context and deeper meaning

3. **Sanskrit Usage Rules:**
   - Present Sanskrit terms parenthetically or in footnotes
   - Use Sanskrit to enhance, not overwhelm, the message
   - Ensure Sanskrit terms are properly contextualized
   - Respect the sacred nature of Sanskrit terminology

4. **Pronunciation and Cultural Sensitivity:**
   - Provide pronunciation guides for key terms
   - Explain cultural context respectfully
   - Avoid casual or superficial use of Sanskrit
   - Honor the tradition while making it accessible`;

/**
 * Sanskrit Concept Formatter
 * Functions to format Sanskrit concepts properly in responses
 */
export const sanskritFormatters = {
  /**
   * Format a Sanskrit concept with proper presentation
   * @param {string} concept - The concept key from sanskritCoreConcepts
   * @param {string} context - How the concept is being used
   * @returns {string} Formatted Sanskrit concept
   */
  formatConcept: function(concept, context = 'general') {
    const conceptData = sanskritCoreConcepts[concept];
    if (!conceptData) return concept;

    return `${conceptData.sanskrit} (${conceptData.iast}) - ${conceptData.meaning} (${context})`;
  },

  /**
   * Create a Sanskrit glossary entry
   * @param {string} concept - The concept key from sanskritCoreConcepts
   * @returns {string} Detailed glossary entry
   */
  createGlossaryEntry: function(concept) {
    const conceptData = sanskritCoreConcepts[concept];
    if (!conceptData) return '';

    return `**${conceptData.sanskrit} (${conceptData.iast}):**
- **Meaning:** ${conceptData.meaning}
- **Usage:** ${conceptData.usage}
- **Context:** ${conceptData.context}`;
  },

  /**
   * Format Sanskrit for pronunciation guidance
   * @param {string} sanskritText - The Sanskrit text
   * @param {string} iastText - The IAST transliteration
   * @returns {string} Pronunciation guidance
   */
  pronunciationGuide: function(sanskritText, iastText) {
    return `${sanskritText} (${iastText})`;
  }
};

/**
 * Sanskrit Wisdom Patterns
 * Common patterns for integrating Sanskrit wisdom into responses
 */
export const sanskritWisdomPatterns = {
  /**
   * Dharma application pattern
   */
  dharmaApplication: `When facing life's challenges, remember *dharma* (धर्म) - your sacred duty and moral responsibility. This ancient concept guides us to act with integrity and purpose, even in difficult circumstances.`,

  /**
   * Karma understanding pattern
   */
  karmaUnderstanding: `The principle of *karma* (कर्म) teaches us that our actions shape our future. Each choice we make creates ripples that return to us, encouraging mindful and compassionate living.`,

  /**
   * Moksha aspiration pattern
   */
  mokshaAspiration: `The ultimate goal of *moksha* (मोक्ष) reminds us that spiritual liberation is possible. This state of complete freedom from suffering is the birthright of every soul.`,

  /**
   * Atman realization pattern
   */
  atmanRealization: `The wisdom of *ātman* (आत्मन्) reveals our true divine nature. Beyond the changing circumstances of life, we discover our eternal, unchanging essence.`
};

/**
 * Sanskrit Validation and Safety
 * Ensures proper and respectful use of Sanskrit concepts
 */
export const sanskritValidation = {
  /**
   * Check if a concept exists in the core library
   * @param {string} concept - Concept to check
   * @returns {boolean} True if concept exists
   */
  isValidConcept: function(concept) {
    return concept in sanskritCoreConcepts;
  },

  /**
   * Get safe alternative if concept doesn't exist
   * @param {string} concept - Original concept
   * @returns {string} Safe alternative or general term
   */
  getSafeAlternative: function(concept) {
    if (this.isValidConcept(concept)) {
      return concept;
    }
    return 'spiritual principle'; // Generic safe alternative
  },

  /**
   * Validate Sanskrit usage in context
   * @param {string} concept - Sanskrit concept being used
   * @param {string} context - Context of usage
   * @returns {boolean} True if usage is appropriate
   */
  validateUsage: function(concept, context) {
    // Basic validation - can be extended with more sophisticated rules
    return this.isValidConcept(concept) && context.length > 10;
  }
};

/**
 * Sanskrit Integration Helper Functions
 * Utility functions for working with Sanskrit concepts
 */
export const sanskritHelpers = {
  /**
   * Get all available Sanskrit concepts
   * @returns {Array} Array of concept keys
   */
  getAllConcepts: function() {
    return Object.keys(sanskritCoreConcepts);
  },

  /**
   * Search concepts by meaning or context
   * @param {string} searchTerm - Term to search for
   * @returns {Array} Array of matching concept keys
   */
  searchConcepts: function(searchTerm) {
    const matches = [];
    for (const [key, concept] of Object.entries(sanskritCoreConcepts)) {
      if (
        concept.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.usage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.context.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        matches.push(key);
      }
    }
    return matches;
  },

  /**
   * Get concepts by category
   * @param {string} category - Category of concepts
   * @returns {Array} Array of concept keys in category
   */
  getConceptsByCategory: function(category) {
    const categories = {
      spiritual: ['dharma', 'karma', 'moksha', 'atman', 'brahman', 'maya'],
      consciousness: ['atman', 'brahman', 'samadhi', 'nirvana'],
      practice: ['yoga', 'bhakti', 'jnana'],
      ethical: ['ahimsa', 'satya']
    };

    return categories[category] || [];
  }
};
