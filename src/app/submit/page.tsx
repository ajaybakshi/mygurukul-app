'use client'

import { useState } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { callDiscoveryEngine, DiscoveryEngineResponse, DiscoveryEngineError } from '@/lib/discoveryEngine'
import AIResponse from '@/components/AIResponse'

export default function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState<DiscoveryEngineResponse | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsSubmitting(true)
    setIsLoadingAI(true)
    setAiError(null)
    setAiResponse(null)

    try {
      const response = await callDiscoveryEngine(question)
      setAiResponse(response)
    } catch (error) {
      if (error instanceof DiscoveryEngineError) {
        setAiError(error.message)
      } else if (error instanceof Error) {
        setAiError(error.message)
      } else {
        setAiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
      setIsLoadingAI(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="flex items-center mb-6">
        <Link 
          href="/"
          className="flex items-center text-spiritual-600 hover:text-spiritual-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-spiritual-950 mb-2">
          Ask a Spiritual Question
        </h1>
        <p className="text-spiritual-700 mb-8">
          Seek wisdom from ancient spiritual texts and receive AI-powered guidance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-spiritual-950 font-semibold mb-3">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 border border-spiritual-200 rounded-xl bg-white text-spiritual-950 focus:outline-none focus:ring-2 focus:ring-spiritual-500 focus:border-transparent"
            >
              <option value="general">General Spiritual Guidance</option>
              <option value="meditation">Meditation & Mindfulness</option>
              <option value="philosophy">Philosophy & Ethics</option>
              <option value="relationships">Relationships & Love</option>
              <option value="purpose">Life Purpose & Meaning</option>
              <option value="challenges">Dealing with Challenges</option>
            </select>
          </div>

          <div>
            <label className="block text-spiritual-950 font-semibold mb-3">Your Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Share your spiritual question or concern..."
              className="w-full p-4 border border-spiritual-200 rounded-xl bg-white text-spiritual-950 placeholder-spiritual-500 focus:outline-none focus:ring-2 focus:ring-spiritual-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={500}
            />
            <div className="text-right text-sm text-spiritual-600 mt-2">
              {question.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isSubmitting}
            className="w-full spiritual-gradient text-white py-4 rounded-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Seeking Wisdom...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Question</span>
              </>
            )}
          </button>
        </form>

        <AIResponse 
          response={aiResponse} 
          isLoading={isLoadingAI} 
          error={aiError} 
        />

        <div className="mt-8 bg-white rounded-xl p-6 card-shadow">
          <h3 className="text-lg font-bold text-spiritual-950 mb-3">Guidelines for Questions</h3>
          <ul className="space-y-2 text-sm text-spiritual-700">
            <li className="flex items-start">
              <span className="text-spiritual-600 mr-2 font-bold">•</span>
              <span className="text-spiritual-800">Be specific and clear about your concern</span>
            </li>
            <li className="flex items-start">
              <span className="text-spiritual-600 mr-2 font-bold">•</span>
              <span className="text-spiritual-800">Share relevant context to help provide better guidance</span>
            </li>
            <li className="flex items-start">
              <span className="text-spiritual-600 mr-2 font-bold">•</span>
              <span className="text-spiritual-800">Respect the spiritual nature of this community</span>
            </li>
            <li className="flex items-start">
              <span className="text-spiritual-600 mr-2 font-bold">•</span>
              <span className="text-spiritual-800">Questions are typically answered within 24-48 hours</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

