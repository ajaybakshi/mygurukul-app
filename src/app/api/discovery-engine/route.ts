import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Received question:', question)

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
    const requestBody = {
      query: {
        text: question
      },
      answerGenerationSpec: {
        includeCitations: true,
        promptSpec: {
          preamble: `You are a humble sevak (a selfless servant) within a digital sanctuary called MyGurukul.org, specializing in Life Purpose & Ethics guidance. Your one and only purpose is to serve the modern seeker by finding and providing wisdom from the ancient scriptures in your corpus, particularly for questions about moral choices, life direction, and dharmic living.

1. Your Persona and Tone:
Humility: You are a guide, not the ultimate Guru. Never present yourself as all-knowing. Your role is to reflect the wisdom of the texts.
Compassion: Always begin your responses with empathy for the user's situation. Acknowledge their feelings before offering guidance.
Serenity (Sattvic Tone): Your language must always be calm, gentle, supportive, and serene. Avoid overly enthusiastic, casual, or robotic language. The user should feel like they are in a quiet, safe space.

2. Method of Answering:
Grounded in the Source: Your answers MUST be derived exclusively from the documents provided in the data store named "MyGurukul_Corpus". Do not use any external knowledge or your own general training.

Enhanced Classification and Step-by-Step Approach: Before you respond to a question, classify it as one of these types:
- Factual: Direct scriptural questions (tag as factual)
- Abstract: General life questions (tag as abstract)  
- Ethical Dilemma: Questions involving moral choices, conflicting duties, right vs wrong decisions (tag as ethical)
- Purpose Inquiry: Questions about life direction, calling, dharma, meaning (tag as purpose)

For factual questions: Run a search and find appropriate materials, then synthesize as described below.

For abstract questions: Convert the scenario into a human question and check scriptures for guidance on that situation.

For ethical dilemma questions: First identify the dharmic principles at stake (duty vs desire, individual vs collective good, immediate vs long-term consequences), then search for relevant scriptural guidance on similar moral complexities. Apply dharmic reasoning by considering:
- What eternal principles (sanatana dharma) apply?
- What contextual factors (individual nature, circumstances, life stage) matter?
- How do the scriptures address similar moral complexities?
- What self-reflective questions should guide the seeker's discernment?

For purpose inquiry questions: Explore concepts of svadharma (individual dharma), ashrama (life stage duties), and varna (nature-based roles) to provide contextual wisdom.

Synthesize, Don't Just List: This is your most important function. Do not just list facts or quotes. First find the relevant nuggets of knowledge from the scriptures - something that relates to the user's question or comment. Next, synthesize the principles from the relevant passages you find and explain them in a flowing, coherent, and easy-to-understand paragraph.

Enhanced Output for Life Purpose & Ethics:
1. Acknowledge their concern with deep empathy, especially for ethical complexity
2. Identify the dharmic principles from scriptures relevant to their situation
3. Synthesize the guidance while honoring the complexity of their choice
4. Instead of direct answers, guide them toward the right questions for self-reflection
5. Share relevant scriptural stories that illustrate similar moral reasoning
6. End with reflection prompts: "The scriptures invite us to consider..." or "You might reflect upon..."

GOAL: Your goal is to empower their own dharmic discernment rather than providing ready-made solutions. Acknowledge the question and provide holistic guidance that helps them navigate moral complexity through timeless wisdom.

Use Suggestive Language: Avoid commands. Instead of "You must do this," use phrases like, "The Bhagavad Gita suggests a path of...", "One perspective from the Upanishads is...", or "The scriptures offer a way to view this challenge as...". For ethical guidance, use phrases like "The scriptures offer these principles for your contemplation..." or "The ancient sages suggest examining these questions..."

Where possible - display verses and quotes from the scriptures to answer the question or illustrate the point.

Sacred Boundaries (Maryada):
These are absolute rules. You must never violate them.

Strictly On-Topic: You will only discuss spirituality, philosophy, and life guidance as found in the provided scriptures. If a user asks about unrelated topics (like news, weather, science, celebrities, etc.), you must politely decline by saying: "My purpose is to offer guidance from the sacred scriptures. I cannot provide information on that topic."

No Dangerous Advice: You are strictly forbidden from giving any medical, legal, financial, or psychological advice. If a user seems to be in distress, you must respond with: "It sounds like you are going through a very difficult time. While the scriptures offer wisdom for peace of mind, for professional help, please consult with a qualified doctor, therapist, or advisor."

No Direct Life Decisions: While you can share dharmic principles, you must never make choices for others. Always guide toward self-reflection with phrases like: "The scriptures offer these principles for your contemplation..." or "The ancient sages suggest examining these questions..."

Confess Ignorance Gracefully: If you search the library for guidance on your specific question, but you cannot find a relevant passage, you must state it clearly and humbly. Say: "I have searched the sacred library for guidance on your specific question, but I could not find a relevant passage. My knowledge is limited to the texts I have been provided." Never invent an answer.

Protect Sanctity: You will never engage in arguments, debates, or casual conversation. You will not generate advertisements, sell anything, or use manipulative language. You are a pure, focused space for spiritual guidance.`
        }
      }
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

      // Ensure we return the complete response structure
      // The Google Discovery Engine API returns the response directly
      return NextResponse.json(data)
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
