import Link from 'next/link'
import { ArrowLeft, Clock, Eye, MessageCircle } from 'lucide-react'

export default function HistoryPage() {
  // Mock data for demonstration
  const questions = [
    {
      id: 1,
      question: "How can I find inner peace in daily life?",
      category: "meditation",
      status: "answered",
      answer: "The path to inner peace begins with mindfulness...",
      views: 45,
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      question: "What is the meaning of karma?",
      category: "philosophy",
      status: "answered",
      answer: "Karma is the law of cause and effect...",
      views: 32,
      timestamp: "1 day ago"
    },
    {
      id: 3,
      question: "How to deal with difficult relationships?",
      category: "relationships",
      status: "pending",
      answer: null,
      views: 18,
      timestamp: "3 days ago"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meditation':
        return '🧘'
      case 'philosophy':
        return '📚'
      case 'relationships':
        return '💕'
      default:
        return '❓'
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

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-spiritual-950 mb-2">
          Your Question History
        </h1>
        <p className="text-spiritual-700 mb-8">
          Review your past questions and spiritual guidance received.
        </p>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-spiritual-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-spiritual-700 mb-2">
              No questions yet
            </h3>
            <p className="text-spiritual-600 mb-6">
              Start your spiritual journey by asking your first question.
            </p>
            <Link
              href="/submit"
              className="spiritual-gradient text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Ask a Question
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 card-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h3 className="font-semibold text-spiritual-950 mb-1">
                        {item.question}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-spiritual-600">
                        <span className="capitalize">{item.category}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {item.answer && (
                  <div className="mb-4">
                    <p className="text-spiritual-700 text-sm line-clamp-3">
                      {item.answer}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-spiritual-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{item.views} views</span>
                    </div>
                    {item.status === 'answered' && (
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>1 answer</span>
                      </div>
                    )}
                  </div>
                  <button className="text-spiritual-500 hover:text-spiritual-700 font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

