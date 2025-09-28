import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface MultiAgentWisdomRequest {
  question: string;
  sessionId?: string;
}

interface PythonCollectorResponse {
  question: string;
  verseData: {
    sessionId: string;
    query: any;
    results: {
      totalVerses: number;
      verses: any[];
    };
    metadata: any;
  };
}

interface SpiritualSynthesizerResponse {
  success: boolean;
  data: {
    sessionId: string;
    narrative: string;
    citations: any[];
    sources: any[];
    structure: any;
    metadata: any;
  };
  correlationId: string;
  timestamp: string;
}

interface MultiAgentWisdomResponse {
  success: boolean;
  data: {
    sessionId: string;
    narrative: string;
    citations: any[];
    sources: any[];
    structure: any;
    metadata: {
      collectorResponse?: any;
      synthesizerResponse: any;
      pipelineExecution: {
        collectorTime?: number;
        synthesizerTime: number;
        totalTime: number;
        steps: string[];
        isNewSession: boolean;
      };
    };
  };
  correlationId: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = uuidv4();

  console.log(`🚀 [${correlationId}] Multi-Agent Wisdom Pipeline Started`);

  try {
    // Parse and validate request
    const body: MultiAgentWisdomRequest = await request.json();

    if (!body.question || typeof body.question !== 'string' || body.question.trim().length === 0) {
      console.log(`❌ [${correlationId}] Invalid request: missing or empty question`);
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Question is required and must be a non-empty string',
          correlationId
        },
        { status: 400 }
      );
    }

    const { question, sessionId } = body;
    const isNewSession = !sessionId;
    console.log(`📝 [${correlationId}] Processing question: "${question.substring(0, 100)}..."`);
    console.log(`🆔 [${correlationId}] Session type: ${isNewSession ? 'NEW session' : 'EXISTING session'} (${sessionId || 'N/A'})`);

    let collectorResponse: PythonCollectorResponse | null = null;
    let collectorTime: number | undefined;

    // Determine the conversation flow based on session type
    if (isNewSession) {
      // Step 1: For NEW sessions - Query Python Collector first
      console.log(`🔄 [${correlationId}] Step 1: Querying Python Collector (new session)...`);
      const collectorStartTime = Date.now();

      const collectorRequest = {
        question: question.trim(),
        sessionId: uuidv4() // Generate new session ID for collector
      };

      try {
        const collectorRes = await fetch('http://localhost:5001/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': correlationId
          },
          body: JSON.stringify(collectorRequest),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!collectorRes.ok) {
          const errorText = await collectorRes.text();
          console.log(`❌ [${correlationId}] Python Collector HTTP error: ${collectorRes.status} - ${errorText}`);

          // Provide specific error messages based on status code
          let errorMessage = 'Unable to collect Sanskrit verses at this time';
          if (collectorRes.status === 503) {
            errorMessage = 'Sanskrit collection service is temporarily unavailable. Please try again in a few moments.';
          } else if (collectorRes.status === 500) {
            errorMessage = 'There was an internal error while collecting verses. Our team has been notified.';
          }

          throw new Error(`Python Collector HTTP ${collectorRes.status}: ${errorText}`);
        }

        collectorResponse = await collectorRes.json();

        if (!collectorResponse || !collectorResponse.verseData) {
          console.log(`❌ [${correlationId}] Python Collector returned invalid response:`, collectorResponse);
          throw new Error('Python Collector returned invalid or empty verse data');
        }

        collectorTime = Date.now() - collectorStartTime;
        console.log(`✅ [${correlationId}] Python Collector completed in ${collectorTime}ms`);
        console.log(`📊 [${correlationId}] Collector results: ${collectorResponse.verseData.results?.totalVerses || 0} verses`);

      } catch (collectorError) {
        collectorTime = Date.now() - collectorStartTime;
        console.log(`❌ [${correlationId}] Python Collector failed after ${collectorTime}ms:`, collectorError);

        // Enhanced error handling for Python service failures
        let userMessage = 'Unable to access sacred text collection service';
        let errorCode = 'COLLECTOR_SERVICE_ERROR';

        if (collectorError instanceof Error) {
          if (collectorError.message.includes('ECONNREFUSED') || collectorError.message.includes('ENOTFOUND')) {
            userMessage = 'The Sanskrit collection service is currently offline. Please ensure the Python collector is running on port 5001.';
            errorCode = 'COLLECTOR_SERVICE_UNAVAILABLE';
          } else if (collectorError.message.includes('timeout')) {
            userMessage = 'The Sanskrit collection service is taking too long to respond. Please try again.';
            errorCode = 'COLLECTOR_TIMEOUT';
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: errorCode,
            message: userMessage,
            details: collectorError instanceof Error ? collectorError.message : 'Unknown error',
            correlationId,
            timestamp: new Date().toISOString()
          },
          { status: 503 }
        );
      }
    }

    // Step 2: Synthesize Wisdom with Spiritual Synthesizer
    console.log(`🔄 [${correlationId}] Step 2: Synthesizing wisdom with Spiritual Synthesizer...`);
    const synthesizerStartTime = Date.now();

    let synthesizerEndpoint: string;
    let synthesizerRequest: any;

    if (isNewSession) {
      // NEW session: Use synthesize-wisdom endpoint with verse data
      synthesizerEndpoint = 'http://localhost:3002/api/v1/synthesize-wisdom';
      synthesizerRequest = {
        question: question.trim(),
        sessionId: collectorResponse!.verseData.sessionId, // Use session ID from collector
        context: {
          collectorQuery: { question: question.trim() },
          collectorResults: collectorResponse!.verseData
        },
        verseData: collectorResponse!.verseData,
        options: {
          includeCitations: true,
          includeSources: true,
          includeStructure: true,
          enhancedPrompt: true
        }
      };
    } else {
      // EXISTING session: Use continue-conversation endpoint
      synthesizerEndpoint = 'http://localhost:3002/api/v1/continue-conversation';
      synthesizerRequest = {
        question: question.trim(),
        sessionId: sessionId,
        context: {},
        options: {
          includeCitations: true,
          includeSources: true,
          includeStructure: true
        }
      };
    }

    let synthesizerResponse: SpiritualSynthesizerResponse;
    try {
      const synthesizerRes = await fetch(synthesizerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId
        },
        body: JSON.stringify(synthesizerRequest),
        signal: AbortSignal.timeout(45000) // 45 second timeout for synthesis
      });

      if (!synthesizerRes.ok) {
        const errorText = await synthesizerRes.text();
        console.log(`❌ [${correlationId}] Spiritual Synthesizer HTTP error: ${synthesizerRes.status} - ${errorText}`);
        throw new Error(`Spiritual Synthesizer HTTP ${synthesizerRes.status}: ${errorText}`);
      }

      synthesizerResponse = await synthesizerRes.json();

      if (!synthesizerResponse.success) {
        console.log(`❌ [${correlationId}] Spiritual Synthesizer returned error:`, synthesizerResponse);
        throw new Error(`Spiritual Synthesizer error: ${JSON.stringify(synthesizerResponse)}`);
      }

      const synthesizerTime = Date.now() - synthesizerStartTime;
      console.log(`✅ [${correlationId}] Spiritual Synthesizer completed in ${synthesizerTime}ms`);
      console.log(`📝 [${correlationId}] Synthesis results: ${synthesizerResponse.data.narrative?.length || 0} characters`);

    } catch (synthesizerError) {
      const synthesizerTime = Date.now() - synthesizerStartTime;
      console.log(`❌ [${correlationId}] Spiritual Synthesizer failed after ${synthesizerTime}ms:`, synthesizerError);

      // Enhanced error handling for synthesizer service failures
      let userMessage = 'Unable to generate spiritual wisdom at this time';
      let errorCode = 'SYNTHESIZER_SERVICE_ERROR';

      if (synthesizerError instanceof Error) {
        if (synthesizerError.message.includes('ECONNREFUSED') || synthesizerError.message.includes('ENOTFOUND')) {
          userMessage = 'The spiritual synthesis service is currently offline. Please ensure the synthesizer is running on port 3002.';
          errorCode = 'SYNTHESIZER_SERVICE_UNAVAILABLE';
        } else if (synthesizerError.message.includes('timeout')) {
          userMessage = 'The spiritual synthesis is taking longer than expected. Please try again.';
          errorCode = 'SYNTHESIZER_TIMEOUT';
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorCode,
          message: userMessage,
          details: synthesizerError instanceof Error ? synthesizerError.message : 'Unknown error',
          correlationId,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Step 3: Compile final response
    const totalTime = Date.now() - startTime;
    const synthesizerTime = Date.now() - synthesizerStartTime;

    console.log(`🎉 [${correlationId}] Multi-Agent Pipeline completed successfully in ${totalTime}ms`);
    if (collectorTime !== undefined) {
      console.log(`📊 [${correlationId}] Performance: Collector=${collectorTime}ms, Synthesizer=${synthesizerTime}ms, Total=${totalTime}ms`);
    } else {
      console.log(`📊 [${correlationId}] Performance: Synthesizer=${synthesizerTime}ms, Total=${totalTime}ms`);
    }

    const response: MultiAgentWisdomResponse = {
      success: true,
      data: {
        sessionId: synthesizerResponse.data.sessionId,
        narrative: synthesizerResponse.data.narrative,
        citations: synthesizerResponse.data.citations || [],
        sources: synthesizerResponse.data.sources || [],
        structure: synthesizerResponse.data.structure || {},
        metadata: {
          ...(collectorResponse && {
            collectorResponse: {
              totalVerses: collectorResponse.verseData.results?.totalVerses || 0,
              verses: collectorResponse.verseData.results?.verses || [],
              sessionId: collectorResponse.verseData.sessionId,
              collectionTime: collectorResponse.verseData.metadata?.collectionTime,
              collectorVersion: collectorResponse.verseData.metadata?.collectorVersion
            }
          }),
          synthesizerResponse: {
            narrativeLength: synthesizerResponse.data.narrative?.length || 0,
            citationsCount: synthesizerResponse.data.citations?.length || 0,
            sourcesCount: synthesizerResponse.data.sources?.length || 0,
            correlationId: synthesizerResponse.correlationId,
            timestamp: synthesizerResponse.timestamp,
            endpoint: isNewSession ? 'synthesize-wisdom' : 'continue-conversation'
          },
          pipelineExecution: {
            ...(collectorTime !== undefined && { collectorTime }),
            synthesizerTime,
            totalTime,
            steps: isNewSession
              ? [
                  'Python Collector Query',
                  'Sanskrit Verse Collection',
                  'Spiritual Synthesizer Query',
                  'Wisdom Synthesis & Narrative Generation',
                  'Response Compilation'
                ]
              : [
                  'Continue Conversation Query',
                  'Context Analysis & Follow-up Logic',
                  'Spiritual Synthesizer Query',
                  'Wisdom Synthesis & Narrative Generation',
                  'Response Compilation'
                ],
            isNewSession
          }
        }
      },
      correlationId,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.log(`💥 [${correlationId}] Multi-Agent Pipeline failed after ${totalTime}ms:`, error);

    // Enhanced general error handling
    let userMessage = 'An unexpected error occurred while processing your spiritual inquiry';
    let errorCode = 'PIPELINE_ERROR';

    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        userMessage = 'There was an issue processing the response format. Please try again.';
        errorCode = 'RESPONSE_PARSING_ERROR';
      } else if (error.message.includes('AbortError') || error.message.includes('timeout')) {
        userMessage = 'The request timed out. Please try again with a simpler question.';
        errorCode = 'REQUEST_TIMEOUT';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorCode,
        message: userMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-correlation-id',
    },
  });
}
