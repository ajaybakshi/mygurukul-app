/**
 * Synthesizer Prompts Configuration - Centralized Exports
 *
 * This file serves as the main entry point for all synthesizer prompt configurations.
 * It exports all prompt components, templates, and utilities in a centralized manner.
 */

// Load modules synchronously at startup
let systemPrompts, narrativeTemplates, sanskritIntegration;

// Synchronous loading function
function loadModulesSync() {
  try {
    systemPrompts = require('./synthesizer-system-prompt.js');
    narrativeTemplates = require('./narrative-templates.js');
    sanskritIntegration = require('./sanskrit-integration.js');
  } catch (error) {
    console.error('Failed to load prompt modules:', error);
    throw error;
  }
}

// Load modules immediately
loadModulesSync();

// Getters for CommonJS compatibility
const getSystemPrompts = () => systemPrompts;
const getNarrativeTemplates = () => narrativeTemplates;
const getSanskritIntegration = () => sanskritIntegration;

/**
 * Complete Synthesizer Prompt Configuration Object
 * Provides a single object containing all prompt configurations
 */
const synthesizerPrompts = {
  // System Configuration
  version: "2.0.0-sanskrit-revolution", // Hardcoded for now

  // System Prompts
  system: {
    coreIdentity: systemPrompts.coreIdentityPrompt,
    sacredBoundaries: systemPrompts.sacredBoundariesPrompt,
    synthesisMethodology: systemPrompts.synthesisMethodologyPrompt,
    sanskritIntegration: systemPrompts.sanskritIntegrationPrompt,
    complete: systemPrompts.getSynthesizerSystemPrompt()
  },

  // Templates
  templates: {
    baseStructure: narrativeTemplates.baseResponseStructure,
    generalGuidance: narrativeTemplates.generalGuidanceTemplate,
    crisisSupport: narrativeTemplates.crisisSupportTemplate,
    philosophicalInquiry: narrativeTemplates.philosophicalInquiryTemplate,
    sanskritGuidance: narrativeTemplates.sanskritGuidanceTemplate,
    comparativeAnalysis: narrativeTemplates.comparativeAnalysisTemplate
  },

  // Sanskrit Integration
  sanskrit: {
    coreConcepts: sanskritIntegration.sanskritCoreConcepts,
    guidelines: sanskritIntegration.sanskritIntegrationGuidelines,
    formatters: sanskritIntegration.sanskritFormatters,
    wisdomPatterns: sanskritIntegration.sanskritWisdomPatterns,
    validation: sanskritIntegration.sanskritValidation,
    helpers: sanskritIntegration.sanskritHelpers
  }
};

/**
 * Get Complete Synthesizer Configuration
 * Returns the full synthesizer configuration with all components
 * @returns {Object} Complete synthesizer prompt configuration
 */
function getCompleteSynthesizerConfig() {
  return {
    version: synthesizerPrompts.version,
    system: {
      coreIdentity: systemPrompts.coreIdentityPrompt,
      sacredBoundaries: systemPrompts.sacredBoundariesPrompt,
      synthesisMethodology: systemPrompts.synthesisMethodologyPrompt,
      sanskritIntegration: systemPrompts.sanskritIntegrationPrompt,
      complete: systemPrompts.getSynthesizerSystemPrompt()
    },
    templates: {
      baseStructure: narrativeTemplates.baseResponseStructure,
      generalGuidance: narrativeTemplates.generalGuidanceTemplate,
      crisisSupport: narrativeTemplates.crisisSupportTemplate,
      philosophicalInquiry: narrativeTemplates.philosophicalInquiryTemplate,
      sanskritGuidance: narrativeTemplates.sanskritGuidanceTemplate,
      comparativeAnalysis: narrativeTemplates.comparativeAnalysisTemplate
    },
    sanskrit: {
      coreConcepts: sanskritIntegration.sanskritCoreConcepts,
      guidelines: sanskritIntegration.sanskritIntegrationGuidelines,
      formatters: sanskritIntegration.sanskritFormatters,
      wisdomPatterns: sanskritIntegration.sanskritWisdomPatterns,
      validation: sanskritIntegration.sanskritValidation,
      helpers: sanskritIntegration.sanskritHelpers
    }
  };
}

/**
 * Initialize Synthesizer Prompts
 * Sets up all prompt components and returns initialization status
 * @returns {Object} Initialization status and configuration
 */
function initializeSynthesizerPrompts() {
  try {
    const config = getCompleteSynthesizerConfig();

    console.log(`✅ Synthesizer Prompts v${config.version} initialized successfully`);
    console.log(`📿 Available templates: ${Object.keys(config.templates).length}`);
    console.log(`🔤 Sanskrit concepts: ${Object.keys(config.sanskrit.coreConcepts).length}`);
    console.log(`🌸 System prompt components: ${Object.keys(config.system).length - 2}`); // -2 for version and complete

    return {
      success: true,
      version: config.version,
      status: 'initialized',
      config: config
    };
  } catch (error) {
    console.error('❌ Failed to initialize synthesizer prompts:', error);
    return {
      success: false,
      error: error.message,
      status: 'failed'
    };
  }
}

/**
 * Validate Synthesizer Configuration
 * Validates that all required prompt components are present and functional
 * @returns {Object} Validation results
 */
