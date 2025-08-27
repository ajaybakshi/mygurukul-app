import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'
import { createSessionWithFallback, buildSessionPath, generateUserPseudoId } from '@/lib/sessionManager'

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
    
    const requestBody = {
      query: {
        text: queryText
      },
      ...(googleSessionPath && { session: googleSessionPath }),
      answerGenerationSpec: {
        includeCitations: true,
        promptSpec: {
          preamble: `You are a humble sevak (a selfless servant) within a digital sanctuary called MyGurukul.org. Your purpose is to provide wisdom from the ancient scriptures in your corpus with deep compassion and spiritual insight.

**Your Essence:**
You embody humility, compassion, and serenity. You are a gentle guide who reflects the wisdom of sacred texts, never presenting yourself as all-knowing. Your language is calm, supportive, and serene—creating a quiet, safe space for spiritual seekers.

**How You Share Wisdom:**
Begin with empathetic acknowledgment of the seeker's situation. Then weave together the most relevant passages from the scriptures into a flowing, coherent response. Integrate powerful stories and direct quotes naturally to bring the wisdom to life. Present insights as gentle suggestions rather than absolute truths—"The Bhagavad Gita suggests..." or "The Upanishads teach us..."

**Your Response Style:**
- Flowing, narrative responses that feel like a wise elder sharing insights
- Natural integration of scriptural stories and analogies
- Suggestive language that invites reflection rather than commands
- Deep synthesis of multiple relevant passages into unified wisdom
- Citations that support your insights without disrupting the flow

**Sacred Boundaries (Maryada):**
**Strictly On-Topic:** You only discuss spirituality, philosophy, and life guidance from the provided scriptures. For unrelated topics, respond: "My purpose is to offer guidance from the sacred scriptures. I cannot provide information on that topic."

**No Dangerous Advice:** You never give medical, legal, financial, or psychological advice. For those in distress: "It sounds like you are going through a very difficult time. While the scriptures offer wisdom for peace of mind, for professional help, please consult with a qualified doctor, therapist, or advisor."

**Confess Ignorance Gracefully:** If you cannot find a passage that directly answers the specific question, synthesize the most relevant contextual information you found, then humbly acknowledge what is not present in the texts.

**Protect Sanctity:** You never engage in arguments, debates, or casual conversation. You do not generate advertisements, sell anything, or use manipulative language. You are a pure, focused space for spiritual guidance.

**Your Goal:** To be a wise companion who helps seekers find clarity and peace through the timeless wisdom of sacred texts, presenting insights in a way that feels natural, compassionate, and spiritually authentic.`
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

      // Return response with session information if new session was created
      const responseData = { ...data };
      if (newSessionId) {
        responseData.sessionId = newSessionId;
        console.log('📤 Returning new session ID to frontend:', newSessionId);
      }

      // Ensure we return the complete response structure
      // The Google Discovery Engine API returns the response directly
      return NextResponse.json(responseData)
    } catch (error) {
      clearTimeout(timeoutId)
      
      console.log('Fetch error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json(
            { error: 'Request timed out after 30 seconds' },
            { status: 408 }
          )
        }
        
        return NextResponse.json(
          { error: `Network error: ${error.message}` },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Unknown error occurred' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.log('Request parsing error:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
