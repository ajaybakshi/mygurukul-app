'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Send, ArrowRight, CheckCircle, MessageSquare, Library } from 'lucide-react';
import SacredReadingView from '@/components/SacredReadingView';
import AskTab from '@/components/tabs/AskTab';
import LibraryTab from '@/components/tabs/LibraryTab';

interface LibraryStats {
  totalScriptures: number;
  totalCategories: number;
  categoryNames: string[];
  scriptureTypes: string[];
}

interface HomeTabProps {
  onAsk?: (question: string) => void;
  onNavigate?: (tab: string) => void;
}

// Library book data with subtitles
const libraryBooks = [
  { name: 'Vedas', subtitle: 'The Eternal Knowledge' },
  { name: 'Upanishads', subtitle: 'The Philosophical Essence' },
  { name: 'Gita', subtitle: 'The Song of God' }
];

type CurrentView = 'hub' | 'wisdom' | 'chat' | 'library';

export default function HomeTab({ onAsk, onNavigate }: HomeTabProps) {
  const [currentView, setCurrentView] = useState<CurrentView>('hub');
  const [inputVal, setInputVal] = useState('');
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({
    totalScriptures: 0,
    totalCategories: 0,
    categoryNames: [],
    scriptureTypes: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch library statistics
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/library-stats');
        if (response.ok) {
          const stats = await response.json();
          setLibraryStats(stats);
          console.log('Library stats loaded:', stats);
        } else {
          console.error('Failed to fetch library stats:', response.status);
        }
      } catch (error) {
        console.error('Error loading library stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Load Google Fonts
  useEffect(() => {
    const link1 = document.createElement('link');
    link1.rel = 'preconnect';
    link1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = 'anonymous';
    document.head.appendChild(link2);

    const link3 = document.createElement('link');
    link3.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Martel:wght@400;600;700&display=swap';
    link3.rel = 'stylesheet';
    document.head.appendChild(link3);

    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(link2);
      document.head.removeChild(link3);
    };
  }, []);

  const handleAsk = () => {
    if (!inputVal.trim()) return;
    setCurrentView('chat');
    // inputVal will be passed to AskTab via initialQuestion prop
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Render based on currentView
  if (currentView === 'wisdom') {
    return <SacredReadingView onBack={() => setCurrentView('hub')} />;
  }

  if (currentView === 'chat') {
    return <AskTab onBack={() => setCurrentView('hub')} initialQuestion={inputVal} />;
  }

  if (currentView === 'library') {
    return <LibraryTab onBack={() => setCurrentView('hub')} />;
  }

  // Render Hub (Bento Dashboard)
  return (
    <div 
      className="max-w-6xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-500 bg-stone-50 min-h-screen"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(252, 211, 77, 0.04) 0%, transparent 50%)
        `
      }}
      >
      {/* Hero Introduction Section */}
      <section className="text-center mb-8 px-4">
        <h1 
          className="text-3xl md:text-4xl font-bold text-stone-800 mb-3" 
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Welcome to MyGurukul
        </h1>
        <p className="text-xl text-spiritual-700 mb-4 font-medium">
          Your AI-Powered Gateway to Ancient Indian Wisdom
        </p>
        <p className="text-base text-stone-600 max-w-2xl mx-auto mb-4 leading-relaxed">
          Experience authentic sacred teachings from original Sanskrit scriptures, enhanced with AI-guided interpretation. Explore {statsLoading ? '...' : `${libraryStats.totalScriptures}+`} texts spanning Vedas, Upanishads, Puranas, Ayurveda, and Shastras in three meaningful ways.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            ✓ Original Sanskrit Texts
          </span>
          <span className="flex items-center gap-1">
            ✓ Scholarly English Translations
          </span>
          <span className="flex items-center gap-1">
            ✓ AI-Enhanced Interpretations
          </span>
        </div>
      </section>

      {/* Library Stats Banner */}
      <div className="bg-gradient-to-r from-spiritual-50 to-orange-50 rounded-xl p-6 mb-8 border border-spiritual-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-6 text-center">
          {/* Scripture Count */}
          <div className="flex items-center gap-2">
            <span className="text-3xl">🕉️</span>
            <div>
              <p className="text-2xl font-bold text-spiritual-800">
                {statsLoading ? '...' : `${libraryStats.totalScriptures}+`}
              </p>
              <p className="text-sm text-stone-600">Sacred Texts</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-12 w-px bg-spiritual-300"></div>

          {/* Category Count */}
          <div className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <div>
              <p className="text-2xl font-bold text-spiritual-800">
                {statsLoading ? '...' : libraryStats.totalCategories}
              </p>
              <p className="text-sm text-stone-600">Categories</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-12 w-px bg-spiritual-300"></div>

          {/* Scripture Categories */}
          <div className="flex-1 min-w-[280px]">
            <p className="text-sm text-stone-700 font-medium">
              {statsLoading ? 'Loading...' : libraryStats.categoryNames.slice(0, 6).join(' • ')}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              From foundational Vedas to practical life sciences
            </p>
          </div>
        </div>
      </div>

      {/* Top Hero Section - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 1. Sacred Reading Card (Takes 4 columns) */}
        <div className="md:col-span-4 bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-spiritual-500 border border-orange-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          {/* Decorative Background Icon */}
          <div className="absolute -right-6 -top-6 opacity-5 transform group-hover:rotate-12 transition-transform duration-700">
            <Sparkles size={120} />
          </div>
          
          {/* Icon Circle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-spiritual-500 rounded-full flex items-center justify-center shadow-md">
              <BookOpen size={24} className="text-white" />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Sparkles size={18} />
              <span>Sacred Reading</span>
            </div>
            <div className="text-center my-6">
              <p 
                className="text-3xl font-bold text-amber-900 mb-2 leading-relaxed text-center"
                style={{ fontFamily: 'Martel, serif' }}
              >
                सत्यमेव जयते नानृतं
              </p>
              <p className="text-stone-700 italic text-sm mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                &ldquo;Truth alone triumphs; not falsehood.&rdquo;
              </p>
              {/* Badge/Stat */}
              <div className="inline-flex items-center gap-1 bg-spiritual-100 text-spiritual-700 px-3 py-1 rounded-full text-xs font-medium">
                <Sparkles size={12} />
                <span>Daily curated wisdom</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('wisdom')}
            className="w-full py-3 bg-spiritual-500 hover:bg-spiritual-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Begin Reading <ArrowRight size={16} />
          </button>
        </div>

        {/* 2. Spiritual Guidance Card (Takes 8 columns) */}
        <div className="md:col-span-8 bg-white border-l-4 border-orange-500 rounded-2xl p-8 shadow-xl shadow-orange-100 hover:shadow-xl transition-all duration-300 flex flex-col relative">
          {/* Icon Circle */}
          <div className="flex justify-start mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
              <MessageSquare size={24} className="text-white" />
            </div>
          </div>
          
           <div className="mb-4">
             <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
               Spiritual Guidance
                    </h2>
             <p className="text-stone-600 mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>What seeks clarity in you today?</p>
             {/* Badge/Stat */}
             <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium mt-2">
               <Sparkles size={12} />
               <span>AI-powered answers</span>
             </div>
                  </div>
                  
           <div className="flex-grow relative mb-4">
             <textarea
               className="w-full h-32 p-4 bg-transparent border-0 border-b-2 border-stone-200 focus:border-orange-500 focus:ring-0 focus:outline-none resize-none text-lg placeholder-stone-400 transition-all"
                    style={{
                 background: 'linear-gradient(to bottom, rgba(254, 243, 199, 0.1), transparent)',
                 fontFamily: 'Playfair Display, serif'
               }}
               placeholder="Type your question here..."
               value={inputVal}
               onChange={(e) => setInputVal(e.target.value)}
               onKeyDown={handleKeyDown}
             />
                    </div>
                    
                    {/* Full-width CTA Button */}
                    <button
                      onClick={handleAsk}
                      disabled={!inputVal.trim()}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      Ask Sevak <ArrowRight size={16} />
                    </button>
                  </div>
      </div>

      {/* Sacred Library Journey Card */}
      <div className="mt-6 bg-white border-l-4 border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
        {/* Icon Circle */}
        <div className="flex justify-start mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Library size={24} className="text-white" />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Sacred Library
          </h3>
          <p className="text-sm text-stone-600 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Explore {statsLoading ? '...' : `${libraryStats.totalScriptures}+`} authentic texts across {statsLoading ? '...' : libraryStats.totalCategories} categories—from Vedic hymns to Ayurvedic treatises, philosophical Upanishads to epic narratives
          </p>
          {/* Category Badge */}
          <div className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full inline-block mb-4">
            {statsLoading ? 'Loading...' : libraryStats.categoryNames.slice(0, 4).join(' • ')}
          </div>
        </div>
        
        <button
          onClick={() => setCurrentView('library')}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Explore Library <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
