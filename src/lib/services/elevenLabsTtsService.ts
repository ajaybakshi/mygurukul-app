/**
 * ElevenLabs TTS Service
 * Professional text-to-speech integration with caching and GCS storage
 * Follows established service patterns with "Always Works" methodology
 */

import { Storage } from '@google-cloud/storage';
import NodeCache from 'node-cache';
import { AudioRendition, AudioGenerationRequest, AudioGenerationResponse, AudioMetadata } from './audioService';
import { SanskritCleanupService } from './sanskritCleanupService';
import { TransliterationService } from './transliterationService';

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  defaultVoiceId: string;
  defaultModelId: string;
  maxRetries: number;
  timeoutMs: number;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface ElevenLabsTtsRequest {
  text: string;
  voice_id: string;
  model_id: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  output_format?: string;
}

export interface ElevenLabsTtsResponse {
  audio: ArrayBuffer;
  content_type: string;
  generation_time: number;
}

export interface AudioCacheEntry {
  rendition: AudioRendition;
  audioBuffer: ArrayBuffer;
  createdAt: Date;
  expiresAt: Date;
}

export const DEFAULT_ELEVENLABS_CONFIG: ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  baseUrl: 'https://api.elevenlabs.io/v1',
  defaultVoiceId: 'FVlJRjSBkHratGRXBKRG', // User's preferred voice
  defaultModelId: 'eleven_monolingual_v1',
  maxRetries: 3,
  timeoutMs: 30000,
};

export class ElevenLabsTtsService {
  private static instance: ElevenLabsTtsService;
  private config: ElevenLabsConfig;
  private cache: NodeCache;
  private storage: Storage | null = null;
  private bucketName: string = 'mygurukul-audio-renditions';
  private renditionIdToCacheKey: Map<string, string> = new Map();

