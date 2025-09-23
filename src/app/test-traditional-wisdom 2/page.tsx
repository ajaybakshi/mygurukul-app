'use client';
import React, { useState, useEffect } from 'react';
import TraditionalWisdomDisplay from '@/components/TraditionalWisdomDisplay';

interface WisdomData {
  rawText: string;
  rawTextAnnotation: {
    chapter: string;
    section: string;
    source: string;
    characters?: string;
    location?: string;
    theme?: string;
  };
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  encouragement: string;
}

export default function TestTraditionalWisdom() {
  const [wisdomData, setWisdomData] = useState<WisdomData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWisdom = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceName: 'Ramayana' }),
      });

      const data = await response.json();
      
      if (data.success && data.todaysWisdom) {
        setWisdomData(data.todaysWisdom);
      } else {
        setError(data.error || 'Failed to fetch wisdom');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching wisdom:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWisdom();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Traditional Wisdom Display Test
          </h1>
          <p className="text-gray-600 mb-6">
            Experience the sacred texts in traditional Bharat format
          </p>
          
          <button
            onClick={fetchWisdom}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Loading...' : 'Get New Wisdom'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Wisdom Display */}
        {wisdomData && (
          <TraditionalWisdomDisplay 
            wisdomData={wisdomData} 
            isLoading={isLoading} 
          />
        )}

        {/* Loading State */}
        {isLoading && !wisdomData && (
          <TraditionalWisdomDisplay 
            wisdomData={{} as WisdomData} 
            isLoading={true} 
          />
        )}

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How to Use This Component</h2>
          <div className="space-y-3 text-gray-600">
            <p>1. <strong>Raw Sacred Text:</strong> The original scripture appears first in traditional format</p>
            <p>2. <strong>Chapter Annotation:</strong> Shows the source chapter, section, characters, and theme</p>
            <p>3. <strong>Guru's Interpretation:</strong> AI-enhanced spiritual guidance follows the raw text</p>
            <p>4. <strong>Traditional Design:</strong> Uses Bharat-inspired colors and typography</p>
            <p>5. <strong>Responsive:</strong> Works beautifully on all device sizes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
