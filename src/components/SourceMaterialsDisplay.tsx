'use client';

import React, { useState, useEffect } from 'react';
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

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-pulse"></div>
      </div>
    </div>
    <div className="ml-4">
      <p className="text-amber-700 font-medium">Discovering sacred wisdom...</p>
      <p className="text-amber-600 text-sm">Searching through ancient texts</p>
    </div>
  </div>
);

// Error state component
const ErrorState = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Sources</h3>
    <p className="text-red-600">{message}</p>
  </div>
);

// Empty state component
const EmptyState = ({ category }: { category: string }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-amber-800 mb-2">No Sources Found</h3>
    <p className="text-amber-600 mb-4">
      No source materials are currently available for the "{category}" category.
    </p>
    <p className="text-amber-500 text-sm">
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

// Individual source material card
const SourceMaterialCard = ({ source }: { source: SourceMaterial }) => {
  const isAvailable = source.status === 'available';
  
  return (
    <div className={`bg-white rounded-xl shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isAvailable 
        ? 'border-amber-200 hover:border-amber-300' 
        : 'border-gray-200 opacity-75'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">
                {getSourceIcon(source.collection)}
              </span>
              <h3 className={`text-xl font-bold ${
                isAvailable ? 'text-amber-800' : 'text-gray-500'
              }`}>
                {source.sourceName}
              </h3>
            </div>
            <p className="text-sm text-amber-600 font-medium">
              {source.collection}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm ${
            isAvailable 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : source.status === 'not_found'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {isAvailable ? '✓ Available' : source.status === 'not_found' ? 'Not Found' : 'Error'}
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm mb-4 leading-relaxed ${
          isAvailable ? 'text-gray-700' : 'text-gray-500'
        }`}>
          {source.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Author</p>
            <p className={`text-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.author}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Language</p>
            <p className={`text-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.language}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Period</p>
            <p className={`text-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.period}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Size</p>
            <p className={`text-sm font-medium ${isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
              {source.fileSize}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-amber-100">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-amber-600 font-medium">
              Updated: {source.lastUpdated}
            </span>
          </div>
          {isAvailable && (
            <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105">
              View Source
            </button>
          )}
        </div>

        {/* Error Message */}
        {!isAvailable && source.errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{source.errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
const SourceMaterialsDisplay: React.FC<SourceMaterialsDisplayProps> = ({ selectedCategory }) => {
  const [sources, setSources] = useState<SourceMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFound: 0, totalRequested: 0 });

  useEffect(() => {
    const fetchSourceMaterials = async () => {
      if (!selectedCategory) return;

      setLoading(true);
      setError(null);

      try {
        // Get backend files for the selected category
        const backendFiles = getBackendFilesForCategory(selectedCategory);
        
        if (backendFiles.length === 0) {
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
          throw new Error(data.error || 'Failed to fetch source materials');
        }
      } catch (err) {
        console.error('Error fetching source materials:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSourceMaterials();
  }, [selectedCategory]);

  // Get category display name
  const categoryDisplayName = categoryConfig[selectedCategory]?.displayName || selectedCategory;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🕉️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-amber-800 mb-2 leading-tight">
                Sacred Sources
              </h2>
              <p className="text-lg text-amber-600 font-medium">
                {categoryDisplayName}
              </p>
              <p className="text-amber-500 text-sm mt-1">
                Discover wisdom from ancient texts and spiritual teachings
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-600 font-medium">
              {stats.totalFound} of {stats.totalRequested} sources available
            </span>
          </div>
        </div>
        
        {/* Mobile stats */}
        <div className="md:hidden bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-600 font-medium">
              {stats.totalFound} of {stats.totalRequested} sources available
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {sources.length === 0 ? (
        <EmptyState category={categoryDisplayName} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source, index) => (
            <SourceMaterialCard key={`${source.fileName}-${index}`} source={source} />
          ))}
        </div>
      )}

      {/* Footer */}
      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-amber-200">
          <div className="text-center">
            <p className="text-sm text-amber-600">
              These sacred texts contain timeless wisdom for your spiritual journey
            </p>
            <div className="flex items-center justify-center mt-2 space-x-1">
              <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
              <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
              <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceMaterialsDisplay;
