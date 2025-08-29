import { perplexitySearch } from './perplexitySearch'

/**
 * HYDE (Hypothetical Document Embeddings) Service for Spiritual AI
 * 
 * This service implements the HYDE approach to enhance query retrieval by:
 * 1. Generating a hypothetical document that would answer the user's question
 * 2. Extracting key terms and concepts from this document
 * 3. Using these terms to enhance the original query for better retrieval
 * 
 * HYDE is particularly effective for spiritual queries as it can generate
 * contextually rich documents that capture the essence of spiritual concepts
 * and traditional terminology that might not be present in the original query.
 * 
 * The service is designed to:
 * - Maintain 100% corpus purity (no external content in final responses)
 * - Provide graceful fallback if HYDE fails
 * - Support comprehensive logging for debugging and optimization
 * - Be completely toggleable via environment variables
 */

export interface HydeResult {
  success: boolean
  document?: string
  extractedTerms: string[]
  confidence: number
  processingTime: number
  error?: string
}

export interface HydeConfig {
  enabled: boolean
  timeout: number
  targetLength: number
  model: string
  minConfidence: number
  rolloutPercentage: number
}

export interface ExtractedTerms {
  terms: string[]
  confidence: number
  categories: {
    spiritual: string[]
    philosophical: string[]
    traditional: string[]
    contextual: string[]
  }
}

const DEFAULT_HYDE_CONFIG: HydeConfig = {
  enabled: process.env.HYDE_ENABLED === 'true',
  timeout: 10000, // 10 seconds
  targetLength: 150, // 100-200 words
  model: 'sonar',
  minConfidence: 0.3,
  rolloutPercentage: parseInt(process.env.HYDE_ROLLOUT_PERCENTAGE || '0', 10)
}

const SPIRITUAL_HYDE_PROMPT = `As a wise spiritual scholar, you are tasked with creating a hypothetical document that would answer a seeker's question about spiritual topics. This document should be written in the style of ancient sacred texts and contain the wisdom that would naturally answer their question.

Your task is to write a 100-200 word document that:
1. Addresses the core spiritual question directly
2. Uses traditional Sanskrit terminology and spiritual concepts
3. Reflects the style and depth of ancient scriptures
4. Contains specific terms and concepts that would help find relevant passages
5. Maintains the compassionate, humble tone of spiritual guidance

QUESTION: "{userQuery}"

Write a document that would naturally answer this seeker's question. Focus on spiritual wisdom, traditional concepts, and Sanskrit terminology that would help locate relevant passages in sacred texts.`

const TERM_EXTRACTION_PROMPT = `Extract key spiritual terms, concepts, and Sanskrit words from this hypothetical spiritual document. Focus on terms that would help find relevant passages in ancient sacred texts.

Document: "{document}"

Extract and categorize the most important terms:

**Spiritual Terms**: Sanskrit spiritual concepts, philosophical terms
**Philosophical Terms**: Logical and metaphysical concepts
**Traditional Terms**: Classical terminology, ancient practices
**Contextual Terms**: Related concepts, supporting ideas

Provide only the extracted terms, separated by spaces, in this format:
spiritual_term1 spiritual_term2 philosophical_term1 traditional_term1 contextual_term1

Example: dharma karma moksha atman brahman meditation vedas upanishads`

/**
 * Generate a hypothetical document for HYDE query enhancement
 * @param userQuery - The original user question
 * @param config - HYDE configuration options
 * @param sessionId - Optional session ID for A/B testing consistency
 * @returns Promise<HydeResult> - The HYDE generation result
 */