  private constructor(config: ElevenLabsConfig = DEFAULT_ELEVENLABS_CONFIG) {
    this.config = config;
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Don't clone objects for better performance
    });
    this.initializeStorage();
  }

  static getInstance(config?: ElevenLabsConfig): ElevenLabsTtsService {
    if (!ElevenLabsTtsService.instance) {
      ElevenLabsTtsService.instance = new ElevenLabsTtsService(config);
    }
    return ElevenLabsTtsService.instance;
  }

  /**
   * Initialize Google Cloud Storage using established patterns
   */
  private initializeStorage(): void {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.storage = new Storage();
      } else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
        this.storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentials: {
            client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
        });
      } else {
        console.warn('⚠️ Google Cloud Storage credentials not found. Audio files will only be cached locally.');
      }
    } catch (error) {
      console.error('❌ Error initializing Google Cloud Storage:', error);
      this.storage = null;
    }
  }

  /**
   * Generate audio from text with comprehensive processing pipeline
   */
  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate request
      this.validateRequest(request);
      
      // Step 2: Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedEntry = this.cache.get<AudioCacheEntry>(cacheKey);
      if (cachedEntry && cachedEntry.expiresAt > new Date()) {
        console.log('🎵 Audio found in cache');
        return {
          success: true,
          rendition: cachedEntry.rendition,
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: Check GCS storage
      const gcsRendition = await this.getFromGcsStorage(cacheKey);
      if (gcsRendition) {
        console.log('☁️ Audio found in GCS storage');
        // Cache it locally for faster access
        await this.cacheAudio(cacheKey, gcsRendition, new ArrayBuffer(0));
        return {
          success: true,
          rendition: gcsRendition,
          processingTime: Date.now() - startTime
        };
      }

      // Step 4: Process text through Sanskrit pipeline
      const processedText = await this.processTextForTts(request.text, request.language || 'sanskrit');
      
      // Step 5: Generate audio with ElevenLabs
      const audioBuffer = await this.callElevenLabsApi(processedText, request);
      
      // Step 6: Create audio rendition
      const rendition = this.createAudioRendition(request, processedText, audioBuffer);
      
      // Step 7: Cache and store
      await this.cacheAudio(cacheKey, rendition, audioBuffer);
      await this.storeInGcs(cacheKey, rendition, audioBuffer);
      
      // Step 8: Store rendition ID to cache key mapping
      this.renditionIdToCacheKey.set(rendition.id, cacheKey);
      
      // Also store the mapping in cache for persistence across restarts
      this.cache.set(`mapping_${rendition.id}`, cacheKey, 24 * 60 * 60); // 24 hours TTL

      const processingTime = Date.now() - startTime;
      console.log(`✅ Audio generated successfully in ${processingTime}ms`);

      return {
        success: true,
        rendition,
        processingTime
      };

    } catch (error) {
      console.error('❌ Audio generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process text through Sanskrit cleanup and transliteration pipeline
   */
  private async processTextForTts(text: string, language: string): Promise<string> {
    console.log(`🔍 AUDIO PIPELINE DEBUG - Input text: "${text}"`);
    console.log(`🔍 AUDIO PIPELINE DEBUG - Language: ${language}`);
    
    if (language === 'sanskrit' || language === 'sa') {
      // Apply Sanskrit cleanup
      const cleaned = SanskritCleanupService.cleanForAudio(text, 'unknown');
      console.log(`🔍 AUDIO PIPELINE DEBUG - After cleanup: "${cleaned.cleanedText}"`);
      
      // Apply transliteration if needed
      const transliterated = TransliterationService.transliterate(cleaned.cleanedText, {
        devanagariPreferred: true,
        preserveNumbers: true,
        handleMixed: true
      });
      console.log(`🔍 AUDIO PIPELINE DEBUG - After transliteration: "${transliterated.result}"`);
      console.log(`🔍 AUDIO PIPELINE DEBUG - Was transliterated: ${transliterated.wasTransliterated}`);
      console.log(`🔍 AUDIO PIPELINE DEBUG - Detected script: ${transliterated.detectedScript}`);
      
      return transliterated.result;
    }
    
    console.log(`🔍 AUDIO PIPELINE DEBUG - Non-Sanskrit, returning original: "${text}"`);
    return text;
  }

  /**
   * Call ElevenLabs API with retry logic
   */
  private async callElevenLabsApi(text: string, request: AudioGenerationRequest): Promise<ArrayBuffer> {
    console.log(`🎤 ELEVENLABS API DEBUG - Final text sent to ElevenLabs: "${text}"`);
    console.log(`🎤 ELEVENLABS API DEBUG - Text length: ${text.length} characters`);
    console.log(`🎤 ELEVENLABS API DEBUG - Text type: ${typeof text}`);
    
    const ttsRequest: ElevenLabsTtsRequest = {
      text,
      voice_id: request.voice || this.config.defaultVoiceId,
      model_id: this.config.defaultModelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      },
      output_format: 'mp3_44100_128'
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 ElevenLabs API call attempt ${attempt}/${this.config.maxRetries}`);
        
        const response = await fetch(`${this.config.baseUrl}/text-to-speech/${ttsRequest.voice_id}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey,
          },
          body: JSON.stringify(ttsRequest),
          signal: AbortSignal.timeout(this.config.timeoutMs)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        console.log(`✅ ElevenLabs API call successful (${audioBuffer.byteLength} bytes)`);
        return audioBuffer;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ ElevenLabs API attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`ElevenLabs API failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Create audio rendition object
   */
  private createAudioRendition(request: AudioGenerationRequest, processedText: string, audioBuffer: ArrayBuffer): AudioRendition {
    const id = this.generateRenditionId(request, processedText);
    const metadata: AudioMetadata = {
      language: request.language || 'sanskrit',
      voice: request.voice || this.config.defaultVoiceId,
      speed: request.speed || 1.0,
      pitch: request.pitch || 1.0,
      volume: request.volume || 1.0,
      source: 'elevenlabs'
    };

    return {
      id,
      text: processedText,
      audioUrl: this.generateAudioUrl(id),
      duration: this.estimateDuration(audioBuffer.byteLength),
      format: request.format || 'mp3',
      quality: request.quality || 'medium',
      createdAt: new Date(),
      metadata
    };
  }

  /**
   * Cache audio with metadata
   */
  private async cacheAudio(cacheKey: string, rendition: AudioRendition, audioBuffer: ArrayBuffer): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const cacheEntry: AudioCacheEntry = {
      rendition,
      audioBuffer,
      createdAt: new Date(),
      expiresAt
    };

    this.cache.set(cacheKey, cacheEntry, 24 * 60 * 60); // 24 hours TTL
    
    // Also store the audio data directly with the rendition ID for immediate access
    this.cache.set(`audio_${rendition.id}`, audioBuffer, 24 * 60 * 60); // 24 hours TTL
    
    console.log(`💾 Audio cached with key: ${cacheKey} and direct key: audio_${rendition.id}`);
  }

  /**
   * Store audio in Google Cloud Storage
   */
  private async storeInGcs(cacheKey: string, rendition: AudioRendition, audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.storage) {
      console.warn('⚠️ GCS storage not available, skipping storage');
      return;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `audio/${cacheKey}.${rendition.format}`;
      const file = bucket.file(fileName);

      // Upload audio file
      await file.save(Buffer.from(audioBuffer), {
        metadata: {
          contentType: `audio/${rendition.format}`,
          metadata: {
            renditionId: rendition.id,
            text: rendition.text,
            language: rendition.metadata.language,
            voice: rendition.metadata.voice,
            createdAt: rendition.createdAt.toISOString()
          }
        }
      });

      // Upload metadata file
      const metadataFileName = `metadata/${cacheKey}.json`;
      const metadataFile = bucket.file(metadataFileName);
      await metadataFile.save(JSON.stringify(rendition, null, 2), {
        metadata: {
          contentType: 'application/json'
        }
      });

      console.log(`☁️ Audio stored in GCS: ${fileName}`);
    } catch (error) {
      console.error('❌ Failed to store audio in GCS:', error);
      // Don't throw - caching is more important than GCS storage
    }
  }

  /**
   * Retrieve audio from GCS storage
   */
  private async getFromGcsStorage(cacheKey: string): Promise<AudioRendition | null> {
    if (!this.storage) return null;

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const metadataFileName = `metadata/${cacheKey}.json`;
      const metadataFile = bucket.file(metadataFileName);

      const [exists] = await metadataFile.exists();
      if (!exists) return null;

      const [metadataBuffer] = await metadataFile.download();
      const rendition: AudioRendition = JSON.parse(metadataBuffer.toString());
      
      // Convert date strings back to Date objects
      rendition.createdAt = new Date(rendition.createdAt);
      
      return rendition;
    } catch (error) {
      console.error('❌ Failed to retrieve audio from GCS:', error);
      return null;
    }
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: AudioGenerationRequest): string {
    const textHash = this.hashString(request.text);
    const voice = request.voice || this.config.defaultVoiceId;
    const language = request.language || 'sanskrit';
    const speed = request.speed || 1.0;
    const pitch = request.pitch || 1.0;
    
    return `${textHash}_${voice}_${language}_${speed}_${pitch}`;
  }

  /**
   * Generate unique rendition ID
   */
  private generateRenditionId(request: AudioGenerationRequest, processedText: string): string {
    const timestamp = Date.now();
    const textHash = this.hashString(processedText).substring(0, 8);
    return `el_${timestamp}_${textHash}`;
  }

  /**
   * Generate audio URL
   */
  private generateAudioUrl(renditionId: string): string {
    return `/api/audio/${renditionId}`;
  }

  /**
   * Estimate audio duration based on file size
   */
  private estimateDuration(byteLength: number): number {
    // Rough estimation: 128kbps MP3 ≈ 16KB per second
    return Math.round(byteLength / 16000);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: AudioGenerationRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    if (request.text.length > 5000) {
      throw new Error('Text too long (max 5000 characters)');
    }

    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('❌ Failed to fetch voices:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number; ksize: number; vsize: number } {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('🗑️ Audio cache cleared');
  }

  /**
   * Get cached audio buffer
   */
  async getCachedAudio(cacheKey: string): Promise<ArrayBuffer | null> {
    const entry = this.cache.get<AudioCacheEntry>(cacheKey);
    if (entry && entry.expiresAt > new Date()) {
      return entry.audioBuffer;
    }
    return null;
  }

  /**
   * Get cache key for a rendition ID
   */
  getCacheKeyForRendition(renditionId: string): string | null {
    // First try the in-memory mapping
    const directKey = this.renditionIdToCacheKey.get(renditionId);
    if (directKey) {
      return directKey;
    }
    
    // Second try: Check persistent mapping in cache
    const persistentKey = this.cache.get<string>(`mapping_${renditionId}`);
    if (persistentKey) {
      console.log(`✅ Found persistent mapping for ${renditionId}: ${persistentKey}`);
      return persistentKey;
    }
    
    // Fallback: Try to reconstruct from rendition ID
    return this.reconstructCacheKeyFromRenditionId(renditionId);
  }

  /**
   * Reconstruct cache key from rendition ID as fallback
   */
  private reconstructCacheKeyFromRenditionId(renditionId: string): string | null {
    try {
      // Extract timestamp and hash from rendition ID (format: el_timestamp_hash)
      const parts = renditionId.split('_');
      if (parts.length >= 3 && parts[0] === 'el') {
        const timestamp = parts[1];
        const hash = parts[2];
        
        console.log(`🔍 Attempting to reconstruct cache key for rendition: ${renditionId}`);
        console.log(`🔍 Looking for hash: ${hash}`);
        
        // Try to find matching cache key by checking all cache entries
        const cacheKeys = this.cache.keys();
        console.log(`🔍 Available cache keys: ${cacheKeys.length}`);
        
        for (const key of cacheKeys) {
          console.log(`🔍 Checking cache key: ${key}`);
          if (key.startsWith(hash + '_')) {
            console.log(`✅ Found matching cache key: ${key}`);
            return key;
          }
        }
        
        // If no exact match, try to find any key that contains the hash
        for (const key of cacheKeys) {
          if (key.includes(hash)) {
            console.log(`✅ Found partial matching cache key: ${key}`);
            return key;
          }
        }
        
        console.log(`❌ No matching cache key found for hash: ${hash}`);
      }
      return null;
    } catch (error) {
      console.error('Error reconstructing cache key:', error);
      return null;
    }
  }
}
