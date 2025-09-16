/**
 * Audio Rendition List Component Interface
 * React component for displaying and managing audio renditions
 */

import React from 'react';
import { AudioRendition } from '../../lib/services/audioService';

export interface AudioRenditionListProps {
  renditions: AudioRendition[];
  onPlay?: (rendition: AudioRendition) => void;
  onDelete?: (renditionId: string) => void;
  onDownload?: (renditionId: string) => void;
  onShare?: (renditionId: string) => void;
  className?: string;
}

export interface AudioRenditionItemProps {
  rendition: AudioRendition;
  onPlay?: (rendition: AudioRendition) => void;
  onDelete?: (renditionId: string) => void;
  onDownload?: (renditionId: string) => void;
  onShare?: (renditionId: string) => void;
}

export const AudioRenditionItem: React.FC<AudioRenditionItemProps> = ({
  rendition,
  onPlay,
  onDelete,
  onDownload,
  onShare,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="audio-rendition-item">
      <div className="rendition-header">
        <div className="rendition-info">
          <h4 className="rendition-text">
            {rendition.text.length > 100 
              ? `${rendition.text.substring(0, 100)}...` 
              : rendition.text
            }
          </h4>
          <div className="rendition-meta">
            <span className="duration">{formatDuration(rendition.duration)}</span>
            <span className="format">{rendition.format.toUpperCase()}</span>
            <span className="quality">{rendition.quality}</span>
            <span className="language">{rendition.metadata.language}</span>
            <span className="voice">{rendition.metadata.voice}</span>
          </div>
        </div>
        <div className="rendition-actions">
          <button
            onClick={() => onPlay?.(rendition)}
            className="action-button play-button"
            title="Play"
          >
            ▶️
          </button>
          <button
            onClick={() => onDownload?.(rendition.id)}
            className="action-button download-button"
            title="Download"
          >
            ⬇️
          </button>
          <button
            onClick={() => onShare?.(rendition.id)}
            className="action-button share-button"
            title="Share"
          >
            🔗
          </button>
          <button
            onClick={() => onDelete?.(rendition.id)}
            className="action-button delete-button"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="rendition-details">
        <div className="audio-settings">
          <span>Speed: {rendition.metadata.speed}x</span>
          <span>Pitch: {rendition.metadata.pitch}</span>
          <span>Volume: {Math.round(rendition.metadata.volume * 100)}%</span>
        </div>
        <div className="creation-date">
          Created: {formatDate(rendition.createdAt)}
        </div>
      </div>
    </div>
  );
};

export const AudioRenditionList: React.FC<AudioRenditionListProps> = ({
  renditions,
  onPlay,
  onDelete,
  onDownload,
  onShare,
  className = '',
}) => {
  if (renditions.length === 0) {
    return (
      <div className={`audio-rendition-list empty ${className}`}>
        <div className="empty-state">
          <p>No audio renditions found.</p>
          <p>Generate your first audio rendition to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-rendition-list ${className}`}>
      <div className="list-header">
        <h3>Audio Renditions ({renditions.length})</h3>
      </div>
      
      <div className="renditions-container">
        {renditions.map((rendition) => (
          <AudioRenditionItem
            key={rendition.id}
            rendition={rendition}
            onPlay={onPlay}
            onDelete={onDelete}
            onDownload={onDownload}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
};
