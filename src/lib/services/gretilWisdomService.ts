import { Storage } from '@google-cloud/storage';

interface GretilWisdomSource {
  folderName: string;
  displayName: string;
  category: string;
  textType: 'purana' | 'gita' | 'upanishad' | 'veda' | 'epic';
}

interface ExtractedWisdom {
  sanskrit: string;
  reference: string;
  textName: string;
  category: string;
  estimatedVerses: number;
}

class GretilWisdomService {
  private storage: Storage | null = null;
  private bucketName: string = 'mygurukul-sacred-texts-corpus';
  private gretilFolder: string = 'Gretil_Originals';

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
    
    // Purana texts - handle clean filenames like "Agni_Purana.txt"
    if (name.includes('purana') || name === 'agni_purana') {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Puranas',
        textType: 'purana'
      };
    }
    
    // Bhagavad Gita - handle "Bhagvad_Gita.txt" or similar variants
    if (name.includes('bhagvad') || name.includes('gita') || name.includes('bhagavad') || name === 'bhagvad_gita') {
      return {
        folderName: fileName,
        displayName: 'Bhagavad Gita',
        category: 'Philosophical Texts',
        textType: 'gita'
      };
    }
    
    // Upanishads - handle "Chandogya_Upanishad.txt" etc.
    if (name.includes('upanishad') || name === 'chandogya_upanishad') {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Upanishads',
        textType: 'upanishad'
      };
    }
    
    // Vedas - handle various Veda file patterns
    if (name.includes('veda') || name.includes('rg_veda') || name.includes('khila') || name.includes('rig_veda')) {
      return {
        folderName: fileName,
        displayName: this.formatDisplayName(fileName),
        category: 'Vedas',
        textType: 'veda'
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
        textType: 'epic'
      };
    }
    
    // Default categorization for other texts
    return {
      folderName: fileName,
      displayName: this.formatDisplayName(fileName),
      category: 'Sacred Texts',
      textType: 'purana'
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
      
      const storage = this.initializeStorage();
      const filePath = `${this.gretilFolder}/${sourceName}`;
      console.log(`File path: ${filePath}`);
      
      const file = storage.bucket(this.bucketName).file(filePath);
      
      const [content] = await file.download();
      const textContent = content.toString('utf-8');
      
      console.log(`File size: ${textContent.length} characters`);
      console.log(`First 500 characters:`);
      console.log(textContent.substring(0, 500));
      console.log(`=== END PREVIEW ===`);
      
      const result = this.extractRandomStanza(textContent, sourceName);
      console.log(`Extraction result: ${result ? 'SUCCESS' : 'NULL'}`);
      
      return result;
      
    } catch (error) {
      console.error(`=== ERROR in extraction from ${sourceName}:`, error);
      return null;
    }
  }
  

  private extractRandomStanza(content: string, fileName: string): ExtractedWisdom | null {
    console.log(`🔍 DEBUG extractRandomStanza for ${fileName}:`);
    
    // Write debug info to file
    const fs = require('fs');
    const debugInfo = {
      fileName,
      timestamp: new Date().toISOString(),
      totalLines: content.split('\n').length,
      firstLines: content.split('\n').slice(0, 15),
      hasReference: false,
      patterns: []
    };
    
    // Skip header section and find text content
    const lines = content.split('\n');
    console.log(`📄 Total lines in file: ${lines.length}`);
    
    const textStartIndex = Math.max(
      lines.findIndex(line => line.includes('# Text')),
      lines.findIndex(line => line.includes('## Text')),
      lines.findIndex(line => line.trim() === 'oṃ' || line.includes('oṃ '))
    ) + 1;
    
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
      console.log('Debug file write error:', e.message);
    }
    
    if (verses.length === 0) {
      console.log(`No verses found, using fallback for ${fileName}`);
      return this.extractMeaningfulParagraph(textLines, fileName);
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
  
  private extractMeaningfulParagraph(lines: string[], fileName: string): ExtractedWisdom | null {
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
      textName: source?.displayName || fileName,
      category: source?.category || 'Sacred Texts',
      estimatedVerses: meaningfulLines.length
    };
  }
  

  private hasReference(line: string): boolean {
    // Check for various reference patterns found in samples
    const patterns = [
      /ap_\d+\.\d+/,          // Agni Purana: ap_1.001ab
      /bhg \d+\.\d+/,         // Bhagavad Gita: bhg 1.1  
      /chup_\d+,\d+\.\d+/,    // Chandogya: chup_1,1.1
      /RvKh_\d+,\d+\.\d+/,    // Rig Veda Khila: RvKh_1,1.1
      /Ram_\d+,\d+\.\d+/      // Ramayana: Ram_2,1.1
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private extractReference(line: string): string | null {
    const referencePatterns = [
      /ap_\d+\.\d+[a-z]*/,
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

  private extractVerseText(line: string): string | null {
    // Remove reference and extract Sanskrit text
    const cleanLine = line
      .replace(/\/\/.*$/, '')  // Remove end comments
      .replace(/\|\|.*$/, '')  // Remove verse endings
      .replace(/ap_\d+\.\d+[a-z]*\/?\s*/, '')
      .replace(/bhg \d+\.\d+\s*/, '')
      .replace(/chup_\d+,\d+\.\d+\s*\|\|\s*/, '')
      .replace(/RvKh_\d+,\d+\.\d+\s*/, '')
      .replace(/Ram_\d+,\d+\.\d+\s*/, '')
      .trim();
    
    return cleanLine.length > 10 ? cleanLine : null;
  }

}

export const gretilWisdomService = new GretilWisdomService();
