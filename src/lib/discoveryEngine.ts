// A/B Testing Configuration
const USE_MULTI_AGENT = process.env.NEXT_PUBLIC_USE_MULTI_AGENT === 'true' || 
                       process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MULTI_AGENT !== 'false';

console.log('🔧 Multi-Agent Configuration:', {
  USE_MULTI_AGENT,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_USE_MULTI_AGENT: process.env.NEXT_PUBLIC_USE_MULTI_AGENT
});

export interface DiscoveryEngineResponse {
  sessionId?: string;
  answer: {
    state: string;
    answerText: string;
    citations?: Array<{
      startIndex: number;
      endIndex: number;
      sources: Array<{
        referenceId: string;
        title?: string;
        uri?: string;
      }>;
    }>;
    references?: Array<{
      title?: string;
      uri?: string;
      chunkInfo?: {
        content: string;
        relevanceScore?: number;
        documentMetadata?: {
          document: string;
          uri: string;
          title: string;
        };
      };
    }>;
    steps?: Array<{
      state: string;
      description: string;
      actions?: Array<{
        searchAction?: {
          query: string;
        };
        observation?: {
          searchResults?: Array<{
            document: string;
            uri: string;
            title: string;
            snippetInfo?: Array<{
              snippet: string;
              snippetStatus: string;
            }>;
          }>;
        };
      }>;
    }>;
  };
}

// Multi-Agent Response Interfaces
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

export class DiscoveryEngineError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DiscoveryEngineError';
  }
}

export async function callDiscoveryEngine(question: string, sessionId?: string, category?: string): Promise<DiscoveryEngineResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    console.log('Calling Discovery Engine API with question:', question);
    
    const response = await fetch('/api/discovery-engine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, sessionId, category }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('API Error data:', errorData);
      throw new DiscoveryEngineError(
        errorData.error || `API request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('API Success data:', data);
    console.log('API Response structure:', {
      hasAnswer: !!data.answer,
      answerState: data.answer?.state,
      answerTextLength: data.answer?.answerText?.length || 0,
      hasCitations: !!data.answer?.citations,
      citationsCount: data.answer?.citations?.length || 0,
      hasReferences: !!data.answer?.references,
      referencesCount: data.answer?.references?.length || 0
    });
    return data as DiscoveryEngineResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.log('Discovery Engine error:', error);
    
    if (error instanceof DiscoveryEngineError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new DiscoveryEngineError('Request timed out after 30 seconds');
      }
      throw new DiscoveryEngineError(`Network error: ${error.message}`);
    }
    
    throw new DiscoveryEngineError('Unknown error occurred');
  }
}

export async function callMultiAgentWisdom(question: string, sessionId?: string, category?: string): Promise<DiscoveryEngineResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for multi-agent pipeline

  try {
    console.log('🚀 Calling Multi-Agent Wisdom API with question:', question);
    console.log('🆔 Session ID:', sessionId || 'new session');
    
    const response = await fetch('/api/multi-agent/wisdom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, sessionId, category }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Multi-Agent API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Multi-Agent API Error data:', errorData);
      throw new DiscoveryEngineError(
        errorData.message || errorData.error || `Multi-Agent API request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const multiAgentData: MultiAgentWisdomResponse = await response.json();
    console.log('✅ Multi-Agent API Success data received');
    console.log('📊 Multi-Agent Response structure:', {
      success: multiAgentData.success,
      hasNarrative: !!multiAgentData.data?.narrative,
      narrativeLength: multiAgentData.data?.narrative?.length || 0,
      hasCitations: !!multiAgentData.data?.citations,
      citationsCount: multiAgentData.data?.citations?.length || 0,
      hasSources: !!multiAgentData.data?.sources,
      sourcesCount: multiAgentData.data?.sources?.length || 0,
      sessionId: multiAgentData.data?.sessionId,
      totalTime: multiAgentData.data?.metadata?.pipelineExecution?.totalTime || 0
    });

    // Map multi-agent response to DiscoveryEngineResponse format
    console.log('🔧 Mapping multi-agent data:', {
      narrativeLength: multiAgentData.data.narrative?.length || 0,
      citationsCount: multiAgentData.data.citations?.length || 0,
      sourcesCount: multiAgentData.data.sources?.length || 0,
      firstCitation: multiAgentData.data.citations?.[0],
      firstSource: multiAgentData.data.sources?.[0]
    });

    const mappedResponse: DiscoveryEngineResponse = {
      sessionId: multiAgentData.data.sessionId,
      answer: {
        state: 'SUCCEEDED',
        answerText: multiAgentData.data.narrative || '',
        citations: mapMultiAgentCitations(multiAgentData.data.citations || []),
        references: mapMultiAgentSources(multiAgentData.data.sources || []),
        steps: mapMultiAgentSteps(multiAgentData.data.metadata?.pipelineExecution?.steps || [])
      }
    };

    console.log('🔄 Mapped response structure:', {
      hasAnswer: !!mappedResponse.answer,
      answerState: mappedResponse.answer?.state,
      answerTextLength: mappedResponse.answer?.answerText?.length || 0,
      hasCitations: !!mappedResponse.answer?.citations,
      citationsCount: mappedResponse.answer?.citations?.length || 0,
      hasReferences: !!mappedResponse.answer?.references,
      referencesCount: mappedResponse.answer?.references?.length || 0
    });

    return mappedResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.log('💥 Multi-Agent Wisdom error:', error);
    
    if (error instanceof DiscoveryEngineError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new DiscoveryEngineError('Multi-Agent request timed out after 60 seconds');
      }
      throw new DiscoveryEngineError(`Multi-Agent network error: ${error.message}`);
    }
    
    throw new DiscoveryEngineError('Unknown multi-agent error occurred');
  }
}

