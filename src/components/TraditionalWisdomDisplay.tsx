'use client';
import React from 'react';

interface EnhancedRawTextAnnotation {
  // Primary Information
  textName: string;
  tradition: string;
  chapter: string;
  section: string;

  // Context Information
  spiritualTheme: string;
  characters?: string[];
  location?: string;

  // Cultural Context
  historicalPeriod?: string;
  literaryGenre: string;

  // Reference Information (for scholars)
  technicalReference?: string;
  estimatedAge?: string;

  // Legacy fields for backward compatibility
  theme?: string;
  source?: string;

  // Gretil Metadata Integration
  gretilMetadata?: {
    title: string;
    dataEntry?: string;
    contribution?: string;
    dateVersion?: string;
    source?: string;
    publisher?: string;
    licence?: string;
    referenceStructure?: string;
    notes?: string;
    revisions?: string;
    originalUrl?: string;
    chapterInfo?: {
      book?: number;
      chapter: number;
      section?: number;
    };
    verseNumber?: {
      verse: number;
      subVerse?: string;
      fullReference: string;
    };
    citationFormat?: string;
    textType?: string;
    timePeriod?: string;
    hasCommentary?: boolean;
  };
}

interface WisdomData {
  rawText: string;
  rawTextAnnotation: EnhancedRawTextAnnotation;
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  encouragement: string;
}

interface Props {
  wisdomData: WisdomData;
  isLoading?: boolean;
}

