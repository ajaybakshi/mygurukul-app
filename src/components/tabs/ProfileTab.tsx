'use client';

import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  History, 
  Heart, 
  ExternalLink, 
  Info, 
  BookOpen,
  Star,
  Bell,
  Globe,
  Moon,
  Sun,
  Volume2,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface ProfileTabProps {
  className?: string;
}

interface SpiritualResource {
  title: string;
  description: string;
  url: string;
  icon: string;
}

interface PlaceholderSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon: boolean;
  items?: string[];
}

const ProfileTab: React.FC<ProfileTabProps> = ({ className = '' }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Spiritual resources
  const spiritualResources: SpiritualResource[] = [
    {
      title: "Vedic Heritage Portal",
      description: "Comprehensive collection of ancient Sanskrit texts",
      url: "https://www.vedicheritageportal.org",
      icon: "🕉️"
    },
    {
      title: "Sacred Texts Archive",
      description: "Digital library of world religious and spiritual texts",
      url: "https://www.sacred-texts.com",
      icon: "📚"
    },
    {
      title: "Dharma Wheel Community",
      description: "Buddhist discussion and meditation community",
      url: "https://www.dharmawheel.net",
      icon: "☸️"
    },
    {
      title: "Yoga Alliance",
      description: "Global yoga community and teacher resources",
      url: "https://www.yogaalliance.org",
      icon: "🧘"
    },
    {
      title: "Isha Foundation",
      description: "Sadhguru's teachings and spiritual programs",
      url: "https://isha.sadhguru.org",
      icon: "🙏"
    }
  ];

  // Placeholder sections for future features
  const placeholderSections: PlaceholderSection[] = [
    {
      title: "Conversation History",
      description: "Review your past spiritual conversations and insights",
      icon: <History className="w-6 h-6" />,
      comingSoon: true,
      items: [
        "Search through your spiritual questions",
        "Export conversation transcripts", 
        "Favorite meaningful discussions",
        "Personal growth timeline"
      ]
    },
    {
      title: "Personal Preferences",
      description: "Customize your spiritual guidance experience", 
      icon: <Settings className="w-6 h-6" />,
      comingSoon: true,
      items: [
        "Preferred spiritual traditions",
        "Language preferences",
        "Complexity level settings",
        "Topic interests and focus areas"
      ]
    },
    {
      title: "Sacred Favorites",
      description: "Save and organize your favorite teachings",
      icon: <Heart className="w-6 h-6" />,
      comingSoon: true,
      items: [
        "Bookmark meaningful verses",
        "Create personal collections",
        "Share favorite teachings",
        "Daily inspiration reminders"
      ]
    },
    {
      title: "Learning Progress",
      description: "Track your spiritual journey and growth",
      icon: <Star className="w-6 h-6" />,
      comingSoon: true,
      items: [
        "Topics explored over time",
        "Knowledge areas mastered",
        "Recommended next readings",
        "Personal milestones"
      ]
    }
  ];

  const PlaceholderCard: React.FC<{ section: PlaceholderSection }> = ({ section }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg text-amber-600">
          {section.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-amber-800">
              {section.title}
            </h3>
            {section.comingSoon && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-amber-600 text-sm mb-4 leading-relaxed">
            {section.description}
          </p>
          {section.items && (
            <ul className="space-y-2">
              {section.items.map((item, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-amber-700">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  const ResourceCard: React.FC<{ resource: SpiritualResource }> = ({ resource }) => (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-amber-300 group"
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{resource.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-amber-800 group-hover:text-amber-900">
              {resource.title}
            </h4>
            <ExternalLink className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
          </div>
          <p className="text-amber-600 text-sm leading-relaxed">
            {resource.description}
          </p>
        </div>
      </div>
    </a>
  );

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
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Sacred Profile
          </h1>
          <p className="text-amber-600 text-lg">
            Your spiritual journey, preferences, and sacred resources
          </p>
        </div>

        {/* App Information Card */}
        <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-l-4 border-amber-400 rounded-xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-200 rounded-lg">
              <Info className="w-6 h-6 text-amber-800" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-amber-800 mb-2">
                MyGurukul App
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-amber-800">Version:</span>
                  <span className="ml-2 text-amber-700">v0.1.0</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-800">Platform:</span>
                  <span className="ml-2 text-amber-700">Next.js 14</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-800">Mission:</span>
                  <span className="ml-2 text-amber-700">Ancient wisdom for modern life</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-800">Tradition:</span>
                  <span className="ml-2 text-amber-700">Guru-Shishya परंपरा</span>
                </div>
              </div>
              <p className="text-amber-600 text-sm mt-4 leading-relaxed">
                MyGurukul brings the timeless wisdom of ancient spiritual texts to your daily life through 
                AI-powered guidance, helping you navigate life&apos;s challenges with dharmic principles.
              </p>
            </div>
          </div>
        </div>

        {/* Current Settings (Demo) */}
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-amber-800 mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-3" />
            Quick Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-medium text-amber-800">Daily Wisdom Notifications</div>
                  <div className="text-sm text-amber-600">Receive daily spiritual insights</div>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-amber-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={notificationsEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center space-x-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-amber-600" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <div className="font-medium text-amber-800">Dark Mode</div>
                  <div className="text-sm text-amber-600">Comfortable reading in low light</div>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-amber-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={darkMode}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-medium text-amber-800">Sacred Sounds</div>
                  <div className="text-sm text-amber-600">Meditation bells and chimes</div>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-amber-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={soundEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Future Features - Placeholder Cards */}
        <div>
          <h2 className="text-2xl font-bold text-amber-800 mb-6 text-center">
            Enhanced Features Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {placeholderSections.map((section, index) => (
              <PlaceholderCard key={index} section={section} />
            ))}
          </div>
        </div>

        {/* Spiritual Resources */}
        <div>
          <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center justify-center">
            <Globe className="w-6 h-6 mr-3" />
            Sacred Resources & Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spiritualResources.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </div>
          <p className="text-center text-amber-600 text-sm mt-6">
            Explore these external resources to deepen your spiritual practice
          </p>
        </div>

        {/* App Stats */}
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-amber-800 mb-4 text-center">
            Your Spiritual Journey
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-amber-700">-</div>
              <div className="text-sm text-amber-600">Questions Asked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">-</div>
              <div className="text-sm text-amber-600">Texts Explored</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">-</div>
              <div className="text-sm text-amber-600">Wisdom Received</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">-</div>
              <div className="text-sm text-amber-600">Days Active</div>
            </div>
          </div>
          <p className="text-center text-amber-600 text-xs mt-4">
            Statistics will be available in future updates
          </p>
        </div>

        {/* Sacred Footer */}
        <div className="text-center text-sm text-amber-600 border-t border-amber-200 pt-6 mt-8">
          <div className="font-serif">May your spiritual journey be filled with wisdom and peace</div>
          <div className="mt-2 text-amber-500">
            🕉️ In service of eternal dharma 🕉️
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