// Unified A/B Testing Function
export async function callWisdomEngine(question: string, sessionId?: string, category?: string): Promise<DiscoveryEngineResponse> {
  console.log('🎯 A/B Testing Decision:', {
    USE_MULTI_AGENT,
    question: question.substring(0, 50) + '...',
    sessionId: sessionId || 'new session'
  });

  if (USE_MULTI_AGENT) {
    console.log('🚀 Using Multi-Agent Wisdom Engine');
    return await callMultiAgentWisdom(question, sessionId, category);
  } else {
    console.log('🔍 Using Traditional Discovery Engine');
    return await callDiscoveryEngine(question, sessionId, category);
  }
}

// Multi-Agent Response Mapping Functions
function mapMultiAgentCitations(citations: any[]): Array<{
  startIndex: number;
  endIndex: number;
  sources: Array<{
    referenceId: string;
    title?: string;
    uri?: string;
  }>;
}> {
  if (!citations || !Array.isArray(citations)) return [];
  
  return citations.map((citation, index) => {
    // Extract verse data from multi-agent citation structure
    const verse = citation.verse || citation;
    const reference = verse.reference || verse.title || `Citation ${index + 1}`;
    
    return {
      startIndex: citation.startIndex || 0,
      endIndex: citation.endIndex || (citation.startIndex || 0) + 50, // Default length
      sources: [{
        referenceId: reference,
        title: reference,
        uri: verse.uri || citation.uri || ''
      }]
    };
  });
}

function mapMultiAgentSources(sources: any[]): Array<{
  title?: string;
  uri?: string;
  chunkInfo?: {
    content: string;
    relevanceScore?: number;
    documentMetadata?: {
      document: string;
      uri: string;
      title: string;
    };
  };
}> {
  if (!sources || !Array.isArray(sources)) return [];
  
  return sources.map((source, index) => {
    // Extract rich verse data from multi-agent source structure
    const reference = source.reference || source.title || `Source ${index + 1}`;
    const sanskrit = source.sanskrit || '';
    const translation = source.translation || '';
    const interpretation = source.interpretation || '';
    const relevance = source.relevance || 0.8;
    
    // Create rich content combining Sanskrit, translation, and interpretation
    let content = '';
    if (sanskrit) content += `Sanskrit: ${sanskrit}\n`;
    if (translation) content += `Translation: ${translation}\n`;
    if (interpretation) content += `Interpretation: ${interpretation}`;
    
    return {
      title: reference,
      uri: source.uri || '',
      chunkInfo: {
        content: content || source.content || source.text || source.description || '',
        relevanceScore: relevance,
        documentMetadata: {
          document: source.document || source.source || 'Multi-Agent Wisdom',
          uri: source.uri || '',
          title: reference
        }
      }
    };
  });
}

