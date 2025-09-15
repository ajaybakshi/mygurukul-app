'use client';
import React from 'react';

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
          🕉️ Today's Sacred Reading 🕉️
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
        </div>

        {/* Raw Sacred Text */}
        <div className="text-gray-800 leading-relaxed text-lg font-medium bg-white bg-opacity-40 p-4 rounded italic border-l-2 border-amber-300">
          "{wisdomData.rawText}"
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
