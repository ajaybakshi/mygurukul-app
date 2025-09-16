/**
 * Audio GCS Storage Service
 * Google Cloud Storage integration for audio renditions with advanced management
 * Follows established GCS patterns with "Always Works" methodology
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import { AudioRendition } from './audioService';

export interface GcsStorageConfig {
  bucketName: string;
  audioFolder: string;
  metadataFolder: string;
  maxRetries: number;
  timeoutMs: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  audioFiles: number;
  metadataFiles: number;
  oldestFile: Date | null;
  newestFile: Date | null;
  averageFileSize: number;
  storageClasses: Record<string, number>;
}

export interface FileInfo {
  name: string;
  size: number;
  created: Date;
  updated: Date;
  contentType: string;
  metadata: Record<string, string>;
  storageClass: string;
}

export const DEFAULT_GCS_CONFIG: GcsStorageConfig = {
  bucketName: 'mygurukul-audio-renditions',
  audioFolder: 'audio',
  metadataFolder: 'metadata',
  maxRetries: 3,
  timeoutMs: 30000,
  compressionEnabled: true,
  encryptionEnabled: true,
};

export class AudioGcsStorageService {
  private static instance: AudioGcsStorageService;
  private storage: Storage | null = null;
  private bucket: Bucket | null = null;
  private config: GcsStorageConfig;
  private initialized: boolean = false;

  private constructor(config: GcsStorageConfig = DEFAULT_GCS_CONFIG) {
    this.config = config;
    this.initializeStorage();
  }

  static getInstance(config?: GcsStorageConfig): AudioGcsStorageService {
    if (!AudioGcsStorageService.instance) {
      AudioGcsStorageService.instance = new AudioGcsStorageService(config);
    }
    return AudioGcsStorageService.instance;
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
        console.warn('⚠️ Google Cloud Storage credentials not found');
        return;
      }

      this.bucket = this.storage.bucket(this.config.bucketName);
      this.initialized = true;
      console.log('✅ GCS Storage initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Cloud Storage:', error);
      this.storage = null;
      this.bucket = null;
    }
  }

  /**
   * Check if GCS storage is available
   */
  isAvailable(): boolean {
    return this.initialized && this.storage !== null && this.bucket !== null;
  }

  /**
   * Store audio rendition in GCS
   */
  async storeAudioRendition(
    rendition: AudioRendition, 
    audioBuffer: ArrayBuffer,
    options: {
      overwrite?: boolean;
      makePublic?: boolean;
      compression?: boolean;
    } = {}
  ): Promise<{ success: boolean; audioUrl?: string; metadataUrl?: string; error?: string }> {
    if (!this.isAvailable()) {
      return { success: false, error: 'GCS storage not available' };
    }

    try {
      const audioFileName = `${this.config.audioFolder}/${rendition.id}.${rendition.format}`;
      const metadataFileName = `${this.config.metadataFolder}/${rendition.id}.json`;

      // Store audio file
      const audioResult = await this.storeAudioFile(audioFileName, audioBuffer, rendition, options);
      if (!audioResult.success) {
        return audioResult;
      }

      // Store metadata file
      const metadataResult = await this.storeMetadataFile(metadataFileName, rendition, options);
      if (!metadataResult.success) {
        // Clean up audio file if metadata storage fails
        await this.deleteFile(audioFileName);
        return metadataResult;
      }

      console.log(`☁️ Audio rendition stored: ${rendition.id}`);
      return {
        success: true,
        audioUrl: audioResult.audioUrl,
        metadataUrl: metadataResult.metadataUrl
      };

    } catch (error) {
      console.error('❌ Failed to store audio rendition:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store audio file in GCS
   */
  private async storeAudioFile(
    fileName: string, 
    audioBuffer: ArrayBuffer, 
    rendition: AudioRendition,
    options: { overwrite?: boolean; makePublic?: boolean; compression?: boolean }
  ): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      const file = this.bucket!.file(fileName);

      // Check if file exists and overwrite is not allowed
      if (!options.overwrite) {
        const [exists] = await file.exists();
        if (exists) {
          return { success: false, error: 'File already exists and overwrite is disabled' };
        }
      }

      // Prepare file metadata
      const metadata: any = {
        contentType: `audio/${rendition.format}`,
        metadata: {
          renditionId: rendition.id,
          text: rendition.text.substring(0, 1000), // Limit text length
          language: rendition.metadata.language,
          voice: rendition.metadata.voice,
          duration: rendition.duration.toString(),
          quality: rendition.quality,
          createdAt: rendition.createdAt.toISOString(),
          source: rendition.metadata.source
        }
      };

      // Add compression if enabled
      if (options.compression && this.config.compressionEnabled) {
        metadata.contentEncoding = 'gzip';
      }

      // Add encryption if enabled
      if (this.config.encryptionEnabled) {
        metadata.kmsKeyName = this.getKmsKeyName();
      }

      // Upload file
      await file.save(Buffer.from(audioBuffer), {
        metadata,
        resumable: true,
        validation: 'crc32c'
      });

      // Make public if requested
      if (options.makePublic) {
        await file.makePublic();
      }

      const audioUrl = `https://storage.googleapis.com/${this.config.bucketName}/${fileName}`;
      return { success: true, audioUrl };

    } catch (error) {
      console.error('❌ Failed to store audio file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store metadata file in GCS
   */
  private async storeMetadataFile(
    fileName: string, 
    rendition: AudioRendition,
    options: { overwrite?: boolean; makePublic?: boolean }
  ): Promise<{ success: boolean; metadataUrl?: string; error?: string }> {
    try {
      const file = this.bucket!.file(fileName);

      // Check if file exists and overwrite is not allowed
      if (!options.overwrite) {
        const [exists] = await file.exists();
        if (exists) {
          return { success: false, error: 'Metadata file already exists and overwrite is disabled' };
        }
      }

      // Prepare metadata
      const metadata = {
        contentType: 'application/json',
        metadata: {
          renditionId: rendition.id,
          createdAt: rendition.createdAt.toISOString(),
          type: 'audio-metadata'
        }
      };

      // Upload metadata
      await file.save(JSON.stringify(rendition, null, 2), {
        metadata,
        resumable: false
      });

      const metadataUrl = `https://storage.googleapis.com/${this.config.bucketName}/${fileName}`;
      return { success: true, metadataUrl };

    } catch (error) {
      console.error('❌ Failed to store metadata file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retrieve audio rendition from GCS
   */
  async getAudioRendition(renditionId: string): Promise<{ rendition: AudioRendition; audioBuffer: ArrayBuffer } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Get metadata first
      const metadataFileName = `${this.config.metadataFolder}/${renditionId}.json`;
      const metadataFile = this.bucket!.file(metadataFileName);

      const [exists] = await metadataFile.exists();
      if (!exists) {
        return null;
      }

      const [metadataBuffer] = await metadataFile.download();
      const rendition: AudioRendition = JSON.parse(metadataBuffer.toString());
      
      // Convert date strings back to Date objects
      rendition.createdAt = new Date(rendition.createdAt);

      // Get audio file
      const audioFileName = `${this.config.audioFolder}/${renditionId}.${rendition.format}`;
      const audioFile = this.bucket!.file(audioFileName);

      const [audioExists] = await audioFile.exists();
      if (!audioExists) {
        console.warn(`⚠️ Audio file not found for rendition: ${renditionId}`);
        return null;
      }

      const [audioBuffer] = await audioFile.download();
      
      console.log(`☁️ Retrieved audio rendition: ${renditionId}`);
      return {
        rendition,
        audioBuffer: audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength)
      };

    } catch (error) {
      console.error('❌ Failed to retrieve audio rendition:', error);
      return null;
    }
  }

  /**
   * Delete audio rendition from GCS
   */
  async deleteAudioRendition(renditionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isAvailable()) {
      return { success: false, error: 'GCS storage not available' };
    }

    try {
      // Get metadata to determine file format
      const metadataFileName = `${this.config.metadataFolder}/${renditionId}.json`;
      const metadataFile = this.bucket!.file(metadataFileName);

      const [metadataExists] = await metadataFile.exists();
      let format = 'mp3'; // default

      if (metadataExists) {
        try {
          const [metadataBuffer] = await metadataFile.download();
          const rendition: AudioRendition = JSON.parse(metadataBuffer.toString());
          format = rendition.format;
        } catch (error) {
          console.warn('⚠️ Could not read metadata for format detection, using default');
        }
      }

      // Delete both files
      const audioFileName = `${this.config.audioFolder}/${renditionId}.${format}`;
      const audioFile = this.bucket!.file(audioFileName);

      const deletePromises = [this.deleteFile(audioFileName)];
      if (metadataExists) {
        deletePromises.push(this.deleteFile(metadataFileName));
      }

      await Promise.all(deletePromises);

      console.log(`🗑️ Deleted audio rendition: ${renditionId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete audio rendition:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a single file from GCS
   */
  private async deleteFile(fileName: string): Promise<void> {
    const file = this.bucket!.file(fileName);
    await file.delete();
  }

  /**
   * List all audio renditions
   */
  async listAudioRenditions(options: {
    limit?: number;
    prefix?: string;
    includeMetadata?: boolean;
  } = {}): Promise<FileInfo[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const query: any = {
        prefix: options.prefix || this.config.audioFolder,
        maxResults: options.limit || 1000
      };

      const [files] = await this.bucket!.getFiles(query);
      
      const fileInfos: FileInfo[] = [];
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        fileInfos.push({
          name: file.name,
          size: parseInt(metadata.size || '0'),
          created: new Date(metadata.timeCreated || ''),
          updated: new Date(metadata.updated || ''),
          contentType: metadata.contentType || '',
          metadata: metadata.metadata || {},
          storageClass: metadata.storageClass || 'STANDARD'
        });
      }

      return fileInfos;
    } catch (error) {
      console.error('❌ Failed to list audio renditions:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    if (!this.isAvailable()) {
      return {
        totalFiles: 0,
        totalSize: 0,
        audioFiles: 0,
        metadataFiles: 0,
        oldestFile: null,
        newestFile: null,
        averageFileSize: 0,
        storageClasses: {}
      };
    }

    try {
      const [files] = await this.bucket!.getFiles();
      
      let totalSize = 0;
      let audioFiles = 0;
      let metadataFiles = 0;
      const storageClasses: Record<string, number> = {};
      const dates: Date[] = [];

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const size = parseInt(metadata.size || '0');
        totalSize += size;

        if (file.name.startsWith(this.config.audioFolder)) {
          audioFiles++;
        } else if (file.name.startsWith(this.config.metadataFolder)) {
          metadataFiles++;
        }

        const storageClass = metadata.storageClass || 'STANDARD';
        storageClasses[storageClass] = (storageClasses[storageClass] || 0) + 1;

        if (metadata.timeCreated) {
          dates.push(new Date(metadata.timeCreated));
        }
      }

      const totalFiles = files.length;
      const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

      return {
        totalFiles,
        totalSize,
        audioFiles,
        metadataFiles,
        oldestFile: sortedDates.length > 0 ? sortedDates[0] : null,
        newestFile: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null,
        averageFileSize: Math.round(averageFileSize),
        storageClasses
      };

    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        audioFiles: 0,
        metadataFiles: 0,
        oldestFile: null,
        newestFile: null,
        averageFileSize: 0,
        storageClasses: {}
      };
    }
  }

  /**
   * Clean up old files based on age
   */
  async cleanupOldFiles(maxAgeDays: number = 30): Promise<{ deletedCount: number; freedSpace: number }> {
    if (!this.isAvailable()) {
      return { deletedCount: 0, freedSpace: 0 };
    }

    try {
      const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
      const [files] = await this.bucket!.getFiles();

      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdDate = new Date(metadata.timeCreated || '');
        
        if (createdDate < cutoffDate) {
          const size = parseInt(metadata.size || '0');
          await file.delete();
          deletedCount++;
          freedSpace += size;
        }
      }

      console.log(`🧹 Cleaned up ${deletedCount} old files, freed ${this.formatBytes(freedSpace)}`);
      return { deletedCount, freedSpace };

    } catch (error) {
      console.error('❌ Failed to cleanup old files:', error);
      return { deletedCount: 0, freedSpace: 0 };
    }
  }

  /**
   * Get KMS key name for encryption
   */
  private getKmsKeyName(): string {
    // Return your KMS key name here
    // This should be configured in your environment
    return process.env.GCS_KMS_KEY_NAME || '';
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
   * Test GCS connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; error?: string; latency?: number }> {
    if (!this.isAvailable()) {
      return { success: false, error: 'GCS storage not available' };
    }

    try {
      const startTime = Date.now();
      await this.bucket!.getMetadata();
      const latency = Date.now() - startTime;

      return { success: true, latency };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

