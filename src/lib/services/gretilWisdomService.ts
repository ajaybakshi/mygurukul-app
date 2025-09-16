import { Storage } from '@google-cloud/storage';
import { gretilTextTypeClassifier, GretilTextTypeClassifier } from './gretilTextTypeClassifier';
import { GretilTextType, LEGACY_TYPE_MAPPING, LegacyTextType } from '../../types/gretil-types';
import { epicLogicalUnitExtractor, EpicLogicalUnitExtractor } from './extractors/epicLogicalUnitExtractor';
import { philosophicalLogicalUnitExtractor, PhilosophicalLogicalUnitExtractor } from './extractors/philosophicalLogicalUnitExtractor';
import { dialogueLogicalUnitExtractor, DialogueLogicalUnitExtractor } from './extractors/dialogueLogicalUnitExtractor';
import { hymnalLogicalUnitExtractor, HymnalLogicalUnitExtractor } from './extractors/hymnalLogicalUnitExtractor';
import { narrativeLogicalUnitExtractor, NarrativeLogicalUnitExtractor } from './extractors/narrativeLogicalUnitExtractor';
import { BoundaryExtractor } from './boundaryExtractor';
import { ScripturePatternService } from './scripturePatternService';

interface ParsedLogicalUnit {
  cleanText: string;
  metadata: {
    source: string;
    chapter: string; 
    section: string;
    reference: string;
  };
  boundaries: {
    startVerse: string;
    endVerse?: string;
  };
}

interface GretilWisdomSource {
  folderName: string;
  displayName: string;
  category: string;
  textType: LegacyTextType; // Keep legacy for backward compatibility
  enhancedTextType?: GretilTextType; // New enhanced classification
}

interface LogicalUnit {
  sanskrit: string;
  reference: string;
  teachingType?: 'commentary' | 'dialogue' | 'teaching' | 'explanation' | 'narrative';
  speaker?: string;
  addressee?: string;
  verses?: string[];
  verseRange?: {
    start: string;
    end: string;
    count: number;
  };
  context?: {
    book?: number;
    chapter?: number;
    section?: string;
    philosophicalConcept?: string;
    narrativeType?: string;
    emotionalTone?: string;
  };
  unitType?: 'epic' | 'philosophical' | 'dialogue' | 'hymnal' | 'narrative';
}

interface GretilMetadata {
  title: string; // Required field - extracted from filename
  transformationTitle?: string; // Optional - from header if available
  dataEntry?: string;
  contribution?: string;
  dateVersion?: string;
  source?: string;
  publisher?: string;
  licence?: string;
  referenceStructure?: string;
  notes?: string;
  revisions?: string;
  originalUrl?: string;
  chapterInfo?: ChapterReference;
  verseNumber?: VerseReference;
  citationFormat?: string;
  textType?: LegacyTextType; // Legacy type for backward compatibility
  enhancedTextType?: GretilTextType; // New enhanced classification
  textTypeConfidence?: string; // Classification confidence level
  timePeriod?: string;
  hasCommentary?: boolean;
  // Logical unit support
  philosophicalUnit?: any;
  epicUnit?: any;
  dialogueUnit?: any;
  hymnalUnit?: any;
  narrativeUnit?: any;
}

interface ChapterReference {
  book?: number;
  chapter: number;
  section?: number;
}

interface VerseReference {
  verse: number;
  subVerse?: string;
  fullReference: string;
}

interface ExtractedWisdom {
  sanskrit: string;
  reference: string;
  textName: string;
  category: string;
  estimatedVerses: number;
  metadata?: GretilMetadata; // Optional metadata field
}

