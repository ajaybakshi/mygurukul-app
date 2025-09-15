import Link from 'next/link'
import { Home, MessageCircle, Clock, User } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-spiritual-950 mb-2">
          MyGurukul
        </h1>
        <p className="text-spiritual-700 text-lg">
          Your spiritual journey begins here
        </p>
      </header>

      {/* Welcome Section */}
      <section className="mb-8">
        <div className="spiritual-gradient rounded-2xl p-6 text-white text-center card-shadow">
          <h2 className="text-2xl font-semibold mb-3">
            Welcome, Seeker
          </h2>
          <p className="text-spiritual-100 mb-4">
            Discover ancient wisdom and modern insights. Ask questions, find answers, and grow on your spiritual path.
          </p>
          <Link 
            href="/submit"
            className="inline-block bg-white text-spiritual-950 px-6 py-3 rounded-full font-medium hover:bg-spiritual-50 transition-colors"
          >
            Ask a Question
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-spiritual-950 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Link 
            href="/submit"
            className="bg-white rounded-xl p-4 text-center card-shadow hover:shadow-lg transition-shadow"
          >
            <MessageCircle className="w-8 h-8 text-spiritual-500 mx-auto mb-2" />
            <span className="text-spiritual-950 font-medium">Ask Question</span>
          </Link>
          <Link 
            href="/history"
            className="bg-white rounded-xl p-4 text-center card-shadow hover:shadow-lg transition-shadow"
          >
            <Clock className="w-8 h-8 text-spiritual-500 mx-auto mb-2" />
            <span className="text-spiritual-950 font-medium">My History</span>
          </Link>
        </div>
      </section>

      {/* Featured Wisdom */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-spiritual-950 mb-4">
          Daily Wisdom
        </h3>
        <div className="bg-white rounded-xl p-6 card-shadow">
          <blockquote className="text-spiritual-800 text-lg italic mb-4">
            &ldquo;The mind is everything. What you think you become.&rdquo;
          </blockquote>
          <cite className="text-spiritual-600 text-sm">
            — Buddha
          </cite>
        </div>
      </section>

      {/* Recent Questions */}
      <section>
        <h3 className="text-xl font-semibold text-spiritual-950 mb-4">
          Recent Questions
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 card-shadow">
              <h4 className="font-medium text-spiritual-950 mb-2">
                How can I find inner peace in daily life?
              </h4>
              <p className="text-spiritual-700 text-sm mb-3">
                I&apos;m struggling with stress and anxiety. Looking for practical spiritual guidance...
              </p>
              <div className="flex items-center justify-between text-xs text-spiritual-600">
                <span>2 hours ago</span>
                <span>3 answers</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