export async function generateHypotheticalDocument(
  userQuery: string,
  config: Partial<HydeConfig> = {},
  sessionId?: string | null
): Promise<HydeResult> {
  const startTime = Date.now()
  const finalConfig = { ...DEFAULT_HYDE_CONFIG, ...config }
  
  console.log('🔮 HYDE: Starting hypothetical document generation for:', userQuery)
  
  // Check if HYDE should be enabled for this specific query (A/B testing)
  const shouldEnable = shouldEnableHydeForQuery(userQuery, sessionId)
  
  if (!shouldEnable) {
    console.log('🔮 HYDE: Disabled by A/B testing or configuration')
    return {
      success: false,
      extractedTerms: [],
      confidence: 0,
      processingTime: Date.now() - startTime,
      error: 'HYDE disabled by A/B testing or configuration'
    }
  }

  try {
    // Create timeout promise
    const timeoutPromise = createTimeoutPromise(finalConfig.timeout)
    
    // Generate the hypothetical document
    const documentPromise = generateSpiritualDocument(userQuery, finalConfig)
    
    // Race between document generation and timeout
    const document = await Promise.race([documentPromise, timeoutPromise])
    
    if (!document) {
      throw new Error('Document generation timed out')
    }
    
    // Extract terms from the generated document
    const extractedTerms = await extractTermsFromDocument(document, finalConfig)
    
    // Calculate confidence score
    const confidence = calculateConfidence(document, extractedTerms, finalConfig)
    
    const processingTime = Date.now() - startTime
    
    console.log('🔮 HYDE: Successfully generated document with', extractedTerms.terms.length, 'terms')
    
    return {
      success: true,
      document,
      extractedTerms: extractedTerms.terms,
      confidence,
      processingTime
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown HYDE error'
    
    console.log('🔮 HYDE: Error during generation:', errorMessage)
    
    return {
      success: false,
      extractedTerms: [],
      confidence: 0,
      processingTime,
      error: errorMessage
    }
  }
}

/**
 * Generate a spiritual document using Perplexity AI
 */
async function generateSpiritualDocument(userQuery: string, config: HydeConfig): Promise<string> {
  const prompt = SPIRITUAL_HYDE_PROMPT.replace('{userQuery}', userQuery)
  
  const response = await perplexitySearch(prompt, {
    model: config.model as any,
    includeSpiritualContext: true,
    searchFocus: 'spiritual_texts'
  })
  
  if (!response || !response.answer) {
    throw new Error('No response from Perplexity for document generation')
  }
  
  return response.answer.trim()
}

/**
 * Extract key terms from the generated document
 */
async function extractTermsFromDocument(document: string, config: HydeConfig): Promise<ExtractedTerms> {
  const prompt = TERM_EXTRACTION_PROMPT.replace('{document}', document)
  
  const response = await perplexitySearch(prompt, {
    model: config.model as any,
    includeSpiritualContext: true,
    searchFocus: 'spiritual_texts'
  })
  
  if (!response || !response.answer) {
    throw new Error('No response from Perplexity for term extraction')
  }
  
  const terms = response.answer.trim().split(/\s+/).filter(term => term.length > 2)
  
  // Categorize terms (simplified categorization)
  const categories = {
    spiritual: terms.filter(term => /^(dharma|karma|moksha|atman|brahman|meditation|vedas|upanishads|yoga|sanskrit)/i.test(term)),
    philosophical: terms.filter(term => /^(philosophy|logic|metaphysics|consciousness|liberation|enlightenment)/i.test(term)),
    traditional: terms.filter(term => /^(ancient|classical|traditional|scripture|text|practice)/i.test(term)),
    contextual: terms.filter(term => !/^(dharma|karma|moksha|atman|brahman|meditation|vedas|upanishads|yoga|sanskrit|philosophy|logic|metaphysics|consciousness|liberation|enlightenment|ancient|classical|traditional|scripture|text|practice)/i.test(term))
  }
  
  return {
    terms,
    confidence: Math.min(terms.length / 10, 1.0), // Simple confidence based on term count
    categories
  }
}

/**
 * Calculate confidence score for the HYDE result
 */
function calculateConfidence(document: string, extractedTerms: ExtractedTerms, config: HydeConfig): number {
  let confidence = 0
  
  // Document length factor
  if (document.length >= 100 && document.length <= 300) {
    confidence += 0.2
  }
  
  // Term count factor
  if (extractedTerms.terms.length >= 5) {
    confidence += 0.3
  }
  
  // Spiritual term presence
  if (extractedTerms.categories.spiritual.length > 0) {
    confidence += 0.3
  }
  
  // Traditional term presence
  if (extractedTerms.categories.traditional.length > 0) {
    confidence += 0.2
  }
  
  return Math.min(confidence, 1.0)
}

/**
 * Generate a deterministic hash for consistent user experience
 */
export function generateUserHash(userQuery: string, sessionId?: string | null): number {
  const input = `${userQuery}:${sessionId || 'anonymous'}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Check if HYDE should be enabled for this specific query (A/B testing)
 */
export function shouldEnableHydeForQuery(userQuery: string, sessionId?: string | null): boolean {
  const config = getHydeConfig()
  
  // If HYDE is globally disabled, return false
  if (!config.enabled) {
    return false
  }
  
  // If rollout percentage is 0, return false
  if (config.rolloutPercentage <= 0) {
    return false
  }
  
  // If rollout percentage is 100, return true
  if (config.rolloutPercentage >= 100) {
    return true
  }
  
  // Generate deterministic hash for consistent experience
  const userHash = generateUserHash(userQuery, sessionId)
  const hashPercentage = userHash % 100
  
  // Enable HYDE if hash percentage is within rollout percentage
  const shouldEnable = hashPercentage < config.rolloutPercentage
  
  console.log('🔮 HYDE A/B Test:', {
    userQuery: userQuery.substring(0, 50) + '...',
    sessionId: sessionId || 'anonymous',
    userHash,
    hashPercentage,
    rolloutPercentage: config.rolloutPercentage,
    shouldEnable
  })
  
  return shouldEnable
}

/**
 * Check if HYDE is enabled (legacy function for backward compatibility)
 */
export function isHydeEnabled(): boolean {
  return process.env.HYDE_ENABLED === 'true'
}

/**
 * Get HYDE configuration
 */
export function getHydeConfig(): HydeConfig {
  return { ...DEFAULT_HYDE_CONFIG }
}

/**
 * Create a timeout promise
 */
function createTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('HYDE operation timed out')), timeout)
  })
}

/**
 * Log HYDE operation details
 */
export function logHydeOperation(
  operation: string,
  userQuery: string,
  result: HydeResult,
  sessionId?: string | null,
  additionalData?: Record<string, any>
): void {
  const config = getHydeConfig()
  const shouldEnable = shouldEnableHydeForQuery(userQuery, sessionId)
  
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    userQuery: userQuery.substring(0, 100) + (userQuery.length > 100 ? '...' : ''),
    sessionId: sessionId || 'anonymous',
    abTesting: {
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage,
      shouldEnable,
      userHash: generateUserHash(userQuery, sessionId),
      hashPercentage: generateUserHash(userQuery, sessionId) % 100
    },
    hydeResult: {
      success: result.success,
      termCount: result.extractedTerms.length,
      terms: result.extractedTerms,
      confidence: result.confidence,
      processingTime: result.processingTime,
      error: result.error
    },
    ...additionalData
  }
  
  console.log('🔮 HYDE LOG:', JSON.stringify(logData, null, 2))
}

export { DEFAULT_HYDE_CONFIG }
