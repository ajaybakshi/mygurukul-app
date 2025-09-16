/**
 * AudioIconButton Component
 * Sattvic design principles: minimal, non-intrusive, harmonious
 * Integrates with ElevenLabs TTS service for Sanskrit text
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';

export interface AudioIconButtonProps {
  text: string;
  language?: 'sanskrit' | 'english';
  voice?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export const AudioIconButton: React.FC<AudioIconButtonProps> = ({
  text,
  language = 'sanskrit',
  voice,
  className = '',
  size = 'md',
  variant = 'primary',
  onPlayStart,
  onPlayEnd,
  onError,
  disabled = false,
}) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Size configurations following sattvic principles
  const sizeConfig = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base',
    },
  };

  // Variant configurations with sattvic color palette
  const variantConfig = {
    primary: {
      idle: 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200',
      active: 'bg-amber-200 text-amber-800 border-amber-300',
      loading: 'bg-amber-150 text-amber-700 border-amber-250',
      error: 'bg-red-100 text-red-700 border-red-200',
    },
    secondary: {
      idle: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100',
      active: 'bg-blue-100 text-blue-700 border-blue-200',
      loading: 'bg-blue-75 text-blue-600 border-blue-150',
      error: 'bg-red-50 text-red-600 border-red-100',
    },
    ghost: {
      idle: 'bg-transparent hover:bg-gray-50 text-gray-600 border-gray-200',
      active: 'bg-gray-100 text-gray-700 border-gray-300',
      loading: 'bg-gray-50 text-gray-600 border-gray-250',
      error: 'bg-red-50 text-red-600 border-red-100',
    },
  };

  // Generate audio using ElevenLabs API
  const generateAudio = async (): Promise<string> => {
    try {
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language,
          voice: voice || 'FVlJRjSBkHratGRXBKRG', // Default to user's preferred voice
          speed: 0.25, // Much slower speed for better Sanskrit pronunciation
          pitch: 1.0,
          format: 'mp3',
          quality: 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const data = await response.json();
      return data.audioUrl;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Audio generation failed');
    }
  };

  // Handle play/pause functionality
  const handleTogglePlay = async () => {
    if (disabled) return;

    try {
      setError(null);

      if (audioState === 'idle') {
        // Generate and play new audio
        setAudioState('loading');
        onPlayStart?.();

        const audioUrl = await generateAudio();
        
        // Create audio element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
          setAudioState('idle');
          setCurrentTime(0);
          onPlayEnd?.();
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        });

        audio.addEventListener('error', () => {
          setAudioState('error');
          setError('Audio playback failed');
          onError?.('Audio playback failed');
        });

        // Start playing
        await audio.play();
        setAudioState('playing');

        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          if (audio && !audio.paused) {
            setCurrentTime(audio.currentTime);
          }
        }, 100);

      } else if (audioState === 'playing') {
        // Pause audio
        if (audioRef.current) {
          audioRef.current.pause();
          setAudioState('paused');
        }

      } else if (audioState === 'paused') {
        // Resume audio
        if (audioRef.current) {
          await audioRef.current.play();
          setAudioState('playing');
        }
      }

    } catch (error) {
      setAudioState('error');
      const errorMessage = error instanceof Error ? error.message : 'Audio operation failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Get current state styling
  const getStateStyling = () => {
    const baseClasses = variantConfig[variant];
    
    switch (audioState) {
      case 'loading':
        return baseClasses.loading;
      case 'playing':
      case 'paused':
        return baseClasses.active;
      case 'error':
        return baseClasses.error;
      default:
        return baseClasses.idle;
    }
  };

  // Get current icon
  const getCurrentIcon = () => {
    switch (audioState) {
      case 'loading':
        return <Loader2 className={`${sizeConfig[size].icon} animate-spin`} />;
      case 'playing':
        return <Pause className={sizeConfig[size].icon} />;
      case 'paused':
        return <Play className={sizeConfig[size].icon} />;
      case 'error':
        return <AlertCircle className={sizeConfig[size].icon} />;
      default:
        return <Volume2 className={sizeConfig[size].icon} />;
    }
  };

  // Get accessibility label
  const getAccessibilityLabel = () => {
    switch (audioState) {
      case 'loading':
        return 'Generating audio...';
      case 'playing':
        return 'Pause audio';
      case 'paused':
        return 'Resume audio';
      case 'error':
        return `Audio error: ${error}`;
      default:
        return 'Play audio';
    }
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`audio-icon-button-container ${className}`}>
      <button
        onClick={handleTogglePlay}
        disabled={disabled || audioState === 'loading'}
        className={`
          ${sizeConfig[size].button}
          ${getStateStyling()}
          border rounded-full
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
          shadow-sm hover:shadow-md
          transform hover:scale-105 active:scale-95
        `}
        aria-label={getAccessibilityLabel()}
        title={getAccessibilityLabel()}
      >
        {getCurrentIcon()}
      </button>

      {/* Progress indicator - minimal and non-intrusive */}
      {audioState === 'playing' && duration > 0 && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Error tooltip - appears briefly */}
      {audioState === 'error' && error && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded shadow-lg border border-red-200 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
};

// Export default
export default AudioIconButton;

