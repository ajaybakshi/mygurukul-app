'use client';

import React, { useState, useEffect, useRef } from 'react';
import { categoryConfig, getBackendFilesForCategory } from '@/data/categoryConfig';

// Types for the component
interface SourceMaterial {
  fileName: string;
  sourceName: string;
  collection: string;
  description: string;
  author: string;
  language: string;
  period: string;
  category: string;
  fileSize: string;
  lastUpdated: string;
  status: 'available' | 'not_found' | 'error';
  errorMessage?: string;
}

interface SourceDiscoveryResponse {
  success: boolean;
  sources: SourceMaterial[];
  totalFound: number;
  totalRequested: number;
  errors?: string[];
}

interface SourceMaterialsDisplayProps {
  selectedCategory: string;
}

// Enhanced loading spinner component with spiritual elements
const LoadingSpinner = () => (
  <div 
    className="flex flex-col sm:flex-row justify-center items-center py-12 sm:py-16 space-y-6 sm:space-y-0 sm:space-x-6"
    role="status"
    aria-live="polite"
    aria-label="Loading source materials"
  >
    <div className="relative">
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-gentlePulse"></div>
      </div>
    </div>
    <div className="text-center sm:text-left space-y-2">
      <p className="text-amber-700 font-semibold text-base sm:text-lg animate-gentlePulse">
        Discovering sacred wisdom...
      </p>
      <p className="text-amber-600 text-sm sm:text-base">
        Searching through ancient texts
      </p>
    </div>
  </div>
);

// Enhanced error state component
const ErrorState = ({ message }: { message: string }) => (
  <div 
    className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center animate-fadeInUp premium-shadow"
    role="alert"
    aria-live="assertive"
  >
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-3">Unable to Load Sources</h3>
    <p className="text-red-600 text-sm sm:text-base leading-relaxed">{message}</p>
  </div>
);

// Enhanced empty state component
const EmptyState = ({ category }: { category: string }) => (
  <div 
    className="bg-premium-gradient border border-amber-200 rounded-xl p-8 sm:p-10 text-center animate-fadeInUp premium-shadow"
    role="status"
    aria-live="polite"
  >
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-subtleFloat">
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    <h3 className="text-xl sm:text-2xl font-bold text-amber-800 mb-4">No Sources Found</h3>
    <p className="text-amber-600 mb-4 text-base sm:text-lg leading-relaxed">
      No source materials are currently available for the &ldquo;{category}&rdquo; category.
    </p>
    <p className="text-amber-500 text-sm sm:text-base">
      Please check back later or try a different category.
    </p>
  </div>
);

// Helper function to get source icon based on collection
const getSourceIcon = (collection: string) => {
  const collectionLower = collection.toLowerCase();
  if (collectionLower.includes('upanishad')) return '🕉️';
  if (collectionLower.includes('bhagavad') || collectionLower.includes('gita')) return '📖';
  if (collectionLower.includes('ramayana')) return '🏹';
  if (collectionLower.includes('mahabharata')) return '⚔️';
  if (collectionLower.includes('yoga') || collectionLower.includes('sutra')) return '🧘';
  if (collectionLower.includes('swami') || collectionLower.includes('vivekananda')) return '🙏';
  return '📚';
};

