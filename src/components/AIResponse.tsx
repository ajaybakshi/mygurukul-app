'use client'

import { DiscoveryEngineResponse } from '@/lib/discoveryEngine'
import { formatAnswerText, extractCitations, createComprehensiveSpiritualResponse } from '@/lib/discoveryEngine'
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react'

interface AIResponseProps {
  response: DiscoveryEngineResponse | null;
  isLoading: boolean;
  error: string | null;
}

export default function AIResponse({ response, isLoading, error }: AIResponseProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 card-shadow mt-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-spiritual-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-spiritual-700 font-medium">
            Seeking spiritual wisdom...
          </span>
        </div>
        <p className="text-center text-sm text-spiritual-600 mt-2">
          This may take a few moments
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
        <div className="flex items-center space-x-3 mb-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">
            Unable to get answer
          </h3>
        </div>
        <p className="text-red-700 mb-3">
          {error}
        </p>
        <p className="text-sm text-red-600">
          Please try again later or rephrase your question.
        </p>
      </div>
    )
  }

  if (!response) {
    return null
  }

  const { answer } = response
  
  // Debug logging to see the complete response
  console.log('AIResponse - Complete answer:', answer)
  console.log('AIResponse - Answer text length:', answer.answerText?.length || 0)
  console.log('AIResponse - Answer state:', answer.state)
  
  // Check if the answer is in a successful state
  if (answer.state !== 'SUCCEEDED') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
        <div className="flex items-center space-x-3 mb-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-yellow-800">
            Processing Response
          </h3>
        </div>
        <p className="text-yellow-700">
          The response is still being processed. State: {answer.state}
        </p>
      </div>
    )
  }

  // Create comprehensive spiritual response combining answerText and reference content
  const comprehensiveText = createComprehensiveSpiritualResponse(response)
  const formattedText = formatAnswerText(comprehensiveText)
  const citations = extractCitations(answer.answerText, answer.citations)

  return (
    <div className="bg-white rounded-xl p-6 card-shadow mt-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 spiritual-gradient rounded-full flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-spiritual-950">
            Spiritual Guidance
          </h3>
          <p className="text-sm text-spiritual-600">
            Synthesized wisdom from sacred texts via Answer API
          </p>
        </div>
      </div>

      {/* Answer Text */}
      <div className="mb-6">
        <div className="text-xs text-spiritual-500 mb-2">
          Answer API response: {comprehensiveText.length} characters | 
          Synthesized answer: {answer.answerText?.length || 0} characters | 
          Citations: {answer.citations?.length || 0} | 
          References: {answer.references?.length || 0}
        </div>
        <div 
          className="text-spiritual-800 leading-relaxed prose prose-spiritual max-w-none"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="border-t border-spiritual-100 pt-4">
          <h4 className="text-sm font-semibold text-spiritual-700 mb-3">
            Sources & References
          </h4>
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <div key={citation.referenceId} className="flex items-start space-x-3">
                <span className="text-xs font-medium text-spiritual-500 bg-spiritual-50 px-2 py-1 rounded-full">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-spiritual-700 mb-1">
                    "{citation.text}"
                  </p>
                  {citation.title && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-spiritual-600">
                        {citation.title}
                      </span>
                      {citation.uri && (
                        <a
                          href={citation.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-spiritual-500 hover:text-spiritual-600 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional References */}
      {answer.references && answer.references.length > 0 && (
        <div className="border-t border-spiritual-100 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-spiritual-700 mb-3">
            Further Reading
          </h4>
          <div className="space-y-2">
            {answer.references.map((reference, index) => (
              <a
                key={index}
                href={reference.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-spiritual-50 rounded-lg hover:bg-spiritual-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-spiritual-800 mb-1">
                      {reference.title}
                    </h5>
                    {reference.snippet && (
                      <p className="text-xs text-spiritual-600 line-clamp-2">
                        {reference.snippet}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-spiritual-500 flex-shrink-0 ml-2" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-spiritual-100">
        <p className="text-xs text-spiritual-500 text-center">
          This response is generated using AI and spiritual wisdom sources. 
          Always use your own discernment and consult with spiritual teachers when needed.
        </p>
      </div>
    </div>
  )
}
