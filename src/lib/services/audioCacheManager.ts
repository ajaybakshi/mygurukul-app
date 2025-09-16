/**
 * Audio Cache Manager
 * Manages audio caching for UI components with GCS integration
 * Provides seamless caching experience for audio renditions
 */

import { AudioRendition } from './audioService';
import { AudioCacheService } from './audioCacheService';
import { AudioGcsStorageService } from './audioGcsStorageService';

export interface CacheManagerConfig {
  enableLocalCache: boolean;
  enableGcsCache: boolean;
  maxCacheSize: number; // bytes
  maxCacheAge: number; // milliseconds
  preloadEnabled: boolean;
}

export interface CacheStats {
  localCache: {
    hits: number;
    misses: number;
    size: number;
    entries: number;
  };
  gcsCache: {
    available: boolean;
    hits: number;
    misses: number;
    totalFiles: number;
    totalSize: number;
  };
  performance: {
    averageResponseTime: number;
    cacheHitRate: number;
  };
}

export const DEFAULT_CACHE_CONFIG: CacheManagerConfig = {
  enableLocalCache: true,
  enableGcsCache: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  preloadEnabled: true,
};

export class AudioCacheManager {
  private static instance: AudioCacheManager;
  private config: CacheManagerConfig;
  private localCache: AudioCacheService;
  private gcsCache: AudioGcsStorageService;
  private stats: {
    localHits: number;
    localMisses: number;
    gcsHits: number;
    gcsMisses: number;
    responseTimes: number[];
  };

  private constructor(config: CacheManagerConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.localCache = AudioCacheService.getInstance();
    this.gcsCache = AudioGcsStorageService.getInstance();
    this.stats = {
      localHits: 0,
      localMisses: 0,
      gcsHits: 0,
      gcsMisses: 0,
      responseTimes: [],
    };
  }

  static getInstance(config?: CacheManagerConfig): AudioCacheManager {
    if (!AudioCacheManager.instance) {
      AudioCacheManager.instance = new AudioCacheManager(config);
    }
    return AudioCacheManager.instance;
  }

  /**
   * Get audio rendition from cache (local first, then GCS)
   */
  async getAudioRendition(cacheKey: string): Promise<{
    rendition: AudioRendition;
    audioBuffer: ArrayBuffer;
  } | null> {
    const startTime = Date.now();

    try {
      // Try local cache first
      if (this.config.enableLocalCache) {
        const localResult = await this.localCache.get(cacheKey);
        if (localResult) {
          this.stats.localHits++;
          this.recordResponseTime(Date.now() - startTime);
          console.log(`💾 Audio found in local cache: ${cacheKey}`);
          return localResult;
        }
        this.stats.localMisses++;
      }

      // Try GCS cache
      if (this.config.enableGcsCache && this.gcsCache.isAvailable()) {
        const gcsResult = await this.gcsCache.getAudioRendition(cacheKey);
        if (gcsResult) {
          this.stats.gcsHits++;
          
          // Store in local cache for faster future access
          if (this.config.enableLocalCache) {
            await this.localCache.set(cacheKey, gcsResult.rendition, gcsResult.audioBuffer);
          }
          
          this.recordResponseTime(Date.now() - startTime);
          console.log(`☁️ Audio found in GCS cache: ${cacheKey}`);
          return gcsResult;
        }
        this.stats.gcsMisses++;
      }

      this.recordResponseTime(Date.now() - startTime);
      return null;

    } catch (error) {
      console.error('❌ Cache retrieval error:', error);
      this.recordResponseTime(Date.now() - startTime);
      return null;
    }
  }

  /**
   * Store audio rendition in cache (both local and GCS)
   */
  async storeAudioRendition(
    cacheKey: string,
    rendition: AudioRendition,
    audioBuffer: ArrayBuffer
  ): Promise<boolean> {
    try {
      const promises: Promise<boolean>[] = [];

      // Store in local cache
      if (this.config.enableLocalCache) {
        promises.push(this.localCache.set(cacheKey, rendition, audioBuffer));
      }

      // Store in GCS cache
      if (this.config.enableGcsCache && this.gcsCache.isAvailable()) {
        promises.push(
          this.gcsCache.storeAudioRendition(rendition, audioBuffer).then(result => result.success)
        );
      }

      const results = await Promise.all(promises);
      const success = results.every(result => result);

      if (success) {
        console.log(`💾 Audio stored in cache: ${cacheKey}`);
      } else {
        console.warn(`⚠️ Partial cache storage failure: ${cacheKey}`);
      }

      return success;

    } catch (error) {
      console.error('❌ Cache storage error:', error);
      return false;
    }
  }

