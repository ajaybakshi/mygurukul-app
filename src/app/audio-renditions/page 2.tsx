/**
 * Audio Renditions Page
 * Main page for audio rendition functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AudioGenerator } from '../../components/audio/AudioGenerator';
import { AudioPlayer } from '../../components/audio/AudioPlayer';
import { AudioRenditionList } from '../../components/audio/AudioRenditionList';
import { AudioRendition } from '../../lib/services/audioService';
import { AudioRenditionStorage } from '../../lib/services/audioRenditionStorage';
import { featureFlags } from '../../lib/featureFlags';

export default function AudioRenditionsPage() {
  const [renditions, setRenditions] = useState<AudioRendition[]>([]);
  const [currentRendition, setCurrentRendition] = useState<AudioRendition | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storage = new AudioRenditionStorage();

  useEffect(() => {
    loadRenditions();
  }, []);

  const loadRenditions = async () => {
    try {
      setIsLoading(true);
      const allRenditions = await storage.getAllRenditions();
      setRenditions(allRenditions);
    } catch (err) {
      setError('Failed to load audio renditions');
      console.error('Error loading renditions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationComplete = async (rendition: AudioRendition) => {
    try {
      await storage.saveRendition(rendition);
      setRenditions(prev => [rendition, ...prev]);
      setCurrentRendition(rendition);
    } catch (err) {
      setError('Failed to save audio rendition');
      console.error('Error saving rendition:', err);
    }
  };

  const handlePlay = (rendition: AudioRendition) => {
    setCurrentRendition(rendition);
  };

  const handleDelete = async (renditionId: string) => {
    try {
      await storage.deleteRendition(renditionId);
      setRenditions(prev => prev.filter(r => r.id !== renditionId));
      if (currentRendition?.id === renditionId) {
        setCurrentRendition(undefined);
      }
    } catch (err) {
      setError('Failed to delete audio rendition');
      console.error('Error deleting rendition:', err);
    }
  };

  const handleDownload = async (renditionId: string) => {
    try {
      // TODO: Implement actual download functionality
      console.log('Downloading rendition:', renditionId);
    } catch (err) {
      setError('Failed to download audio rendition');
      console.error('Error downloading rendition:', err);
    }
  };

  const handleShare = async (renditionId: string) => {
    try {
      // TODO: Implement actual sharing functionality
      console.log('Sharing rendition:', renditionId);
    } catch (err) {
      setError('Failed to share audio rendition');
      console.error('Error sharing rendition:', err);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Check if audio renditions feature is enabled
  if (!featureFlags.isEnabled('audioRenditions')) {
    return (
      <div className="audio-renditions-page">
        <div className="feature-disabled">
          <h1>Audio Renditions</h1>
          <p>This feature is currently disabled.</p>
          <p>Audio renditions functionality is under development.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-renditions-page">
      <div className="page-header">
        <h1>Audio Renditions</h1>
        <p>Generate, play, and manage audio renditions of sacred texts</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="page-content">
        <div className="audio-generator-section">
          <AudioGenerator
            onGenerationComplete={handleGenerationComplete}
            onError={handleError}
            className="generator-panel"
          />
        </div>

        {currentRendition && (
          <div className="audio-player-section">
            <h3>Now Playing</h3>
            <AudioPlayer
              rendition={currentRendition}
              showControls={true}
              className="player-panel"
            />
          </div>
        )}

        <div className="audio-list-section">
          {isLoading ? (
            <div className="loading-state">
              <p>Loading audio renditions...</p>
            </div>
          ) : (
            <AudioRenditionList
              renditions={renditions}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onShare={handleShare}
              className="renditions-panel"
            />
          )}
        </div>
      </div>
    </div>
  );
}
