'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchChapterManifest } from '@/lib/libraryService';
import type { ChapterManifest, SectionMetadata, ChapterMetadata } from '@/types/library';
import ChapterInsightsModal from '@/components/library/ChapterInsightsModal';

/**
 * Converts GCS gs:// URLs to HTTPS URLs that browsers can open
 * @param gcsUrl - GCS URL in gs:// format
 * @returns HTTPS URL for browser access
 */
function convertGcsUrlToHttps(gcsUrl: string): string {
  if (gcsUrl.startsWith('gs://')) {
    return gcsUrl.replace('gs://', 'https://storage.googleapis.com/');
  }
  return gcsUrl;
}

export default function ChapterBrowserPage() {
  const params = useParams();
  const router = useRouter();
  const scriptureId = params.scriptureId as string;

  const [manifest, setManifest] = useState<ChapterManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadManifest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[ChapterBrowser] Loading manifest for: ${scriptureId}`);
        const data = await fetchChapterManifest(scriptureId);
        
        if (!data) {
          setError('Chapter manifest not found for this scripture.');
          return;
        }
        
        setManifest(data);
        
        // Expand first section by default
        if (data.sections.length > 0) {
          setExpandedSections(new Set([data.sections[0].sectionId]));
        }
      } catch (err) {
        console.error('[ChapterBrowser] Error loading manifest:', err);
        setError('Failed to load chapter manifest. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (scriptureId) {
      loadManifest();
    }
  }, [scriptureId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewPDF = (pdfUrl: string) => {
    const httpsUrl = convertGcsUrlToHttps(pdfUrl);
    console.log(`[ChapterBrowser] Opening PDF: ${httpsUrl}`);
    window.open(httpsUrl, '_blank', 'noopener,noreferrer');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chapters...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !manifest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Chapters
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Chapter manifest not found for this scripture.'}
          </p>
          <button
            onClick={handleBack}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {manifest.scriptureName}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {manifest.totalChapters} Chapters
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {manifest.sections.length} Sections
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {manifest.sections.map((section) => (
            <SectionAccordion
              key={section.sectionId}
              section={section}
              isExpanded={expandedSections.has(section.sectionId)}
              onToggle={() => toggleSection(section.sectionId)}
              onViewPDF={handleViewPDF}
            />
          ))}
        </div>

        {/* Footer - Back to Library */}
        <div className="mt-12 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>
        </div>
      </div>
    </div>
  );
}

// Section Accordion Component
interface SectionAccordionProps {
  section: SectionMetadata;
  isExpanded: boolean;
  onToggle: () => void;
  onViewPDF: (pdfUrl: string) => void;
}

function SectionAccordion({ section, isExpanded, onToggle, onViewPDF }: SectionAccordionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-blue-600 dark:text-blue-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {section.sectionName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {section.sectionNameEnglish}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {section.chapterCount} {section.chapterCount === 1 ? 'Chapter' : 'Chapters'}
        </span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.chapters.map((chapter) => (
              <ChapterCard
                key={chapter.chapterId}
                chapter={chapter}
                onViewPDF={onViewPDF}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Chapter Card Component
interface ChapterCardProps {
  chapter: ChapterMetadata;
  onViewPDF: (pdfUrl: string) => void;
}

interface ChapterMetadataJson {
  aiSummary?: string;
  keyConcepts?: Array<{ term: string; definition: string }>;
  deeperInsights?: {
    philosophicalViewpoint?: string;
    practicalAdvice?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

function ChapterCard({ chapter, onViewPDF }: ChapterCardProps) {
  const [fullMetadata, setFullMetadata] = useState<ChapterMetadataJson | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  useEffect(() => {
    // Only fetch if chapter has metadata and metadataUrl is available
    if (!chapter.hasMetadata || !chapter.metadataUrl) return;

    const fetchMetadata = async () => {
      try {
        setLoadingSummary(true);
        const httpsUrl = convertGcsUrlToHttps(chapter.metadataUrl);
        
        console.log(`[ChapterCard] Fetching metadata for Chapter ${chapter.chapterNumber}: ${httpsUrl}`);
        
        const response = await fetch(httpsUrl);
        if (response.ok) {
          const data: ChapterMetadataJson = await response.json();
          setFullMetadata(data);
          
          if (data.aiSummary) {
            console.log(`[ChapterCard] Loaded metadata for Chapter ${chapter.chapterNumber}`);
          }
        } else {
          console.warn(`[ChapterCard] Failed to fetch metadata for Chapter ${chapter.chapterNumber}: ${response.status}`);
        }
      } catch (error) {
        console.error(`[ChapterCard] Error fetching chapter metadata for Chapter ${chapter.chapterNumber}:`, error);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchMetadata();
  }, [chapter.metadataUrl, chapter.hasMetadata, chapter.chapterNumber]);

  // Extract and truncate summary for card display
  const aiSummary = fullMetadata?.aiSummary || '';
  const truncatedSummary = aiSummary.length > 250 
    ? aiSummary.substring(0, 250).trim() + '...'
    : aiSummary;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Chapter Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
            Chapter {chapter.chapterNumber}
          </span>
          {chapter.hasMetadata && (
            <span className="text-xs text-green-600 dark:text-green-400" title="Metadata available">
              ✓
            </span>
          )}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1 leading-snug">
          {chapter.title}
        </h4>
        {chapter.titleEnglish && chapter.titleEnglish.trim() !== '' && (
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
            {chapter.titleEnglish}
          </p>
        )}
      </div>

      {/* AI Summary Section */}
      {chapter.hasMetadata && (
        <div className="mb-3">
          {loadingSummary ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Loading summary...</span>
            </div>
          ) : aiSummary ? (
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
              {truncatedSummary}
            </p>
          ) : null}
        </div>
      )}

      {/* Chapter Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onViewPDF(chapter.pdfUrl)}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View PDF
        </button>
        
        <button
          onClick={() => setIsInsightsOpen(true)}
          disabled={!chapter.hasMetadata || !fullMetadata}
          className={`w-full px-3 py-2 text-sm rounded font-medium flex items-center justify-center gap-2 transition-colors ${
            chapter.hasMetadata && fullMetadata
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
          }`}
          title={chapter.hasMetadata ? 'View detailed insights' : 'No insights available'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          View Full Insights
        </button>
      </div>

      {/* Chapter Insights Modal */}
      <ChapterInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        chapterMetadata={fullMetadata}
        chapterNumber={chapter.chapterNumber}
        chapterTitle={chapter.title}
      />
    </div>
  );
}

