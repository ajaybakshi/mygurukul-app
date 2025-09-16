"use strict";
/**
 * ElevenLabs TTS Service
 * Professional text-to-speech integration with caching and GCS storage
 * Follows established service patterns with "Always Works" methodology
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsTtsService = exports.DEFAULT_ELEVENLABS_CONFIG = void 0;
const storage_1 = require("@google-cloud/storage");
const node_cache_1 = __importDefault(require("node-cache"));
const sanskritCleanupService_1 = require("./sanskritCleanupService");
const transliterationService_1 = require("./transliterationService");
exports.DEFAULT_ELEVENLABS_CONFIG = {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    baseUrl: 'https://api.elevenlabs.io/v1',
    defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
    defaultModelId: 'eleven_monolingual_v1',
    maxRetries: 3,
    timeoutMs: 30000,
};
class ElevenLabsTtsService {
    constructor(config = exports.DEFAULT_ELEVENLABS_CONFIG) {
        this.storage = null;
        this.bucketName = 'mygurukul-audio-renditions';
        this.config = config;
        this.cache = new node_cache_1.default({
            stdTTL: 3600, // 1 hour default TTL
            checkperiod: 600, // Check for expired keys every 10 minutes
            useClones: false // Don't clone objects for better performance
        });
        this.initializeStorage();
    }
    static getInstance(config) {
        if (!ElevenLabsTtsService.instance) {
            ElevenLabsTtsService.instance = new ElevenLabsTtsService(config);
        }
        return ElevenLabsTtsService.instance;
    }
    /**
     * Initialize Google Cloud Storage using established patterns
     */
    initializeStorage() {
        try {
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                this.storage = new storage_1.Storage();
            }
            else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
                this.storage = new storage_1.Storage({
                    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                    credentials: {
                        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
                        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    },
                });
            }
            else {
                console.warn('⚠️ Google Cloud Storage credentials not found. Audio files will only be cached locally.');
            }
        }
        catch (error) {
            console.error('❌ Error initializing Google Cloud Storage:', error);
            this.storage = null;
        }
    }
    /**
     * Generate audio from text with comprehensive processing pipeline
     */
    async generateAudio(request) {
        const startTime = Date.now();
        try {
            // Step 1: Validate request
            this.validateRequest(request);
            // Step 2: Check cache first
            const cacheKey = this.generateCacheKey(request);
            const cachedEntry = this.cache.get(cacheKey);
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
            const processingTime = Date.now() - startTime;
            console.log(`✅ Audio generated successfully in ${processingTime}ms`);
            return {
                success: true,
                rendition,
                processingTime
            };
        }
        catch (error) {
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
    async processTextForTts(text, language) {
        if (language === 'sanskrit' || language === 'sa') {
            // Apply Sanskrit cleanup
            const cleaned = sanskritCleanupService_1.SanskritCleanupService.cleanForAudio(text, 'unknown');
            // Apply transliteration if needed
            const transliterated = transliterationService_1.TransliterationService.transliterate(cleaned.cleanedText, {
                devanagariPreferred: true,
                preserveNumbers: true,
                handleMixed: true
            });
            return transliterated.result;
        }
        return text;
    }
    /**
     * Call ElevenLabs API with retry logic
     */
    async callElevenLabsApi(text, request) {
        const ttsRequest = {
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
        let lastError = null;
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
            }
            catch (error) {
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
    createAudioRendition(request, processedText, audioBuffer) {
        const id = this.generateRenditionId(request, processedText);
        const metadata = {
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
    async cacheAudio(cacheKey, rendition, audioBuffer) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const cacheEntry = {
            rendition,
            audioBuffer,
            createdAt: new Date(),
            expiresAt
        };
        this.cache.set(cacheKey, cacheEntry, 24 * 60 * 60); // 24 hours TTL
        console.log(`💾 Audio cached with key: ${cacheKey}`);
    }
    /**
     * Store audio in Google Cloud Storage
     */
    async storeInGcs(cacheKey, rendition, audioBuffer) {
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
        }
        catch (error) {
            console.error('❌ Failed to store audio in GCS:', error);
            // Don't throw - caching is more important than GCS storage
        }
    }
    /**
     * Retrieve audio from GCS storage
     */
    async getFromGcsStorage(cacheKey) {
        if (!this.storage)
            return null;
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const metadataFileName = `metadata/${cacheKey}.json`;
            const metadataFile = bucket.file(metadataFileName);
            const [exists] = await metadataFile.exists();
            if (!exists)
                return null;
            const [metadataBuffer] = await metadataFile.download();
            const rendition = JSON.parse(metadataBuffer.toString());
            // Convert date strings back to Date objects
            rendition.createdAt = new Date(rendition.createdAt);
            return rendition;
        }
        catch (error) {
            console.error('❌ Failed to retrieve audio from GCS:', error);
            return null;
        }
    }
    /**
     * Generate cache key from request
     */
    generateCacheKey(request) {
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
    generateRenditionId(request, processedText) {
        const timestamp = Date.now();
        const textHash = this.hashString(processedText).substring(0, 8);
        return `el_${timestamp}_${textHash}`;
    }
    /**
     * Generate audio URL
     */
    generateAudioUrl(renditionId) {
        return `/api/audio/${renditionId}`;
    }
    /**
     * Estimate audio duration based on file size
     */
    estimateDuration(byteLength) {
        // Rough estimation: 128kbps MP3 ≈ 16KB per second
        return Math.round(byteLength / 16000);
    }
    /**
     * Simple string hash function
     */
    hashString(str) {
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
    validateRequest(request) {
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
    async getAvailableVoices() {
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
        }
        catch (error) {
            console.error('❌ Failed to fetch voices:', error);
            return [];
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️ Audio cache cleared');
    }
    /**
     * Get cached audio buffer
     */
    async getCachedAudio(cacheKey) {
        const entry = this.cache.get(cacheKey);
        if (entry && entry.expiresAt > new Date()) {
            return entry.audioBuffer;
        }
        return null;
    }
}
exports.ElevenLabsTtsService = ElevenLabsTtsService;
