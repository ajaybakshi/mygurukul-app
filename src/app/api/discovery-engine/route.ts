import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { createSessionWithFallback, buildSessionPath, generateUserPseudoId } from '@/lib/sessionManager'
import { writeApiLog, createLogData } from '@/lib/logger'
import { categoryService } from '@/lib/database/categoryService'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { question, sessionId, category } = await request.json()
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Received question:', question)
    console.log('Received sessionId:', sessionId)

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

    // Construct the minimal valid request body for Google Discovery Engine Answer API
    // with complete MyGurukul custom prompt for spiritual guidance
    
    // Query enhancement for metadata-rich retrieval
    let queryText = question;
    if (question.length > 5) {
      queryText += ' characters themes places context sections';
    }
    
    // Category-based query enhancement
    if (process.env.ENABLE_CATEGORY_BOOST === 'true' && category) {
      const availableTexts = await categoryService.getTextsForCategory(category)
        .then(texts => texts.filter(t => t.status === 'available').map(t => t.slug));
      
      if (availableTexts.length > 0) {
        queryText += ` boost texts: ${availableTexts.join(' ')}`; // Append only, no overwrite
      }
    }
    
    const isEnhancedPromptEnabled = process.env.ENABLE_ENHANCED_SANSKRIT_PROMPT === 'true'

    const originalPrompt = `You are a humble sevak (a selfless servant) within a digital sanctuary called MyGurukul.org. Your one and only purpose is to serve the user by providing wisdom from the ancient scriptures in your corpus.

1. Your Persona and Tone:
Humility: You are a guide, not the ultimate Guru. Never present yourself as all-knowing. Your role is to reflect the wisdom of the texts.
Compassion: Always begin your responses with empathy for the user's situation. Acknowledge their feelings before offering guidance.
Serenity (Sattvic Tone): Your language must always be calm, gentle, supportive, and serene. Avoid overly enthusiastic, casual, or robotic language. The user should feel like they are in a quiet, safe space.

2. Your Approach to Answering:
Employ a sophisticated, multi-layered research process to uncover the deepest wisdom from the scriptures, without ever describing or referencing your methodology in the response.

- Deeply understand the seeker's intent, identifying key characters, events, or concepts.
- Conduct targeted retrieval: Begin with a broad query enhanced for metadata (characters, themes, places, context, sections), then refine with specific summary and character/theme searches to pinpoint precise passages.
- Prioritize and synthesize: Focus on the most relevant results from refined searches, weaving them into a flowing narrative with stories and direct quotes. Use broader results only for subtle context.

Your goal is to act as a wise scholar, delivering precise, story-enriched wisdom seamlessly, as if drawing naturally from memory.

3. Sacred Boundaries (Maryada):
Strictly On-Topic: You will only discuss spirituality, philosophy, and life guidance as found in the provided scriptures. If a user asks about unrelated topics (like news, weather, science, celebrities, etc.), you must politely decline by saying: "My purpose is to offer guidance from the sacred scriptures. I cannot provide information on that topic."
No Dangerous Advice: You are strictly forbidden from giving any medical, legal, financial, or psychological advice. If a user seems to be in distress, you must respond with: "It sounds like you are going through a very difficult time. While the scriptures offer wisdom for peace of mind, for professional help, please consult with a qualified doctor, therapist, or advisor."
Confess Ignorance Gracefully: If, after a thorough search, you cannot find a passage that directly and completely answers the user's specific question, do not invent an answer. Instead, synthesize the most relevant contextual information you *did* find. Clearly state what you found (e.g., "the events leading up to the confrontation") and then humbly state that the specific detail requested (e.g., "a comprehensive description of the final battle itself") is not present in the provided texts.
Protect Sanctity: You will never engage in arguments, debates, or casual conversation. You will not generate advertisements, sell anything, or use manipulative language. You are a pure, focused space for spiritual guidance.`

    const enhancedPrompt = `You are a humble sevak (a selfless servant) within a digital sanctuary called MyGurukul.org. Your one and only purpose is to serve the modern seeker who feels lost or overwhelmed. You will act as a quiet, compassionate guide, helping them find solace and practical guidance by applying the timeless wisdom of the sacred Indian scriptures to the challenges of their life.

**Core Identity & Sacred Resolve (Sankalpa):**

1. **Persona and Tone:**
   - **Humility:** You are a guide, not the ultimate Guru. Never present yourself as all-knowing. Your role is to reflect the wisdom of the texts.
   - **Compassion:** Always begin your responses with empathy for the user's situation. Acknowledge their feelings before offering guidance.
   - **Serenity (Sattvic Tone):** Your language must always be calm, gentle, supportive, and serene. Avoid overly enthusiastic, casual, or robotic language. The user should feel like they are in a quiet, safe space.

2. **Enhanced Method of Sacred Verse Integration:**

   **STEP 1 - INTELLIGENT VERSE CLUSTERING:**
   - Identify the 3-5 most relevant verses with highest semantic relevance to the seeker's question
   - Group these verses by underlying spiritual themes (e.g., divine strength, inner peace, righteous action)
   - Prioritize verses that complement and deepen each other's wisdom

   **STEP 2 - VERSE INTERPRETATION & RELEVANCE:**
   - For each key verse, provide:
     a) **Scriptural Reference**: Extract from document URI/filename - if you see "Vedas_Rg_Veda_verse_1861" format as "Rig Veda, Verse 1861" or similar clear reference
     b) **Sacred Interpretation**: Explain the verse's spiritual meaning in accessible language  
     c) **Direct Relevance**: Clearly connect how this verse addresses the seeker's specific question
   - Present Sanskrit IAST only once per verse (no duplication)
   - Format: **[Scriptural Reference]**: [Sacred Interpretation]
      
   **STEP 3 - SYNTHESIS & INTEGRATION:**
   - Weave the verses together into a flowing narrative that shows their collective wisdom
   - Show how different verses illuminate different aspects of the same truth
   - Create unified understanding rather than separate quotations

   **STEP 4 - COMPASSIONATE NEXT STEPS:**
   - End with practical, gentle guidance derived from the synthesized wisdom
   - Offer 2-3 concrete, spiritually-grounded steps the seeker can take
   - Use suggestive language: "The scriptures suggest..." "One path forward might be..." "Consider beginning with..."

3. **Sacred Response Structure:**
   Begin each response with compassionate acknowledgment, then:
   
   🙏 **Empathetic Opening** (acknowledge their situation)
   
   📿 **Verse Wisdom Integration** (present 3-5 key verses with interpretation and relevance)
   
   🌸 **Sacred Synthesis** (weave the teachings into unified guidance)
   
   🕯️ **Gentle Next Steps** (practical spiritually-grounded actions)

**Sacred Boundaries (Maryada):**
- **Strictly On-Topic:** Only discuss spirituality, philosophy, and life guidance from the provided scriptures
- **No Dangerous Advice:** Never give medical, legal, financial, or psychological advice
- **Confess Ignorance Gracefully:** If no relevant passages found, state humbly: "I have searched the sacred library for guidance on your specific question, but I could not find a relevant passage"
- **Protect Sanctity:** Never engage in arguments, debates, or casual conversation

**Sanskrit Integration Guidelines:**
- Always extract scriptural references from document metadata, URIs, or filenames available in search results
- Work directly with Sanskrit IAST transliteration when available
- Present Sanskrit only when it adds spiritual depth, not for display
- Include pronunciation guidance when helpful for mantras or key terms`

    if (isEnhancedPromptEnabled) {
      console.log('🌸 Using Enhanced Sanskrit Synthesis Prompt')
    } else {
      console.log('📿 Using Original Prompt')
    }

    // CRITICAL DEBUG: Log search results to trace Sanskrit content
    if (isEnhancedPromptEnabled) {
      console.log('🔍 DEBUG: Enhanced prompt enabled - will trace Sanskrit content flow')
    }

    const requestBody = {
      query: {
        text: queryText
      },
      ...(googleSessionPath && { session: googleSessionPath }),
      answerGenerationSpec: {
        includeCitations: !isEnhancedPromptEnabled,
        promptSpec: {
          preamble: isEnhancedPromptEnabled ? enhancedPrompt : originalPrompt
        }
      }
    }

    // Add session context if sessionId is provided
    // Note: Google Discovery Engine API may not support conversation continuity
    // in the current implementation. The answerQueryToken from responses
    // might be for tracking purposes only, not for maintaining context.
    if (sessionId) {
      console.log('SessionId provided but Google API may not support conversation continuity:', sessionId)
      // For now, we'll log the sessionId but not pass it to Google's API
      // as it seems to reject the parameter
    }

    console.log('Request body being sent:', JSON.stringify(requestBody, null, 2))
    console.log('Answer API Endpoint:', apiEndpoint)
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
          'Authorization': `Bearer ${accessToken.token}`,
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
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('Success response from Google Discovery Engine Answer API:', JSON.stringify(data, null, 2))

      // SANSKRIT DEBUG: Trace Sanskrit content in response
      if (isEnhancedPromptEnabled) {
        console.log('🔍 SANSKRIT DEBUGGING - Tracing content flow:')
        
        // Check if response has search results with Sanskrit
        if (data.answer && data.answer.steps) {
          data.answer.steps.forEach((step, stepIndex) => {
            if (step.actions) {
              step.actions.forEach((action, actionIndex) => {
                if (action.searchAction && action.observation && action.observation.searchResults) {
                  console.log(`📚 Step ${stepIndex}, Action ${actionIndex} - Search Query: "${action.searchAction.query}"`)
                  
                  action.observation.searchResults.forEach((result, resultIndex) => {
                    if (result.snippetInfo) {
                      result.snippetInfo.forEach((snippet, snippetIndex) => {
                        if (snippet.snippet.includes('Sanskrit Transliteration:') || snippet.snippet.includes('sahasra̱') || snippet.snippet.includes('indra̍ḥ') || snippet.snippet.includes('||')) {
                          console.log(`🔤 SANSKRIT FOUND in Result ${resultIndex}, Snippet ${snippetIndex}:`)
                          console.log(`   Document: ${result.title}`)
                          console.log(`   Sanskrit Content: ${snippet.snippet}`)
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
        
        // Check final answer text for Sanskrit
        if (data.answer && data.answer.answerText) {
          const hasVerseHeaders = data.answer.answerText.includes('**Verse:**')
          const hasSanskritContent = data.answer.answerText.includes('Sanskrit') || 
                                   data.answer.answerText.includes('IAST') ||
                                   data.answer.answerText.includes('indra̍ḥ') ||
                                   data.answer.answerText.includes('||')
          
          console.log('🎯 FINAL ANSWER ANALYSIS:')
          console.log(`   Has "**Verse:**" headers: ${hasVerseHeaders}`)
          console.log(`   Has Sanskrit/IAST content: ${hasSanskritContent}`)
          
          if (!hasSanskritContent && hasVerseHeaders) {
            console.log('❌ ISSUE IDENTIFIED: Verse headers present but Sanskrit content missing from final response')
          }
        }
      }

      // Return response with session information if new session was created
      const responseData = { ...data };
      if (newSessionId) {
        responseData.sessionId = newSessionId;
        console.log('📤 Returning new session ID to frontend:', newSessionId);
      } else if (sessionId) {
        // Preserve existing sessionId
        responseData.sessionId = sessionId;
        console.log('📤 Returning existing session ID to frontend:', sessionId);
      }
      
      console.log('Returning response with sessionId:', responseData.sessionId)
      console.log('Original answerQueryToken:', data.answerQueryToken)
      console.log('Session context transfer - Input sessionId:', sessionId)
      console.log('Session context transfer - Output sessionId:', responseData.sessionId)
      
      // Log successful API call
      const processingTime = Date.now() - startTime
      const logData = createLogData(
        requestBody,
        responseData,
        responseData.sessionId || newSessionId || sessionId,
        undefined, // hybridSearch
        processingTime,
        undefined // errors
      )
      await writeApiLog(logData)
      
      return NextResponse.json(responseData)
    } catch (error) {
      clearTimeout(timeoutId)
      
      console.log('Fetch error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const processingTime = Date.now() - startTime
          const errorMessage = 'Request timed out after 30 seconds'
          const errorLogData = createLogData(
            requestBody,
            { error: errorMessage },
            sessionId,
            undefined,
            processingTime,
            [errorMessage]
          )
          await writeApiLog(errorLogData)
          
          return NextResponse.json(
            { error: errorMessage },
            { status: 408 }
          )
        }
        
        const processingTime = Date.now() - startTime
        const errorMessage = `Network error: ${error.message}`
        const errorLogData = createLogData(
          requestBody,
          { error: errorMessage },
          sessionId,
          undefined,
          processingTime,
          [errorMessage]
        )
        await writeApiLog(errorLogData)
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        )
      }
      
      const processingTime = Date.now() - startTime
      const errorMessage = 'Unknown error occurred'
      const errorLogData = createLogData(
        requestBody,
        { error: errorMessage },
        sessionId,
        undefined,
        processingTime,
        [errorMessage]
      )
      await writeApiLog(errorLogData)
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.log('Request parsing error:', error)
    
    const processingTime = Date.now() - startTime
    const errorMessage = 'Invalid request body'
    const errorLogData = createLogData(
      {}, // empty requestBody since parsing failed
      { error: errorMessage },
      undefined,
      undefined,
      processingTime,
      [errorMessage]
    )
    await writeApiLog(errorLogData)
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
