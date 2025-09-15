// src/lib/services/crossCorpusWisdomService.ts
import { categoryService } from '../database/categoryService';
import { corpusChecker } from './corpusChecker';
import { Storage } from '@google-cloud/storage';
import { gretilWisdomService } from './gretilWisdomService';

export interface CrossCorpusWisdomOptions {
  userPreference?: string; // specific category or 'random'
  excludeRecent?: string[]; // recently shown sources to avoid repetition
  diversityMode?: 'balanced' | 'weighted' | 'random';
}

export interface SelectedCorpusSource {
  folderName: string;
  displayName: string;
  category: string;
  isAvailable: boolean;
  selectionReason: string;
}

class CrossCorpusWisdomService {
  
  // Initialize Google Cloud Storage with same robust pattern as existing services
  private initializeStorage() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return new Storage();
      }
      
      if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
        const credentials = {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        };
        
        return new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentials
        });
      }
      
      throw new Error('Google Cloud Storage credentials not found');
    } catch (error) {
      console.error('Error initializing Google Cloud Storage:', error);
      throw error;
    }
  }
  
  // GCS-first approach - scan what actually exists first
  async getAllAvailableSources(): Promise<string[]> {
    try {
      // Get existing GCS sources
      const storage = this.initializeStorage();
      const bucketName = 'mygurukul-sacred-texts-corpus';
      const bucket = storage.bucket(bucketName);
      
      console.log('Scanning GCS bucket for actual available documents...');
      const [files] = await bucket.getFiles();
      
      // Group files by folder to find folders with actual content
      const folderCounts = new Map<string, number>();
      
      files.forEach(file => {
        const pathParts = file.name.split('/');
        if (pathParts.length > 1 && pathParts[0].trim() && pathParts[0] !== 'Gretil_Originals') {
          const folderName = pathParts[0];
          folderCounts.set(folderName, (folderCounts.get(folderName) || 0) + 1);
        }
      });
      
      // Only include folders with substantial content (more than 2 files)
      const actuallyAvailableFolders = Array.from(folderCounts.entries())
        .filter(([folder, count]) => count > 2)  // Has real content
        .map(([folder, count]) => folder)
        .sort();
      
      console.log(`GCS-first scan found ${actuallyAvailableFolders.length} folders with content:`, 
        actuallyAvailableFolders.map(f => `${f}(${folderCounts.get(f)} files)`));
      
      // Get Gretil sources
      const gretilSources = await gretilWisdomService.getAllAvailableGretilSources();
      const gretilSourceNames = gretilSources.map(source => `Gretil_${source.folderName}`);
      
      console.log(`Found ${gretilSources.length} Gretil sources`);
      
      // Combine all sources
      const allSources = [...actuallyAvailableFolders, ...gretilSourceNames];
      
      return allSources.length > 0 ? allSources : ['Ramayana'];
      
    } catch (error) {
      console.error('Error scanning for available documents:', error);
      return ['Ramayana']; // fallback
    }
  }
  
  // Intelligent source selection using existing corpus infrastructure
  async selectWisdomSource(options: CrossCorpusWisdomOptions = {}): Promise<SelectedCorpusSource> {
    try {
      const availableSources = await this.getAllAvailableSources();
      
      // If user specified a preference, try to honor it
      if (options.userPreference && options.userPreference !== 'random') {
        const userPref = options.userPreference; // TypeScript narrowing
        const preferredSource = availableSources.find(source => 
          source.toLowerCase().includes(userPref.toLowerCase())
        );
        if (preferredSource) {
          return await this.buildSourceInfo(preferredSource, 'user-specified');
        }
      }
      
      // Filter out recently shown sources for variety
      let candidateSources = availableSources;
      if (options.excludeRecent && options.excludeRecent.length > 0) {
        const excludeList = options.excludeRecent; // TypeScript narrowing
        candidateSources = availableSources.filter(source => 
          !excludeList.includes(source)
        );
      }
      
      // If no candidates after filtering, use all sources
      if (candidateSources.length === 0) {
        candidateSources = availableSources;
      }
      
      // Random selection with optional weighting
      const selectedSource = this.selectWithDiversity(candidateSources, options.diversityMode);
      
      return await this.buildSourceInfo(selectedSource, 'intelligent-selection');
      
    } catch (error) {
      console.error('Error selecting wisdom source:', error);
      return {
        folderName: 'ramayana',
        displayName: 'Ramayana',
        category: 'Life Purpose & Ethics',
        isAvailable: true,
        selectionReason: 'fallback'
      };
    }
  }
  
  private async buildSourceInfo(source: string, reason: string): Promise<SelectedCorpusSource> {
    if (source.startsWith('Gretil_')) {
      // Handle Gretil source
      const gretilFileName = source.replace('Gretil_', '');
      const gretilSources = await gretilWisdomService.getAllAvailableGretilSources();
      const gretilSource = gretilSources.find(gs => gs.folderName === gretilFileName);
      
      if (gretilSource) {
        return {
          folderName: source, // Keep the Gretil_ prefix for identification
          displayName: gretilSource.displayName,
          category: gretilSource.category,
          isAvailable: true,
          selectionReason: reason
        };
      }
    }
    
    // Handle regular source
    return {
      folderName: source,
      displayName: this.formatDisplayName(source),
      category: await this.getCategoryForSource(source),
      isAvailable: true,
      selectionReason: reason
    };
  }

  // Helper methods
  private selectWithDiversity(sources: string[], mode: string = 'balanced'): string {
    const randomIndex = Math.floor(Math.random() * sources.length);
    return sources[randomIndex];
  }
  
  private formatDisplayName(folderName: string | undefined): string {
    if (!folderName) {
      return 'Unknown Source';
    }
    return folderName.replace(/([A-Z])/g, ' $1').trim()
      .split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  private async getCategoryForSource(folderName: string): Promise<string> {
    try {
      // Use Library Tab's system to find category for available sources
      const categories = categoryService.getCategories();
      for (const category of categories) {
        const categoryWithTexts = await categoryService.getCategoryWithTexts(category.id);
        if (categoryWithTexts) {
          const foundText = categoryWithTexts.texts.find(text => 
            text.status === 'available' && text.cloudFolderPath === folderName
          );
          if (foundText) {
            return category.name;
          }
        }
      }
      return 'Sacred Texts';
    } catch (error) {
      console.error('Error finding category for source:', error);
      return 'Sacred Texts';
    }
  }
}

export const crossCorpusWisdomService = new CrossCorpusWisdomService();
