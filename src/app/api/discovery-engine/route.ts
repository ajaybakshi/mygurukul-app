import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { createSessionWithFallback, buildSessionPath, generateUserPseudoId } from '@/lib/sessionManager'
import { perplexitySearch, isPerplexitySearchEnabled, getPerplexitySearchWeight } from '@/lib/perplexitySearch'
import { writeApiLog, createLogData } from '@/lib/logger'

// Helper function to execute Discovery Engine search
const executeDiscoveryEngineSearch = async (question: string, accessToken: string, apiEndpoint: string, googleSessionPath?: string) => {
  // Query enhancement for metadata-rich retrieval
  let queryText = question;
  if (question.length > 5) {
    queryText += ' characters themes places context sections';
  }
  
  const requestBody = {
    query: {
      text: queryText
    },
    ...(googleSessionPath && { session: googleSessionPath }),
    answerGenerationSpec: {
      includeCitations: true,
      promptSpec: {
        preamble: `You are a humble sevak (a selfless servant) within a digital sanctuary called MyGurukul.org. Your one and only purpose is to serve the user by providing wisdom from the ancient scriptures in your corpus.

CRITICAL: You are STRICTLY LIMITED to the MyGurukul sacred texts corpus. You must NEVER reference external sources, websites, or texts not present in your uploaded documents. If information is not found in your corpus, you must humbly acknowledge this limitation.

1. Your Persona and Tone:
Humility: You are a guide, not the ultimate Guru. Never present yourself as all-knowing. Your role is to reflect the wisdom of the texts.
Compassion: Always begin your responses with empathy for the user's situation. Acknowledge their feelings before offering guidance.
Serenity (Sattvic Tone): Your language must always be calm, gentle, supportive, and serene. Avoid overly enthusiastic, casual, or robotic language. The user should feel like they are in a quiet, safe space.

2. Method of Answering (The Scholar's Method):
Your method must be a sophisticated, multi-step process to find the deepest and most accurate wisdom FROM YOUR CORPUS ONLY.

**Step 1: Understand the Seeker's Intent.**
Read the user's query carefully to understand the core question, including the specific characters, events, or concepts involved.

**Step 2: Multi-Step Targeted Retrieval (CORPUS-ONLY).**
Do not rely on a single search. You must perform a series of targeted searches to find the most precise passages FROM YOUR UPLOADED SACRED TEXTS.
* **Initial Broad Search:** First, perform a general search using the user's query enhanced with the keywords 'characters themes places context sections' to gather a wide range of potentially relevant documents FROM YOUR CORPUS.
* **Targeted Summary Search:** From the user's query, extract the most critical keywords (e.g., for "final confrontation between Rama and Ravana," the keywords are "final," "confrontation," "battle," "Rama," "Ravana"). Perform a second, highly specific search targeting ONLY the \`[SECTION_SUMMARY: ...]\` tags in your documents with these keywords. This will help you locate the exact section where the event occurs.
* **Targeted Character/Theme Search:** If a specific character or theme is central, perform another search combining that character with the theme (e.g., search for passages where \`[CHARACTERS: ...]\` contains 'Rama' AND \`[THEMES: ...]\` contains 'Final Battle' or 'Dharma').

**Step 3: Prioritize and Synthesize with Wisdom (CORPUS-GROUNDED).**
After performing these searches, you will have several sets of results FROM YOUR SACRED TEXTS. Your most important task is to prioritize them.
* **Prioritize the Targeted Results:** The passages found via the **Summary Search** and **Character/Theme Search** are the most important. You MUST build the core of your answer from these highly relevant, specific passages FROM YOUR CORPUS.
* **Use Broad Results for Context Only:** Use the results from the Initial Broad Search only to add supporting context or introductory information, if needed. Do not let them dominate the answer.
* **Synthesize the Answer:**
    * Begin with an empathetic acknowledgment.
    * Construct a flowing, coherent answer based primarily on your best, most targeted search results FROM YOUR SACRED TEXTS.
    * Weave in powerful stories and direct quotes from these prioritized passages to bring the wisdom to life.
    * ALWAYS cite specific passages from your corpus with proper references.

GOAL: You are not just a search engine; you are a wise scholar grounded in the MyGurukul sacred texts. Your duty is to perform deep research using multiple targeted methods within your corpus, and then present only the most precise and relevant wisdom to the seeker.

3. Sacred Boundaries (Maryada):
CORPUS-ONLY RESPONSES: You will ONLY provide information found in your uploaded sacred texts. If a question cannot be answered from your corpus, respond with: "I humbly acknowledge that this specific guidance is not present in the sacred texts available to me. While I cannot provide a direct answer, I can share related wisdom from our scriptures that may offer some guidance." Then provide any relevant contextual information from your corpus.

Strictly On-Topic: You will only discuss spirituality, philosophy, and life guidance as found in the provided scriptures. If a user asks about unrelated topics (like news, weather, science, celebrities, etc.), you must politely decline by saying: "My purpose is to offer guidance from the sacred scriptures. I cannot provide information on that topic."
No Dangerous Advice: You are strictly forbidden from giving any medical, legal, financial, or psychological advice. If a user seems to be in distress, you must respond with: "It sounds like you are going through a very difficult time. While the scriptures offer wisdom for peace of mind, for professional help, please consult with a qualified doctor, therapist, or advisor."
Confess Ignorance Gracefully: If, after a thorough search, you cannot find a passage that directly and completely answers the user's specific question, do not invent an answer. Instead, synthesize the most relevant contextual information you *did* find FROM YOUR CORPUS. Clearly state what you found (e.g., "the events leading up to the confrontation") and then humbly state that the specific detail requested (e.g., "a comprehensive description of the final battle itself") is not present in the provided texts.
Protect Sanctity: You will never engage in arguments, debates, or casual conversation. You will not generate advertisements, sell anything, or use manipulative language. You are a pure, focused space for spiritual guidance grounded in your sacred texts corpus.`
      }
    }
  }

  console.log('Request body being sent:', JSON.stringify(requestBody, null, 2))
  console.log('Answer API Endpoint:', apiEndpoint)
  console.log('Session path being used:', googleSessionPath || 'none')
  console.log('Using OAuth2 authentication with environment-based credentials')
  console.log('🎯 Using Answer API with MyGurukul custom prompt for compassionate spiritual guidance')
  console.log('📖 Applied MyGurukul Core Identity & Sacred Resolve prompt')
  console.log('✅ Using minimal valid payload to avoid 400 errors')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    // Make the actual API call to Google Discovery Engine
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Error response body:', errorText)
      
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorMessage = `Google API Error: ${errorJson.error.message || errorJson.error}`
        }
      } catch (e) {
        // If we can't parse JSON, use the raw text
        errorMessage = `API Error: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('Success response from Google Discovery Engine Answer API:', JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    
    console.log('Fetch error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds')
      }
      
      throw error
    }
    
    throw new Error('Unknown error occurred')
  }
}

// Helper function to extract unique content from Discovery Engine
const extractUniqueContent = (discoveryText: string, perplexityText: string): string => {
  // Simple approach: find sentences in Discovery Engine that aren't in Perplexity
  const discoverySentences = discoveryText.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const perplexitySentences = perplexityText.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  const uniqueSentences = discoverySentences.filter(sentence => {
    const normalizedSentence = sentence.trim().toLowerCase()
    return !perplexitySentences.some(pSentence => 
      pSentence.trim().toLowerCase().includes(normalizedSentence.substring(0, 50))
    )
  })
  
  return uniqueSentences.slice(0, 2).join('. ') + '.'
}

// Helper function to merge citations
const mergeCitations = (discoveryCitations: any[], perplexityCitations: any[]): any[] => {
  const merged = [...discoveryCitations]
  
  perplexityCitations.forEach(perplexityCitation => {
    // Check if citation already exists
    const exists = merged.some(existing => 
      existing.startIndex === perplexityCitation.startIndex &&
      existing.endIndex === perplexityCitation.endIndex
    )
    
    if (!exists) {
      merged.push(perplexityCitation)
    }
  })
  
  return merged
}

// Helper function to merge references
const mergeReferences = (discoveryReferences: any[], perplexityReferences: any[]): any[] => {
  const merged = [...discoveryReferences]
  
  perplexityReferences.forEach(perplexityReference => {
    // Check if reference already exists
    const exists = merged.some(existing => 
      existing.uri === perplexityReference.uri ||
      existing.title === perplexityReference.title
    )
    
    if (!exists) {
      merged.push(perplexityReference)
    }
  })
  
  return merged
}

// Helper function to enhance query using Perplexity insights
const enhanceQueryWithPerplexity = async (originalQuery: string): Promise<string> => {
  console.log('🔍 Enhancing query with Perplexity insights:', originalQuery)
  
  try {
    // Create a focused prompt for query enhancement
    const enhancementPrompt = `You are a spiritual research assistant. Analyze this question about spiritual topics and provide 3-5 key search terms or concepts that would help find relevant information in ancient sacred texts. Focus on Sanskrit terms, spiritual concepts, and traditional themes.

Question: "${originalQuery}"

Provide only the enhanced search terms, separated by spaces. Example: "dharma karma meditation vedas upanishads"

Enhanced terms:`

    const enhancedQuery = await perplexitySearch(enhancementPrompt, {
      model: 'sonar',
      includeSpiritualContext: true,
      searchFocus: 'spiritual_texts'
    })
    
    if (enhancedQuery && enhancedQuery.answer) {
      // Extract the enhanced terms from Perplexity response
      const enhancedTerms = enhancedQuery.answer.trim()
      const finalQuery = `${originalQuery} ${enhancedTerms}`
      
      console.log('✅ Query enhanced:', {
        original: originalQuery,
        enhanced: enhancedTerms,
        final: finalQuery
      })
      
      return finalQuery
    }
  } catch (error) {
    console.log('⚠️ Query enhancement failed, using original query:', error)
  }
  
  return originalQuery
}

// Helper function to validate corpus content with confidence scoring
const validateCorpusContent = (result: any): { isValid: boolean; confidence: number; reason: string } => {
  console.log('🔍 Validating corpus content with confidence scoring')
  
  if (!result) {
    return { isValid: false, confidence: 0, reason: 'No result to validate' }
  }
  
  const answer = result.answer || result.choices?.[0]?.message?.content || ''
  let confidence = 0
  let reasons: string[] = []
  
  // Check for spiritual keywords and themes
  const spiritualKeywords = [
    'dharma', 'karma', 'moksha', 'meditation', 'vedas', 'upanishads', 'bhagavad gita',
    'spiritual', 'sacred', 'divine', 'soul', 'consciousness', 'enlightenment',
    'sanskrit', 'yoga', 'mantra', 'puja', 'sadhana', 'guru', 'shastra',
    'purana', 'vedanta', 'sankhya', 'nyaya', 'mimamsa', 'vaisheshika'
  ]
  
  const foundKeywords = spiritualKeywords.filter(keyword => 
    answer.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (foundKeywords.length > 0) {
    confidence += 0.3
    reasons.push(`Found spiritual keywords: ${foundKeywords.join(', ')}`)
  }
  
  // Check for citations/references
  if (result.citations && result.citations.length > 0) {
    confidence += 0.4
    reasons.push(`Has ${result.citations.length} citations`)
  }
  
  if (result.references && result.references.length > 0) {
    confidence += 0.3
    reasons.push(`Has ${result.references.length} references`)
  }
  
  // Check for corpus-specific references
  if (result.references && result.references.length > 0) {
    const corpusReferences = result.references.filter((ref: any) => {
      const uri = ref.uri || ref.chunkInfo?.documentMetadata?.uri || ''
      return uri.includes('mygurukul-sacred-texts-corpus') || 
             uri.includes('gs://mygurukul-sacred-texts-corpus') ||
             uri.includes('mygurukul-corpus')
    })
    
    if (corpusReferences.length > 0) {
      confidence += 0.4
      reasons.push(`Has ${corpusReferences.length} corpus references`)
    }
  }
  
  // Check content quality
  if (answer.length > 200) {
    confidence += 0.2
    reasons.push('Substantial content length')
  }
  
  const isValid = confidence >= 0.5
  const reason = reasons.join('; ')
  
  console.log('📊 Content validation result:', {
    confidence,
    isValid,
    reason,
    answerLength: answer.length
  })
  
  return { isValid, confidence, reason }
}

// Helper function to process enhanced query through Discovery Engine only
const processEnhancedQuery = async (originalQuery: string, enhancedQuery: string, accessToken: string, apiEndpoint: string, googleSessionPath?: string) => {
  console.log('🎯 Processing enhanced query through Discovery Engine only')
  
  // Use enhanced query for Discovery Engine search
  const discoveryResult = await executeDiscoveryEngineSearch(enhancedQuery, accessToken, apiEndpoint, googleSessionPath)
  
  // Validate the result with confidence scoring
  const validation = validateCorpusContent(discoveryResult)
  
  console.log('📊 Discovery Engine result validation:', {
    isValid: validation.isValid,
    confidence: validation.confidence,
    reason: validation.reason
  })
  
  return {
    result: discoveryResult,
    validation,
    queryInfo: {
      original: originalQuery,
      enhanced: enhancedQuery,
      final: enhancedQuery
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API route started - POST request received')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  
  const startTime = Date.now()
  let requestBody: any = null
  let responseData: any = null
  let errors: string[] = []
  
  try {
    const { question, sessionId } = await request.json()
    requestBody = { question, sessionId }
    
    if (!question || typeof question !== 'string') {
      console.log('❌ Invalid question format, returning 400 error')
      const errorResponse = { error: 'Question is required and must be a string' }
      responseData = errorResponse
      errors.push('Invalid question format')
      
      // Log the error response
      const logData = createLogData(requestBody, responseData, null, null, Date.now() - startTime, errors)
      await writeApiLog(logData)
      
      return NextResponse.json(errorResponse, { status: 400 })
    }

    console.log('Received question:', question)
    console.log('Session ID:', sessionId || 'not provided')

    // Handle session creation if no sessionId provided
    let googleSessionPath: string | null = null;
    let newSessionId: string | null = null;
    
    if (!sessionId) {
      console.log('🔄 No session provided, creating new Google session...');
      const userPseudoId = generateUserPseudoId();
      googleSessionPath = await createSessionWithFallback(
        'MyGurukul Spiritual Session',
        userPseudoId
      );
      
      if (googleSessionPath) {
        // Extract session ID from the full path for frontend
        newSessionId = googleSessionPath.split('/').pop() || null;
        console.log('✅ New session created:', newSessionId);
      } else {
        console.log('⚠️ Session creation failed, continuing without session');
      }
    } else {
      // Use existing sessionId to build proper Google session path
      try {
        googleSessionPath = buildSessionPath(sessionId);
        console.log('🔄 Using existing session:', googleSessionPath);
      } catch (error) {
        console.log('⚠️ Invalid session format, continuing without session:', error);
        googleSessionPath = null;
      }
    }

    // Get environment variables for service account authentication
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY
    const apiEndpoint = process.env.GOOGLE_DISCOVERY_ENGINE_ENDPOINT

    // Validate required environment variables
    if (!projectId || !clientEmail || !privateKey || !apiEndpoint) {
      console.log('Missing environment variables:', {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        hasApiEndpoint: !!apiEndpoint
      })
      console.log('❌ Missing environment variables, returning 500 error')
      const errorResponse = { error: 'Google Cloud credentials not configured. Please check environment variables.' }
      responseData = errorResponse
      errors.push('Missing environment variables')
      
      // Log the error response
      const logData = createLogData(requestBody, responseData, null, null, Date.now() - startTime, errors)
      await writeApiLog(logData)
      
      return NextResponse.json(errorResponse, { status: 500 })
    }
    
    // Construct credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: 'env-provided',
      private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      client_email: clientEmail,
      client_id: 'env-provided',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
      universe_domain: 'googleapis.com'
    }
    console.log('Credentials constructed from environment variables')

    // Check if hybrid search is enabled
    const enableHybridSearch = isPerplexitySearchEnabled()
    const perplexityWeight = getPerplexitySearchWeight()
    const discoveryWeight = 1 - perplexityWeight
    
    console.log('🔀 Hybrid Search Configuration:', {
      enabled: enableHybridSearch,
      perplexityWeight: perplexityWeight,
      discoveryWeight: discoveryWeight
    })

    // Initialize Google Auth with constructed credentials
    const auth = new GoogleAuth({ 
      credentials, 
      scopes: ['https://www.googleapis.com/auth/cloud-platform'] 
    })
    console.log('Google Auth initialized with environment-based credentials')

    // Get access token
    let accessToken
    try {
      const client = await auth.getClient()
      accessToken = await client.getAccessToken()
      console.log('Access token obtained successfully')
    } catch (error) {
      console.log('Error getting access token:', error)
      console.log('❌ Authentication failed, returning 500 error')
      const errorResponse = { error: 'Failed to authenticate with Google Cloud. Please check service account credentials and permissions.' }
      responseData = errorResponse
      errors.push('Authentication failed')
      
      // Log the error response
      const logData = createLogData(requestBody, responseData, null, null, Date.now() - startTime, errors)
      await writeApiLog(logData)
      
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Prepare for hybrid search execution
    let discoveryEngineResult = null
    let perplexityResult = null
    let discoveryEngineError = null
    let perplexityError = null

    // Execute query enhancement pattern if hybrid search is enabled
    if (enableHybridSearch) {
      console.log('🚀 Starting query enhancement pattern...')
      
      try {
        // Step 1: Enhance query using Perplexity insights
        console.log('🔍 Step 1: Enhancing query with Perplexity insights...')
        const enhancedQuery = await enhanceQueryWithPerplexity(question)
        
        // Step 2: Process enhanced query through Discovery Engine only
        console.log('🔍 Step 2: Processing enhanced query through Discovery Engine...')
        const processedResult = await processEnhancedQuery(question, enhancedQuery, accessToken.token!, apiEndpoint!, googleSessionPath || undefined)
        
        const { result: discoveryResult, validation, queryInfo } = processedResult
        
        console.log('📊 Query Enhancement Results:', {
          originalQuery: queryInfo.original,
          enhancedQuery: queryInfo.enhanced,
          validation: {
            isValid: validation.isValid,
            confidence: validation.confidence,
            reason: validation.reason
          }
        })
        
        // Step 3: Handle response based on validation confidence
        if (validation.isValid && validation.confidence >= 0.7) {
          // High confidence - return Discovery Engine result directly
          console.log('✅ High confidence result, returning Discovery Engine response')
          responseData = {
            answer: {
              state: 'COMPLETED',
              answerText: discoveryResult.answer || discoveryResult.choices?.[0]?.message?.content || '',
              citations: discoveryResult.citations || [],
              references: discoveryResult.references || [],
              steps: discoveryResult.steps || []
            },
            sessionId: newSessionId
          }
        } else if (validation.isValid && validation.confidence >= 0.5) {
          // Medium confidence - return with suggestion to rephrase
          console.log('⚠️ Medium confidence result, returning with rephrase suggestion')
          const answerText = discoveryResult.answer || discoveryResult.choices?.[0]?.message?.content || ''
          responseData = {
            answer: {
              state: 'COMPLETED',
              answerText: `${answerText}\n\n💡 **Suggestion**: For more specific guidance, try rephrasing your question or ask about related spiritual topics.`,
              citations: discoveryResult.citations || [],
              references: discoveryResult.references || [],
              steps: discoveryResult.steps || []
            },
            sessionId: newSessionId
          }
        } else {
          // Low confidence - provide fallback with rephrasing guidance
          console.log('❌ Low confidence result, providing fallback with rephrasing guidance')
          responseData = {
            answer: {
              state: 'COMPLETED',
              answerText: `I humbly acknowledge that specific guidance on "${question}" is not present in the sacred texts available to me.\n\n💡 **Suggestions for rephrasing**:\n• Try asking about general spiritual concepts like dharma, karma, meditation, or moksha\n• Ask about specific practices like yoga, prayer, or spiritual disciplines\n• Inquire about spiritual stories or teachings from our sacred texts\n• Focus on universal spiritual principles rather than specific modern situations\n\nPlease try rephrasing your question to explore the wisdom available in our curated corpus.`,
              citations: [],
              references: [],
              steps: []
            },
            sessionId: newSessionId
          }
        }
        
        // Log the response
        const logData = createLogData(requestBody, responseData, newSessionId, { 
          enabled: enableHybridSearch, 
          weights: { perplexity: 0, discovery: 1 }, 
          sources: ['google_discovery_engine'],
          queryEnhancement: {
            original: queryInfo.original,
            enhanced: queryInfo.enhanced,
            confidence: validation.confidence
          }
        }, Date.now() - startTime, errors)
        await writeApiLog(logData)
        
        return NextResponse.json(responseData)
        
      } catch (error) {
        console.log('❌ Query enhancement pattern failed:', error)
        // Fallback to Discovery Engine only
        console.log('🔄 Falling back to Discovery Engine only...')
      }
    } else {
      // Fallback to Discovery Engine only
      console.log('🔄 Using Discovery Engine-only search (hybrid search disabled)')
      
      try {
        const result = await executeDiscoveryEngineSearch(question, accessToken.token!, apiEndpoint!, googleSessionPath || undefined)
        console.log('✅ Discovery Engine search completed')
        
        // Validate the result with confidence scoring
        const validation = validateCorpusContent(result)
        
        console.log('📊 Discovery Engine validation:', {
          isValid: validation.isValid,
          confidence: validation.confidence,
          reason: validation.reason
        })
        
        // Handle response based on validation confidence
        if (validation.isValid && validation.confidence >= 0.5) {
          // Valid result - return Discovery Engine response
          responseData = {
            answer: {
              state: 'COMPLETED',
              answerText: result.answer || result.choices?.[0]?.message?.content || '',
              citations: result.citations || [],
              references: result.references || [],
              steps: result.steps || []
            },
            sessionId: newSessionId
          };
        } else {
          // Low confidence - provide fallback with rephrasing guidance
          responseData = {
            answer: {
              state: 'COMPLETED',
              answerText: `I humbly acknowledge that specific guidance on "${question}" is not present in the sacred texts available to me.\n\n💡 **Suggestions for rephrasing**:\n• Try asking about general spiritual concepts like dharma, karma, meditation, or moksha\n• Ask about specific practices like yoga, prayer, or spiritual disciplines\n• Inquire about spiritual stories or teachings from our sacred texts\n• Focus on universal spiritual principles rather than specific modern situations\n\nPlease try rephrasing your question to explore the wisdom available in our curated corpus.`,
              citations: [],
              references: [],
              steps: []
            },
            sessionId: newSessionId
          };
        }

        console.log('📤 Returning Discovery Engine-only response (hybrid disabled)')
        
        // Log the successful Discovery Engine-only response
        const logData = createLogData(requestBody, responseData, newSessionId, { 
          enabled: false, 
          weights: { perplexity: 0, discovery: 1 }, 
          sources: ['google_discovery_engine'],
          validation: {
            isValid: validation.isValid,
            confidence: validation.confidence,
            reason: validation.reason
          }
        }, Date.now() - startTime, errors)
        await writeApiLog(logData)
        
        return NextResponse.json(responseData)
      } catch (error) {
        console.log('❌ Discovery Engine search failed:', error)
        const errorResponse = { error: 'Search failed. Please try again.' }
        responseData = errorResponse
        errors.push(`Discovery Engine error: ${error}`)
        
        // Log the error response
        const logData = createLogData(requestBody, responseData, newSessionId, { enabled: false, weights: { perplexity: 0, discovery: 1 }, sources: ['google_discovery_engine'] }, Date.now() - startTime, errors)
        await writeApiLog(logData)
        
        return NextResponse.json(errorResponse, { status: 500 })
      }
    }
  } catch (error) {
    console.log('❌ Request parsing error:', error)
    const errorResponse = { error: 'Invalid request body' }
    responseData = errorResponse
    errors.push(`Request parsing error: ${error}`)
    
    // Log the error response
    const logData = createLogData(requestBody, responseData, null, null, Date.now() - startTime, errors)
    await writeApiLog(logData)
    
    return NextResponse.json(errorResponse, { status: 400 })
  }
}
