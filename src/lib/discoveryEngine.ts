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
