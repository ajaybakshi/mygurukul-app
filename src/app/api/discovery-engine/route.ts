import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { createSessionWithFallback, buildSessionPath, generateUserPseudoId } from '@/lib/sessionManager'
import { writeApiLog, createLogData } from '@/lib/logger'
import { categoryService } from '@/lib/database/categoryService'
import { getDiscoveryPrompt, isDiscoveryEngineEnabled } from './discovery-prompts-config'

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

    // Check if Discovery Engine AI processing is enabled
    const isEngineEnabled = isDiscoveryEngineEnabled()
    const discoveryPrompt = getDiscoveryPrompt(isEnhancedPromptEnabled)

    if (isEngineEnabled) {
      if (isEnhancedPromptEnabled) {
        console.log('🌸 Using Enhanced Sanskrit Synthesis Prompt')
      } else {
        console.log('📿 Using Original Prompt')
      }
    } else {
      console.log('⚠️ Discovery Engine AI processing DISABLED - Pass-through mode active')
    }

    // CRITICAL DEBUG: Log search results to trace Sanskrit content
    if (isEngineEnabled && isEnhancedPromptEnabled) {
      console.log('🔍 DEBUG: Enhanced prompt enabled - will trace Sanskrit content flow')
    }

    // Handle disabled Discovery Engine - return pass-through response
    if (!isEngineEnabled) {
      console.log('🚫 Discovery Engine disabled - returning pass-through response')

      const passThroughResponse = {
        answer: {
          answerText: `The Discovery Engine is currently disabled to prevent interference with the new Synthesizer system. Your query: "${question}" has been received but AI processing is temporarily unavailable.`,
          citations: [],
          answerQueryToken: null
        },
        sessionId: newSessionId || sessionId,
        passThrough: true,
        originalQuery: question
      }

      // Log the pass-through request
      const processingTime = Date.now() - startTime
      const logData = createLogData(
        { query: question, passThrough: true },
        passThroughResponse,
        newSessionId || sessionId,
        undefined,
        processingTime,
        undefined
      )
      await writeApiLog(logData)

      return NextResponse.json(passThroughResponse)
    }

    const requestBody = {
      query: {
        text: queryText
      },
      ...(googleSessionPath && { session: googleSessionPath }),
      answerGenerationSpec: {
        includeCitations: !isEnhancedPromptEnabled,
        promptSpec: {
          preamble: discoveryPrompt
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
      if (isEngineEnabled && isEnhancedPromptEnabled) {
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
