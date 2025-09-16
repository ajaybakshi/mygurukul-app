/**
 * Boundary-Based Verse Extractor
 * Shared utility for extracting clean Sanskrit text using verse markers as boundaries
 * This replaces the old pattern-based extraction with boundary-based extraction
 */

export interface VerseMarker {
  fullMatch: string;
  textAbbreviation: string;
  numbers: string[];
  patternType: number;
  position: number;
  endPosition: number;
}

export interface ExtractedVerse {
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

export class BoundaryExtractor {
  
  /**
   * Extract clean Sanskrit text using verse markers as boundaries
   * This is the core boundary-based extraction logic
   */
  static extractVerse(rawText: string): ExtractedVerse {
    console.log('🔍 Boundary-based extraction input:', rawText.substring(0, 200) + '...');
    
    // 1. UNIVERSAL VERSE MARKER PATTERNS - Covers ALL possible formats including Sanskrit
    const universalPatterns = [
      // Pattern 1: Comment-style with optional slashes: // Ram_2,1.10 // or // kūrmp_1,1.23 //
      /(?:\/\/\s*)?([a-zA-Zāīūṛśṣṭḍṇṅñḥṃ]+)_(\d+)(?:,(\d+))?\.(\d+)([a-z]*)?(?:\s*\/\/)?/g,
      
      // Pattern 2: Pipe delimiters: || chup_1,1.3 || or | text |
      /(?:\|\|\s*)?([a-zA-Zāīūṛśṣṭḍṇṅñḥṃ]+)_(\d+)(?:,(\d+))?\.(\d+)([a-z]*)?(?:\s*\|\|)?/g,
      
      // Pattern 3: Space-separated: bhg 1.2 or verses 1.24
      /([a-zA-Zāīūṛśṣṭḍṇṅñḥṃ]+)\s+(\d+)\.(\d+)([a-z]*)?/g,
      
      // Pattern 4: Slash-enclosed: /ap_10.029ab/ or /text_1.5/
      /\/([a-zA-Zāīūṛśṣṭḍṇṅñḥṃ]+)_(\d+)(?:,(\d+))?\.(\d+)([a-z]*)?\/*/g,
      
      // Pattern 5: Standalone markers: markp_1.24 or ram_2.10
      /\b([a-zA-Zāīūṛśṣṭḍṇṅñḥṃ]+)_(\d+)(?:,(\d+))?\.(\d+)([a-z]*)?/g
    ];

    // 2. EXTRACT ALL VERSE MARKERS using Universal Pattern Detection
    const foundMarkers: VerseMarker[] = [];
    
    universalPatterns.forEach((pattern, patternIndex) => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(rawText)) !== null) {
        const [fullMatch, textAbbrev, num1, num2, num3, subVerse] = match;
        
        // Skip if this looks like regular text, not a verse marker
        if (this.isValidVerseMarker(textAbbrev, num1, num2, num3)) {
          foundMarkers.push({
            fullMatch: fullMatch,
            textAbbreviation: textAbbrev,
            numbers: [num1, num2, num3, subVerse].filter(Boolean),
            patternType: patternIndex + 1,
            position: match.index,
            endPosition: match.index + fullMatch.length
          });
          
          console.log(`✅ Found boundary marker:`, fullMatch, `(${textAbbrev}) at position`, match.index);
        }
      }
    });

    // 3. REMOVE DUPLICATES - prefer longer matches (more complete markers)
    const seen = new Set();
    const uniqueMarkers = foundMarkers
      .sort((a, b) => b.fullMatch.length - a.fullMatch.length) // Sort by length descending
      .filter(marker => {
        const key = `${marker.position}_${marker.endPosition}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.position - b.position); // Then sort by position
    
    console.log('📊 Unique boundary markers found:', uniqueMarkers.length);

    // 4. BOUNDARY-BASED TEXT EXTRACTION - Extract text between consecutive markers
    let cleanText = '';
    let metadata = {
      source: 'Sacred Text',
      chapter: 'Sacred Chapter', 
      section: 'Sacred Section',
      reference: 'Unknown'
    };

    if (uniqueMarkers.length >= 2) {
      // Find the first two different markers (not overlapping)
      let startMarker = uniqueMarkers[0];
      let endMarker = null;
      
      for (let i = 1; i < uniqueMarkers.length; i++) {
        if (uniqueMarkers[i].position > startMarker.endPosition) {
          endMarker = uniqueMarkers[i];
          break;
        }
      }
      
      if (endMarker) {
        const startPos = startMarker.endPosition;
        const endPos = endMarker.position;
        
        cleanText = rawText.substring(startPos, endPos)
          .replace(/\/\/+/g, '')           // Remove extra slashes
          .replace(/\|\|+/g, '')          // Remove extra pipes  
          .replace(/^\s*start\s+/gm, '')  // Remove "start" keywords
          .replace(/^\s*\d+\s+/gm, '')    // Remove standalone line numbers
          .replace(/\s{2,}/g, ' ')        // Normalize multiple spaces
          .trim();

        // Generate metadata from the first marker
        metadata = this.generateUniversalMetadata(startMarker);
        
        console.log(`🎯 Extracted text between boundaries: "${startMarker.fullMatch}" and "${endMarker.fullMatch}"`);
        console.log(`📏 Text length: ${cleanText.length} characters`);
      } else {
        // Fallback to single marker
        cleanText = rawText.substring(startMarker.endPosition)
          .replace(/\/\/+/g, '')
          .replace(/\|\|+/g, '')
          .replace(/^\s*start\s+/gm, '')
          .replace(/^\s*\d+\s+/gm, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        metadata = this.generateUniversalMetadata(startMarker);
        
        console.log(`🎯 Extracted text after single marker: "${startMarker.fullMatch}"`);
      }
    } else if (uniqueMarkers.length === 1) {
      // Single marker - extract text after it
      const marker = uniqueMarkers[0];
      cleanText = rawText.substring(marker.endPosition)
        .replace(/\/\/+/g, '')
        .replace(/\|\|+/g, '')
        .replace(/^\s*start\s+/gm, '')
        .replace(/^\s*\d+\s+/gm, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      metadata = this.generateUniversalMetadata(marker);
      
      console.log(`🎯 Extracted text after single marker: "${marker.fullMatch}"`);
    } else {
      // No markers found - fallback to original cleaning
      cleanText = rawText
        .replace(/\/\/+/g, '')
        .replace(/\|\|+/g, '')
        .replace(/^\s*start\s+/gm, '')
        .replace(/^\s*\d+\s+/gm, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      console.log(`⚠️ No boundary markers found, using fallback cleaning`);
    }

    console.log('🧹 Final cleaned text length:', cleanText.length);

    // 5. BOUNDARY DETECTION
    const boundaries = {
      startVerse: uniqueMarkers[0]?.fullMatch || '',
      endVerse: uniqueMarkers[1]?.fullMatch || undefined
    };

    return {
      cleanText,
      metadata,
      boundaries
    };
  }

  // Helper: Validate if detected pattern is actually a verse marker
  private static isValidVerseMarker(abbrev: string, num1: string, num2?: string, num3?: string): boolean {
    // Sanskrit text abbreviations are typically 2-8 characters
    if (!abbrev || abbrev.length < 2 || abbrev.length > 8) return false;
    
    // Must have meaningful numeric structure
    if (!num1 || parseInt(num1) < 1 || parseInt(num1) > 999) return false;
    
    // If has chapter/section numbers, validate them
    if (num2 && (parseInt(num2) < 1 || parseInt(num2) > 999)) return false;
    if (num3 && (parseInt(num3) < 1 || parseInt(num3) > 999)) return false;
    
    return true;
  }

  // Helper: Generate metadata from any verse marker using universal logic
  private static generateUniversalMetadata(marker: VerseMarker): any {
    const abbrev = marker.textAbbreviation;
    const [num1, num2, num3, subVerse] = marker.numbers;
    
    // Map common abbreviations to full names (expandable)
    const sourceMap: { [key: string]: string } = {
      'Ram': 'Ramayana', 'ram': 'Ramayana',
      'RvKh': 'Rig Veda Khila', 'rv': 'Rig Veda', 'rvkh': 'Rig Veda Khila',
      'chup': 'Chandogya Upanishad', 'chupbh': 'Chandogya Upanishad',
      'bhg': 'Bhagavad Gita', 'gita': 'Bhagavad Gita',
      'ap': 'Agni Purana', 'agni': 'Agni Purana',
      'garp': 'Garuda Purana', 'garuda': 'Garuda Purana',
      'markp': 'Markandya Purana', 'mark': 'Markandya Purana',
      'vishp': 'Vishnu Purana', 'shivp': 'Shiva Purana',
      'brahmap': 'Brahmanda Purana', 'skandp': 'Skanda Purana',
      'kūrmp': 'Kurma Purana', 'kurmp': 'Kurma Purana'
    };
    
    // Get full source name or create readable version from abbreviation
    const sourceName = sourceMap[abbrev.toLowerCase()] || 
                       this.humanizeAbbreviation(abbrev);
    
    // Generate intelligent chapter/section names based on structure
    let chapter, section;
    
    if (num3) {
      // 3-part structure: abbrev_X,Y.Z (book, chapter, verse)
      chapter = `Book ${num1}`;
      section = `Chapter ${num2}, Verse ${num3}${subVerse || ''}`;
    } else if (num2) {
      // 2-part structure: abbrev_X.Y (chapter, verse)  
      chapter = `Chapter ${num1}`;
      section = `Verse ${num2}${subVerse || ''}`;
    } else {
      // 1-part structure: abbrev_X (verse only)
      chapter = sourceName;
      section = `Verse ${num1}${subVerse || ''}`;
    }
    
    return {
      source: sourceName,
      chapter: chapter,
      section: section,
      reference: marker.fullMatch.replace(/\/+|\|+/g, '').trim()
    };
  }

  // Helper: Convert abbreviation to human-readable name
  private static humanizeAbbreviation(abbrev: string): string {
    // Remove common suffixes and capitalize
    const cleaned = abbrev.replace(/p$/, '').replace(/_.*$/, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase() + ' Text';
  }
}
