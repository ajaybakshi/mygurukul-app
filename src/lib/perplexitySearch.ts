// Direct Perplexity API integration - no SDK dependency

// ============================================================================
// PERPLEXITY API INTERFACES
// ============================================================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

export interface PerplexityCitation {
  start: number
  end: number
  text: string
  document_ids: string[]
}

export interface PerplexityChoice {
  index: number
  message: {
    role: string
    content: string
    citations?: PerplexityCitation[]
  }
  finish_reason: string
}

export interface PerplexityResponse {
  id: string
  object: string
  created: number
  model: string
  choices: PerplexityChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PerplexitySearchResult {
  title: string
  url: string
  snippet: string
  relevanceScore?: number
  sourceType: 'web' | 'document' | 'spiritual_text'
}

export interface PerplexitySearchResponse {
  answer: string
  results: PerplexitySearchResult[]
  citations: Array<{
    startIndex: number
    endIndex: number
    sources: Array<{
      referenceId: string
      title: string
      uri: string
    }>
  }>
  references: Array<{
    title: string
    uri: string
    chunkInfo?: {
      content: string
      relevanceScore?: number
      documentMetadata?: {
        document: string
        uri: string
        title: string
      }
    }
  }>
  steps?: Array<{
    state: string
    description: string
    actions?: Array<{
      searchAction?: {
        query: string
      }
      observation?: {
        searchResults?: Array<{
          document: string
          uri: string
          title: string
          snippetInfo?: Array<{
            snippet: string
            snippetStatus: string
          }>
        }>
      }
    }>
  }>
}

export interface PerplexitySearchOptions {
  model?: 'sonar' | 'sonar-small' | 'sonar-medium' | 'sonar-large' | 'pplx-7b-online' | 'pplx-70b-online' | 'pplx-7b-chat' | 'pplx-70b-chat'
  maxResults?: number
  includeSpiritualContext?: boolean
  searchFocus?: 'spiritual_texts' | 'general' | 'hybrid'
}

export class PerplexitySearchError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message)
    this.name = 'PerplexitySearchError'
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const PERPLEXITY_API_ENDPOINT = 'https://api.perplexity.ai/chat/completions'
const ENABLE_PERPLEXITY_SEARCH = process.env.ENABLE_PERPLEXITY_SEARCH === 'true'
const PERPLEXITY_SEARCH_WEIGHT = parseFloat(process.env.PERPLEXITY_SEARCH_WEIGHT || '0.15')

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function callPerplexityAPI(request: PerplexityRequest): Promise<PerplexityResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    console.log('🌐 Making direct Perplexity API call...')
    console.log('📤 Request payload:', JSON.stringify(request, null, 2))

    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('📥 Perplexity API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Perplexity API error response:', errorText)
      throw new PerplexitySearchError(
        `Perplexity API request failed: ${response.status} ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json() as PerplexityResponse
    console.log('✅ Perplexity API response received:', {
      id: data.id,
      model: data.model,
      choicesCount: data.choices.length,
      usage: data.usage
    })

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof PerplexitySearchError) {
      throw error
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new PerplexitySearchError('Perplexity API request timed out after 30 seconds')
      }
      throw new PerplexitySearchError(`Perplexity API error: ${error.message}`)
    }
    
    throw new PerplexitySearchError('Unknown error during Perplexity API call')
  }
}

function parsePerplexityCitations(choice: PerplexityChoice): Array<{
  startIndex: number
  endIndex: number
  sources: Array<{
    referenceId: string
    title?: string
    uri?: string
  }>
}> {
  if (!choice.message.citations) return []

  return choice.message.citations.map(citation => ({
    startIndex: citation.start,
    endIndex: citation.end,
    sources: citation.document_ids.map((docId, index) => ({
      referenceId: docId,
      title: `Source ${index + 1}`,
      uri: `https://perplexity.ai/source/${docId}`
    }))
  }))
}

function validateConfiguration(): void {
  if (!ENABLE_PERPLEXITY_SEARCH) {
    throw new PerplexitySearchError('Perplexity search is disabled', 503, 'DISABLED')
  }
  
  if (!PERPLEXITY_API_KEY) {
    throw new PerplexitySearchError('Perplexity API key not configured', 500, 'NO_API_KEY')
  }
}

function enhanceQueryForSpiritualSearch(query: string): string {
  // Enhance query with spiritual context and metadata keywords
  const spiritualEnhancements = [
    'spiritual wisdom',
    'sacred texts',
    'ancient scriptures',
    'dharmic teachings',
    'meditation guidance',
    'inner peace',
    'spiritual growth'
  ]
  
  const enhancedQuery = `${query} ${spiritualEnhancements.join(' ')}`
  console.log('🔍 Enhanced query for spiritual search:', enhancedQuery)
  
  return enhancedQuery
}

