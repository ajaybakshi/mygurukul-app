import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { createSessionWithFallback, buildSessionPath, generateUserPseudoId } from '@/lib/sessionManager'
import { perplexitySearch, isPerplexitySearchEnabled, getPerplexitySearchWeight } from '@/lib/perplexitySearch'

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

1. Your Persona and Tone:
Humility: You are a guide, not the ultimate Guru. Never present yourself as all-knowing. Your role is to reflect the wisdom of the texts.
Compassion: Always begin your responses with empathy for the user's situation. Acknowledge their feelings before offering guidance.
Serenity (Sattvic Tone): Your language must always be calm, gentle, supportive, and serene. Avoid overly enthusiastic, casual, or robotic language. The user should feel like they are in a quiet, safe space.

2. Method of Answering (The Scholar's Method):
Your method must be a sophisticated, multi-step process to find the deepest and most accurate wisdom.

**Step 1: Understand the Seeker's Intent.**
Read the user's query carefully to understand the core question, including the specific characters, events, or concepts involved.

**Step 2: Multi-Step Targeted Retrieval.**
Do not rely on a single search. You must perform a series of targeted searches to find the most precise passages.
* **Initial Broad Search:** First, perform a general search using the user's query enhanced with the keywords 'characters themes places context sections' to gather a wide range of potentially relevant documents.
* **Targeted Summary Search:** From the user's query, extract the most critical keywords (e.g., for "final confrontation between Rama and Ravana," the keywords are "final," "confrontation," "battle," "Rama," "Ravana"). Perform a second, highly specific search targeting ONLY the \`[SECTION_SUMMARY: ...]\` tags in your documents with these keywords. This will help you locate the exact section where the event occurs.
* **Targeted Character/Theme Search:** If a specific character or theme is central, perform another search combining that character with the theme (e.g., search for passages where \`[CHARACTERS: ...]\` contains 'Rama' AND \`[THEMES: ...]\` contains 'Final Battle' or 'Dharma').

**Step 3: Prioritize and Synthesize with Wisdom.**
After performing these searches, you will have several sets of results. Your most important task is to prioritize them.
* **Prioritize the Targeted Results:** The passages found via the **Summary Search** and **Character/Theme Search** are the most important. You MUST build the core of your answer from these highly relevant, specific passages.
* **Use Broad Results for Context Only:** Use the results from the Initial Broad Search only to add supporting context or introductory information, if needed. Do not let them dominate the answer.
* **Synthesize the Answer:**
    * Begin with an empathetic acknowledgment.
    * Construct a flowing, coherent answer based primarily on your best, most targeted search results.
    * Weave in powerful stories and direct quotes from these prioritized passages to bring the wisdom to life.

GOAL: You are not just a search engine; you are a wise scholar. Your duty is to perform deep research using multiple targeted methods, and then present only the most precise and relevant wisdom to the seeker.

3. Sacred Boundaries (Maryada):
Strictly On-Topic: You will only discuss spirituality, philosophy, and life guidance as found in the provided scriptures. If a user asks about unrelated topics (like news, weather, science, celebrities, etc.), you must politely decline by saying: "My purpose is to offer guidance from the sacred scriptures. I cannot provide information on that topic."
No Dangerous Advice: You are strictly forbidden from giving any medical, legal, financial, or psychological advice. If a user seems to be in distress, you must respond with: "It sounds like you are going through a very difficult time. While the scriptures offer wisdom for peace of mind, for professional help, please consult with a qualified doctor, therapist, or advisor."
Confess Ignorance Gracefully: If, after a thorough search, you cannot find a passage that directly and completely answers the user's specific question, do not invent an answer. Instead, synthesize the most relevant contextual information you *did* find. Clearly state what you found (e.g., "the events leading up to the confrontation") and then humbly state that the specific detail requested (e.g., "a comprehensive description of the final battle itself") is not present in the provided texts.
Protect Sanctity: You will never engage in arguments, debates, or casual conversation. You will not generate advertisements, sell anything, or use manipulative language. You are a pure, focused space for spiritual guidance.`
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

// Helper function to fuse search results intelligently
const fuseSearchResults = (discoveryResult: any, perplexityResult: any, perplexityWeight: number, discoveryWeight: number) => {
  console.log('🔀 Fusing search results with weights:', { perplexityWeight, discoveryWeight })
  
  // Extract answer texts
  const discoveryAnswer = discoveryResult?.answer || discoveryResult?.choices?.[0]?.message?.content || ''
  const perplexityAnswer = perplexityResult?.answer || ''
  
  // Extract citations
  const discoveryCitations = discoveryResult?.citations || []
  const perplexityCitations = perplexityResult?.citations || []
  
  // Extract references
  const discoveryReferences = discoveryResult?.references || []
  const perplexityReferences = perplexityResult?.references || []
  
  // Intelligent answer fusion
  let fusedAnswer = ''
  if (perplexityAnswer && discoveryAnswer) {
    // Combine answers with weighted approach
    const perplexityLength = Math.floor(perplexityAnswer.length * perplexityWeight)
    const discoveryLength = Math.floor(discoveryAnswer.length * discoveryWeight)
    
    // Use Perplexity as primary (70%) and Discovery Engine as supplement (30%)
    fusedAnswer = perplexityAnswer
    if (discoveryAnswer.length > 0) {
      // Add unique insights from Discovery Engine
      const uniqueDiscoveryContent = extractUniqueContent(discoveryAnswer, perplexityAnswer)
      if (uniqueDiscoveryContent) {
        fusedAnswer += '\n\n' + uniqueDiscoveryContent
      }
    }
  } else if (perplexityAnswer) {
    fusedAnswer = perplexityAnswer
  } else if (discoveryAnswer) {
    fusedAnswer = discoveryAnswer
  }
  
  // Merge citations (avoid duplicates)
  const mergedCitations = mergeCitations(discoveryCitations, perplexityCitations)
  
  // Merge references (avoid duplicates)
  const mergedReferences = mergeReferences(discoveryReferences, perplexityReferences)
  
  // Create fused result
  const fusedResult = {
    ...discoveryResult, // Preserve Discovery Engine structure
    answer: fusedAnswer,
    citations: mergedCitations,
    references: mergedReferences,
    _hybridSearch: {
      enabled: true,
      weights: { perplexity: perplexityWeight, discovery: discoveryWeight },
      sources: ['google_discovery_engine', 'perplexity']
    }
  }
  
  console.log('✅ Result fusion completed:', {
    answerLength: fusedAnswer.length,
    citationsCount: mergedCitations.length,
    referencesCount: mergedReferences.length
  })
  
  return fusedResult
}

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId } = await request.json()
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Google Cloud credentials not configured. Please check environment variables.' },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Cloud. Please check service account credentials and permissions.' },
        { status: 500 }
      )
    }

    // Prepare for hybrid search execution
    let discoveryEngineResult = null
    let perplexityResult = null
    let discoveryEngineError = null
    let perplexityError = null

    // Execute searches in parallel if hybrid search is enabled
    if (enableHybridSearch) {
      console.log('🚀 Starting parallel hybrid search execution...')
      
      // Start both searches in parallel
      const searchPromises = [
        // Google Discovery Engine search
        (async () => {
          try {
            console.log('🔍 Starting Google Discovery Engine search...')
            const result = await executeDiscoveryEngineSearch(question, accessToken.token!, apiEndpoint!, googleSessionPath)
            console.log('✅ Google Discovery Engine search completed')
            return { success: true, result }
          } catch (error) {
            console.log('❌ Google Discovery Engine search failed:', error)
            return { success: false, error }
          }
        })(),
        
        // Perplexity search
        (async () => {
          try {
            console.log('🔍 Starting Perplexity search...')
            const result = await perplexitySearch(question, {
              model: 'sonar',
              includeSpiritualContext: true,
              searchFocus: 'spiritual_texts'
            })
            console.log('✅ Perplexity search completed')
            return { success: true, result }
          } catch (error) {
            console.log('❌ Perplexity search failed:', error)
            return { success: false, error }
          }
        })()
      ]

      // Wait for both searches to complete
      const [discoveryResponse, perplexityResponse] = await Promise.allSettled(searchPromises)
      
      // Process Discovery Engine result
      if (discoveryResponse.status === 'fulfilled' && discoveryResponse.value.success) {
        discoveryEngineResult = discoveryResponse.value.result
      } else {
        discoveryEngineError = discoveryResponse.status === 'fulfilled' ? discoveryResponse.value.error : discoveryResponse.reason
      }
      
      // Process Perplexity result
      if (perplexityResponse.status === 'fulfilled' && perplexityResponse.value.success) {
        perplexityResult = perplexityResponse.value.result
      } else {
        perplexityError = perplexityResponse.status === 'fulfilled' ? perplexityResponse.value.error : perplexityResponse.reason
      }

      console.log('📊 Hybrid Search Results:', {
        discoveryEngineSuccess: !!discoveryEngineResult,
        perplexitySuccess: !!perplexityResult,
        discoveryEngineError: discoveryEngineError?.message,
        perplexityError: perplexityError?.message
      })

      // If both searches failed, return error
      if (!discoveryEngineResult && !perplexityResult) {
        return NextResponse.json(
          { error: 'Both search methods failed. Please try again.' },
          { status: 500 }
        )
      }

      // If only one search succeeded, use that result
      if (!discoveryEngineResult && perplexityResult) {
        console.log('🔄 Using Perplexity-only result (Discovery Engine failed)')
        const responseData = { ...perplexityResult };
        if (newSessionId) {
          responseData.sessionId = newSessionId;
        }
        return NextResponse.json(responseData)
      }
      
      if (discoveryEngineResult && !perplexityResult) {
        console.log('🔄 Using Discovery Engine-only result (Perplexity failed)')
        const responseData = { ...discoveryEngineResult };
        if (newSessionId) {
          responseData.sessionId = newSessionId;
        }
        return NextResponse.json(responseData)
      }

      // Both searches succeeded - perform intelligent fusion
      console.log('🔀 Performing intelligent result fusion...')
      const fusedResult = fuseSearchResults(discoveryEngineResult, perplexityResult, perplexityWeight, discoveryWeight)
      console.log('✅ Result fusion completed')
      
      // Add session information if new session was created
      const responseData = { ...fusedResult };
      if (newSessionId) {
        responseData.sessionId = newSessionId;
        console.log('📤 Returning new session ID to frontend:', newSessionId);
      }
      
      return NextResponse.json(responseData)
    } else {
      // Fallback to Discovery Engine only
      console.log('🔄 Using Discovery Engine-only search (hybrid search disabled)')
      const result = await executeDiscoveryEngineSearch(question, accessToken.token!, apiEndpoint!, googleSessionPath)
      
      // Return response with session information if new session was created
      const responseData = { ...result };
      if (newSessionId) {
        responseData.sessionId = newSessionId;
        console.log('📤 Returning new session ID to frontend:', newSessionId);
      }

      return NextResponse.json(responseData)
    }
  } catch (error) {
    console.log('Request parsing error:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
