'use client';

import { useEffect } from 'react';

interface KeyConcept {
  term: string;
  definition: string;
}

interface DeeperInsights {
  philosophicalViewpoint?: string;
  practicalAdvice?: string[];
  [key: string]: any;
}

interface ChapterMetadata {
  aiSummary?: string;
  keyConcepts?: KeyConcept[];
  deeperInsights?: DeeperInsights;
  [key: string]: any;
}

interface ChapterInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterMetadata: ChapterMetadata | null;
  chapterNumber: number;
  chapterTitle: string;
}

export default function ChapterInsightsModal({
  isOpen,
  onClose,
  chapterMetadata,
  chapterNumber,
  chapterTitle,
}: ChapterInsightsModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Chapter {chapterNumber} - {chapterTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!chapterMetadata ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No insights available for this chapter.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* AI Summary Section */}
              {chapterMetadata.aiSummary && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    AI Summary
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    {chapterMetadata.aiSummary}
                  </p>
                </section>
              )}

              {/* Key Concepts Section */}
              {chapterMetadata.keyConcepts && chapterMetadata.keyConcepts.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Key Concepts
                  </h3>
                  <div className="space-y-4">
                    {chapterMetadata.keyConcepts.map((concept, index) => (
                      <div key={index} className="pl-4 border-l-2 border-green-200 dark:border-green-800">
                        <dt className="font-bold text-gray-900 dark:text-white mb-1">
                          {concept.term}
                        </dt>
                        <dd className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {concept.definition}
                        </dd>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Deeper Insights Section */}
              {chapterMetadata.deeperInsights && (
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Deeper Insights
                  </h3>
                  <div className="space-y-6">
                    {/* Philosophical Viewpoint */}
                    {chapterMetadata.deeperInsights.philosophicalViewpoint && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          Philosophical Viewpoint
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-4">
                          {chapterMetadata.deeperInsights.philosophicalViewpoint}
                        </p>
                      </div>
                    )}

                    {/* Practical Advice */}
                    {chapterMetadata.deeperInsights.practicalAdvice && 
                     chapterMetadata.deeperInsights.practicalAdvice.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          Practical Advice
                        </h4>
                        <ul className="space-y-2 pl-4">
                          {chapterMetadata.deeperInsights.practicalAdvice.map((advice, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                              <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                              <span>{advice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Show message if no metadata available */}
              {!chapterMetadata.aiSummary && 
               (!chapterMetadata.keyConcepts || chapterMetadata.keyConcepts.length === 0) &&
               !chapterMetadata.deeperInsights && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    No detailed insights available for this chapter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

