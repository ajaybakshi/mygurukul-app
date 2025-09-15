'use client';

import { useState, useEffect } from 'react';

export default function TestReferencePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testReference = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testReference();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 Testing Technical Reference Display
        </h1>

        <div className="mb-8 text-center">
          <button
            onClick={testReference}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : 'Test Technical Reference'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API Response Analysis</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-800">Success Status</h3>
                <p className={`text-lg font-mono ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                </p>
              </div>

              {result.todaysWisdom && (
                <>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-green-800">Technical Reference Field</h3>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                      <strong>technicalReference:</strong> {result.todaysWisdom.rawTextAnnotation.technicalReference || 'undefined'}
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-purple-800">Full Raw Text Annotation</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.todaysWisdom.rawTextAnnotation, null, 2)}
                    </pre>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-orange-800">UI Simulation - TraditionalWisdomDisplay</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="text-center border-b border-amber-300 pb-4 mb-4">
                        <div className="text-amber-600 text-sm font-medium mb-2">🕉️ Today's Sacred Reading 🕉️</div>
                        <h1 className="text-2xl font-bold text-gray-800">
                          {result.todaysWisdom.sourceName} Daily Wisdom
                        </h1>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="text-amber-700 text-lg font-semibold">📜 Sacred Text</div>
                        </div>

                        <div className="bg-white bg-opacity-60 rounded p-3 mb-4 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="font-medium text-amber-800">Chapter:</span>
                              <span className="ml-2 text-gray-700">{result.todaysWisdom.rawTextAnnotation.chapter}</span>
                            </div>
                            <div>
                              <span className="font-medium text-amber-800">Section:</span>
                              <span className="ml-2 text-gray-700">{result.todaysWisdom.rawTextAnnotation.section}</span>
                            </div>
                            <div>
                              <span className="font-medium text-amber-800">Theme:</span>
                              <span className="ml-2 text-gray-700">{result.todaysWisdom.rawTextAnnotation.theme || 'Spiritual Growth'}</span>
                            </div>
                          </div>

                          {/* Scholarly Reference Display */}
                          {result.todaysWisdom.rawTextAnnotation.technicalReference && (
                            <div className="mt-2 pt-2 border-t border-amber-200">
                              <span className="font-medium text-amber-800">Reference:</span>
                              <span className="ml-2 font-mono text-sm bg-amber-100 px-2 py-1 rounded text-amber-900">
                                {result.todaysWisdom.rawTextAnnotation.technicalReference}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-gray-800 leading-relaxed text-lg font-medium bg-white bg-opacity-40 p-4 rounded italic border-l-2 border-amber-300">
                          "{result.todaysWisdom.rawText}"
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {result.error && (
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-red-600">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