class GretilWisdomService {
  private storage: Storage | null = null;
  private bucketName: string = 'mygurukul-sacred-texts-corpus';
  private gretilFolder: string = 'Gretil_Originals';
  private currentFileName: string | null = null;
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
    // Initialize pattern service with validation
    this.scripturePatternService.initialize();
  }

  private initializeStorage(): Storage {
    if (this.storage) return this.storage;

    // Use the EXACT same pattern as your working Today's Wisdom service
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
      throw new Error('Google Cloud credentials not found in environment variables');
    }

    return this.storage;
  }

  async getAllAvailableGretilSources(): Promise<GretilWisdomSource[]> {
    try {
      const storage = this.initializeStorage();
      const [files] = await storage.bucket(this.bucketName)
        .getFiles({ prefix: `${this.gretilFolder}/` });
  
      const sources: GretilWisdomSource[] = [];
      
      for (const file of files) {
        const fileName = file.name.split('/').pop();
        // Only process .txt files directly in Gretil_Originals/ (no subfolders)
        if (fileName && fileName.endsWith('.txt') && fileName !== '.txt' && !file.name.includes('/', file.name.indexOf('/') + 1)) {
          const source = this.categorizeGretilText(fileName);
          if (source) {
            // Use actual filename as the identifier
            source.folderName = fileName;
            sources.push(source);
            console.log(`Added Gretil source: ${fileName} -> ${source.displayName} (${source.category})`);
          }
        }
      }
  
      console.log(`Total Gretil sources found: ${sources.length}`);
      return sources.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
    } catch (error) {
      console.error('Error scanning Gretil sources:', error);
      return [];
    }
  }
  

  private categorizeGretilText(fileName: string): GretilWisdomSource | null {
    const name = fileName.replace('.txt', '').toLowerCase();

    // Use enhanced classifier for better categorization (will be populated with content later)
    // For now, use filename-based classification with legacy fallback

    // Bhagavad Gita - handle "Bhagvad_Gita.txt" or similar variants (highest priority)
    if (name.includes('bhagvad') || name.includes('gita') || name.includes('bhagavad') || name === 'bhagvad_gita') {
      return {
        folderName: fileName,
        displayName: 'Bhagavad Gita',
        category: 'Philosophical Texts',
        textType: 'gita', // Preserve legacy 'gita' type for backward compatibility
        enhancedTextType: GretilTextType.PHILOSOPHICAL
      };
    }

    // Epics - handle "Ramayana.txt", "Mahabharata.txt" etc.
    if (name.includes('ramayana') || name.includes('rama') || name.includes('mahabharata')) {
      const displayName = name.includes('ramayana') ? 'Ramayana' :
                         name.includes('mahabharata') ? 'Mahabharata' :
                         this.formatDisplayName(fileName);
      return {
        folderName: fileName,
        displayName: displayName,
        category: 'Epics',
        textType: 'epic',
        enhancedTextType: GretilTextType.EPIC
      };
    }

    // Vedas - handle various Veda file patterns
    if (name.includes('veda') || name.includes('rg_veda') || name.includes('khila') || name.includes('rig_veda')) {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Vedas',
        textType: 'veda',
        enhancedTextType: GretilTextType.HYMNAL
      };
    }

    // Upanishads - handle "Chandogya_Upanishad.txt" etc.
    if (name.includes('upanishad') || name === 'chandogya_upanishad') {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Upanishads',
        textType: 'upanishad',
        enhancedTextType: GretilTextType.PHILOSOPHICAL
      };
    }

    // Purana texts - handle clean filenames like "Agni_Purana.txt"
    if (name.includes('purana') || name === 'agni_purana') {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Puranas',
        textType: 'purana',
        enhancedTextType: GretilTextType.NARRATIVE
      };
    }

    // Default categorization for other texts - will be enhanced with content analysis later
    return {
      folderName: fileName,
      displayName: this.formatDisplayName(fileName),
      category: 'Sacred Texts',
      textType: 'other', // Use 'other' instead of 'purana' for unknown texts
      enhancedTextType: GretilTextType.NARRATIVE
    };
  }

  private formatDisplayName(fileName: string): string {
    return fileName
      .replace('.txt', '')
      .replace(/_/g, ' ')  // Handle underscore-based naming
      .replace(/-/g, ' ')  // Also handle hyphens
      .replace(/sample/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async extractWisdomFromGretilSource(sourceName: string): Promise<ExtractedWisdom | null> {
    try {
      console.log(`=== DEBUGGING: Starting extraction from ${sourceName} ===`);
      console.log(`🔍 Source file: ${sourceName}`);

      const storage = this.initializeStorage();
      const filePath = `${this.gretilFolder}/${sourceName}`;
      console.log(`📁 File path: ${filePath}`);

      const file = storage.bucket(this.bucketName).file(filePath);

      const [content] = await file.download();
      const textContent = content.toString('utf-8');

      console.log(`📊 File size: ${textContent.length} characters`);
      console.log(`📄 First 500 characters:`);
      console.log(textContent.substring(0, 500));
      console.log(`=== END PREVIEW ===`);

      // Parse metadata from header
      this.currentFileName = sourceName; // Set current filename for classification
      const metadata = this.parseGretilHeader(textContent, sourceName);

      // CRITICAL FIX: Enhanced text classification with filename priority
      const textClassification = this.enhancedClassifyText(sourceName, textContent);
      console.log(`📊 ENHANCED Text classified as: ${textClassification.textType} (${textClassification.confidence})`);
      console.log(`📋 Classification method: ${textClassification.method}`);

      console.log('=== GRETIL SERVICE DIAGNOSTIC ===');
      console.log('🕐 Extraction start timestamp:', new Date().toISOString());
      console.log('📁 File selected for extraction:', sourceName);
      console.log('📊 File size:', textContent.length, 'characters');
      console.log('🔍 Text type classified as:', textClassification.textType);
      console.log('📈 Classification confidence:', textClassification.confidence);
      console.log('📋 Classification details:', {
        textType: textClassification.textType,
        confidence: textClassification.confidence,
        fileName: sourceName,
        fileSize: textContent.length
      });

      let result: ExtractedWisdom | null = null;

      // Get source categorization for fallback display names
      const source = this.categorizeGretilText(sourceName);
      console.log('📂 Source categorization:', {
        folderName: source?.folderName,
        displayName: source?.displayName,
        category: source?.category,
        textType: source?.textType
      });

      // CRITICAL FIX: Enhanced extractor selection with proper text types
      console.log(`🎯 ENHANCED Extractor selection for ${textClassification.textType} (${textClassification.confidence} confidence)`);
      
      if (textClassification.textType === GretilTextType.EPIC && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('🎭 Extractor selected: EpicLogicalUnitExtractor');
        console.log('📋 Selection criteria: EPIC text type with', textClassification.confidence, 'confidence');
        console.log(`🎭 Using EPIC logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const epicUnit = epicLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Epic extraction time:', extractionTime, 'ms');
        
        if (epicUnit) {
          result = epicLogicalUnitExtractor.toExtractedWisdom(epicUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ EPIC extraction successful: ${epicUnit.verseRange.count} verses, ${epicUnit.narrativeType} type`);
          console.log('📊 Epic unit details:', {
            verseCount: epicUnit.verseRange.count,
            narrativeType: epicUnit.narrativeType,
            reference: epicUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ EPIC extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: EpicLogicalUnitExtractor returned null');
        }
      }

      // Use PHILOSOPHICAL extractor for Upanishads and other philosophical texts
      if (textClassification.textType === GretilTextType.PHILOSOPHICAL && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('📚 Extractor selected: PhilosophicalLogicalUnitExtractor');
        console.log('📋 Selection criteria: PHILOSOPHICAL text type with', textClassification.confidence, 'confidence');
        console.log(`📚 Using PHILOSOPHICAL logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const philosophicalUnit = philosophicalLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Philosophical extraction time:', extractionTime, 'ms');
        
        if (philosophicalUnit) {
          result = philosophicalLogicalUnitExtractor.toExtractedWisdom(philosophicalUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ PHILOSOPHICAL extraction successful: ${philosophicalUnit.verseRange.count} verses, ${philosophicalUnit.teachingType} type`);
          console.log('📊 Philosophical unit details:', {
            verseCount: philosophicalUnit.verseRange.count,
            teachingType: philosophicalUnit.teachingType,
            reference: philosophicalUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ PHILOSOPHICAL extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: PhilosophicalLogicalUnitExtractor returned null');
        }
      }

      // Use DIALOGUE extractor for Bhagavad Gita and other dialogue texts
      if (textClassification.textType === GretilTextType.DIALOGUE && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('💬 Extractor selected: DialogueLogicalUnitExtractor');
        console.log('📋 Selection criteria: DIALOGUE text type with', textClassification.confidence, 'confidence');
        console.log(`💬 Using DIALOGUE logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const dialogueUnit = dialogueLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Dialogue extraction time:', extractionTime, 'ms');
        
        if (dialogueUnit) {
          result = dialogueLogicalUnitExtractor.toExtractedWisdom(dialogueUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ DIALOGUE extraction successful: ${dialogueUnit.verseRange.count} verses, ${dialogueUnit.dialogueType} type`);
          console.log('📊 Dialogue unit details:', {
            verseCount: dialogueUnit.verseRange.count,
            dialogueType: dialogueUnit.dialogueType,
            reference: dialogueUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ DIALOGUE extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: DialogueLogicalUnitExtractor returned null');
        }
      }

      // Use HYMNAL extractor for Vedic texts
      if (textClassification.textType === GretilTextType.HYMNAL && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('🎵 Extractor selected: HymnalLogicalUnitExtractor');
        console.log('📋 Selection criteria: HYMNAL text type with', textClassification.confidence, 'confidence');
        console.log(`🎵 Using HYMNAL logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const hymnalUnit = hymnalLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Hymnal extraction time:', extractionTime, 'ms');
        
        if (hymnalUnit) {
          result = hymnalLogicalUnitExtractor.toExtractedWisdom(hymnalUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ HYMNAL extraction successful: ${hymnalUnit.verseRange.count} verses, ${hymnalUnit.hymnType} type`);
          console.log('📊 Hymnal unit details:', {
            verseCount: hymnalUnit.verseRange.count,
            hymnType: hymnalUnit.hymnType,
            reference: hymnalUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ HYMNAL extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: HymnalLogicalUnitExtractor returned null');
        }
      }

      // Use NARRATIVE extractor for Puranic and mythological texts
      if (textClassification.textType === GretilTextType.NARRATIVE && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('📖 Extractor selected: NarrativeLogicalUnitExtractor');
        console.log('📋 Selection criteria: NARRATIVE text type with', textClassification.confidence, 'confidence');
        console.log(`📖 Using NARRATIVE logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const narrativeUnit = narrativeLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Narrative extraction time:', extractionTime, 'ms');
        
        if (narrativeUnit) {
          result = narrativeLogicalUnitExtractor.toExtractedWisdom(narrativeUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ NARRATIVE extraction successful: ${narrativeUnit.verseRange.count} verses, ${narrativeUnit.narrativeType} type`);
          console.log('📊 Narrative unit details:', {
            verseCount: narrativeUnit.verseRange.count,
            narrativeType: narrativeUnit.narrativeType,
            reference: narrativeUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ NARRATIVE extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: NarrativeLogicalUnitExtractor returned null');
        }
      }

      // Fall back to standard extraction if specialized extraction didn't work
      if (!result) {
        console.log('🎯 Extractor selected: Standard extractRandomStanzaWithMetadata');
        console.log('📋 Fallback reason: All specialized extractors failed or returned null');
        console.log(`🎯 Using ENHANCED standard extractRandomStanzaWithMetadata()...`);
        result = this.extractRandomStanzaWithMetadata(textContent, sourceName, metadata);
      }
      console.log(`📋 extractRandomStanzaWithMetadata() RESULT:`, result ? 'SUCCESS' : 'NULL');

      if (result) {
        console.log(`🎉 FINAL RESULT:`, {
          sanskrit: result.sanskrit.substring(0, 100) + '...',
          reference: result.reference,
          textName: result.textName,
          category: result.category,
          hasMetadata: !!result.metadata
        });
        if (result.metadata) {
          console.log(`📊 RESULT METADATA:`, result.metadata);
        }
      }

      console.log(`=== END DEBUGGING for ${sourceName} ===`);
      return result;

    } catch (error) {
      console.error(`=== ERROR in extraction from ${sourceName}:`, error);
      // Fallback to original method if parsing fails
      console.log(`🔄 FALLING BACK to original extraction method...`);
      return this.extractWisdomFromGretilSourceFallback(sourceName);
    }
  }

  // ============================================================================
  // UNIVERSAL GRETIL HEADER PARSER AND METADATA EXTRACTOR
  // ============================================================================


  private parseGretilHeader(content: string, fileName?: string): GretilMetadata | null {
    try {
      console.log(`🔧 parseGretilHeader() called with content length: ${content?.length || 0}`);

      // Safety checks for malformed content
      if (!content || typeof content !== 'string' || content.length < 100) {
        console.log('❌ Content too short or invalid for header parsing');
        return null;
      }

      const lines = content.split('\n');
      console.log(`📝 Total lines: ${lines.length}`);

      if (lines.length < 5) {
        console.log('❌ Content has too few lines for header parsing');
        return null;
      }

      // Find header and text boundaries with safety checks
      const headerStart = lines.findIndex(line => line.includes('# Header'));
      const textStart = lines.findIndex(line => line.includes('# Text'));

      console.log(`🔍 Header start index: ${headerStart}`);
      console.log(`🔍 Text start index: ${textStart}`);

      if (headerStart === -1) {
        console.log('❌ No # Header marker found');
        return null;
      }

      if (textStart === -1) {
        console.log('❌ No # Text marker found');
        return null;
      }

      if (headerStart >= textStart) {
        console.log('❌ Header starts after text section - malformed file');
        return null;
      }

      const headerLines = lines.slice(headerStart + 1, textStart);
      console.log(`📄 Header lines found: ${headerLines.length}`);
      console.log(`📋 Header content (first 20 lines):`, headerLines.slice(0, 20));

      // Log all header lines for debugging
      console.log(`📋 FULL HEADER CONTENT:`);
      headerLines.forEach((line, index) => {
        console.log(`  ${index + 1}: "${line}"`);
      });

      // Initialize metadata with required title field
      const basicTextType = this.classifyTextType(content);
      const enhancedClassification = gretilTextTypeClassifier.classifyText(fileName || 'unknown.txt', content);

      const metadata: Partial<GretilMetadata> = {
        citationFormat: this.detectCitationFormat(content),
        textType: basicTextType,
        enhancedTextType: enhancedClassification.textType,
        textTypeConfidence: enhancedClassification.confidence,
        hasCommentary: this.detectCommentary(content)
      };

      console.log(`📊 Initial metadata:`, metadata);

      // 🎯 PRIMARY STRATEGY: Use filename for reliable title extraction
      if (fileName) {
        const baseName = fileName.replace('.txt', '').replace(/_/g, ' ');
        metadata.title = baseName;
        console.log(`✅ Title extracted from filename: "${metadata.title}"`);
      } else {
        console.log(`⚠️ No filename provided, using default title`);
        metadata.title = 'Sacred Text';
      }

      // OPTIONAL: Try to extract additional metadata from header if available
      // (This is now optional and won't override the filename-based title)
      console.log(`🔍 Attempting to extract additional metadata from header...`);
      try {
        const transformationLine = headerLines.find(line => line.includes('Transformation'));
        if (transformationLine) {
          const titleMatch = transformationLine.match(/Transformation:\s*(.+)/);
          if (titleMatch && titleMatch[1].trim()) {
            // Store transformation info as additional metadata but keep filename as title
            metadata.transformationTitle = titleMatch[1].trim();
            console.log(`📝 Found transformation info: "${metadata.transformationTitle}"`);
          }
        }
      } catch (headerError) {
        console.log(`⚠️ Header parsing failed, but that's OK - using filename title`);
      }

      // Parse all ## Field: Value pairs generically with safety checks
      headerLines.forEach(line => {
        if (!line || typeof line !== 'string') return;

        const fieldMatch = line.match(/^##\s*([^:]+):\s*(.+)$/);
        if (fieldMatch && fieldMatch[1] && fieldMatch[2]) {
          const fieldName = fieldMatch[1].trim().toLowerCase().replace(/\s+/g, '');
          const fieldValue = fieldMatch[2].trim();

          if (!fieldName || !fieldValue) return;

          // Handle field name variations with safety checks
          try {
            switch(fieldName) {
              case 'dataentry':
              case 'data-entry':
                metadata.dataEntry = fieldValue;
                break;
              case 'contribution':
              case 'contributor':
                metadata.contribution = fieldValue;
                break;
              case 'date/version':
              case 'dateversion':
              case 'version':
                metadata.dateVersion = fieldValue;
                break;
              case 'source':
                metadata.source = fieldValue;
                break;
              case 'publisher':
                metadata.publisher = fieldValue;
                break;
              case 'licence':
              case 'license':
                metadata.licence = fieldValue;
                break;
              case 'referencestructure':
              case 'reference-structure':
                metadata.referenceStructure = fieldValue;
                break;
              case 'notes':
                metadata.notes = fieldValue;
                break;
              case 'revisions':
                metadata.revisions = fieldValue;
                break;
              case 'originalurl':
              case 'original-url':
                metadata.originalUrl = fieldValue;
                break;
            }
          } catch (fieldError) {
            console.log(`Error parsing field ${fieldName}:`, fieldError);
          }
        }
      });

      // Extract additional context (only if we have a title)
      if (metadata.title) {
        metadata.timePeriod = this.extractTimePeriod(metadata.title, content);
        const chapterInfo = this.extractChapterInfo(metadata as GretilMetadata, content);
        if (chapterInfo) {
          metadata.chapterInfo = chapterInfo;
        }

        // Extract verse reference from content for additional metadata
        const verseRef = this.extractVerseReferenceFromContent(content);
        if (verseRef) {
          metadata.verseNumber = verseRef;
        }
      }

      // Ensure we have the required title field before casting
      if (!metadata.title) {
        console.log('Title extraction failed');
        return null;
      }

      return metadata as GretilMetadata;
    } catch (error) {
      console.error('Error parsing Gretil header:', error);
      return null;
    }
  }

  private extractTitleFromContent(content: string): string | null {
    // Multiple strategies to extract title from content
    const lines = content.split('\n').slice(0, 20); // First 20 lines

    // Strategy 1: Look for title-like patterns
    for (const line of lines) {
      if (line.includes('#') && !line.includes('# Header') && !line.includes('# Text')) {
        const cleanTitle = line.replace(/^#+\s*/, '').trim(); // Remove # and ## prefixes
        if (cleanTitle.length > 5 && cleanTitle.length < 100) {
          // Additional check: don't return contributor information as title
          if (!cleanTitle.toLowerCase().includes('data entry') &&
              !cleanTitle.toLowerCase().includes('jun takashima') &&
              !cleanTitle.toLowerCase().includes('göttingen') &&
              !cleanTitle.toLowerCase().includes('creative commons') &&
              !cleanTitle.toLowerCase().includes('contribution:') &&
              !cleanTitle.toLowerCase().includes('source:') &&
              !cleanTitle.toLowerCase().includes('publisher:') &&
              !cleanTitle.toLowerCase().includes('licence:')) {
            return cleanTitle;
          }
        }
      }
    }

    // Strategy 2: Look for Sanskrit text that might be title
    for (const line of lines) {
      if (this.hasSanskritContent(line) && line.length > 10 && line.length < 200) {
        return line.trim();
      }
    }

    return null;
  }

  private extractVerseReference(line: string): VerseReference | null {
    if (!line || typeof line !== 'string') return null;

    const patterns = [
      // Ramayana: Ram_2,1.1
      { regex: /Ram_(\d+),(\d+)\.(\d+)/, format: 'ramayana', groups: ['book', 'chapter', 'verse'] },
      // Rig Veda Khila: RvKh_1,1.1
      { regex: /RvKh_(\d+),(\d+)\.(\d+)/, format: 'veda-khila', groups: ['book', 'section', 'verse'] },
      // Chandogya Upanishad: chup_1,1.1
      { regex: /chup_(\d+),(\d+)\.(\d+)/, format: 'upanishad', groups: ['chapter', 'section', 'verse'] },
      // Bhagavad Gita: bhg 1.1
      { regex: /bhg (\d+)\.(\d+)/, format: 'gita', groups: ['chapter', 'verse'] },
      // Agni Purana: ap_1.001ab
      { regex: /ap_(\d+)\.(\d+)([a-z]*)/, format: 'purana', groups: ['chapter', 'verse', 'subVerse'] },
      // Linga Purana: LiP_1,106.6
      { regex: /LiP_(\d+),(\d+)\.(\d+)/, format: 'purana', groups: ['chapter', 'section', 'verse'] },
      // Generic pattern for other texts
      { regex: /(\w+)_(\d+),?(\d*)\.?(\d*)([a-z]*)/, format: 'generic', groups: ['text', 'book', 'chapter', 'verse', 'subVerse'] }
    ];


    for (const pattern of patterns) {
      try {
        const match = line.match(pattern.regex);
        if (match) {
          const reference: Partial<VerseReference> = {
            fullReference: match[0],
            subVerse: match[match.length - 1] || undefined
          };

          // Map captured groups based on pattern
          pattern.groups.forEach((groupName, index) => {
            const value = match[index + 1];
            if (value && value !== '' && !isNaN(Number(value))) {
              (reference as any)[groupName] = parseInt(value);
            }
          });

          // Validate that we have at least a verse number
          if (reference.verse !== undefined) {
            return reference as VerseReference;
          }
        }
      } catch (patternError) {
        // Continue to next pattern
      }
    }

    return null;
  }

  private extractChapterInfo(metadata: GretilMetadata, content: string): ChapterReference | undefined {
    if (!content || typeof content !== 'string') return undefined;

    // Extract chapter information from content or metadata
    const chapterPatterns = [
      /Book (\d+), Chapter (\d+)/i,
      /Chapter (\d+), Section (\d+)/i,
      /Book (\d+), Section (\d+)/i,
      /Volume (\d+), Chapter (\d+)/i
    ];

    for (const pattern of chapterPatterns) {
      try {
        const match = content.match(pattern);
        if (match) {
          return {
            book: match[1] ? parseInt(match[1]) : undefined,
            chapter: parseInt(match[2]),
            section: match[3] ? parseInt(match[3]) : undefined
          };
        }
      } catch (chapterError) {
        console.log('Error extracting chapter info:', chapterError);
      }
    }

    return undefined;
  }

  private extractVerseReferenceFromContent(content: string): VerseReference | undefined {
    if (!content || typeof content !== 'string') return undefined;

    const lines = content.split('\n');

    // Look for verse references in the first part of the content (after header)
    for (let i = 0; i < Math.min(lines.length, 1000); i++) {
      const line = lines[i].trim();

      // Skip header lines
      if (line.includes('# Header') || line.includes('# Text')) continue;
      if (line.startsWith('#')) continue;

      const verseRef = this.extractVerseReference(line);
      if (verseRef) {
        return verseRef;
      }
    }

    return undefined;
  }

  /**
   * CRITICAL FIX: Enhanced text classification with filename priority
   * This method provides reliable classification based on filename patterns
   */
  private enhancedClassifyText(filename: string, content: string): {
    textType: GretilTextType;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN';
    method: string;
  } {
    const fileName = filename.toLowerCase();
    
    console.log(`🔍 Enhanced classification for: ${filename}`);
    
    // PRIMARY: Filename-based classification (most reliable)
    if (fileName.includes('upanishad') || fileName.includes('upaniṣad')) {
      console.log(`✅ Filename-based classification: PHILOSOPHICAL (Upanishad detected)`);
      return {
        textType: GretilTextType.PHILOSOPHICAL,
        confidence: 'HIGH',
        method: 'filename-upanishad'
      };
    }
    
    if (fileName.includes('veda') || fileName.includes('ṛgveda') || fileName.includes('sāmaveda') || fileName.includes('yajurveda') || fileName.includes('saṃhitā')) {
      console.log(`✅ Filename-based classification: HYMNAL (Veda detected)`);
      return {
        textType: GretilTextType.HYMNAL,
        confidence: 'HIGH',
        method: 'filename-veda'
      };
    }
    
    if (fileName.includes('gita') || fileName.includes('gītā') || fileName.includes('bhagvad')) {
      console.log(`✅ Filename-based classification: DIALOGUE (Gita detected)`);
      return {
        textType: GretilTextType.DIALOGUE,
        confidence: 'HIGH',
        method: 'filename-gita'
      };
    }
    
    if (fileName.includes('ramayana') || fileName.includes('rāmāyaṇa') || fileName.includes('mahabharata') || fileName.includes('mahābhārata') || fileName.includes('valmiki')) {
      console.log(`✅ Filename-based classification: EPIC (Epic detected)`);
      return {
        textType: GretilTextType.EPIC,
        confidence: 'HIGH',
        method: 'filename-epic'
      };
    }
    
    if (fileName.includes('purana') || fileName.includes('purāṇa')) {
      console.log(`✅ Filename-based classification: NARRATIVE (Purana detected)`);
      return {
        textType: GretilTextType.NARRATIVE,
        confidence: 'HIGH',
        method: 'filename-purana'
      };
    }
    
    // SECONDARY: Content-based classification as fallback
    console.log(`⚠️ Filename classification failed, trying content-based classification...`);
    const contentClassification = gretilTextTypeClassifier.classifyText(filename, content);
    
    return {
      textType: contentClassification.textType,
      confidence: contentClassification.confidence,
      method: 'content-fallback'
    };
  }

  private classifyTextType(content: string): GretilMetadata['textType'] {
    if (!content || typeof content !== 'string') return 'other';

    const title = this.extractTitleFromContent(content)?.toLowerCase() || '';

    // Use filename-based classification if available
    if (this.currentFileName) {
      const fileName = this.currentFileName.toLowerCase();
      if (fileName.includes('veda') || fileName.includes('ṛgveda') || fileName.includes('sāmaveda') || fileName.includes('yajurveda')) {
        return 'veda';
      }
      if (fileName.includes('upanishad') || fileName.includes('upaniṣad')) {
        return 'upanishad';
      }
      if (fileName.includes('purana') || fileName.includes('purāṇa')) {
        return 'purana';
      }
      if (fileName.includes('ramayana') || fileName.includes('rāmāyaṇa') || fileName.includes('mahabharata') || fileName.includes('mahābhārata')) {
        return 'epic';
      }
      if (fileName.includes('gita') || fileName.includes('gītā')) {
        return 'gita';
      }
    }

    // Fallback to content-based classification
    if (title.includes('veda') || title.includes('ṛgveda') || title.includes('sāmaveda') || title.includes('yajurveda')) {
      return 'veda';
    }
    if (title.includes('upanishad') || title.includes('upaniṣad')) {
      return 'upanishad';
    }
    if (title.includes('purana') || title.includes('purāṇa')) {
      return 'purana';
    }
    if (title.includes('ramayana') || title.includes('rāmāyaṇa') || title.includes('mahabharata') || title.includes('mahābhārata')) {
      return 'epic';
    }
    if (title.includes('gita') || title.includes('gītā')) {
      return 'gita';
    }

    return 'other';
  }

  private detectCommentary(content: string): boolean {
    if (!content || typeof content !== 'string') return false;

    const commentaryIndicators = [
      'commentary',
      'ṭīkā',
      'bhāṣya',
      'vyākhyā',
      'explained',
      'interpretation',
      'according to'
    ];

    const lowerContent = content.toLowerCase();
    return commentaryIndicators.some(indicator => lowerContent.includes(indicator));
  }

  private extractTimePeriod(title: string, content: string): string | undefined {
    if (!title && !content) return undefined;

    const searchText = (title + ' ' + content.substring(0, 1000)).toLowerCase();

    const timeIndicators = [
      { pattern: /vedic period|vedic age/i, period: 'Vedic Period' },
      { pattern: /upanishadic period/i, period: 'Upanishadic Period' },
      { pattern: /epic period/i, period: 'Epic Period' },
      { pattern: /puranic period/i, period: 'Puranic Period' },
      { pattern: /ancient india/i, period: 'Ancient India' },
      { pattern: /classical period/i, period: 'Classical Period' }
    ];

    for (const indicator of timeIndicators) {
      if (indicator.pattern.test(searchText)) {
        return indicator.period;
      }
    }

    return undefined;
  }

  private detectCitationFormat(content: string): string {
    if (!content || typeof content !== 'string') return 'unknown';

    const firstLines = content.split('\n').slice(0, 50);
    const referenceLine = firstLines.find(line => line.includes('//'));

    if (!referenceLine) return 'unknown';

    if (referenceLine.includes('Ram_')) return 'ramayana';
    if (referenceLine.includes('RvKh_')) return 'veda-khila';
    if (referenceLine.includes('chup_')) return 'upanishad';
    if (referenceLine.includes('bhg ')) return 'gita';
    if (referenceLine.includes('ap_')) return 'purana';

    return 'custom';
  }

  private extractRandomStanzaWithMetadata(content: string, fileName: string, metadata?: GretilMetadata | null): ExtractedWisdom | null {
    console.log(`🚀🚀🚀 EXTRACT_RANDOM_STANZA_WITH_METADATA STARTED for ${fileName} 🚀🚀🚀`);
    console.log(`📊 Metadata received:`, metadata ? 'YES' : 'NO');

    if (metadata) {
      console.log(`📋 Metadata details:`, {
        title: metadata.title,
        textType: metadata.textType,
        citationFormat: metadata.citationFormat
      });
    }

    try {
      // Skip header section and find text content
      const lines = content.split('\n');

      // Debug: Check what lines contain text markers
      const textMarkers = lines.filter(line => line.includes('# Text') || line.includes('## Text'));
      console.log(`🔍 DEBUG: Found text markers:`, textMarkers);

      const textStartIndex = Math.max(
        lines.findIndex(line => line.includes('# Text')),
        lines.findIndex(line => line.includes('## Text')),
        lines.findIndex(line => line.trim() === 'oṃ' || line.includes('oṃ '))
      ) + 1;

      console.log(`📍 Text start index: ${textStartIndex}`);
      console.log(`📄 Lines around text marker:`, lines.slice(Math.max(0, textStartIndex - 5), Math.min(lines.length, textStartIndex + 10)));

      if (textStartIndex <= 0) {
        console.log(`❌ No text section found in ${fileName}`);
        return this.extractMeaningfulParagraph(lines, fileName, metadata);
      }

      const textLines = lines.slice(textStartIndex);
      console.log(`📖 Text lines to process: ${textLines.length}`);
      console.log(`📝 First 10 text lines:`, textLines.slice(0, 10));

      // Find verses/stanzas with references or meaningful Sanskrit content
      const verses: { text: string; reference: string; index: number; verseRef?: VerseReference }[] = [];

      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i].trim();

        // Skip empty lines, comments, and headers
        if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('--')) {
          continue;
        }

        // Check for Sanskrit content
        const hasSanskrit = this.hasSanskritContent(line);
        if (hasSanskrit) {
          const verseReference = this.extractVerseReference(line);
          const verseText = this.extractVerseText(line);

          // CRITICAL: Only accept clean, digestible content (2-3 verses max)
          if (verseText && verseText.length > 15 && verseText.length < 300) {
            let reference = verseReference ?
              `${metadata?.title || fileName} - ${verseReference.fullReference}` :
              `Line ${i + textStartIndex}`;

            verses.push({
              text: verseText,
              reference: reference,
              index: i,
              verseRef: verseReference || undefined
            });
          }
        }
      }

      console.log(`📊 Found ${verses.length} verses in ${fileName}`);

      if (verses.length === 0) {
        console.log(`❌ No verses found, using fallback for ${fileName}`);
        return this.extractMeaningfulParagraph(textLines, fileName, metadata);
      }

      // CRITICAL FIX: True random content selection with timestamp-based seeding
      const timestamp = Date.now();
      const seed = timestamp % 1000000; // Use timestamp as seed for better randomization
      const randomIndex = Math.floor((Math.random() * seed) % verses.length);
      const randomVerse = verses[randomIndex];
      const source = this.categorizeGretilText(fileName);
      
      console.log('🎲 ENHANCED Random line selection details:');
      console.log('  Total verses available:', verses.length);
      console.log('  Random seed used:', seed);
      console.log('  Random index selected:', randomIndex);
      console.log('  Selected verse reference:', randomVerse.reference);
      console.log('  Selected verse index:', randomVerse.index);
      console.log('  Raw extracted content preview:', randomVerse.text.substring(0, 100));
      console.log('  Content length:', randomVerse.text.length, 'characters');
      console.log('  Selection timestamp:', new Date().toISOString());
      console.log('  Randomization method: timestamp-seeded');


      const result = {
        sanskrit: randomVerse.text,
        reference: randomVerse.reference,
        textName: metadata?.title || source?.displayName || fileName,
        category: metadata?.textType ? this.mapTextTypeToCategory(metadata.textType) : source?.category || 'Sacred Texts',
        estimatedVerses: verses.length,
        metadata: metadata || undefined
      };

      console.log(`✅ extractRandomStanzaWithMetadata() returning:`, {
        textName: result.textName,
        category: result.category,
        hasMetadata: !!result.metadata,
        metadataTitle: result.metadata?.title
      });
      console.log(`🎯🎯🎯 FINAL RESULT: Chapter/Verse will be: ${result.reference} 🎯🎯🎯`);

      return result;
    } catch (error) {
      console.error(`❌ Error in extractRandomStanzaWithMetadata for ${fileName}:`, error);
      return this.extractMeaningfulParagraph(content.split('\n'), fileName, metadata);
    }
  }

  private mapTextTypeToCategory(textType: string): string {
    const categoryMap: Record<string, string> = {
      'veda': 'Vedas',
      'upanishad': 'Upanishads',
      'purana': 'Puranas',
      'epic': 'Epics',
      'gita': 'Philosophical Texts',
      'other': 'Sacred Texts'
    };
    return categoryMap[textType] || 'Sacred Texts';
  }

  private extractWisdomFromGretilSourceFallback(sourceName: string): Promise<ExtractedWisdom | null> {
    // Use the original extraction logic as fallback
    return this.extractWisdomFromGretilSourceOriginal(sourceName);
  }

  private async extractWisdomFromGretilSourceOriginal(sourceName: string): Promise<ExtractedWisdom | null> {
    try {
      const storage = this.initializeStorage();
      const filePath = `${this.gretilFolder}/${sourceName}`;
      const file = storage.bucket(this.bucketName).file(filePath);

      const [content] = await file.download();
      const textContent = content.toString('utf-8');

      return this.extractRandomStanza(textContent, sourceName);
    } catch (error) {
      console.error(`Fallback extraction failed for ${sourceName}:`, error);
      return null;
    }
  }

  private extractRandomStanza(content: string, fileName: string): ExtractedWisdom | null {
    console.log(`🔍 DEBUG extractRandomStanza for ${fileName}:`);

    // Skip header section and find text content
    const lines = content.split('\n');
    console.log(`📄 Total lines in file: ${lines.length}`);

    const textStartIndex = Math.max(
      lines.findIndex(line => line.includes('# Text')),
      lines.findIndex(line => line.includes('## Text')),
      lines.findIndex(line => line.trim() === 'oṃ' || line.includes('oṃ '))
    ) + 1;

    // Write debug info to file
    const fs = require('fs');
    const debugInfo: any = {
      fileName,
      timestamp: new Date().toISOString(),
      totalLines: content.split('\n').length,
      firstLines: content.split('\n').slice(0, 15),
      hasReference: false,
      patterns: [],
      textStartIndex: textStartIndex,
      versesFound: 0,
      verses: []
    };

    console.log(`📍 Text start index: ${textStartIndex}`);
    console.log(`📝 First 10 lines of file:`, lines.slice(0, 10));

    debugInfo.textStartIndex = textStartIndex;

    if (textStartIndex <= 0) {
      console.log(`No text section found in ${fileName}`);
      return this.extractMeaningfulParagraph(lines, fileName);
    }

    const textLines = lines.slice(textStartIndex);
    console.log(`📖 Text lines to process: ${textLines.length}`);
    console.log(`📝 First 5 text lines:`, textLines.slice(0, 5));

    // Find verses/stanzas with references or meaningful Sanskrit content
    const verses: { text: string; reference: string; index: number }[] = [];

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i].trim();

      // Skip empty lines, comments, and headers
      if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('--')) continue;

      // Check for Sanskrit content (contains Devanagari-related characters or long Sanskrit text)
      const hasSanskrit = this.hasSanskritContent(line);
      if (hasSanskrit) {
        const reference = this.extractReference(line);
        const verseText = this.extractVerseText(line);

        // Only log first few lines to avoid spam
        if (i < 5 || reference) {
          console.log(`🔍 Line ${i + textStartIndex}:`, {
            original: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
            hasSanskrit,
            reference,
            verseText: verseText?.substring(0, 50) + (verseText && verseText.length > 50 ? '...' : ''),
            verseTextLength: verseText?.length
          });
        }

        if (verseText && verseText.length > 15) {
          verses.push({
            text: verseText,
            reference: reference || `Line ${i + textStartIndex}`,
            index: i
          });
        }
      }
    }

    console.log(`Found ${verses.length} verses in ${fileName}`);

    // Write debug info to file
    debugInfo.versesFound = verses.length;
    debugInfo.verses = verses.slice(0, 3); // First 3 verses

    try {
      require('fs').writeFileSync(`./debug-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.json`, JSON.stringify(debugInfo, null, 2));
    } catch (e) {
      console.log('Debug file write error:', (e as Error).message);
    }

    if (verses.length === 0) {
      console.log(`No verses found, using fallback for ${fileName}`);
      return this.extractMeaningfulParagraph(textLines, fileName, undefined);
    }

    // Select random verse
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    const source = this.categorizeGretilText(fileName);

    return {
      sanskrit: randomVerse.text,
      reference: randomVerse.reference,
      textName: source?.displayName || fileName,
      category: source?.category || 'Sacred Texts',
      estimatedVerses: verses.length
    };
  }
  
  private hasSanskritContent(line: string): boolean {
    // Check for Sanskrit/Devanagari characters and meaningful content
    const sanskritPatterns = [
      /[āīūṛḷēōṃḥśṣṇṭḍṅñ]/,  // IAST characters
      /\b(om|oṃ|atha|iti|ca|vai|hi|tu|api|eva|na|te|sa|tad|yad|kim)\b/i,  // Common Sanskrit words
      /.{30,}/  // Lines longer than 30 characters (likely to be meaningful content)
    ];
    
    const result = sanskritPatterns.some(pattern => pattern.test(line));
    
    // Debug: log pattern matching for problematic lines
    if (line.length > 20) {
      console.log(`🔍 hasSanskritContent for "${line.substring(0, 50)}...":`, {
        hasIAST: /[āīūṛḷēōṃḥśṣṇṭḍṅñ]/.test(line),
        hasSanskritWords: /\b(om|oṃ|atha|iti|ca|vai|hi|tu|api|eva|na|te|sa|tad|yad|kim)\b/i.test(line),
        isLongEnough: /.{30,}/.test(line),
        result: result
      });
    }
    
    return result;
  }
  
  private extractMeaningfulParagraph(lines: string[], fileName: string, metadata?: GretilMetadata | null): ExtractedWisdom | null {
    // Find substantial content as fallback
    const meaningfulLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 20 &&
             !trimmed.startsWith('#') &&
             !trimmed.startsWith('//') &&
             !trimmed.startsWith('--') &&
             (this.hasSanskritContent(trimmed) || /[a-zA-Z]/.test(trimmed));
    });

    if (meaningfulLines.length === 0) {
      console.log(`No meaningful content found in ${fileName}`);
      return null;
    }

    const randomLine = meaningfulLines[Math.floor(Math.random() * meaningfulLines.length)];
    const source = this.categorizeGretilText(fileName);

    return {
      sanskrit: randomLine.trim(),
      reference: 'General Passage',
      textName: metadata?.title || source?.displayName || fileName,
      category: metadata?.textType ? this.mapTextTypeToCategory(metadata.textType) : source?.category || 'Sacred Texts',
      estimatedVerses: meaningfulLines.length,
      metadata: metadata || undefined
    };
  }
  

  private hasReference(line: string): boolean {
    // Check for various reference patterns found in samples
    const patterns = [
      /ap_\d+\.\d+/,          // Agni Purana: ap_1.001ab
      /LiP_\d+,\d+\.\d+/,     // Linga Purana: LiP_1,106.6
      /bhg \d+\.\d+/,         // Bhagavad Gita: bhg 1.1
      /chup_\d+,\d+\.\d+/,    // Chandogya: chup_1,1.1
      /RvKh_\d+,\d+\.\d+/,    // Rig Veda Khila: RvKh_1,1.1
      /Ram_\d+,\d+\.\d+/      // Ramayana: Ram_2,1.1
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private extractReference(line: string): string | null {
    console.log('🆕 Using enhanced parseLogicalUnit for reference extraction');
    const referencePatterns = [
      /ap_\d+\.\d+[a-z]*/,
      /LiP_\d+,\d+\.\d+/,
      /bhg \d+\.\d+/,
      /chup_\d+,\d+\.\d+/,
      /RvKh_\d+,\d+\.\d+/,
      /Ram_\d+,\d+\.\d+/
    ];
    
    // Debug: Check if line contains any potential reference-like patterns
    const hasNumberPattern = /\d+[\.,]\d+/.test(line);
    const hasUnderscorePattern = /[a-z]+_\d+/.test(line);
    
    for (const pattern of referencePatterns) {
      const match = line.match(pattern);
      if (match) {
        console.log(`📋 ✅ Found reference pattern:`, { 
          pattern: pattern.source, 
          match: match[0], 
          line: line.substring(0, 80) + '...'
        });
        return match[0];
      }
    }
    
    // Only log when there might be a pattern we're missing
    if (hasNumberPattern || hasUnderscorePattern) {
      console.log(`📋 ❌ No pattern matched but found potential reference in: "${line.substring(0, 80)}..."`, {
        hasNumberPattern,
        hasUnderscorePattern,
        availablePatterns: referencePatterns.map(p => p.source)
      });
    }
    
    return null;
  }

  // UNIVERSAL EXTRACTION METHOD using hardcoded scripture patterns
  private extractVerseText(line: string): string | null {
    if (!this.currentFileName) {
      console.error('❌ No current file name available for pattern extraction');
      return line.replace(/\/\/.*$/g, '').replace(/\|\|.*$/g, '').trim();
    }
    
    try {
      // Use scripture-specific patterns for guaranteed clean extraction
      const cleanText = this.scripturePatternService.extractVerseText(line, this.currentFileName);
      return cleanText.length > 10 ? cleanText : null;
    } catch (error) {
      console.error('Error in scripture pattern extractVerseText:', error);
      // Ultimate fallback: basic cleaning
      return line.replace(/\/\/.*$/g, '').replace(/\|\|.*$/g, '').trim();
    }
  }

  // Helper method for metadata extraction using new parseLogicalUnit
  private extractMetadataFromParsedUnit(line: string): any {
    try {
      const parsed = this.parseLogicalUnit(line);
      return {
        source: parsed.metadata.source,
        chapter: parsed.metadata.chapter,
        section: parsed.metadata.section,
        reference: parsed.metadata.reference,
        boundaries: parsed.boundaries
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return null;
    }
  }

  // BOUNDARY-BASED EXTRACTION - Uses shared boundary extractor
  private parseLogicalUnit(rawText: string): ParsedLogicalUnit {
    console.log('🔍 Using shared boundary extractor for parseLogicalUnit');
    
    const result = BoundaryExtractor.extractVerse(rawText);
    
    return {
      cleanText: result.cleanText,
      metadata: result.metadata,
      boundaries: result.boundaries
    };
  }


  // Test function for debugging (can be removed in production)
  private testParseLogicalUnit(): void {
    console.log('🧪 Testing Universal parseLogicalUnit with scripture samples...\n');
    
    // Test Case 1: Markandya Purana (the failing case)
    const markandyaSample = `yat pakșiņaste vijñānamāpuratyantadurlabham // markp_1.24 // tiryagyonyām yadi bhavasteşām jñānam kuto 'bhavat / kathañca droņatanayāḥ procyante te patatriņah // markp_1.25 //`;
    console.log('📖 Test 1 - Markandya Purana Sample:');
    const result1 = this.parseLogicalUnit(markandyaSample);
    console.log('Result:', result1);
    
    // Test Case 2: Ramayana with comment format
    const ramayanaSample = `teṣām api mahātejā rāmo // Ram_2,1.10 gate ca bharate rāmo // Ram_2,1.11`;
    console.log('📖 Test 2 - Ramayana Sample:');
    const result2 = this.parseLogicalUnit(ramayanaSample);
    console.log('Result:', result2);
    
    // Test Case 3: New format test
    const newFormatSample = `some text // newtext_3.5 // more text // another_1.2 //`;
    console.log('📖 Test 3 - New Format Sample:');
    const result3 = this.parseLogicalUnit(newFormatSample);
    console.log('Result:', result3);
    
    console.log('✅ Universal test completed!');
  }

}

export const gretilWisdomService = new GretilWisdomService();
