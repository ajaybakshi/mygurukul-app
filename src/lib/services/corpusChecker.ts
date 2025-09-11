import { Storage } from '@google-cloud/storage';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export class CorpusChecker {
  private storage: Storage;

  constructor() {
    // Use existing Google Cloud credentials from environment
    this.storage = new Storage();
  }

  async checkCorpusAvailability(cloudFolderPath: string): Promise<'available' | 'coming_soon'> {
    const cachedStatus = cache.get<string>(cloudFolderPath);
    if (cachedStatus) return cachedStatus as 'available' | 'coming_soon';

    try {
      const [files] = await this.storage.bucket('mygurukul-sacred-texts-corpus').getFiles({ prefix: `${cloudFolderPath}/` });
      const status = files.length > 0 ? 'available' : 'coming_soon';
      cache.set(cloudFolderPath, status);
      return status;
    } catch (error) {
      console.error(`Error checking corpus for ${cloudFolderPath}:`, error);
      return 'coming_soon'; // Graceful fallback
    }
  }
}

export const corpusChecker = new CorpusChecker();
