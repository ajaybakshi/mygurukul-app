'use client';
import React from 'react';
import AudioIconButton from './audio/AudioIconButton';

interface WisdomData {
  rawText: string;
  rawTextAnnotation: {
    chapter: string;
    section: string;
    source: string;
    characters?: string;
    location?: string;
    theme?: string;
    technicalReference?: string; // Scholarly reference like 'Ram_2,40.20'
    logicalUnitType?: 'Epic' | 'Philosophical' | 'Dialogue' | 'Hymnal' | 'Narrative'; // Logical unit type
    extractionMethod?: 'narrative-sequence' | 'commentary-unit' | 'dialogue-exchange' | 'verse-unit' | 'thematic-unit'; // How it was extracted
    verseRange?: {
      start: string;
      end: string;
      count: number;
    };
  };
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

// Helper function to get logical unit type indicator
const getLogicalUnitIndicator = (logicalUnitType?: string) => {
  const typeMap = {
    'Epic': { emoji: '📖', label: 'Epic', color: 'from-orange-500 to-red-500', bgColor: 'bg-gradient-to-r from-orange-50 to-red-50' },
    'Philosophical': { emoji: '🕉️', label: 'Philosophical', color: 'from-purple-500 to-indigo-500', bgColor: 'bg-gradient-to-r from-purple-50 to-indigo-50' },
    'Dialogue': { emoji: '💬', label: 'Dialogue', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50' },
    'Hymnal': { emoji: '🎵', label: 'Hymnal', color: 'from-green-500 to-emerald-500', bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50' },
    'Narrative': { emoji: '📚', label: 'Narrative', color: 'from-amber-500 to-yellow-500', bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-50' }
  };

  const defaultType = { emoji: '📜', label: 'Scripture', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100' };

  return logicalUnitType ? (typeMap[logicalUnitType as keyof typeof typeMap] || defaultType) : defaultType;
};

// Helper function to format verse range
const formatVerseRange = (verseRange?: { start: string; end: string; count: number }) => {
  if (!verseRange) return null;

  if (verseRange.start === verseRange.end) {
    return `Verse ${verseRange.start}`;
  }

  return `${verseRange.start}-${verseRange.end} (${verseRange.count} verses)`;
};

// Helper function to format extraction method
const formatExtractionMethod = (method?: string) => {
  const methodMap = {
    'narrative-sequence': 'Narrative Sequence',
    'commentary-unit': 'Commentary Unit',
    'dialogue-exchange': 'Dialogue Exchange',
    'verse-unit': 'Verse Unit',
    'thematic-unit': 'Thematic Unit'
  };

  return method ? (methodMap[method as keyof typeof methodMap] || method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())) : null;
};

export default function TraditionalWisdomDisplay({ wisdomData, isLoading = false }: Props) {
  const logicalUnitIndicator = getLogicalUnitIndicator(wisdomData.rawTextAnnotation.logicalUnitType);
  const verseRangeDisplay = formatVerseRange(wisdomData.rawTextAnnotation.verseRange);
  const extractionMethodDisplay = formatExtractionMethod(wisdomData.rawTextAnnotation.extractionMethod);

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
          🕉️ Today's Sacred Reading 🕉️
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {wisdomData.sourceName} Daily Wisdom
        </h1>
      </div>

      {/* Part 1: Raw Sacred Text */}
      <div className={`bg-gradient-to-br ${logicalUnitIndicator.bgColor} border-l-4 border-amber-400 rounded-lg p-6 shadow-lg`}>
        <div className="flex items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{logicalUnitIndicator.emoji}</div>
            <div className={`text-lg font-semibold bg-gradient-to-r ${logicalUnitIndicator.color} bg-clip-text text-transparent`}>
              {logicalUnitIndicator.label} Text
            </div>
          </div>
          <div className="ml-auto text-sm text-amber-600">Original Scripture</div>
        </div>
        
        {/* Chapter and Section Annotation */}
        <div className="bg-white bg-opacity-60 rounded p-3 mb-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <span className="font-medium text-amber-800">Chapter:</span>
              <span className="ml-2 text-gray-700">{wisdomData.rawTextAnnotation.chapter}</span>
            </div>
            <div>
              <span className="font-medium text-amber-800">Section:</span>
              <span className="ml-2 text-gray-700">{wisdomData.rawTextAnnotation.section}</span>
            </div>
            <div>
              <span className="font-medium text-amber-800">Theme:</span>
              <span className="ml-2 text-gray-700">{wisdomData.rawTextAnnotation.theme || 'Spiritual Growth'}</span>
            </div>
          </div>
          {wisdomData.rawTextAnnotation.characters && (
            <div className="mt-2">
              <span className="font-medium text-amber-800">Characters:</span>
              <span className="ml-2 text-gray-700">{wisdomData.rawTextAnnotation.characters}</span>
            </div>
          )}
          {wisdomData.rawTextAnnotation.location && (
            <div className="mt-1">
              <span className="font-medium text-amber-800">Location:</span>
              <span className="ml-2 text-gray-700">{wisdomData.rawTextAnnotation.location}</span>
            </div>
          )}

          {/* Enhanced Reference Display */}
          <div className="mt-2 pt-2 border-t border-amber-200 space-y-2">
            {/* Technical Reference */}
            {wisdomData.rawTextAnnotation.technicalReference && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium text-amber-800">Reference:</span>
                <span className="font-mono text-sm bg-amber-100 px-2 py-1 rounded text-amber-900">
                  {wisdomData.rawTextAnnotation.technicalReference}
                </span>
              </div>
            )}

            {/* Verse Range */}
            {verseRangeDisplay && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium text-amber-800">Range:</span>
                <span className="text-sm bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {verseRangeDisplay}
                </span>
              </div>
            )}

            {/* Extraction Method */}
            {extractionMethodDisplay && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium text-amber-800">Method:</span>
                <span className="text-sm bg-green-100 px-2 py-1 rounded text-green-800">
                  {extractionMethodDisplay}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Raw Sacred Text with Audio Control */}
        <div className="relative">
          <div className="text-gray-800 leading-relaxed text-lg font-medium bg-white bg-opacity-40 p-4 rounded italic border-l-2 border-amber-300">
            "{wisdomData.rawText}"
          </div>
          
          {/* Audio control - positioned subtly in top-right corner */}
          <div className="absolute top-2 right-2">
            <AudioIconButton
              text={wisdomData.rawText}
              language="sanskrit"
              size="sm"
              variant="primary"
              onPlayStart={() => console.log('Playing sacred text audio')}
              onPlayEnd={() => console.log('Sacred text audio finished')}
              onError={(error) => console.error('Audio error:', error)}
            />
          </div>
        </div>
      </div>

      {/* Transition */}
      <div className="text-center py-4">
        <div className="inline-flex items-center space-x-3">
          <div className="h-px bg-amber-300 w-16"></div>
          <div className="text-amber-600 font-medium">🙏 Guru's Interpretation 🙏</div>
          <div className="h-px bg-amber-300 w-16"></div>
        </div>
      </div>

      {/* Part 2: Guru's Enhanced Interpretation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="text-blue-700 text-lg font-semibold">🌟 Spiritual Guidance</div>
          <div className="ml-auto flex items-center space-x-3">
            <div className="text-sm text-blue-600">Enhanced Wisdom</div>
            {/* Audio control for wisdom interpretation */}
            <AudioIconButton
              text={wisdomData.wisdom}
              language="english"
              size="sm"
              variant="secondary"
              onPlayStart={() => console.log('Playing wisdom interpretation audio')}
              onPlayEnd={() => console.log('Wisdom interpretation audio finished')}
              onError={(error) => console.error('Audio error:', error)}
            />
          </div>
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