export default function TraditionalWisdomDisplay({ wisdomData, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-serif">
      {/* Sacred Header */}
      <div className="text-center border-b border-amber-300 pb-4">
        <div className="text-amber-600 text-sm font-medium mb-2">
          🕉️ Today&apos;s Sacred Reading 🕉️
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {wisdomData.sourceName} Daily Wisdom
        </h1>
      </div>

      {/* Part 1: Raw Sacred Text */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="text-amber-700 text-lg font-semibold">📜 Sacred Text</div>
          <div className="ml-auto text-sm text-amber-600">Original Scripture</div>
        </div>
        
        {/* Enhanced Sacred Text Context */}
        <div className="bg-white bg-opacity-60 rounded p-4 mb-4 space-y-3">
          {/* Primary Source Information */}
          <div className="border-b border-amber-200 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-amber-900">{wisdomData.rawTextAnnotation.textName}</h3>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {wisdomData.rawTextAnnotation.estimatedAge || 'Ancient Wisdom'}
              </span>
            </div>
            <p className="text-sm text-amber-700 italic">{wisdomData.rawTextAnnotation.tradition}</p>
            <p className="text-xs text-gray-600 mt-1">{wisdomData.rawTextAnnotation.literaryGenre} • {wisdomData.rawTextAnnotation.historicalPeriod}</p>
          </div>
          
          {/* Chapter and Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-medium text-amber-800">📖 Chapter:</span>
              <div className="ml-4 text-gray-700 text-sm">{wisdomData.rawTextAnnotation.chapter}</div>
            </div>
            <div>
              <span className="font-medium text-amber-800">📜 Section:</span>
              <div className="ml-4 text-gray-700 text-sm">{wisdomData.rawTextAnnotation.section}</div>
            </div>
          </div>
          
          {/* Spiritual Theme */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded p-3">
            <span className="font-medium text-amber-800">🌟 Spiritual Theme:</span>
            <div className="ml-4 text-gray-700 text-sm font-medium">{wisdomData.rawTextAnnotation.spiritualTheme}</div>
          </div>
          
          {/* Characters and Location */}
          {(wisdomData.rawTextAnnotation.characters || wisdomData.rawTextAnnotation.location) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
              {wisdomData.rawTextAnnotation.characters && (
                <div>
                  <span className="font-medium text-amber-800">👑 Characters:</span>
                  <div className="ml-4 text-gray-700 text-sm">
                    {Array.isArray(wisdomData.rawTextAnnotation.characters) 
                      ? wisdomData.rawTextAnnotation.characters.join(', ')
                      : wisdomData.rawTextAnnotation.characters}
                  </div>
                </div>
              )}
              {wisdomData.rawTextAnnotation.location && (
                <div>
                  <span className="font-medium text-amber-800">🏛️ Setting:</span>
                  <div className="ml-4 text-gray-700 text-sm">{wisdomData.rawTextAnnotation.location}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Progressive Disclosure for Technical Details */}
          {wisdomData.rawTextAnnotation.technicalReference && (
            <details className="text-xs text-gray-500 cursor-pointer">
              <summary className="hover:text-gray-700">📚 Scholar Reference</summary>
              <div className="mt-1 ml-4 font-mono text-gray-400">
                {wisdomData.rawTextAnnotation.technicalReference}
              </div>
            </details>
          )}

          {/* Gretil Metadata Display */}
          {wisdomData.rawTextAnnotation.gretilMetadata && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded border border-amber-200">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center">
                  📜 Source Metadata
                  {wisdomData.rawTextAnnotation.gretilMetadata.verseNumber && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Verse {wisdomData.rawTextAnnotation.gretilMetadata.verseNumber.fullReference}
                    </span>
                  )}
                </summary>
                <div className="mt-3 space-y-2 text-xs text-amber-700">
                  {wisdomData.rawTextAnnotation.gretilMetadata.title && (
                    <div><strong>Title:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.title}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.textType && (
                    <div><strong>Text Type:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.textType}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.timePeriod && (
                    <div><strong>Time Period:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.timePeriod}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.contribution && (
                    <div><strong>Contributor:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.contribution}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.source && (
                    <div><strong>Source:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.source}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.citationFormat && (
                    <div><strong>Citation Format:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.citationFormat}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.hasCommentary && (
                    <div><strong>Note:</strong> Includes scholarly commentary</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.licence && (
                    <div><strong>License:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.licence}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.referenceStructure && (
                    <div><strong>Reference Structure:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.referenceStructure}</div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo && (
                    <div>
                      <strong>Location:</strong> Chapter {wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo.chapter}
                      {wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo.book && ` (Book ${wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo.book})`}
                      {wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo.section && `, Section ${wisdomData.rawTextAnnotation.gretilMetadata.chapterInfo.section}`}
                    </div>
                  )}
                  {wisdomData.rawTextAnnotation.gretilMetadata.dateVersion && (
                    <div><strong>Version:</strong> {wisdomData.rawTextAnnotation.gretilMetadata.dateVersion}</div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Raw Sacred Text */}
        <div className="text-gray-800 leading-relaxed text-lg font-medium bg-white bg-opacity-40 p-4 rounded italic border-l-2 border-amber-300">
          &ldquo;{wisdomData.rawText}&rdquo;
        </div>
      </div>

      {/* Transition */}
      <div className="text-center py-4">
        <div className="inline-flex items-center space-x-3">
          <div className="h-px bg-amber-300 w-16"></div>
          <div className="text-amber-600 font-medium">🙏 Guru&apos;s Interpretation 🙏</div>
          <div className="h-px bg-amber-300 w-16"></div>
        </div>
      </div>

      {/* Part 2: Guru's Enhanced Interpretation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="text-blue-700 text-lg font-semibold">🌟 Spiritual Guidance</div>
          <div className="ml-auto text-sm text-blue-600">Enhanced Wisdom</div>
        </div>

        <div className="text-gray-800 leading-relaxed space-y-4">
          {wisdomData.wisdom.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-base">{paragraph}</p>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-100 bg-opacity-60 rounded border border-blue-200">
          <div className="text-blue-800 font-medium mb-2">💫 Your Spiritual Journey</div>
          <p className="text-blue-700 text-sm">{wisdomData.encouragement}</p>
        </div>
      </div>

      {/* Traditional Footer */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        <div>May this wisdom guide your path to spiritual growth</div>
        <div className="mt-1">🕉️ In the tradition of Guru-Shishya परंपरा 🕉️</div>
      </div>
    </div>
  );
}
