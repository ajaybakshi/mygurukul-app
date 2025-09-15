'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import {
  callDiscoveryEngine,
  DiscoveryEngineResponse,
  DiscoveryEngineError,
} from "@/lib/discoveryEngine";
import AIResponse from "@/components/AIResponse";
import { categoryService } from "@/lib/database/categoryService";
import { TopicCategory } from "@/types/categories";
import { useTabContext } from '@/contexts/TabContext';

// Client-side only timestamp component to avoid hydration mismatches
const ClientTimestamp: React.FC<{ timestamp: Date | string }> = ({ timestamp }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span>--:--</span>;
  }

  // Safe date conversion - handles both Date objects and strings
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return <span>--:--</span>;
  }

  return <span>{dateObj.toLocaleTimeString()}</span>;
};

// Initialize categories directly
const initialCategories = categoryService.getCategories();

interface AskTabProps {
  className?: string;
}

const AskTab: React.FC<AskTabProps> = ({ className = '' }) => {
  // Use TabContext for state management
  const {
    question,
    category,
    isSubmitting,
    aiResponse,
    isLoadingAI,
    aiError,
    sessionId,
    showValidationError,
    messages,
    wisdomContext,
    setQuestion,
    setCategory,
    setIsSubmitting,
    setAiResponse,
    setIsLoadingAI,
    setAiError,
    setSessionId,
    setShowValidationError,
    addMessage,
    clearMessages,
    clearSession
  } = useTabContext();

  const [categories, setCategories] = useState<TopicCategory[]>(initialCategories);
  const [isClient, setIsClient] = useState(false);

  // Auto-scroll to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Handle wisdom context from HomeTab (prop drilling)
    if (wisdomContext) {
      const contextMessage = `I just read today's wisdom from ${wisdomContext.sourceName}: "${wisdomContext.rawText.substring(0, 100)}..." Can you help me understand how to apply this to my life?`;
      setQuestion(contextMessage);
    } else {
      // Fallback: Check for wisdom data in sessionStorage (backwards compatibility)
      const storedWisdom = sessionStorage.getItem('homeTabWisdom');
      if (storedWisdom) {
        try {
          const wisdomData = JSON.parse(storedWisdom);
          const contextMessage = `I just read today's wisdom from ${wisdomData.sourceName}: "${wisdomData.rawText.substring(0, 100)}..." Can you help me understand how to apply this to my life?`;
          setQuestion(contextMessage);
          sessionStorage.removeItem('homeTabWisdom'); // Clean up
        } catch (error) {
          console.error('Error parsing wisdom data:', error);
        }
      }
    }
  }, [wisdomContext, setQuestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    setShowValidationError(false);
    setIsSubmitting(true);
    setIsLoadingAI(true);
    setAiError(null);
    setAiResponse(null);

    try {
      // Add user question to message history
      const userMessage = {
        id: Date.now(),
        sender: "user" as const,
        text: question,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      console.log("Sending request with sessionId:", sessionId, "and category:", category);
      const response = await callDiscoveryEngine(
        question,
        sessionId || undefined,
        category
      );
      console.log("Received response with sessionId:", response.sessionId);
      setAiResponse(response);

      // Add AI response to message history
      if (response.answer && response.answer.answerText) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: "ai" as const,
          text: response.answer.answerText,
          citations: response.answer.citations,
          timestamp: new Date(),
        };
        addMessage(aiMessage);
      }

      // Extract and store session ID from response
      if (response.sessionId) {
        setSessionId(response.sessionId);
        console.log("Updated sessionId from response:", response.sessionId);
      }

      // Clear the question input after successful submission
      setQuestion("");
    } catch (error) {
      if (error instanceof DiscoveryEngineError) {
        setAiError(error.message);
        if (error.message.includes("session")) {
          setSessionId(null);
        }
      } else if (error instanceof Error) {
        setAiError(error.message);
      } else {
        setAiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setIsLoadingAI(false);
    }
  };

  const handleNewConversation = () => {
    clearSession();
    setQuestion("");
  };

  // Enhanced Category Dropdown Component
  const CategoryDropdown = () => {
    const selectedCategory = categories.find((cat) => cat.id === category);

    return (
      <div className="relative">
        <label className="block text-lg font-semibold text-amber-800 mb-4">
          Spiritual Category
        </label>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-4 sm:p-5 border border-amber-300 rounded-xl bg-gradient-to-r from-amber-50 to-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-base touch-manipulation transition-all duration-200 hover:border-amber-400 hover:shadow-md appearance-none cursor-pointer"
            style={{ color: '#D4AF37' }}
          >
            <option value="">Select a spiritual category...</option>
            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
                className="py-3 px-4 hover:bg-amber-50 transition-colors duration-200"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected category indicator */}
        {selectedCategory && (
          <div className="mt-3 flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-700 font-medium">
              Selected: {selectedCategory.name}
            </span>
            {selectedCategory.description && (
              <span className="text-xs text-amber-600">
                - {selectedCategory.description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50 ${className}`}>
      {/* Sacred background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-6">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Ask for Spiritual Guidance
          </h1>
          <p className="text-amber-600 text-lg">
            Seek wisdom from ancient spiritual texts and receive AI-powered guidance
          </p>

          {/* Wisdom Context Indicator */}
          {wisdomContext && (
            <div className="mt-6">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100/50 px-4 py-2 rounded-full border border-blue-200/50 shadow-sm">
                <span className="text-lg mr-2">🕉️</span>
                <span className="text-base text-blue-700 font-medium">
                  Discussing today&apos;s wisdom from {wisdomContext.sourceName}
                </span>
              </div>
            </div>
          )}

          {/* Session Status Indicator */}
          {sessionId && (
            <div className="mt-4">
              <div className="inline-flex items-center bg-gradient-to-r from-amber-50 to-amber-100/50 px-4 py-2 rounded-full border border-amber-200/50 shadow-sm">
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-pulse"></span>
                <span className="text-base text-amber-700 font-medium">
                  Continuing conversation
                </span>
                <span className="ml-2 text-sm text-amber-600">
                  ({sessionId.length > 20 ? `${sessionId.substring(0, 8)}...` : sessionId})
                </span>
              </div>
            </div>
          )}

          {/* New Conversation Button */}
          {sessionId && (
            <div className="mt-4">
              <button
                onClick={handleNewConversation}
                className="flex items-center bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:scale-105"
                title="Start a new conversation"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                <span>New Conversation</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <CategoryDropdown />

          <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 sm:p-8 shadow-lg">
            <label className="block text-lg font-semibold text-amber-800 mb-4">
              Your Spiritual Question
            </label>
            <textarea
              key="question-textarea"
              value={isClient ? question : ""}
              onChange={(e) => {
                setQuestion(e.target.value);
                setShowValidationError(false);
              }}
              placeholder="Share your spiritual question or concern..."
              className="w-full p-5 border border-amber-300 rounded-xl bg-gradient-to-r from-white to-amber-50/30 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition-all duration-200 hover:border-amber-400 hover:shadow-md text-base leading-relaxed"
              rows={6}
              maxLength={500}
            />
            <div className="text-right text-sm text-amber-600 mt-3">
              {question.length}/500
            </div>
          </div>

          <button
            key="submit-button"
            type="submit"
            disabled={isSubmitting || !isClient || !question.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-5 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] touch-manipulation text-lg font-semibold border-2 border-amber-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-opacity-50"
            aria-label="Submit spiritual question for AI guidance"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Seeking Wisdom...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Send className="w-6 h-6" />
                <span>Ask for Guidance</span>
              </div>
            )}
          </button>

          {/* Validation Error Message */}
          {showValidationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center animate-pulse">
              Please enter your question before seeking guidance.
            </div>
          )}
        </form>

        {/* Conversation History */}
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
            <span className="mr-2">💬</span>
            Spiritual Conversation
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-l-lg rounded-tr-lg"
                        : "bg-gradient-to-r from-white to-blue-50 border border-blue-100 rounded-r-lg rounded-tl-lg"
                    } p-4 shadow-sm`}
                  >
                    {/* Message Header */}
                    <div
                      className={`text-xs font-medium mb-2 ${
                        message.sender === "user"
                          ? "text-amber-700 text-right"
                          : "text-blue-600 text-left"
                      }`}
                    >
                      {message.sender === "user" ? "You" : "🕉️ Spiritual Guide"}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`leading-relaxed ${
                        message.sender === "user"
                          ? "text-amber-900 text-right"
                          : "text-gray-800 text-left"
                      }`}
                    >
                      {message.text}
                    </div>

                    {/* Citations for AI messages */}
                    {message.sender === "ai" &&
                      message.citations &&
                      message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-100">
                          <div className="text-xs text-blue-600 font-medium mb-2">
                            📚 Sacred Sources:
                          </div>
                          <div className="space-y-1">
                            {message.citations.map((citation, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded"
                              >
                                {citation.title ||
                                  citation.documentId ||
                                  `Source ${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-3 ${
                        message.sender === "user"
                          ? "text-amber-600 text-right"
                          : "text-blue-500 text-left"
                      }`}
                    >
                      <ClientTimestamp timestamp={message.timestamp} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-amber-600">
                <span className="text-3xl mb-2 block">🕉️</span>
                <p className="font-serif">Your spiritual conversation will appear here</p>
                <p className="text-sm mt-2 text-amber-500">Ask a question to begin your journey of wisdom</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* AI Response Section */}
        <div className="transition-all duration-300 ease-in-out">
          <AIResponse
            response={aiResponse}
            isLoading={isLoadingAI}
            error={aiError}
          />
        </div>
      </div>
    </div>
  );
};

export default AskTab;