function createSpiritualContextPrompt(query: string): string {
  return `You are a spiritual guide searching for wisdom from ancient texts and sacred scriptures. 
  
  The seeker asks: "${query}"
  
  Please search for relevant spiritual wisdom, focusing on:
  - Ancient scriptures and sacred texts
  - Dharmic teachings and spiritual guidance
  - Meditation and inner peace practices
  - Stories and parables with spiritual lessons
  - Wisdom from spiritual masters and sages
  
  Provide a comprehensive, compassionate response that draws from authentic spiritual sources.`
}

function transformPerplexityResults(results: any[]): PerplexitySearchResult[] {
  return results.map((result, index) => ({
    title: result.title || `Spiritual Source ${index + 1}`,
    url: result.url || `https://spiritual-source-${index + 1}.org`,
    snippet: result.snippet || result.content || 'Spiritual wisdom content',
    relevanceScore: result.relevanceScore || (1.0 - index * 0.1),
    sourceType: 'spiritual_text' as const
  }))
}

function createMockResults(query: string): PerplexitySearchResponse {
  console.log('🧪 Creating mock Perplexity results for testing')
  
  const mockResults: PerplexitySearchResult[] = [
    {
      title: 'Bhagavad Gita - Chapter 2: Sankhya Yoga',
      url: 'https://sacred-texts.com/bhagavad-gita/chapter-2',
      snippet: 'The Bhagavad Gita teaches about dharma, karma, and the eternal nature of the soul. Lord Krishna guides Arjuna through his spiritual dilemma.',
      relevanceScore: 0.95,
      sourceType: 'spiritual_text'
    },
    {
      title: 'Upanishads - Brihadaranyaka Upanishad',
      url: 'https://sacred-texts.com/upanishads/brihadaranyaka',
      snippet: 'The Upanishads reveal the nature of Brahman, the ultimate reality, and the relationship between the individual soul and the universal consciousness.',
      relevanceScore: 0.88,
      sourceType: 'spiritual_text'
    },
    {
      title: 'Meditation Techniques from Patanjali Yoga Sutras',
      url: 'https://sacred-texts.com/yoga-sutras/meditation',
      snippet: 'Patanjali outlines the eight limbs of yoga, including meditation practices for achieving inner peace and spiritual enlightenment.',
      relevanceScore: 0.82,
      sourceType: 'spiritual_text'
    }
  ]

  const mockAnswer = `Based on the ancient spiritual texts, I found wisdom that addresses your question about "${query}". 

The sacred scriptures teach us that true understanding comes from within, through meditation and self-reflection. The Bhagavad Gita reminds us that we are eternal souls on a spiritual journey, and the Upanishads guide us toward realizing our true nature.

This wisdom has been passed down through generations of spiritual masters and continues to offer guidance for seekers on the path of dharma.`

  return {
    answer: mockAnswer,
    results: mockResults,
    citations: [
      {
        startIndex: 45,
        endIndex: 120,
        sources: [{
          referenceId: 'bg-ch2',
          title: 'Bhagavad Gita - Chapter 2',
          uri: 'https://sacred-texts.com/bhagavad-gita/chapter-2'
        }]
      }
    ],
    references: mockResults.map(result => ({
      title: result.title,
      uri: result.url,
      chunkInfo: {
        content: result.snippet,
        relevanceScore: result.relevanceScore,
        documentMetadata: {
          document: result.url,
          uri: result.url,
          title: result.title
        }
      }
    })),
    steps: [
      {
        state: 'COMPLETED',
        description: 'Searched spiritual texts for relevant wisdom',
        actions: [
          {
            searchAction: {
              query: enhanceQueryForSpiritualSearch(query)
            },
            observation: {
              searchResults: mockResults.map(result => ({
                document: result.url,
                uri: result.url,
                title: result.title,
                snippetInfo: [{
                  snippet: result.snippet,
                  snippetStatus: 'SUCCESS'
                }]
              }))
            }
          }
        ]
      }
    ]
  }
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

export async function perplexitySearch(
  query: string, 
  options: PerplexitySearchOptions = {}
): Promise<PerplexitySearchResponse> {
  const startTime = Date.now()
  
  try {
    // Validate configuration
    validateConfiguration()
    
    console.log('🔍 Starting Perplexity search for query:', query)
    console.log('⚙️ Search options:', options)
    
    // Use mock results for initial testing
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_PERPLEXITY === 'true') {
      console.log('🧪 Using mock Perplexity results for development')
      return createMockResults(query)
    }
    
    // Enhance query for spiritual search
    const enhancedQuery = options.includeSpiritualContext !== false 
      ? enhanceQueryForSpiritualSearch(query)
      : query
    
    // Create spiritual context prompt
    const spiritualPrompt = createSpiritualContextPrompt(query)
    
    // Configure Perplexity client
    const model = options.model || 'sonar'
    const maxResults = options.maxResults || 10
    
    console.log('🤖 Using Perplexity model:', model)
    console.log('📊 Max results:', maxResults)
    
    // Prepare Perplexity API request
    const perplexityRequest: PerplexityRequest = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a wise spiritual guide who searches for and synthesizes wisdom from ancient texts and sacred scriptures. Always provide compassionate, accurate guidance grounded in authentic spiritual sources.'
        },
        {
          role: 'user',
          content: `${spiritualPrompt}\n\nSearch Query: ${enhancedQuery}\n\nPlease provide a comprehensive spiritual response with relevant citations and sources.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9
    }
    
    // Perform the search using direct Perplexity API
    const response = await callPerplexityAPI(perplexityRequest)
    
    const searchTime = Date.now() - startTime
    console.log(`✅ Perplexity search completed in ${searchTime}ms`)
    
    // Transform the Perplexity API response into our expected format
    const choice = response.choices[0]
    const answerText = choice?.message?.content || 'No answer generated'
    const citations = choice ? parsePerplexityCitations(choice) : []
    
    const transformedResponse: PerplexitySearchResponse = {
      answer: answerText,
      results: [], // Perplexity doesn't return structured search results
      citations: citations.map(citation => ({
        ...citation,
        sources: citation.sources.map(source => ({
          referenceId: source.referenceId,
          title: source.title || 'Perplexity Source',
          uri: source.uri || 'https://perplexity.ai'
        }))
      })),
      references: citations.map(citation => ({
        title: citation.sources[0]?.title || 'Perplexity Source',
        uri: citation.sources[0]?.uri || 'https://perplexity.ai',
        chunkInfo: {
          content: answerText.slice(citation.startIndex, citation.endIndex),
          relevanceScore: 0.9,
          documentMetadata: {
            document: citation.sources[0]?.uri || 'https://perplexity.ai',
            uri: citation.sources[0]?.uri || 'https://perplexity.ai',
            title: citation.sources[0]?.title || 'Perplexity Source'
          }
        }
      })),
      steps: [
        {
          state: 'COMPLETED',
          description: `Perplexity search using ${model}`,
          actions: [
            {
              searchAction: {
                query: enhancedQuery
              },
              observation: {
                searchResults: []
              }
            }
          ]
        }
      ]
    }
    
    console.log('📝 Transformed Perplexity response:', {
      answerLength: transformedResponse.answer.length,
      hasSteps: !!transformedResponse.steps,
      stepCount: transformedResponse.steps?.length || 0
    })
    
    return transformedResponse
    
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error('❌ Perplexity search error:', error)
    console.error(`⏱️ Error occurred after ${errorTime}ms`)
    
    if (error instanceof PerplexitySearchError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new PerplexitySearchError(
        `Perplexity search failed: ${error.message}`,
        500,
        'SEARCH_FAILED'
      )
    }
    
    throw new PerplexitySearchError(
      'Unknown error during Perplexity search',
      500,
      'UNKNOWN_ERROR'
    )
  }
}

// ============================================================================
// UTILITY FUNCTIONS FOR HYBRID SEARCH
// ============================================================================

export function getPerplexitySearchWeight(): number {
  return PERPLEXITY_SEARCH_WEIGHT
}

export function isPerplexitySearchEnabled(): boolean {
  return ENABLE_PERPLEXITY_SEARCH
}

export async function testPerplexityConnection(): Promise<boolean> {
  try {
    validateConfiguration()
    console.log('🔗 Testing Perplexity API connection...')
    
    // Simple test request
    const testRequest: PerplexityRequest = {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: 'Test connection - respond with "Hello"'
        }
      ],
      max_tokens: 10
    }
    
    const testResponse = await callPerplexityAPI(testRequest)
    
    console.log('✅ Perplexity API connection successful')
    return true
  } catch (error) {
    console.error('❌ Perplexity API connection failed:', error)
    return false
  }
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export const PERPLEXITY_CONFIG = {
  apiKey: PERPLEXITY_API_KEY,
  apiEndpoint: PERPLEXITY_API_ENDPOINT,
  enabled: ENABLE_PERPLEXITY_SEARCH,
  searchWeight: PERPLEXITY_SEARCH_WEIGHT,
  defaultModel: 'sonar' as const,
  maxResults: 10,
  timeout: 30000
} as const
