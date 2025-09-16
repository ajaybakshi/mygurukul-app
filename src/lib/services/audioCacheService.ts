/**
 * Audio Cache Service
 * Advanced caching system for audio renditions with intelligent management
 * Follows "Always Works" methodology with comprehensive error handling
 */

import NodeCache from 'node-cache';
import { AudioRendition } from './audioService';

export interface CacheConfig {
  defaultTtl: number; // seconds
  maxKeys: number;
  checkPeriod: number; // seconds
  useClones: boolean;
  enableStatistics: boolean;
}

export interface CacheEntry {
  rendition: AudioRendition;
  audioBuffer: ArrayBuffer;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  expiresAt: Date;
  size: number; // bytes
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
  totalSize: number;
  hitRate: number;
  averageAccessCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTtl: 3600, // 1 hour
  maxKeys: 1000,
  checkPeriod: 600, // 10 minutes
  useClones: false,
  enableStatistics: true,
};

export class AudioCacheService {
  private static instance: AudioCacheService;
  private cache: NodeCache;
  private config: CacheConfig;
  private totalSize: number = 0;
  private sizeMap: Map<string, number> = new Map();

  private constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.cache = new NodeCache({
      stdTTL: config.defaultTtl,
      checkperiod: config.checkPeriod,
      useClones: config.useClones,
      maxKeys: config.maxKeys,
      enableLegacyCallbacks: false
    });