  /**
   * Preload audio for better user experience
   */
  async preloadAudio(texts: string[], language: string = 'sanskrit'): Promise<void> {
    if (!this.config.preloadEnabled) return;

    console.log(`🔄 Preloading ${texts.length} audio files...`);

    const preloadPromises = texts.map(async (text) => {
      try {
        const cacheKey = this.generateCacheKey(text, language);
        
        // Check if already cached
        const existing = await this.getAudioRendition(cacheKey);
        if (existing) {
          return; // Already cached
        }

        // Generate and cache audio
        const response = await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language,
            voice: '4BoDaQ6aygOP6fpsUmJe',
            format: 'mp3',
            quality: 'medium',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.renditionId) {
            // Audio is automatically cached by the generation endpoint
            console.log(`✅ Preloaded audio for: "${text.substring(0, 30)}..."`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload audio for: "${text.substring(0, 30)}..."`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('🎵 Audio preloading completed');
  }

  /**
   * Generate cache key for text and language
   */
  generateCacheKey(text: string, language: string): string {
    const textHash = this.hashString(text);
    const voice = '4BoDaQ6aygOP6fpsUmJe'; // Default voice
    const speed = 1.0;
    const pitch = 1.0;
    
    return `${textHash}_${voice}_${language}_${speed}_${pitch}`;
  }

  /**
   * Clear cache (both local and GCS)
   */
  async clearCache(): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (this.config.enableLocalCache) {
        promises.push(this.localCache.clear());
      }

      if (this.config.enableGcsCache && this.gcsCache.isAvailable()) {
        // Note: GCS doesn't have a clear all method, so we skip this
        console.log('⚠️ GCS cache clear not implemented - files will expire naturally');
      }

      await Promise.all(promises);
      this.resetStats();
      console.log('🗑️ Cache cleared successfully');

    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): CacheStats {
    const localCacheStats = this.localCache.getStats();
    const gcsStats = this.gcsCache.isAvailable() ? {
      available: true,
      hits: this.stats.gcsHits,
      misses: this.stats.gcsMisses,
      totalFiles: 0, // Would need to call GCS API
      totalSize: 0,  // Would need to call GCS API
    } : {
      available: false,
      hits: 0,
      misses: 0,
      totalFiles: 0,
      totalSize: 0,
    };

    const totalRequests = this.stats.localHits + this.stats.localMisses + this.stats.gcsHits + this.stats.gcsMisses;
    const cacheHitRate = totalRequests > 0 ? ((this.stats.localHits + this.stats.gcsHits) / totalRequests) * 100 : 0;
    const averageResponseTime = this.stats.responseTimes.length > 0 
      ? this.stats.responseTimes.reduce((sum, time) => sum + time, 0) / this.stats.responseTimes.length 
      : 0;

    return {
      localCache: {
        hits: this.stats.localHits,
        misses: this.stats.localMisses,
        size: localCacheStats.totalSize,
        entries: localCacheStats.keys,
      },
      gcsCache: gcsStats,
      performance: {
        averageResponseTime: Math.round(averageResponseTime),
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      },
    };
  }

  /**
   * Get cache health status
   */
  getCacheHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getCacheStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check local cache health
    if (stats.localCache.size > this.config.maxCacheSize * 0.8) {
      issues.push(`Local cache size high: ${this.formatBytes(stats.localCache.size)}`);
      recommendations.push('Consider clearing cache or reducing cache size');
    }

    // Check cache hit rate
    if (stats.performance.cacheHitRate < 50) {
      issues.push(`Low cache hit rate: ${stats.performance.cacheHitRate}%`);
      recommendations.push('Review cache key strategy or increase cache TTL');
    }

    // Check response time
    if (stats.performance.averageResponseTime > 1000) {
      issues.push(`Slow response time: ${stats.performance.averageResponseTime}ms`);
      recommendations.push('Optimize cache retrieval or check network connectivity');
    }

    // Check GCS availability
    if (!stats.gcsCache.available) {
      issues.push('GCS cache unavailable');
      recommendations.push('Check GCS credentials and connectivity');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning';
    }

    return { status, issues, recommendations };
  }

  /**
   * Record response time for statistics
   */
  private recordResponseTime(time: number): void {
    this.stats.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-100);
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      localHits: 0,
      localMisses: 0,
      gcsHits: 0,
      gcsMisses: 0,
      responseTimes: [],
    };
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

