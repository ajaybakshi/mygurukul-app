'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ArrowLeft } from 'lucide-react';
import TraditionalWisdomDisplay from './TraditionalWisdomDisplay';
import AudioIconButton from './audio/AudioIconButton';
import { TransliterationService } from '@/lib/services/transliterationService';

interface TodaysWisdomData {
  rawText: string;
  rawTextAnnotation: {
    chapter: string;
    section: string;
    source: string;
    characters?: string;
    location?: string;
    theme?: string;
    technicalReference?: string;
  };
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  encouragement: string;
}

interface SacredReadingViewProps {
  onClose?: () => void;
  onBack?: () => void;
}

export default function SacredReadingView({ onClose, onBack }: SacredReadingViewProps) {
  const [todaysWisdom, setTodaysWisdom] = useState<TodaysWisdomData | null>(null);
  const [isLoadingWisdom, setIsLoadingWisdom] = useState<boolean>(false);
  const [wisdomError, setWisdomError] = useState<string | null>(null);
  const [activeTabCard, setActiveTabCard] = useState<'sacred' | 'interpretation'>('sacred');
  const [selectedSource, setSelectedSource] = useState<string>('random');
  const [availableSources, setAvailableSources] = useState<Array<{folderName: string, displayName: string}>>([]);
  const [sourcesLoading, setSourcesLoading] = useState<boolean>(false);

  // Cache management functions
  const getCacheKey = () => `mygurukul_wisdom_${new Date().toDateString()}`;
  
  const getCachedWisdom = (): TodaysWisdomData | null => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        const parsedData = JSON.parse(cached);
        if (parsedData.data && parsedData.timestamp) {
          return parsedData.data;
        }
      }
    } catch (error) {
      console.error('Error reading cached wisdom:', error);
      localStorage.removeItem(getCacheKey());
    }
    return null;
  };

  const setCachedWisdom = (wisdomData: TodaysWisdomData) => {
    try {
      const cacheData = {
        data: wisdomData,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching wisdom:', error);
    }
  };

  // Function to fetch Today's Wisdom with caching
  const fetchTodaysWisdom = async (forceRefresh: boolean = false) => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedWisdom = getCachedWisdom();
      if (cachedWisdom) {
        setTodaysWisdom(cachedWisdom);
        setWisdomError(null);
        return;
      }
    }

    setIsLoadingWisdom(true);
    setWisdomError(null);
    if (forceRefresh) {
      setTodaysWisdom(null);
    }

    try {
      const requestBody = selectedSource === 'random' 
        ? {}
        : { sourcePreference: selectedSource };

      const response = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.todaysWisdom) {
        const enhancedWisdom = {
          ...data.todaysWisdom,
          selectedSource: data.selectedSource,
          selectionMethod: data.selectionMethod,
          selectedSourceInfo: data.selectedSourceInfo,
          message: data.message
        };
        setTodaysWisdom(enhancedWisdom);
        setCachedWisdom(enhancedWisdom);
      } else if (data.fallbackWisdom) {
        const fallbackWisdom = {
          ...data.fallbackWisdom,
          selectedSource: data.selectedSource || data.fallbackWisdom.sourceName,
          selectionMethod: data.selectionMethod || 'fallback',
          selectedSourceInfo: data.selectedSourceInfo || { displayName: data.fallbackWisdom.sourceName, category: 'Sacred Texts' },
          message: data.message || 'Wisdom provided via intelligent fallback selection'
        };
        setTodaysWisdom(fallbackWisdom);
        setCachedWisdom(fallbackWisdom);
      } else {
        setWisdomError(data.error || 'Failed to fetch today\'s wisdom');
      }
    } catch (error) {
      setWisdomError('Network error occurred while fetching wisdom');
      console.error('Error fetching today\'s wisdom:', error);
    } finally {
      setIsLoadingWisdom(false);
    }
  };

  const loadAvailableSources = async () => {
    try {
      setSourcesLoading(true);
      const response = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      if (data.availableSources && Array.isArray(data.availableSources)) {
        setAvailableSources(data.availableSources);
      }
    } catch (error) {
      setAvailableSources([{folderName: 'ramayana', displayName: 'Ramayana'}]);
    } finally {
      setSourcesLoading(false);
    }
  };

  // Auto-load wisdom on mount with caching
  useEffect(() => {
    if (!todaysWisdom) {
      const cachedWisdom = getCachedWisdom();
      if (cachedWisdom) {
        setTodaysWisdom(cachedWisdom);
        setWisdomError(null);
      } else {
        fetchTodaysWisdom(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAvailableSources();
  }, []);

  // Loading State Component
  const WisdomLoadingState = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-6">
        <div 
          className="w-16 h-16 border-4 border-amber-200 rounded-full animate-spin"
          style={{ 
            borderTopColor: '#D4AF37',
            borderRightColor: '#D4AF37'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl animate-pulse">🕉️</div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-amber-800 mb-2">
        Gathering Sacred Wisdom
      </h3>
      <p className="text-amber-600 text-sm animate-pulse">
        Preparing today's divine guidance for your spiritual journey...
      </p>
    </div>
  );

  // Error State Component
  const WisdomErrorState = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <div className="text-red-600 text-4xl mb-4">⚠️</div>
      <h3 className="text-red-800 font-semibold mb-2">Unable to Load Today's Wisdom</h3>
      <p className="text-red-700 text-sm mb-4">{wisdomError}</p>
      <button
        onClick={() => fetchTodaysWisdom(true)}
        className="bg-red-100 hover:bg-red-200 text-red-800 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
      >
        Try Again
      </button>
    </div>
  );

  // If onBack is provided, render inline; otherwise render as modal
  const content = (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
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
        {/* Back Button - shown when onBack is provided */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium transition-colors mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            <ArrowLeft size={18} />
            <span>← Back to Home</span>
          </button>
        )}

        {/* Sacred Header */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🕉️</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Today's Sacred Reading
          </h1>
          <p className="text-amber-600 text-lg">
            Begin your day with divine wisdom from ancient scriptures
          </p>
        </div>

        {/* Today's Wisdom Buttons */}
        <div className="text-center mb-8 space-y-4">
          <div>
            <button
              onClick={() => fetchTodaysWisdom(false)}
              disabled={isLoadingWisdom}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-yellow-300 disabled:to-yellow-400 text-white py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 text-lg font-semibold border-2 border-yellow-300 shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
            >
              <div className="flex items-center justify-center space-x-3">
                {isLoadingWisdom ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading Wisdom...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🌟</span>
                    <span>{todaysWisdom ? "Today's Wisdom" : "Get Today's Wisdom"}</span>
                  </>
                )}
              </div>
            </button>
          </div>
          
          {todaysWisdom && !isLoadingWisdom && (
            <div>
              <button
                onClick={() => fetchTodaysWisdom(true)}
                disabled={isLoadingWisdom}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 text-white py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 text-base font-medium border border-amber-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-opacity-50"
                title="Force refresh to get different wisdom"
              >
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Get New Wisdom</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {isLoadingWisdom && <WisdomLoadingState />}
        
        {wisdomError && !isLoadingWisdom && <WisdomErrorState />}

        {todaysWisdom && !isLoadingWisdom && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-2 shadow-lg">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTabCard('sacred')}
                    className={`px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                      activeTabCard === 'sacred'
                        ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 shadow-md transform scale-105'
                        : 'text-amber-600 hover:bg-amber-50/50 hover:text-amber-700'
                    }`}
                    style={activeTabCard === 'sacred' ? { color: '#D4AF37' } : {}}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🕉️</span>
                      <span>Sacred Text</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTabCard('interpretation')}
                    className={`px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                      activeTabCard === 'interpretation'
                        ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 shadow-md transform scale-105'
                        : 'text-amber-600 hover:bg-amber-50/50 hover:text-amber-700'
                    }`}
                    style={activeTabCard === 'interpretation' ? { color: '#D4AF37' } : {}}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🙏</span>
                      <span>Guru's Interpretation</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabbed Content */}
            <div className="min-h-[400px]">
              {activeTabCard === 'sacred' && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-8 shadow-lg animate-fadeIn">
                  {/* Source Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-800 mb-2">
                      {todaysWisdom.selectedSourceInfo?.displayName || todaysWisdom.sourceName} Daily Wisdom
                    </h2>
                    <div className="text-amber-600 text-sm font-medium mb-2">
                      📜 Original Scripture
                    </div>
                    {todaysWisdom.selectionMethod === 'cross-corpus' && (
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        <span>🌟</span>
                        <span>Intelligently Selected from {todaysWisdom.selectedSourceInfo?.category || 'Sacred Texts'}</span>
                      </div>
                    )}
                    {todaysWisdom.message && (
                      <div className="text-amber-600 text-xs mt-2 italic">
                        {todaysWisdom.message}
                      </div>
                    )}
                  </div>
                  
                  {/* Sacred Text with Audio Control */}
                  <div 
                    className="relative p-6 rounded-lg border-l-4 border-amber-300 shadow-lg overflow-hidden"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,' + 
                        '%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 800 200\'%3E' +
                        '%3Cdefs%3E%3ClinearGradient id=\'scroll\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'0%25\'%3E' +
                        '%3Cstop offset=\'0%25\' style=\'stop-color:%23f4e5b8;stop-opacity:0.9\'/%3E' +
                        '%3Cstop offset=\'5%25\' style=\'stop-color:%23f7ead0;stop-opacity:0.95\'/%3E' +
                        '%3Cstop offset=\'95%25\' style=\'stop-color:%23f7ead0;stop-opacity:0.95\'/%3E' +
                        '%3Cstop offset=\'100%25\' style=\'stop-color:%23f4e5b8;stop-opacity:0.9\'/%3E' +
                        '%3C/linearGradient%3E%3C/defs%3E' +
                        '%3Crect width=\'800\' height=\'200\' fill=\'url(%23scroll)\'/%3E' +
                        '%3Cpath d=\'M0,10 Q20,5 40,10 T80,10 T120,10 T160,10 T200,10 T240,10 T280,10 T320,10 T360,10 T400,10 T440,10 T480,10 T520,10 T560,10 T600,10 T640,10 T680,10 T720,10 T760,10 T800,10\' stroke=\'%23d4b896\' stroke-width=\'0.5\' fill=\'none\' opacity=\'0.4\'/%3E' +
                        '%3Cpath d=\'M0,190 Q20,185 40,190 T80,190 T120,190 T160,190 T200,190 T240,190 T280,190 T320,190 T360,190 T400,190 T440,190 T480,190 T520,190 T560,190 T600,190 T640,190 T680,190 T720,190 T760,190 T800,190\' stroke=\'%23d4b896\' stroke-width=\'0.5\' fill=\'none\' opacity=\'0.4\'/%3E' +
                        '%3C/svg%3E")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/40 rounded-lg"></div>
                    
                    <div className="relative z-10 text-gray-800 leading-relaxed text-lg font-serif italic text-center drop-shadow-sm break-words">
                      "{todaysWisdom.rawText}"
                    </div>
                    
                    <div className="absolute top-2 right-2 z-20">
                      <AudioIconButton
                        text={todaysWisdom.rawText}
                        language="sanskrit"
                        size="sm"
                        variant="primary"
                        onPlayStart={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Playing sacred text audio');
                          }
                        }}
                        onPlayEnd={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Sacred text audio finished');
                          }
                        }}
                        onError={(error) => console.error('Audio error:', error)}
                      />
                    </div>
                  </div>

                  {/* Sanskrit Devanagari Section */}
                  <div 
                    className="relative p-6 rounded-lg border-l-4 border-orange-300 shadow-lg mt-4 overflow-hidden"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,' + 
                        '%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 800 200\'%3E' +
                        '%3Cdefs%3E%3ClinearGradient id=\'scrollAmber\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'0%25\'%3E' +
                        '%3Cstop offset=\'0%25\' style=\'stop-color:%23f4d03f;stop-opacity:0.8\'/%3E' +
                        '%3Cstop offset=\'5%25\' style=\'stop-color:%23f9e79f;stop-opacity:0.9\'/%3E' +
                        '%3Cstop offset=\'95%25\' style=\'stop-color:%23f9e79f;stop-opacity:0.9\'/%3E' +
                        '%3Cstop offset=\'100%25\' style=\'stop-color:%23f4d03f;stop-opacity:0.8\'/%3E' +
                        '%3C/linearGradient%3E%3C/defs%3E' +
                        '%3Crect width=\'800\' height=\'200\' fill=\'url(%23scrollAmber)\'/%3E' +
                        '%3Cpath d=\'M0,10 Q20,5 40,10 T80,10 T120,10 T160,10 T200,10 T240,10 T280,10 T320,10 T360,10 T400,10 T440,10 T480,10 T520,10 T560,10 T600,10 T640,10 T680,10 T720,10 T760,10 T800,10\' stroke=\'%23d68910\' stroke-width=\'0.5\' fill=\'none\' opacity=\'0.4\'/%3E' +
                        '%3Cpath d=\'M0,190 Q20,185 40,190 T80,190 T120,190 T160,190 T200,190 T240,190 T280,190 T320,190 T360,190 T400,190 T440,190 T480,190 T520,190 T560,190 T600,190 T640,190 T680,190 T720,190 T760,190 T800,190\' stroke=\'%23d68910\' stroke-width=\'0.5\' fill=\'none\' opacity=\'0.4\'/%3E' +
                        '%3C/svg%3E")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-amber-50/50 rounded-lg"></div>
                    
                    <div className="relative z-10 text-center mb-3">
                      <h3 className="text-amber-800 font-semibold text-sm drop-shadow-sm">
                        🕉️ Sanskrit (Devanagari)
                      </h3>
                    </div>
                    
                    <div className="relative z-10 text-gray-800 leading-relaxed text-xl font-serif text-center drop-shadow-sm break-words" style={{ fontFamily: 'Noto Sans Devanagari, serif' }}>
                      "{TransliterationService.transliterate(todaysWisdom.rawText, {
                        devanagariPreferred: true,
                        preserveNumbers: true,
                        handleMixed: true
                      }).result}"
                    </div>
                    
                    <div className="absolute top-2 right-2 z-20">
                      <AudioIconButton
                        text={TransliterationService.transliterate(todaysWisdom.rawText, {
                          devanagariPreferred: true,
                          preserveNumbers: true,
                          handleMixed: true
                        }).result}
                        language="sanskrit"
                        size="sm"
                        variant="secondary"
                        onPlayStart={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Playing Sanskrit Devanagari audio');
                          }
                        }}
                        onPlayEnd={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Sanskrit Devanagari audio finished');
                          }
                        }}
                        onError={(error) => console.error('Sanskrit audio error:', error)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTabCard === 'interpretation' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-8 shadow-lg animate-fadeIn">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-800 mb-2">
                      Spiritual Guidance
                    </h2>
                    <div className="text-blue-600 text-sm font-medium">
                      🌟 Enhanced Wisdom for Your Journey
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="text-gray-800 leading-relaxed space-y-4 font-serif">
                      {todaysWisdom.wisdom.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-base">{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-100/60 rounded-lg p-6 border border-blue-200 shadow-sm">
                    <div className="text-blue-800 font-semibold mb-3 flex items-center">
                      <span className="mr-2">💫</span>
                      Your Spiritual Journey
                    </div>
                    <p className="text-blue-700 leading-relaxed font-serif">{todaysWisdom.encouragement}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sacred Footer */}
            <div className="text-center text-sm text-amber-600 border-t border-amber-200 pt-6 mt-8">
              <div className="font-serif">May this wisdom guide your path to spiritual growth</div>
              <div className="mt-2 text-amber-500">
                🕉️ In the tradition of Guru-Shishya परंपरा 🕉️
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If onBack is provided, render inline; otherwise render as modal
  if (onBack) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 bg-stone-50 min-h-screen">
        {content}
      </div>
    );
  }

  // Modal mode (when onClose is provided)
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white border border-gray-200 transition-all hover:scale-110 shadow-lg"
          >
            <X size={20} className="text-gray-600" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
}

