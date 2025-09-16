/**
 * Philosophical Logical Unit Extractor - Phase 3: Multi-Text-Type Extraction
 * Specialized extractor for philosophical texts like Upanishads, Gita, Sutras
 * Identifies and extracts complete philosophical units (commentary sections, teaching units)
 */

import { GretilTextType } from '../../../types/gretil-types';
import { BoundaryExtractor } from '../boundaryExtractor';
import { ScripturePatternService } from '../scripturePatternService';

export interface PhilosophicalUnit {
  sanskrit: string;
  reference: string;
  teachingType: 'commentary' | 'dialogue' | 'teaching' | 'explanation';
  speaker?: string;
  addressee?: string;
  verses: string[];
  verseRange: {
    start: string;
    end: string;
    count: number;
  };
  context: {
    book?: number;
    chapter?: number;
    section?: string;
    philosophicalConcept?: string;
  };
}

export interface PhilosophicalExtractionOptions {
  minVerses: number; // Minimum verses for a philosophical unit
  maxVerses: number; // Maximum verses for a philosophical unit
  preferCommentary: boolean; // Prioritize commentary sequences
  includeDialogue: boolean; // Include teacher-student dialogues
  focusOnConcepts: boolean; // Group by philosophical concepts
}

export class PhilosophicalLogicalUnitExtractor {
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
  }

  private readonly DEFAULT_OPTIONS: PhilosophicalExtractionOptions = {
    minVerses: 2,
    maxVerses: 6,
    preferCommentary: true,
    includeDialogue: true,
    focusOnConcepts: true
  };

  /**
   * Extract a philosophical teaching unit from Upanishadic content
   * This method works on raw content and tries to find philosophical patterns
   */
  extractLogicalUnit(content: string, filename: string, options: Partial<PhilosophicalExtractionOptions> = {}): PhilosophicalUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`📚 PhilosophicalLogicalUnitExtractor: Processing ${filename}`);
    console.log(`📊 Options: minVerses=${opts.minVerses}, maxVerses=${opts.maxVerses}, preferCommentary=${opts.preferCommentary}`);

    try {
      // Parse content into verses with references
      const verses = this.parsePhilosophicalVerses(content, filename);
      console.log(`📖 Found ${verses.length} philosophical verses in ${filename}`);

      if (verses.length < opts.minVerses) {
        console.log(`❌ Not enough verses for philosophical unit extraction (${verses.length} < ${opts.minVerses})`);
        return null;
      }

      // Try different extraction strategies in order of preference
      let unit: PhilosophicalUnit | null = null;

      // Strategy 1: Extract commentary sequence (highest priority for Upanishads)
      if (opts.preferCommentary) {
        unit = this.extractCommentarySequence(verses);
        if (unit) {
          console.log(`📝 Found commentary sequence: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 2: Extract teacher-student dialogue
      if (opts.includeDialogue) {
        unit = this.extractDialogueSequence(verses);
        if (unit) {
          console.log(`💬 Found philosophical dialogue: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 3: Extract concept-focused teaching unit
      if (opts.focusOnConcepts) {
        unit = this.extractConceptSequence(verses);
        if (unit) {
          console.log(`🎯 Found concept-focused sequence: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 4: Extract explanatory passage
      unit = this.extractExplanatorySequence(verses);
      if (unit) {
        console.log(`📖 Found explanatory sequence: ${unit.verses.length} verses`);
        return unit;
      }

      // Fallback: Extract a meaningful contiguous sequence
      unit = this.extractContiguousSequence(verses, opts);
      if (unit) {
        console.log(`🔗 Found contiguous philosophical sequence: ${unit.verses.length} verses`);
        return unit;
      }

      console.log(`❌ No suitable philosophical unit found in ${filename}`);
      return null;

    } catch (error) {
      console.error(`💥 Error extracting philosophical unit from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Parse philosophical content into individual verses with references
   * Handles both structured references (chup_4,1.1) and unstructured philosophical content
   */
  private parsePhilosophicalVerses(content: string, filename: string): Array<{ reference: string; text: string; lineNumber: number }> {
    const verses: Array<{ reference: string; text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    console.log(`📖 Parsing ${lines.length} lines for philosophical verses...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers and empty lines, but process comment lines that contain references
      if (!line || line.startsWith('#') || line.startsWith('--')) {
        continue;
      }

      let reference: string;
      let text: string;

      // Look for Upanishad reference patterns
      const upanishadPatterns = [
        // Chandogya Upanishad: chup_4,1.1
        /chup_(\d+),(\d+)\.(\d+)/i,
        // Taittiriya Upanishad: Taitt_1,1.1
        /Taitt_(\d+),(\d+)\.(\d+)/i,
        // Brihadaranyaka Upanishad: BU_1,1.1
        /BU_(\d+),(\d+)\.(\d+)/i,
        // Bhagavad Gita: bhg 4.1
        /bhg (\d+)\.(\d+)/i,
        // Katha Upanishad: KU_1,1.1
        /KU_(\d+),(\d+)\.(\d+)/i,
        // Isha Upanishad: IU_1.1
        /IU_(\d+)\.(\d+)/i,
        // Mandukya Upanishad: MU_1.1
        /MU_(\d+)\.(\d+)/i
      ];

      let foundPattern = false;
      for (const pattern of upanishadPatterns) {
        const match = line.match(pattern);
        if (match) {
          reference = match[0];
          text = this.extractVerseText(line, filename);
          foundPattern = true;
          break;
        }
      }

      if (!foundPattern) {
        // For unstructured philosophical content, create sequential references
        reference = `Verse_${i + 1}`;
        text = line;
      }

      if (text && text.length > 10) { // Only meaningful philosophical verses
        verses.push({
          reference,
          text,
          lineNumber: i + 1
        });
      }
    }

    console.log(`✅ Parsed ${verses.length} philosophical verses from content`);
    return verses;
  }

  /**
   * Extract commentary sequence (primary for Upanishads)
   */
  private extractCommentarySequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): PhilosophicalUnit | null {
    // Look for commentary markers in Sanskrit philosophical texts
    const commentaryMarkers = [
      /(?:iti|atha|evam|tatra|atra)/i,  // Structural markers
      /(?:śruti|smṛti|bāṣya|ṭīkā)/i,   // Commentary terms
      /(?:ukta|uktam|ākhyātam)/i,      // "It is said" type expressions
      /(?:jñānam|vidyā|brahmavidyā)/i, // Knowledge/wisdom terms
      /(?:upāsana|dhyāna|samādhi)/i    // Practice/meditation terms
    ];

    // CRITICAL FIX: Start from random position for true content diversity
    const startIndex = Math.floor(Math.random() * Math.max(1, verses.length - 10));
    console.log(`🎲 Random starting index for commentary search: ${startIndex} (out of ${verses.length} verses)`);
    
    // Find sequences with philosophical commentary markers starting from random position
    for (let i = startIndex; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasCommentary = commentaryMarkers.some(marker => marker.test(currentVerse.text));

      if (hasCommentary) {
        console.log(`📝 Found commentary marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        // Try to find the commentary boundary (next conceptual shift or section change)
        const commentaryVerses = [currentVerse];
        let j = i + 1;

        // Continue until we find a verse that doesn't seem part of the commentary
        while (j < verses.length && commentaryVerses.length < 6) {
          const nextVerse = verses[j];

          // Check if this verse continues the commentary
          const continuesCommentary = commentaryMarkers.some(marker => marker.test(nextVerse.text)) ||
                                    this.isCommentaryContinuation(currentVerse.text, nextVerse.text);

          if (continuesCommentary) {
            console.log(`📝 Adding commentary continuation: ${nextVerse.reference}`);
            commentaryVerses.push(nextVerse);
            j++;
          } else {
            console.log(`📝 Commentary boundary found at: ${nextVerse.reference}`);
            break;
          }
        }

        if (commentaryVerses.length >= 2) {
          console.log(`✅ Found commentary sequence: ${commentaryVerses.length} verses`);
          return this.createPhilosophicalUnit(commentaryVerses, 'commentary');
        }
      }
    }

    console.log(`❌ No commentary sequences found`);
    return null;
  }

  /**
   * Extract teacher-student dialogue sequence
   */
  private extractDialogueSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): PhilosophicalUnit | null {
    // Look for dialogue markers in philosophical texts
    const dialogueMarkers = [
      /(?:pṛcchati|pṛṣṭa|pṛṣṭavān)/i,  // Asks, asked
      /(?:pratyuvāca|pratyāha)/i,       // Replied
      /(?:uvāca|āha|prāha)/i,           // Said
      /(?:guru|ācārya|śiṣya)/i,         // Teacher/student terms
      /(?:kathayati|ākhyāti)/i          // Narrates/tells
    ];

    // CRITICAL FIX: Start from random position for true content diversity
    const startIndex = Math.floor(Math.random() * Math.max(1, verses.length - 10));
    console.log(`🎲 Random starting index for dialogue search: ${startIndex} (out of ${verses.length} verses)`);
    
    // Find sequences with dialogue markers starting from random position
    for (let i = startIndex; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasDialogue = dialogueMarkers.some(marker => marker.test(currentVerse.text));

      if (hasDialogue) {
        console.log(`💬 Found philosophical dialogue marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        const dialogueVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related dialogue verses
        while (j < verses.length && dialogueVerses.length < 5) {
          const nextVerse = verses[j];

          // Check if this continues the philosophical dialogue
          const continuesDialogue = dialogueMarkers.some(marker => marker.test(nextVerse.text)) ||
                                  this.isDialogueContinuation(currentVerse.text, nextVerse.text);

          if (continuesDialogue) {
            dialogueVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (dialogueVerses.length >= 2) {
          return this.createPhilosophicalUnit(dialogueVerses, 'dialogue');
        }
      }
    }

    return null;
  }

  /**
   * Extract concept-focused teaching sequence
   */
  private extractConceptSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): PhilosophicalUnit | null {
    // Look for philosophical concepts that should be grouped together
    const philosophicalConcepts = [
      /(?:brahman|ātman|paramātman)/i,  // Core concepts
      /(?:mokṣa|saṃsāra|karma)/i,       // Liberation/cycle/action
      /(?:jñāna|bhakti|karma)/i,        // Paths to liberation
      /(?:satya|dharma|ṛta)/i,          // Truth/righteousness/cosmic order
      /(?:prāṇa|cit|ānanda)/i          // Life force/consciousness/bliss
    ];

    // CRITICAL FIX: Start from random position for true content diversity
    const startIndex = Math.floor(Math.random() * Math.max(1, verses.length - 10));
    console.log(`🎲 Random starting index for concept search: ${startIndex} (out of ${verses.length} verses)`);
    
    // Find sequences that discuss related philosophical concepts starting from random position
    for (let i = startIndex; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const currentConcepts = philosophicalConcepts.filter(concept => concept.test(currentVerse.text));

      if (currentConcepts.length > 0) {
        const conceptVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting verses that discuss related concepts
        while (j < verses.length && conceptVerses.length < 4) {
          const nextVerse = verses[j];
          const nextConcepts = philosophicalConcepts.filter(concept => concept.test(nextVerse.text));

          // Check if this verse discusses related concepts
          const sharesConcepts = currentConcepts.some(concept =>
            nextConcepts.some(nextConcept => nextConcept.source === concept.source)
          );

          if (sharesConcepts || nextConcepts.length > 0) {
            conceptVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (conceptVerses.length >= 2) {
          return this.createPhilosophicalUnit(conceptVerses, 'teaching');
        }
      }
    }

    return null;
  }

  /**
   * Extract explanatory passage
   */
  private extractExplanatorySequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): PhilosophicalUnit | null {
    // Look for explanatory passages (verses with multiple philosophical terms)
    const explanatoryVerses = verses.filter(verse => {
      const philosophicalTerms = [
        'brahman', 'ātman', 'mokṣa', 'jñāna', 'bhakti', 'karma', 'dharma',
        'saṃsāra', 'prāṇa', 'cit', 'ānanda', 'satya', 'ṛta', 'vidyā'
      ];

      const termCount = philosophicalTerms.filter(term =>
        verse.text.toLowerCase().includes(term.toLowerCase())
      ).length;

      return verse.text.length > 40 && termCount >= 2; // Substantial length with multiple concepts
    });

    if (explanatoryVerses.length >= 2) {
      // Take a contiguous sequence of explanatory verses
      const startIndex = verses.indexOf(explanatoryVerses[0]);
      const sequence = verses.slice(startIndex, startIndex + Math.min(4, explanatoryVerses.length));

      return this.createPhilosophicalUnit(sequence, 'explanation');
    }

    return null;
  }

  /**
   * Extract contiguous sequence as fallback
   */
  private extractContiguousSequence(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    options: PhilosophicalExtractionOptions
  ): PhilosophicalUnit | null {
    if (verses.length < options.minVerses) return null;

    // Select a random starting point
    const maxStart = verses.length - options.minVerses;
    const startIndex = Math.floor(Math.random() * maxStart);
    const length = Math.min(
      options.maxVerses,
      Math.max(options.minVerses, verses.length - startIndex)
    );

    const sequence = verses.slice(startIndex, startIndex + length);
    return this.createPhilosophicalUnit(sequence, 'teaching');
  }

  /**
   * Check if a verse continues a commentary
   */
  private isCommentaryContinuation(prevText: string, currentText: string): boolean {
    // Simple heuristic: check for structural continuity in philosophical texts
    const structuralMarkers = /(?:iti|atha|tasmāt|tataḥ|evam|atra)/i;
    return structuralMarkers.test(currentText) ||
           this.sharePhilosophicalTerms(prevText, currentText);
  }

  /**
   * Check if a verse continues a philosophical dialogue
   */
  private isDialogueContinuation(prevText: string, currentText: string): boolean {
    // Check for dialogue continuity or teacher-student relationship
    const dialogueWords = /(?:guru|ācārya|śiṣya|uvāca|āha|prāha|pṛcchati)/i;
    return dialogueWords.test(prevText) && dialogueWords.test(currentText);
  }

  /**
   * Check if two verses share philosophical terms
   */
  private sharePhilosophicalTerms(text1: string, text2: string): boolean {
    // Extract potential philosophical terms
    const philosophicalTerms = [
      'brahman', 'ātman', 'mokṣa', 'jñāna', 'bhakti', 'karma', 'dharma',
      'saṃsāra', 'prāṇa', 'cit', 'ānanda', 'satya', 'ṛta', 'vidyā'
    ];

    const terms1 = philosophicalTerms.filter(term =>
      text1.toLowerCase().includes(term.toLowerCase())
    );
    const terms2 = philosophicalTerms.filter(term =>
      text2.toLowerCase().includes(term.toLowerCase())
    );

    // Check for overlap
    return terms1.some(term => terms2.includes(term));
  }

  /**
   * Extract clean verse text using scripture-specific patterns
   */
  private extractVerseText(line: string, scriptureFile: string): string {
    return this.scripturePatternService.extractVerseText(line, scriptureFile);
  }

  /**
   * Create a philosophical unit from verse sequence
   */
  private createPhilosophicalUnit(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    type: 'commentary' | 'dialogue' | 'teaching' | 'explanation'
  ): PhilosophicalUnit {
    // Parse the first reference to get context
    const firstRef = verses[0].reference;
    const upanishadPatterns = [
      /chup_(\d+),(\d+)\.(\d+)/i,
      /Taitt_(\d+),(\d+)\.(\d+)/i,
      /BU_(\d+),(\d+)\.(\d+)/i,
      /KU_(\d+),(\d+)\.(\d+)/i,
      /bhg (\d+)\.(\d+)/i,
      /IU_(\d+)\.(\d+)/i,
      /MU_(\d+)\.(\d+)/i
    ];

    let context = {};
    for (const pattern of upanishadPatterns) {
      const match = firstRef.match(pattern);
      if (match) {
        if (match.length >= 3) {
          context = {
            chapter: parseInt(match[1]),
            section: match[2]
          };
        }
        break;
      }
    }

    // Extract speaker if dialogue
    let speaker: string | undefined;
    let addressee: string | undefined;

    if (type === 'dialogue') {
      const speakerMatch = verses[0].text.match(/(\w+)(?:uvāca|āha|prāha)/i);
      if (speakerMatch) {
        speaker = speakerMatch[1];
      }
    }

    // Identify philosophical concept if possible
    let philosophicalConcept: string | undefined;
    const conceptPatterns = [
      { pattern: /brahman/i, concept: 'Brahman' },
      { pattern: /ātman/i, concept: 'Atman' },
      { pattern: /mokṣa/i, concept: 'Moksha' },
      { pattern: /jñāna/i, concept: 'Jnana' },
      { pattern: /bhakti/i, concept: 'Bhakti' },
      { pattern: /karma/i, concept: 'Karma Yoga' },
      { pattern: /dharma/i, concept: 'Dharma' }
    ];

    for (const { pattern, concept } of conceptPatterns) {
      if (verses.some(verse => pattern.test(verse.text))) {
        philosophicalConcept = concept;
        break;
      }
    }

    const lastVerseRef = verses[verses.length - 1].reference;
    let lastVerseNum: string;

    // Handle different reference formats to extract the last verse number
    const refPatterns = [
      /chup_\d+,\d+\.(\d+)/i,
      /Taitt_\d+,\d+\.(\d+)/i,
      /BU_\d+,\d+\.(\d+)/i,
      /KU_\d+,\d+\.(\d+)/i,
      /bhg \d+\.(\d+)/i,
      /IU_\d+\.(\d+)/i,
      /MU_\d+\.(\d+)/i,
      /Verse_(\d+)/i
    ];

    for (const pattern of refPatterns) {
      const match = lastVerseRef.match(pattern);
      if (match) {
        lastVerseNum = match[1];
        break;
      }
    }

    if (!lastVerseNum) {
      lastVerseNum = lastVerseRef;
    }

    return {
      sanskrit: verses.map(v => v.text).join(' '),
      reference: `${verses[0].reference}-${lastVerseNum}`,
      teachingType: type,
      speaker,
      addressee,
      verses: verses.map(v => v.text),
      verseRange: {
        start: verses[0].reference,
        end: verses[verses.length - 1].reference,
        count: verses.length
      },
      context: {
        ...context,
        philosophicalConcept
      }
    };
  }

  /**
   * Convert philosophical unit to standard ExtractedWisdom format
   */
  toExtractedWisdom(unit: PhilosophicalUnit, textName: string): {
    sanskrit: string;
    reference: string;
    textName: string;
    category: string;
    estimatedVerses: number;
    metadata?: any;
  } {
    return {
      sanskrit: unit.sanskrit,
      reference: `${textName} - ${unit.reference} (${unit.teachingType})`,
      textName,
      category: 'Upanishads',
      estimatedVerses: unit.verseRange.count,
      metadata: {
        textType: GretilTextType.PHILOSOPHICAL,
        philosophicalUnit: unit
      }
    };
  }

  /**
   * Extract logical units from already-processed verses
   * This is useful when integrating with existing extraction logic
   */
  extractFromVerses(
    verses: Array<{ text: string; reference: string }>,
    filename: string,
    options: Partial<PhilosophicalExtractionOptions> = {}
  ): PhilosophicalUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`📚 PhilosophicalLogicalUnitExtractor: Processing ${verses.length} pre-extracted verses from ${filename}`);

    if (verses.length < opts.minVerses) {
      console.log(`❌ Not enough verses for philosophical unit extraction (${verses.length} < ${opts.minVerses})`);
      return null;
    }

    // Convert to internal verse format
    const internalVerses = verses.map((v, i) => ({
      reference: v.reference,
      text: v.text,
      lineNumber: i + 1
    }));

    // Try commentary extraction first
    if (opts.preferCommentary) {
      const commentaryUnit = this.extractCommentarySequence(internalVerses);
      if (commentaryUnit) {
        console.log(`✅ Found commentary sequence from pre-extracted verses`);
        return commentaryUnit;
      }
    }

    // Try dialogue extraction
    if (opts.includeDialogue) {
      const dialogueUnit = this.extractDialogueSequence(internalVerses);
      if (dialogueUnit) {
        console.log(`✅ Found dialogue sequence from pre-extracted verses`);
        return dialogueUnit;
      }
    }

    // Try concept extraction
    if (opts.focusOnConcepts) {
      const conceptUnit = this.extractConceptSequence(internalVerses);
      if (conceptUnit) {
        console.log(`✅ Found concept sequence from pre-extracted verses`);
        return conceptUnit;
      }
    }

    // Try explanatory extraction
    const explanatoryUnit = this.extractExplanatorySequence(internalVerses);
    if (explanatoryUnit) {
      console.log(`✅ Found explanatory sequence from pre-extracted verses`);
      return explanatoryUnit;
    }

    // Fallback to contiguous sequence
    const contiguousUnit = this.extractContiguousSequence(internalVerses, opts);
    if (contiguousUnit) {
      console.log(`✅ Found contiguous sequence from pre-extracted verses`);
      return contiguousUnit;
    }

    console.log(`❌ No philosophical unit found in pre-extracted verses`);
    return null;
  }
}

export const philosophicalLogicalUnitExtractor = new PhilosophicalLogicalUnitExtractor();
