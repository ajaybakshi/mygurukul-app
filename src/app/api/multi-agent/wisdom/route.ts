import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface MultiAgentWisdomRequest {
  question: string;
  sessionId?: string;
}

interface SanskritCollectorResponse {
  success: boolean;
  data: {
    verses: any[];
    clusters: any[];
    metadata: any;
  };
  correlationId: string;
  timestamp: string;
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
      collectorResponse: any;
      synthesizerResponse: any;
      pipelineExecution: {
        collectorTime: number;
        synthesizerTime: number;
        totalTime: number;
        steps: string[];
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
    console.log(`📝 [${correlationId}] Processing question: "${question.substring(0, 100)}..."`);
    console.log(`🆔 [${correlationId}] Session ID: ${sessionId || 'new session'}`);

    // Step 1: Query Sanskrit Collector
    console.log(`🔄 [${correlationId}] Step 1: Querying Sanskrit Collector...`);
    const collectorStartTime = Date.now();
    
    const collectorRequest = {
      question: question.trim(),
      context: sessionId ? { sessionId } : {},
      options: {
        maxVerses: 10,
        includeMetadata: true,
        clusteringEnabled: true
      }
    };

    let collectorResponse: SanskritCollectorResponse;
    try {
      const collectorRes = await fetch('http://localhost:3001/api/v1/collect-verses', {
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
        console.log(`❌ [${correlationId}] Sanskrit Collector HTTP error: ${collectorRes.status} - ${errorText}`);
        throw new Error(`Sanskrit Collector HTTP ${collectorRes.status}: ${errorText}`);
      }

      collectorResponse = await collectorRes.json();
      
      if (!collectorResponse.success) {
        console.log(`❌ [${correlationId}] Sanskrit Collector returned error:`, collectorResponse);
        throw new Error(`Sanskrit Collector error: ${JSON.stringify(collectorResponse)}`);
      }

      const collectorTime = Date.now() - collectorStartTime;
      console.log(`✅ [${correlationId}] Sanskrit Collector completed in ${collectorTime}ms`);
      console.log(`📊 [${correlationId}] Collector results: ${collectorResponse.data.verses?.length || 0} verses, ${collectorResponse.data.clusters?.length || 0} clusters`);

    } catch (collectorError) {
      const collectorTime = Date.now() - collectorStartTime;
      console.log(`❌ [${correlationId}] Sanskrit Collector failed after ${collectorTime}ms:`, collectorError);
      
      return NextResponse.json(
        {
          success: false,
          error: 'COLLECTOR_SERVICE_ERROR',
          message: 'Failed to collect Sanskrit verses',
          details: collectorError instanceof Error ? collectorError.message : 'Unknown error',
          correlationId,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Step 2: Synthesize Wisdom with Spiritual Synthesizer
    console.log(`🔄 [${correlationId}] Step 2: Synthesizing wisdom with Spiritual Synthesizer...`);
    const synthesizerStartTime = Date.now();

    const synthesizerRequest = {
      question: question.trim(),
      sessionId: sessionId || uuidv4(),
      context: {
        collectorQuery: collectorRequest,
        collectorResults: collectorResponse.data
      },
      verseData: collectorResponse.data,
      options: {
        includeCitations: true,
        includeSources: true,
        includeStructure: true,
        enhancedPrompt: true
      }
    };

    let synthesizerResponse: SpiritualSynthesizerResponse;
    try {
      const synthesizerRes = await fetch('http://localhost:3002/api/v1/synthesize-wisdom', {
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
      
      return NextResponse.json(
        {
          success: false,
          error: 'SYNTHESIZER_SERVICE_ERROR',
          message: 'Failed to synthesize spiritual wisdom',
          details: synthesizerError instanceof Error ? synthesizerError.message : 'Unknown error',
          correlationId,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Step 3: Compile final response
    const totalTime = Date.now() - startTime;
    const collectorTime = Date.now() - collectorStartTime;
    const synthesizerTime = Date.now() - synthesizerStartTime;

    console.log(`🎉 [${correlationId}] Multi-Agent Pipeline completed successfully in ${totalTime}ms`);
    console.log(`📊 [${correlationId}] Performance: Collector=${collectorTime}ms, Synthesizer=${synthesizerTime}ms, Total=${totalTime}ms`);

    const response: MultiAgentWisdomResponse = {
      success: true,
      data: {
        sessionId: synthesizerResponse.data.sessionId,
        narrative: synthesizerResponse.data.narrative,
        citations: synthesizerResponse.data.citations || [],
        sources: synthesizerResponse.data.sources || [],
        structure: synthesizerResponse.data.structure || {},
        metadata: {
          collectorResponse: {
            versesCount: collectorResponse.data.verses?.length || 0,
            clustersCount: collectorResponse.data.clusters?.length || 0,
            correlationId: collectorResponse.correlationId,
            timestamp: collectorResponse.timestamp
          },
          synthesizerResponse: {
            narrativeLength: synthesizerResponse.data.narrative?.length || 0,
            citationsCount: synthesizerResponse.data.citations?.length || 0,
            sourcesCount: synthesizerResponse.data.sources?.length || 0,
            correlationId: synthesizerResponse.correlationId,
            timestamp: synthesizerResponse.timestamp
          },
          pipelineExecution: {
            collectorTime,
            synthesizerTime,
            totalTime,
            steps: [
              'Sanskrit Collector Query',
              'Verse Collection & Clustering',
              'Spiritual Synthesizer Query',
              'Wisdom Synthesis & Narrative Generation',
              'Response Compilation'
            ]
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

    return NextResponse.json(
      {
        success: false,
        error: 'PIPELINE_ERROR',
        message: 'Multi-agent wisdom pipeline failed',
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