    // Set up event listeners for cache management
    this.setupCacheEventListeners();
  }

  static getInstance(config?: CacheConfig): AudioCacheService {
    if (!AudioCacheService.instance) {
      AudioCacheService.instance = new AudioCacheService(config);
    }
    return AudioCacheService.instance;
  }

  /**
   * Set up cache event listeners for intelligent management
   */
  private setupCacheEventListeners(): void {
    this.cache.on('set', (key: string, value: CacheEntry) => {
      this.totalSize += value.size;
      this.sizeMap.set(key, value.size);
      console.log(`📦 Cached audio: ${key} (${this.formatBytes(value.size)})`);
    });

    this.cache.on('del', (key: string) => {
      const size = this.sizeMap.get(key) || 0;
      this.totalSize -= size;
      this.sizeMap.delete(key);
      console.log(`🗑️ Removed from cache: ${key} (${this.formatBytes(size)})`);
    });

    this.cache.on('expired', (key: string) => {
      const size = this.sizeMap.get(key) || 0;
      this.totalSize -= size;
      this.sizeMap.delete(key);
      console.log(`⏰ Cache expired: ${key} (${this.formatBytes(size)})`);
    });
  }

  /**
   * Store audio rendition in cache
   */
  async set(key: string, rendition: AudioRendition, audioBuffer: ArrayBuffer, ttl?: number): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (ttl || this.config.defaultTtl) * 1000);
      
      const entry: CacheEntry = {
        rendition,
        audioBuffer,
        createdAt: now,
        lastAccessed: now,
        accessCount: 0,
        expiresAt,
        size: audioBuffer.byteLength
      };

      // Check if we need to evict entries to make space
      await this.ensureSpaceForEntry(entry);

      this.cache.set(key, entry, ttl || this.config.defaultTtl);
      return true;
    } catch (error) {
      console.error('❌ Failed to cache audio:', error);
      return false;
    }
  }

  /**
   * Retrieve audio rendition from cache
   */
  async get(key: string): Promise<{ rendition: AudioRendition; audioBuffer: ArrayBuffer } | null> {
    try {
      const entry = this.cache.get<CacheEntry>(key);
      if (!entry) {
        return null;
      }

      // Update access statistics
      entry.lastAccessed = new Date();
      entry.accessCount++;
      
      // Update the cache entry with new access info
      this.cache.set(key, entry, this.cache.getTtl(key) || this.config.defaultTtl);

      return {
        rendition: entry.rendition,
        audioBuffer: entry.audioBuffer
      };
    } catch (error) {
      console.error('❌ Failed to retrieve from cache:', error);
      return null;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove specific entry from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.del(key) > 0;
    } catch (error) {
      console.error('❌ Failed to delete from cache:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      this.cache.flushAll();
      this.totalSize = 0;
      this.sizeMap.clear();
      console.log('🗑️ Audio cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const basicStats = this.cache.getStats();
    const entries = this.getAllEntries();
    
    const totalAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const averageAccessCount = entries.length > 0 ? totalAccessCount / entries.length : 0;
    
    const hitRate = basicStats.hits + basicStats.misses > 0 
      ? (basicStats.hits / (basicStats.hits + basicStats.misses)) * 100 
      : 0;

    const dates = entries.map(entry => entry.createdAt).sort();
    const oldestEntry = dates.length > 0 ? dates[0] : null;
    const newestEntry = dates.length > 0 ? dates[dates.length - 1] : null;

    return {
      ...basicStats,
      totalSize: this.totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      averageAccessCount: Math.round(averageAccessCount * 100) / 100,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Get all cache entries (for statistics and management)
   */
  private getAllEntries(): CacheEntry[] {
    const keys = this.cache.keys();
    return keys.map(key => this.cache.get<CacheEntry>(key)).filter(Boolean) as CacheEntry[];
  }

  /**
   * Ensure there's space for a new entry by evicting if necessary
   */
  private async ensureSpaceForEntry(newEntry: CacheEntry): Promise<void> {
    const maxSize = 100 * 1024 * 1024; // 100MB max cache size
    const maxKeys = this.config.maxKeys;

    // Check if we need to evict based on size
    if (this.totalSize + newEntry.size > maxSize) {
      await this.evictBySize(newEntry.size);
    }

    // Check if we need to evict based on key count
    if (this.cache.keys().length >= maxKeys) {
      await this.evictByCount(1);
    }
  }

  /**
   * Evict entries based on size constraints
   */
  private async evictBySize(requiredSpace: number): Promise<void> {
    const entries = this.getAllEntries()
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime()); // LRU

    let freedSpace = 0;
    for (const entry of entries) {
      const key = this.findKeyForEntry(entry);
      if (key) {
        this.cache.del(key);
        freedSpace += entry.size;
        if (freedSpace >= requiredSpace) {
          break;
        }
      }
    }

    console.log(`🧹 Evicted ${this.formatBytes(freedSpace)} to make space`);
  }

  /**
   * Evict entries based on count constraints
   */
  private async evictByCount(count: number): Promise<void> {
    const entries = this.getAllEntries()
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime()); // LRU

    for (let i = 0; i < count && i < entries.length; i++) {
      const key = this.findKeyForEntry(entries[i]);
      if (key) {
        this.cache.del(key);
      }
    }

    console.log(`🧹 Evicted ${count} entries to make space`);
  }

  /**
   * Find cache key for a given entry (helper method)
   */
  private findKeyForEntry(targetEntry: CacheEntry): string | null {
    const keys = this.cache.keys();
    for (const key of keys) {
      const entry = this.cache.get<CacheEntry>(key);
      if (entry && entry === targetEntry) {
        return key;
      }
    }
    return null;
  }

  /**
   * Get cache entries by pattern
   */
  getByPattern(pattern: string): { key: string; entry: CacheEntry }[] {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern, 'i');
    
    return keys
      .filter(key => regex.test(key))
      .map(key => ({
        key,
        entry: this.cache.get<CacheEntry>(key)!
      }))
      .filter(item => item.entry);
  }

  /**
   * Get cache entries by language
   */
  getByLanguage(language: string): { key: string; entry: CacheEntry }[] {
    const entries = this.getAllEntries();
    return entries
      .map(entry => ({
        key: this.findKeyForEntry(entry)!,
        entry
      }))
      .filter(item => 
        item.key && 
        item.entry.rendition.metadata.language === language
      );
  }

  /**
   * Get cache entries by voice
   */
  getByVoice(voice: string): { key: string; entry: CacheEntry }[] {
    const entries = this.getAllEntries();
    return entries
      .map(entry => ({
        key: this.findKeyForEntry(entry)!,
        entry
      }))
      .filter(item => 
        item.key && 
        item.entry.rendition.metadata.voice === voice
      );
  }

  /**
   * Warm up cache with frequently accessed entries
   */
  async warmup(entries: Array<{ key: string; rendition: AudioRendition; audioBuffer: ArrayBuffer }>): Promise<void> {
    console.log(`🔥 Warming up cache with ${entries.length} entries`);
    
    for (const { key, rendition, audioBuffer } of entries) {
      await this.set(key, rendition, audioBuffer);
    }
    
    console.log('✅ Cache warmup completed');
  }

  /**
   * Get cache health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rate
    if (stats.hitRate < 50) {
      issues.push(`Low hit rate: ${stats.hitRate}%`);
      recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    }

    // Check cache size
    if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
      issues.push(`Large cache size: ${this.formatBytes(stats.totalSize)}`);
      recommendations.push('Consider reducing cache TTL or implementing more aggressive eviction');
    }

    // Check key count
    if (stats.keys > this.config.maxKeys * 0.9) {
      issues.push(`High key count: ${stats.keys}/${this.config.maxKeys}`);
      recommendations.push('Consider increasing maxKeys or implementing more aggressive eviction');
    }

    // Check memory usage
    if (stats.vsize > 100 * 1024 * 1024) { // 100MB
      issues.push(`High memory usage: ${this.formatBytes(stats.vsize)}`);
      recommendations.push('Consider reducing cache size or implementing memory-based eviction');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning';
    }

    return { status, issues, recommendations };
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

  /**
   * Export cache data for backup
   */
  async exportCache(): Promise<{ key: string; entry: CacheEntry }[]> {
    const keys = this.cache.keys();
    return keys.map(key => ({
      key,
      entry: this.cache.get<CacheEntry>(key)!
    })).filter(item => item.entry);
  }

  /**
   * Import cache data from backup
   */
  async importCache(data: Array<{ key: string; entry: CacheEntry }>): Promise<void> {
    console.log(`📥 Importing ${data.length} cache entries`);
    
    for (const { key, entry } of data) {
      await this.set(key, entry.rendition, entry.audioBuffer);
    }
    
    console.log('✅ Cache import completed');
  }
}