function validateSynthesizerConfig() {
  const results = {
    isValid: true,
    checks: [],
    errors: []
  };

  try {
    // Check system prompts
    const requiredSystemPrompts = ['coreIdentity', 'sacredBoundaries', 'synthesisMethodology', 'sanskritIntegration'];
    for (const prompt of requiredSystemPrompts) {
      if (!synthesizerPrompts.system[prompt]) {
        results.isValid = false;
        results.errors.push(`Missing system prompt: ${prompt}`);
      } else {
        results.checks.push(`✅ System prompt ${prompt} loaded`);
      }
    }

    // Check templates
    const requiredTemplates = ['generalGuidance', 'crisisSupport', 'philosophicalInquiry'];
    for (const template of requiredTemplates) {
      if (!synthesizerPrompts.templates[template]) {
        results.isValid = false;
        results.errors.push(`Missing template: ${template}`);
      } else {
        results.checks.push(`✅ Template ${template} loaded`);
      }
    }

    // Check Sanskrit integration
    if (!synthesizerPrompts.sanskrit.coreConcepts || Object.keys(synthesizerPrompts.sanskrit.coreConcepts).length === 0) {
      results.isValid = false;
      results.errors.push('Sanskrit core concepts missing or empty');
    } else {
      results.checks.push(`✅ Sanskrit concepts loaded: ${Object.keys(synthesizerPrompts.sanskrit.coreConcepts).length}`);
    }

    // Check utilities
    const requiredUtils = ['getSynthesizerSystemPrompt', 'getNarrativeTemplate', 'initializeSynthesizerPrompts'];
    for (const util of requiredUtils) {
      if (typeof eval(util) !== 'function') { // eslint-disable-line no-eval
        results.isValid = false;
        results.errors.push(`Missing utility function: ${util}`);
      } else {
        results.checks.push(`✅ Utility ${util} available`);
      }
    }

    if (results.isValid) {
      results.checks.push('🎉 All synthesizer prompt components validated successfully');
    }

    return results;
  } catch (error) {
    results.isValid = false;
    results.errors.push(`Validation error: ${error.message}`);
    return results;
  }
}

/**
 * Synthesizer Prompt Builder
 * Advanced utility for building custom synthesizer prompts
 */
class SynthesizerPromptBuilder {
  constructor() {
    this.components = [];
    this.customInstructions = [];
  }

  /**
   * Add system prompt component
   * @param {string} componentName - Name of component to add
   * @returns {SynthesizerPromptBuilder} This builder instance
   */
  addSystemComponent(componentName) {
    const component = getPromptComponent(componentName);
    if (component) {
      this.components.push(component);
    }
    return this;
  }

  /**
   * Add narrative template
   * @param {string} templateType - Type of template to add
   * @returns {SynthesizerPromptBuilder} This builder instance
   */
  addTemplate(templateType) {
    const template = getNarrativeTemplate(templateType);
    if (template) {
      this.components.push(template);
    }
    return this;
  }

  /**
   * Add custom instructions
   * @param {string} instructions - Custom instructions to add
   * @returns {SynthesizerPromptBuilder} This builder instance
   */
  addCustomInstructions(instructions) {
    this.customInstructions.push(instructions);
    return this;
  }

  /**
   * Build the complete prompt
   * @returns {string} Complete custom prompt
   */
  build() {
    const promptParts = [
      ...this.components,
      ...this.customInstructions
    ];

    return promptParts.join('\n\n---\n\n');
  }

  /**
   * Reset the builder
   * @returns {SynthesizerPromptBuilder} This builder instance
   */
  reset() {
    this.components = [];
    this.customInstructions = [];
    return this;
  }
}

// CommonJS exports
module.exports = {
  // Configuration
  synthesizerPrompts,
  getCompleteSynthesizerConfig,
  initializeSynthesizerPrompts,
  validateSynthesizerConfig,

  // System Prompts
  SYNTHESIZER_VERSION: "2.0.0-sanskrit-revolution", // Define the version
  coreIdentityPrompt: systemPrompts.coreIdentityPrompt,
  sacredBoundariesPrompt: systemPrompts.sacredBoundariesPrompt,
  synthesisMethodologyPrompt: systemPrompts.synthesisMethodologyPrompt,
  sanskritIntegrationPrompt: systemPrompts.sanskritIntegrationPrompt,
  getSynthesizerSystemPrompt: systemPrompts.getSynthesizerSystemPrompt,
  getPromptComponent: systemPrompts.getPromptComponent,

  // Templates
  baseResponseStructure: narrativeTemplates.baseResponseStructure,
  generalGuidanceTemplate: narrativeTemplates.generalGuidanceTemplate,
  crisisSupportTemplate: narrativeTemplates.crisisSupportTemplate,
  philosophicalInquiryTemplate: narrativeTemplates.philosophicalInquiryTemplate,
  sanskritGuidanceTemplate: narrativeTemplates.sanskritGuidanceTemplate,
  comparativeAnalysisTemplate: narrativeTemplates.comparativeAnalysisTemplate,
  getNarrativeTemplate: narrativeTemplates.getNarrativeTemplate,
  getResponseSection: narrativeTemplates.getResponseSection,
  composeCustomTemplate: narrativeTemplates.composeCustomTemplate,

  // Sanskrit Integration
  sanskritCoreConcepts: sanskritIntegration.sanskritCoreConcepts,
  sanskritIntegrationGuidelines: sanskritIntegration.sanskritIntegrationGuidelines,
  sanskritFormatters: sanskritIntegration.sanskritFormatters,
  sanskritWisdomPatterns: sanskritIntegration.sanskritWisdomPatterns,
  sanskritValidation: sanskritIntegration.sanskritValidation,
  sanskritHelpers: sanskritIntegration.sanskritHelpers,

  // Utilities
  SynthesizerPromptBuilder
};
