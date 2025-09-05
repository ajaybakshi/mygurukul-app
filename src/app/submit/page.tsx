"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  callDiscoveryEngine,
  DiscoveryEngineResponse,
  DiscoveryEngineError,
} from "@/lib/discoveryEngine";
import AIResponse from "@/components/AIResponse";
import SourceMaterialsDisplay from "@/components/SourceMaterialsDisplay";

export default function SubmitPage() {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("dharmic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<DiscoveryEngineResponse | null>(
    null
  );
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Message history state
  const [messages, setMessages] = useState<
    Array<{
      id: number;
      sender: "user" | "ai";
      text: string;
      citations?: Array<any>;
      timestamp: Date;
    }>
  >([]);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      // Provide user feedback when trying to submit empty question
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000); // Hide after 3 seconds
      return;
    }

    setShowValidationError(false); // Clear any previous validation errors

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
      setMessages((prev) => [...prev, userMessage]);

      console.log("Sending request with sessionId:", sessionId);
      const response = await callDiscoveryEngine(
        question,
        sessionId || undefined
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
        setMessages((prev) => [...prev, aiMessage]);
      }

      // Extract and store session ID from response
      // Always update sessionId if we get a new one from the response
      if (response.sessionId) {
        setSessionId(response.sessionId);
        console.log("Updated sessionId from response:", response.sessionId);
      }
    } catch (error) {
      if (error instanceof DiscoveryEngineError) {
        setAiError(error.message);
        // Handle session-specific errors
        if (error.message.includes("session")) {
          setSessionId(null); // Clear invalid session
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
    setSessionId(null);
    setAiResponse(null);
    setAiError(null);
    setQuestion("");
    setMessages([]); // Clear message history
  };

  // Enhanced Category Dropdown Component
  const CategoryDropdown = () => {
    const categories = [
      { value: "dharmic", label: "🕉️ Dharmic Wisdom & Guidance" },
      { value: "meditation", label: "🧘 Meditation & Inner Peace" },
      { value: "dharma", label: "⚖️ Dharma & Ethical Living" },
      { value: "relationships", label: "💕 Sacred Relationships & Love" },
      { value: "purpose", label: "🎯 Life Purpose & Karma" },
      { value: "challenges", label: "🛡️ Overcoming Life Challenges" },
    ];

    return (
      <div className="relative">
        <label className="block text-premium-lg font-semibold text-spiritual-950 mb-4">
          Category
        </label>

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
            <div
              className={`w-6 h-6 text-spiritual-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Selected category indicator */}
        <div className="mt-3 flex items-center space-x-3">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-gentlePulse"></div>
          <span className="text-premium-sm text-spiritual-600 font-medium">
            Selected: {categories.find((cat) => cat.value === category)?.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* Enhanced Header */}
      <header className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center text-spiritual-600 hover:text-spiritual-800 transition-colors hover-spiritual p-2 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6 mr-3" />
          <span className="text-premium-base font-medium">Back to Home</span>
        </Link>

        {/* Enhanced New Conversation Button - Only show when there's an active session */}
        {sessionId && (
          <button
            onClick={handleNewConversation}
            className="flex items-center bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:scale-105"
            title="Start a new conversation"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            <span>New Conversation</span>
          </button>
        )}
      </header>

      <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
        {/* Chat Section - Fixed Priority Height */}
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-10">
            <h1 className="text-premium-3xl font-bold text-spiritual-950 mb-4">
              Ask a Spiritual Question
            </h1>
            <p className="text-premium-lg text-spiritual-700 max-w-2xl mx-auto leading-relaxed">
              Seek wisdom from ancient spiritual texts and receive AI-powered
              guidance.
            </p>

            {/* Enhanced Session Status Indicator - More prominent and informative */}
            {sessionId && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center bg-gradient-to-r from-amber-50 to-amber-100/50 px-4 py-2 rounded-full border border-amber-200/50 shadow-sm">
                  <span className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-gentlePulse"></span>
                  <span className="text-premium-base text-spiritual-700 font-medium">
                    Continuing conversation
                  </span>
                  <span className="ml-2 text-premium-sm text-spiritual-500">
                    (
                    {sessionId.length > 20
                      ? `${sessionId.substring(0, 8)}...`
                      : sessionId}
                    )
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <CategoryDropdown />

            <div className="bg-premium-card border border-premium rounded-xl p-6 sm:p-8 premium-shadow">
              <label className="block text-premium-lg font-semibold text-spiritual-950 mb-4">
                Your Question
              </label>
              <textarea
                key="question-textarea"
                value={isClient ? question : ""}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setShowValidationError(false); // Clear validation error when user types
                }}
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
              key="submit-button"
              type="submit"
              disabled={isSubmitting || !isClient || !question.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-5 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] touch-manipulation text-premium-lg font-semibold border-2 border-amber-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-opacity-50"
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

          {/* Conversation History - Always visible */}
          <div className="bg-premium-card border border-premium rounded-xl p-6 premium-shadow">
            <h3 className="text-premium-lg font-semibold text-spiritual-950 mb-4 flex items-center">
              <span className="mr-2">💬</span>
              Conversation History
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto p-2">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.sender === "user"
                          ? "bg-amber-100 border border-amber-200 rounded-l-lg rounded-tr-lg"
                          : "bg-white border border-amber-100 rounded-r-lg rounded-tl-lg"
                      } p-4 shadow-sm`}
                    >
                      {/* Message Header */}
                      <div
                        className={`text-xs font-medium mb-2 ${
                          message.sender === "user"
                            ? "text-amber-700 text-right"
                            : "text-spiritual-600 text-left"
                        }`}
                      >
                        {message.sender === "user" ? "You" : "Spiritual Guide"}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`leading-relaxed ${
                          message.sender === "user"
                            ? "text-amber-900 text-right"
                            : "text-spiritual-900 text-left"
                        }`}
                      >
                        {message.text}
                      </div>

                      {/* Citations for AI messages */}
                      {message.sender === "ai" &&
                        message.citations &&
                        message.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <div className="text-xs text-amber-600 font-medium mb-2">
                              📚 Sources:
                            </div>
                            <div className="space-y-1">
                              {message.citations.map((citation, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded"
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
                            : "text-spiritual-500 text-left"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-spiritual-500">
                  <span className="text-2xl mb-2 block">💬</span>
                  <p>Your spiritual conversation will appear here</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Sacred Sources Section */}
        <div className="mt-12 transition-all duration-300 ease-in-out max-h-96 overflow-y-auto">
          <SourceMaterialsDisplay selectedCategory={category} />
        </div>

        {/* AI Response - Spiritual Guidance (Last Section) */}
        <div className="mt-12">
          <AIResponse
            response={aiResponse}
            isLoading={isLoadingAI}
            error={aiError}
          />
        </div>
      </div>
    </div>
  );
}