// Enhanced source material card with premium styling and accessibility
const SourceMaterialCard = ({ source, index }: { source: SourceMaterial; index: number }) => {
  const isAvailable = source.status === 'available';
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isAvailable) {
        // Handle view source action
        console.log('View source:', source.sourceName);
      }
    }
  };
  
  return (
    <div 
      ref={cardRef}
      className={`source-card-premium animate-fadeInUp hover-spiritual ${
        isAvailable 
          ? 'border-amber-200 hover:border-amber-300' 
          : 'border-gray-200 opacity-75'
      }`}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
      role="article"
      aria-labelledby={`source-title-${index}`}
      aria-describedby={`source-description-${index}`}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={handleKeyDown}
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl sm:text-3xl" aria-hidden="true">
                {getSourceIcon(source.collection)}
              </span>
              <h3 
                id={`source-title-${index}`}
                className={`text-premium-xl font-bold ${
                  isAvailable ? 'text-amber-800' : 'text-gray-500'
                }`}
              >
                {source.sourceName}
              </h3>
            </div>
            <p className="text-premium-base text-amber-600 font-medium">
              {source.collection}
            </p>
          </div>
          <div className={`status-premium self-start ${
            isAvailable 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
              : source.status === 'not_found'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {isAvailable ? '✓ Available' : source.status === 'not_found' ? 'Not Found' : 'Error'}
          </div>
        </div>

        {/* Description */}
        <p 
          id={`source-description-${index}`}
          className={`text-premium-base mb-6 leading-relaxed ${
            isAvailable ? 'text-gray-700' : 'text-gray-500'
          }`}
        >
          {source.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="metadata-premium">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Author</p>
            <p className={`text-premium-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.author}
            </p>
          </div>
          <div className="metadata-premium">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Language</p>
            <p className={`text-premium-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.language}
            </p>
          </div>
          <div className="metadata-premium">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Period</p>
            <p className={`text-premium-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.period}
            </p>
          </div>
          <div className="metadata-premium">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-2">Size</p>
            <p className={`filesize-premium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.fileSize}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-amber-100 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-gentlePulse" aria-hidden="true"></div>
            <span className="timestamp-premium">
              Updated: {source.lastUpdated}
            </span>
          </div>
          {isAvailable && (
            <button 
              className="button-premium w-full sm:w-auto px-6 py-3 text-white text-premium-sm"
              aria-label={`View source: ${source.sourceName}`}
            >
              View Source
            </button>
          )}
        </div>

        {/* Error Message */}
        {!isAvailable && source.errorMessage && (
          <div 
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeInUp"
            role="alert"
            aria-live="polite"
          >
            <p className="text-xs text-red-600">{source.errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced main component with premium styling and accessibility
const SourceMaterialsDisplay: React.FC<SourceMaterialsDisplayProps> = ({ selectedCategory }) => {
  const [sources, setSources] = useState<SourceMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFound: 0, totalRequested: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevCategory, setPrevCategory] = useState(selectedCategory);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSourceMaterials = async () => {
      if (!selectedCategory) return;

      console.log('SourceMaterialsDisplay: selectedCategory =', selectedCategory);

      // Start transition if category changed
      if (prevCategory !== selectedCategory) {
        setIsTransitioning(true);
        setPrevCategory(selectedCategory);
      }

      setLoading(true);
      setError(null);

      // Add small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Get backend files for the selected category
        const backendFiles = getBackendFilesForCategory(selectedCategory);
        console.log('SourceMaterialsDisplay: backendFiles =', backendFiles);
        
        if (backendFiles.length === 0) {
          console.log('SourceMaterialsDisplay: No backend files found');
          setSources([]);
          setStats({ totalFound: 0, totalRequested: 0 });
          return;
        }

        // Call the source discovery API
        const response = await fetch('/api/source-discovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileNames: backendFiles,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SourceDiscoveryResponse = await response.json();

        if (data.success) {
          setSources(data.sources);
          setStats({
            totalFound: data.totalFound,
            totalRequested: data.totalRequested,
          });
        } else {
          throw new Error(data.errors?.[0] || 'Failed to fetch source materials');
        }
      } catch (err) {
        console.error('Error fetching source materials:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
        // End transition after a brief delay
        setTimeout(() => setIsTransitioning(false), 200);
      }
    };

    fetchSourceMaterials();
  }, [selectedCategory, prevCategory]);

  // Get category display name
  const categoryDisplayName = (categoryConfig as any)[selectedCategory]?.displayName || selectedCategory;

  // Focus management for accessibility
  useEffect(() => {
    if (!isTransitioning && !loading && containerRef.current) {
      // Announce the change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Loaded ${stats.totalFound} sources for ${categoryDisplayName}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [sources, stats.totalFound, categoryDisplayName, isTransitioning, loading]);

  // Transition loading state
  if (isTransitioning) {
    return (
      <div 
        className="bg-premium-gradient rounded-xl p-6 sm:p-8 animate-categoryTransition premium-shadow"
        role="status"
        aria-live="polite"
        aria-label="Switching categories"
      >
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-gentlePulse"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-amber-700 font-semibold text-base sm:text-lg animate-gentlePulse">
              Discovering sacred wisdom...
            </p>
            <p className="text-amber-500 text-sm sm:text-base">
              Switching to {categoryDisplayName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="bg-premium-gradient rounded-xl p-6 sm:p-8 animate-categoryTransition premium-shadow"
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="bg-premium-gradient rounded-xl p-6 sm:p-8 animate-categoryTransition premium-shadow"
        role="alert"
        aria-live="assertive"
      >
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-premium-gradient rounded-xl p-6 sm:p-8 animate-categoryTransition premium-shadow"
      role="region"
      aria-label={`Source materials for ${categoryDisplayName}`}
    >
      {/* Enhanced Header with premium styling */}
      <div className="mb-8 sm:mb-10 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg animate-spiritualGlow">
              <span className="text-2xl sm:text-3xl" aria-hidden="true">🕉️</span>
            </div>
            <div>
              <h2 className="text-premium-3xl font-bold text-amber-800 mb-2 leading-tight transition-all duration-300">
                Sacred Sources
              </h2>
              <p className="text-premium-lg text-amber-600 font-medium transition-all duration-300">
                {categoryDisplayName}
              </p>
              <p className="text-amber-500 text-premium-base mt-2 transition-all duration-300">
                Discover wisdom from ancient texts and spiritual teachings
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-gentlePulse" aria-hidden="true"></div>
            <span className="text-premium-sm text-amber-600 font-medium">
              {stats.totalFound} of {stats.totalRequested} sources available
            </span>
          </div>
        </div>
        
        {/* Mobile stats */}
        <div className="md:hidden bg-white rounded-xl p-4 mb-6 shadow-sm border border-amber-100">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-gentlePulse" aria-hidden="true"></div>
            <span className="text-premium-sm text-amber-600 font-medium">
              {stats.totalFound} of {stats.totalRequested} sources available
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Content with staggered animations */}
      {sources.length === 0 ? (
        <div className="animate-fadeInUp">
          <EmptyState category={categoryDisplayName} />
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Source materials list"
        >
          {sources.map((source, index) => (
            <div key={`${source.fileName}-${index}-${selectedCategory}`} role="listitem">
              <SourceMaterialCard 
                source={source} 
                index={index}
              />
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Footer */}
      {sources.length > 0 && (
        <div className="mt-10 pt-8 border-t border-amber-200 animate-fadeInUp">
          <div className="text-center space-y-3">
            <p className="text-premium-base text-amber-600 leading-relaxed">
              These sacred texts contain timeless wisdom for your spiritual journey
            </p>
            <div className="flex items-center justify-center space-x-2" aria-hidden="true">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-gentlePulse"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-gentlePulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-gentlePulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceMaterialsDisplay;
