'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { callDiscoveryEngine, DiscoveryEngineResponse, DiscoveryEngineError } from '@/lib/discoveryEngine'
import AIResponse from '@/components/AIResponse'
import SourceMaterialsDisplay from '@/components/SourceMaterialsDisplay'
import ChatContainer from '@/components/ChatContainer'

export default function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState('dharmic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState<DiscoveryEngineResponse | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Add message to chat
  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user question to chat
    addMessage('user', question)

    setIsSubmitting(true)
    setIsLoadingAI(true)
    setAiError(null)
    setAiResponse(null)

    try {
      const response = await callDiscoveryEngine(question)
      setAiResponse(response)
      
      // Add AI response to chat
      if (response.answer?.answerText) {
        addMessage('ai', response.answer.answerText)
      }
    } catch (error) {
      if (error instanceof DiscoveryEngineError) {
        setAiError(error.message)
        addMessage('ai', `Error: ${error.message}`)
      } else if (error instanceof Error) {
        setAiError(error.message)
        addMessage('ai', `Error: ${error.message}`)
      } else {
        setAiError('An unexpected error occurred. Please try again.')
        addMessage('ai', 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
      setIsLoadingAI(false)
    }
  }

  // Enhanced Category Dropdown Component
  const CategoryDropdown = () => {
    const categories = [
      { value: 'dharmic', label: '🕉️ Dharmic Wisdom & Guidance' },
      { value: 'meditation', label: '🧘 Meditation & Inner Peace' },
      { value: 'dharma', label: '⚖️ Dharma & Ethical Living' },
      { value: 'relationships', label: '💕 Sacred Relationships & Love' },
      { value: 'purpose', label: '🎯 Life Purpose & Karma' },
      { value: 'challenges', label: '🛡️ Overcoming Life Challenges' }
    ];

    return (
      <div className="relative">
        <label className="block text-premium-lg font-semibold text-spiritual-950 mb-4">Category</label>
        
        {/* Enhanced Select with premium styling */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            className="w-full p-4 sm:p-5 border border-premium rounded-xl bg-premium-card text-spiritual-950 focus:outline-none focus:ring-2 focus:ring-spiritual-500 focus:border-transparent text-premium-base touch-manipulation transition-all duration-200 hover:border-premium-hover hover:shadow-md appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option 
                key={cat.value} 
                value={cat.value}
                className="py-3 px-4 hover:bg-amber-50 transition-colors duration-200"
              >
                {cat.label}
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <div className={`w-6 h-6 text-spiritual-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Selected category indicator */}
        <div className="mt-3 flex items-center space-x-3">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-gentlePulse"></div>
          <span className="text-premium-sm text-spiritual-600 font-medium">
            Selected: {categories.find(cat => cat.value === category)?.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* Enhanced Header */}
      <header className="flex items-center mb-8">
        <Link 
          href="/"
          className="flex items-center text-spiritual-600 hover:text-spiritual-800 transition-colors hover-spiritual p-2 rounded-lg"
        >
          <span className="text-2xl mr-3">⬅️</span>
          <span className="text-premium-base font-medium">Back to Home</span>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-premium-3xl font-bold text-spiritual-950 mb-4">
            Ask a Spiritual Question
          </h1>
          <p className="text-premium-lg text-spiritual-700 max-w-2xl mx-auto leading-relaxed">
            Seek wisdom from ancient spiritual texts and receive AI-powered guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <CategoryDropdown />

          {/* Source Materials Display with smooth transitions */}
          <div className="transition-all duration-300 ease-in-out">
            <SourceMaterialsDisplay selectedCategory={category} />
          </div>

          <div className="bg-premium-card border border-premium rounded-xl p-6 sm:p-8 premium-shadow">
            <label className="block text-premium-lg font-semibold text-spiritual-950 mb-4">Your Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Share your spiritual question or concern..."
              className="w-full p-5 border border-premium rounded-xl bg-white text-spiritual-950 placeholder-spiritual-500 focus:outline-none focus:ring-2 focus:ring-spiritual-500 focus:border-transparent resize-none transition-all duration-200 hover:border-premium-hover hover:shadow-md text-premium-base leading-relaxed"
              rows={6}
              maxLength={500}
            />
            <div className="text-right text-premium-sm text-spiritual-600 mt-3">
              {question.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !question.trim()}
            className="w-full button-premium text-white py-5 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] touch-manipulation text-premium-lg font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Seeking Wisdom...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xl">📤</span>
                <span>Ask for Guidance</span>
              </div>
            )}
          </button>
        </form>

        {/* Chat Container */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Chat History</h2>
            <div className="space-x-2">
              <button
                onClick={() => setChatMessages([])}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Clear Chat
              </button>
              <button
                onClick={() => addMessage('ai', '🧪 Test AI message - This is a sample response to test the chat display.')}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Test Message
              </button>
            </div>
          </div>
          <ChatContainer messages={chatMessages} />
        </div>

        {/* AI Response */}
        <div className="mt-12">
          <AIResponse 
            response={aiResponse} 
            isLoading={isLoadingAI} 
            error={aiError} 
          />
        </div>
      </div>
    </div>
  )
}

