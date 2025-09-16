/**
 * Audio Rendition Storage Service
 * Manages storage and retrieval of audio renditions
 */

import { AudioRendition } from './audioService';

export interface AudioRenditionStorageInterface {
  saveRendition(rendition: AudioRendition): Promise<boolean>;
  getRendition(id: string): Promise<AudioRendition | null>;
  getAllRenditions(): Promise<AudioRendition[]>;
  deleteRendition(id: string): Promise<boolean>;
  searchRenditions(query: string): Promise<AudioRendition[]>;
  getRenditionsByText(text: string): Promise<AudioRendition[]>;
  getRenditionsByLanguage(language: string): Promise<AudioRendition[]>;
  clearAllRenditions(): Promise<boolean>;
}

export class AudioRenditionStorage implements AudioRenditionStorageInterface {
  private renditions: Map<string, AudioRendition> = new Map();

  async saveRendition(rendition: AudioRendition): Promise<boolean> {
    try {
      this.renditions.set(rendition.id, rendition);
      // TODO: Implement persistent storage (localStorage, IndexedDB, or API)
      return true;
    } catch (error) {
      console.error('Failed to save audio rendition:', error);
      return false;
    }
  }

  async getRendition(id: string): Promise<AudioRendition | null> {
    try {
      return this.renditions.get(id) || null;
    } catch (error) {
      console.error('Failed to get audio rendition:', error);
      return null;
    }
  }

  async getAllRenditions(): Promise<AudioRendition[]> {
    try {
      return Array.from(this.renditions.values());
    } catch (error) {
      console.error('Failed to get all audio renditions:', error);
      return [];
    }
  }

  async deleteRendition(id: string): Promise<boolean> {
    try {
      return this.renditions.delete(id);
    } catch (error) {
      console.error('Failed to delete audio rendition:', error);
      return false;
    }
  }

  async searchRenditions(query: string): Promise<AudioRendition[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return Array.from(this.renditions.values()).filter(rendition =>
        rendition.text.toLowerCase().includes(lowerQuery) ||
        rendition.metadata.language.toLowerCase().includes(lowerQuery) ||
        rendition.metadata.voice.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search audio renditions:', error);
      return [];
    }
  }

  async getRenditionsByText(text: string): Promise<AudioRendition[]> {
    try {
      return Array.from(this.renditions.values()).filter(rendition =>
        rendition.text === text
      );
    } catch (error) {
      console.error('Failed to get renditions by text:', error);
      return [];
    }
  }

  async getRenditionsByLanguage(language: string): Promise<AudioRendition[]> {
    try {
      return Array.from(this.renditions.values()).filter(rendition =>
        rendition.metadata.language === language
      );
    } catch (error) {
      console.error('Failed to get renditions by language:', error);
      return [];
    }
  }

  async clearAllRenditions(): Promise<boolean> {
    try {
      this.renditions.clear();
      // TODO: Implement persistent storage cleanup
      return true;
    } catch (error) {
      console.error('Failed to clear all renditions:', error);
      return false;
    }
  }
}
