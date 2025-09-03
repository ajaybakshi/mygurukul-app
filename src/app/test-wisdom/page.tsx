'use client';

import { useState } from 'react';

interface TodaysWisdom {
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  timestamp: string;
  encouragement: string;
  sourceLocation?: string;
  filesSearched?: string[];
}

interface ApiResponse {
  success: boolean;
  todaysWisdom?: TodaysWisdom;
  error?: string;
  details?: string;
  fallbackWisdom?: TodaysWisdom;
}

export default function TestWisdomPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testTodaysWisdom = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiResponse = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceName: 'Ramayana'
        }),
      });

      const data: ApiResponse = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || `HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
      }

      setResponse(data);
      console.log('Today\'s Wisdom API Response:', data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error testing Today\'s Wisdom API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 mb-4">
            🌟 Today's Wisdom API Test
          </h1>
          <p className="text-lg text-amber-700">
            Test the Today's Wisdom API with source "Ramayana"
          </p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={testTodaysWisdom}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing API...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🧪</span>
                <span>Test Today's Wisdom API</span>
              </div>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ API Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="space-y-6">
            {/* Success/Error Status */}
            <div className={`rounded-lg p-4 ${
              response.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                response.success ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {response.success ? '✅ API Call Successful' : '⚠️ API Call Completed with Issues'}
              </h3>
              {response.error && (
                <p className="text-red-700 mb-2">Error: {response.error}</p>
              )}
              {response.details && (
                <p className="text-gray-600 text-sm">Details: {response.details}</p>
              )}
            </div>

            {/* Wisdom Content */}
            {(response.todaysWisdom || response.fallbackWisdom) && (
              <div className="bg-white border border-amber-200 rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-amber-800 mb-4">
                  🌟 {response.todaysWisdom ? 'Today\'s Wisdom' : 'Fallback Wisdom'}
                </h3>
                
                {response.todaysWisdom && (
                  <div className="space-y-4">
                    {/* Wisdom Type Badge */}
                    <div className="inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        response.todaysWisdom.type === 'story' ? 'bg-blue-100 text-blue-800' :
                        response.todaysWisdom.type === 'verse' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {response.todaysWisdom.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Wisdom Text */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-900 leading-relaxed whitespace-pre-wrap">
                        {response.todaysWisdom.wisdom}
                      </p>
                    </div>

                    {/* Context */}
                    <div className="text-sm text-gray-600">
                      <p><strong>Context:</strong> {response.todaysWisdom.context}</p>
                      {response.todaysWisdom.sourceLocation && (
                        <p><strong>Source:</strong> {response.todaysWisdom.sourceLocation}</p>
                      )}
                      <p><strong>Timestamp:</strong> {formatTimestamp(response.todaysWisdom.timestamp)}</p>
                    </div>

                    {/* Encouragement */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 font-medium">
                        💡 {response.todaysWisdom.encouragement}
                      </p>
                    </div>

                    {/* Files Searched */}
                    {response.todaysWisdom.filesSearched && response.todaysWisdom.filesSearched.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">📁 Files Processed:</h4>
                        <div className="space-y-1">
                          {response.todaysWisdom.filesSearched.map((fileName, index) => (
                            <div key={index} className="text-sm text-gray-600 font-mono">
                              {fileName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback Wisdom */}
                {!response.todaysWisdom && response.fallbackWisdom && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-medium mb-2">
                        ⚠️ Using fallback wisdom due to API issues
                      </p>
                      <p className="text-yellow-700">
                        {response.fallbackWisdom.wisdom}
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 font-medium">
                        💡 {response.fallbackWisdom.encouragement}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Raw Response (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">🔍 Raw API Response:</h4>
                <pre className="text-xs text-gray-600 overflow-auto bg-white p-3 rounded border">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">📋 How to Use</h3>
          <ul className="text-gray-700 space-y-2">
            <li>• Click the "Test Today's Wisdom API" button above</li>
            <li>• The API will search for files in the "Ramayana" folder of your Google Cloud Storage bucket</li>
            <li>• Results will display below with wisdom content, context, and metadata</li>
            <li>• Check the console for detailed API response logs</li>
            <li>• Any errors will be displayed with helpful information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
