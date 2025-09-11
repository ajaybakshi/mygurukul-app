import { Storage } from '@google-cloud/storage';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

// Initialize Google Cloud Storage - same pattern as Today's Wisdom
function initializeStorage() {
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

// Folder name mapping from category data to actual GCS folder names
const FOLDER_MAPPING: { [key: string]: string } = {
  'bhagavad-gita': 'BhagavadGita',
  'upanishads': 'Upanishads',
  'ramayana': 'Ramayana',
  'mahabharata': 'Mahabharata',
  'puranas': 'Puranas',
  'panchatantra': 'Panchatantra',
  'jataka-tales': 'JatakaTales',
  'manusmriti': 'Manusmriti',
  'yajnavalkya-smiriti': 'YajnavalkyaSmiriti',
  'narada-smiriti': 'NaradaSmiriti',
  'parashara-smriti': 'ParasharaSmriti',
  'yoga-sutras': 'YogaSutrasPatanjali',
  'hatha-yoga-pradipika': 'HathaYogaPradipika',
  'shiva-samhita': 'ShivaSamhita',
  'vedas': 'Vedas',
  'charaka-samhita': 'CharakaSamhita',
  'sushruta-samhita': 'SushrutaSamhita',
  'ashtanga-hridayam': 'AshtangaHridayamSangraha',
  'atharva-veda': 'AtharvaVeda',
  'rig-veda': 'RigVeda',
  'agni-purana': 'AgniPurana',
  'kama-sutra': 'KamaSutra',
  'natya-shastra': 'NatyaShastra',
  'abhinavabharati': 'Abhinavabharati',
  'silpa-shastras': 'SilpaShastras',
  'abhijnanashakuntalam': 'Abhijnanashakuntalam',
  'malavikagnimitram': 'Malavikagnimitram',
  'vikramorvasiyam': 'Vikramorvasiyam',
  'mricchakatika': 'Mricchakatika',
  'mudraraksasa': 'Mudraraksasa',
  'bhasa-plays': 'BhasaPlays',
  'shatakatraya': 'Shatakatraya',
  'nyaya-sutras': 'NyayaSutras',
  'vaisheshika-sutras': 'VaisheshikaSutras',
  'samkhya-karika': 'SamkhyaKarika',
  'mimamsa-sutras': 'MimamsaSutras',
  'brahma-sutras': 'BrahmaSutras',
  'tattvartha-sutra': 'TattvarthaSutra',
  'aryabhatia': 'Aryabhatia',
  'brahmasputasiddhanta': 'Brahmasputasiddhanta',
  'mahabhaskariiya': 'Mahabhaskariiya',
  'arthashastra': 'Arthashastra',
  'vedanga-jyotish': 'VedangaJyotish'
};

export class CorpusChecker {
  private storage: Storage;

  constructor() {
    // Use the same robust initialization as Today's Wisdom
    this.storage = initializeStorage();
  }

  async checkCorpusAvailability(cloudFolderPath: string): Promise<'available' | 'coming_soon'> {
    const cachedStatus = cache.get<string>(cloudFolderPath);
    if (cachedStatus) return cachedStatus as 'available' | 'coming_soon';

    try {
      // Map category folder path to actual GCS folder name
      const actualFolderName = FOLDER_MAPPING[cloudFolderPath] || cloudFolderPath;
      const bucketName = 'mygurukul-sacred-texts-corpus';
      
      console.log(`Checking corpus availability for: ${cloudFolderPath} -> ${actualFolderName}`);
      
      const [files] = await this.storage.bucket(bucketName).getFiles({ 
        prefix: `${actualFolderName}/` 
      });
      
      const status = files.length > 0 ? 'available' : 'coming_soon';
      console.log(`Found ${files.length} files in ${actualFolderName}, status: ${status}`);
      
      cache.set(cloudFolderPath, status);
      return status;
    } catch (error) {
      console.error(`Error checking corpus for ${cloudFolderPath}:`, error);
      // Graceful fallback - return 'coming_soon' if GCS is unavailable
      return 'coming_soon';
    }
  }
}

export const corpusChecker = new CorpusChecker();