function mapMultiAgentSteps(steps: string[]): Array<{
  state: string;
  description: string;
  actions?: Array<{
    searchAction?: {
      query: string;
    };
    observation?: {
      searchResults?: Array<{
        document: string;
        uri: string;
        title: string;
        snippetInfo?: Array<{
          snippet: string;
          snippetStatus: string;
        }>;
      }>;
    };
  }>;
}> {
  if (!steps || !Array.isArray(steps)) return [];
  
  return steps.map((step, index) => ({
    state: 'completed',
    description: step,
    actions: [{
      observation: {
        searchResults: [{
          document: 'Multi-Agent Pipeline',
          uri: '/api/multi-agent/wisdom',
          title: `Step ${index + 1}: ${step}`,
          snippetInfo: [{
            snippet: step,
            snippetStatus: 'completed'
          }]
        }]
      }
    }]
  }));
}

export function formatAnswerText(text: string): string {
  if (!text) return '';
  
  // Replace markdown-style formatting with HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/\n\n/g, '</p><p>') // Paragraphs
    .replace(/\n/g, '<br>') // Line breaks
    .replace(/^/, '<p>') // Start with paragraph
    .replace(/$/, '</p>') // End with paragraph
    .replace(/<p><\/p>/g, ''); // Remove empty paragraphs
}

export function createComprehensiveSpiritualResponse(response: DiscoveryEngineResponse): string {
  console.log('🔧 Creating comprehensive spiritual response from Answer API...');
  
  if (!response.answer) {
    console.log('❌ No answer object in response');
    return '';
  }

  const { answerText, references } = response.answer;
  
  console.log('📝 Answer API response - answerText length:', answerText ? answerText.length : 0, 'characters');
  console.log('📝 Answer API response - references count:', references ? references.length : 0);

  // For Answer API, the answerText is already synthesized and conversational
  // Start with the main synthesized answer text
  let comprehensiveResponse = answerText || '';
  
  // Add additional wisdom from references if available
  if (references && references.length > 0) {
    console.log('📚 Adding supplementary wisdom from sacred texts');
    
    // Add a gentle separator for additional wisdom
    comprehensiveResponse += '\n\n' + '─'.repeat(40) + '\n\n';
    comprehensiveResponse += '🌟 **Additional Wisdom from Sacred Texts** 🌟\n\n';
    
    references.forEach((reference, index) => {
      if (reference.chunkInfo && reference.chunkInfo.content) {
        const content = reference.chunkInfo.content.trim();
        const title = reference.chunkInfo.documentMetadata?.title || `Sacred Text ${index + 1}`;
        
        console.log(`📚 Adding supplementary reference ${index + 1}: "${title}" (${content.length} chars)`);
        
        // Add reference header
        comprehensiveResponse += `**📖 ${title}**\n\n`;
        
        // Add the supplementary content
        comprehensiveResponse += content + '\n\n';
        
        // Add a subtle separator between references
        if (index < references.length - 1) {
          comprehensiveResponse += '•' + '─'.repeat(25) + '•\n\n';
        }
      }
    });
    
    // Add closing blessing
    comprehensiveResponse += '─'.repeat(40) + '\n\n';
    comprehensiveResponse += '🙏 *May this wisdom guide your spiritual journey* 🙏\n\n';
  }
  
  console.log('✅ Answer API comprehensive response created:', comprehensiveResponse.length, 'characters');
  console.log('✅ Content breakdown:');
  console.log('  - Synthesized answerText:', answerText ? answerText.length : 0, 'chars');
  console.log('  - Supplementary reference content:', comprehensiveResponse.length - (answerText ? answerText.length : 0), 'chars');
  console.log('  - Total comprehensive response:', comprehensiveResponse.length, 'chars');
  
  return comprehensiveResponse;
}

export function extractCitations(answerText: string, citations?: Array<any>): Array<{
  text: string;
  referenceId: string;
  title?: string;
  uri?: string;
}> {
  if (!citations) return [];

  return citations.map((citation, index) => {
    const citedText = answerText.slice(citation.startIndex, citation.endIndex);
    const source = citation.sources?.[0];
    
    return {
      text: citedText,
      referenceId: source?.referenceId || `ref-${index + 1}`,
      title: source?.title,
      uri: source?.uri,
    };
  });
}
