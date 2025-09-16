/**
 * Epic Logical Unit Extractor - Phase 2: Pattern-Specific Extractors
 * Specialized extractor for epic texts like Ramayana, Mahabharata
 * Identifies and extracts complete narrative sequences as logical units
 */

import { GretilTextType } from '../../../types/gretil-types';
import { BoundaryExtractor } from '../boundaryExtractor';
import { ScripturePatternService } from '../scripturePatternService';

export interface EpicNarrativeUnit {
  sanskrit: string;
  reference: string;
  narrativeType: 'dialogue' | 'description' | 'action' | 'scene';
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
  };
}

export interface EpicExtractionOptions {
  minVerses: number; // Minimum verses for a logical unit
  maxVerses: number; // Maximum verses for a logical unit
  preferDialogue: boolean; // Prioritize dialogue sequences
  includeDescriptive: boolean; // Include descriptive passages
}

export class EpicLogicalUnitExtractor {
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
  }

  private readonly DEFAULT_OPTIONS: EpicExtractionOptions = {
    minVerses: 2,
    maxVerses: 8,
    preferDialogue: true,
    includeDescriptive: true
  };

  /**
   * Extract a logical narrative unit from epic text content
   * This method works on raw content and tries to find narrative patterns
   */
  extractLogicalUnit(content: string, filename: string, options: Partial<EpicExtractionOptions> = {}): EpicNarrativeUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`🎭 EpicLogicalUnitExtractor: Processing ${filename}`);
    console.log(`📊 Options: minVerses=${opts.minVerses}, maxVerses=${opts.maxVerses}, preferDialogue=${opts.preferDialogue}`);

    try {
      // Parse content into verses with references
      const verses = this.parseEpicVerses(content, filename);
      console.log(`📖 Found ${verses.length} verses in ${filename}`);

      if (verses.length < opts.minVerses) {
        console.log(`❌ Not enough verses for logical unit extraction (${verses.length} < ${opts.minVerses})`);
        return null;
      }

      // Try different extraction strategies in order of preference
      let unit: EpicNarrativeUnit | null = null;

      // Strategy 1: Extract dialogue sequence (highest priority)
      if (opts.preferDialogue) {
        unit = this.extractDialogueSequence(verses);
        if (unit) {
          console.log(`💬 Found dialogue sequence: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 2: Extract complete scene/action sequence
      unit = this.extractSceneSequence(verses);
      if (unit) {
        console.log(`🎬 Found scene sequence: ${unit.verses.length} verses`);
        return unit;
      }

      // Strategy 3: Extract descriptive passage
      if (opts.includeDescriptive) {
        unit = this.extractDescriptiveSequence(verses);
        if (unit) {
          console.log(`📝 Found descriptive sequence: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Fallback: Extract a meaningful contiguous sequence
      unit = this.extractContiguousSequence(verses, opts);
      if (unit) {
        console.log(`🔗 Found contiguous sequence: ${unit.verses.length} verses`);
        return unit;
      }

      console.log(`❌ No suitable logical unit found in ${filename}`);
      return null;

    } catch (error) {
      console.error(`💥 Error extracting logical unit from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Parse epic content into individual verses with references
   * Handles both structured references (Ram_2,1.1) and unstructured epic content
   */
  private parseEpicVerses(content: string, filename: string): Array<{ reference: string; text: string; lineNumber: number }> {
    const verses: Array<{ reference: string; text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    console.log(`📖 Parsing ${lines.length} lines for epic verses...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers and empty lines, but process comment lines that contain references
      if (!line || line.startsWith('#') || line.startsWith('--')) {
        continue;
      }

      let reference: string;
      let text: string;

      // Look for Ramayana reference pattern: Ram_[book],[chapter].[verse]
      const ramayanaMatch = line.match(/Ram_(\d+),(\d+)\.(\d+)/);
      if (ramayanaMatch) {
        const [, book, chapter, verse] = ramayanaMatch;
        reference = `Ram_${book},${chapter}.${verse}`;
        text = this.extractVerseText(line, filename);
      } else {
        // For unstructured epic content, create sequential references
        reference = `Verse_${i + 1}`;
        text = line;
      }

      if (text && text.length > 10) { // Only meaningful verses
        verses.push({
          reference,
          text,
          lineNumber: i + 1
        });
      }
    }

    console.log(`✅ Parsed ${verses.length} verses from epic content`);
    return verses;
  }

  /**
   * Extract dialogue sequence (speaker-addressee exchanges)
   */
  private extractDialogueSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): EpicNarrativeUnit | null {
    // Look for dialogue markers in Sanskrit
    const dialogueMarkers = [
      /(?:uvāca|āha|prāha|abravīt|kathayati)/i,  // Said, spoke
      /(?:pratyuvāca|pratyāha)/i,                // Replied
      /(?:pṛṣṭa|pṛcchati)/i,                     // Asked
      /(?:uttara|pratyuttara)/i                 // Answer
    ];

    // Find sequences with dialogue markers
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasDialogue = dialogueMarkers.some(marker => marker.test(currentVerse.text));

      if (hasDialogue) {
        console.log(`🎭 Found dialogue marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        // Try to find the dialogue boundary (next speaker change or scene change)
        const dialogueVerses = [currentVerse];
        let j = i + 1;

        // Continue until we find a verse that doesn't seem part of the dialogue
        while (j < verses.length && dialogueVerses.length < 6) {
          const nextVerse = verses[j];

          // Check if this verse continues the dialogue
          const continuesDialogue = dialogueMarkers.some(marker => marker.test(nextVerse.text)) ||
                                  this.isDialogueContinuation(currentVerse.text, nextVerse.text);

          if (continuesDialogue) {
            console.log(`🎭 Adding dialogue continuation: ${nextVerse.reference}`);
            dialogueVerses.push(nextVerse);
            j++;
          } else {
            console.log(`🎭 Dialogue boundary found at: ${nextVerse.reference}`);
            break;
          }
        }

        if (dialogueVerses.length >= 2) {
          console.log(`✅ Found dialogue sequence: ${dialogueVerses.length} verses`);
          return this.createNarrativeUnit(dialogueVerses, 'dialogue');
        }
      }
    }

    console.log(`❌ No dialogue sequences found`);
    return null;
  }

  /**
   * Extract complete scene/action sequence
   */
  private extractSceneSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): EpicNarrativeUnit | null {
    // Look for action or scene markers
    const actionMarkers = [
      /(?:jagāma|gataḥ|gacchati)/i,      // Went, going
      /(?:dadarśa|apaśyat)/i,            // Saw, beheld
      /(?:cakre|karoti|kṛtvā)/i,         // Did, made, having done
      /(?:prāpta|prāpnoti)/i,            // Obtained, reaches
      /(?:āgata|āyāta)/i                 // Came, arrived
    ];

    // Find sequences that tell a complete action
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasAction = actionMarkers.some(marker => marker.test(currentVerse.text));

      if (hasAction) {
        const sceneVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related action verses
        while (j < verses.length && sceneVerses.length < 5) {
          const nextVerse = verses[j];

          // Check if this continues the scene
          const continuesScene = actionMarkers.some(marker => marker.test(nextVerse.text)) ||
                               this.isSceneContinuation(currentVerse.text, nextVerse.text);

          if (continuesScene) {
            sceneVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (sceneVerses.length >= 2) {
          return this.createNarrativeUnit(sceneVerses, 'action');
        }
      }
    }

    return null;
  }

  /**
   * Extract descriptive passage
   */
  private extractDescriptiveSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): EpicNarrativeUnit | null {
    // Look for descriptive passages (longer verses with adjectives)
    const descriptiveVerses = verses.filter(verse =>
      verse.text.length > 50 && // Substantial length
      /[a-zāīūṛśṣṭḍṇṅñḥṃ]+\s+[a-zāīūṛśṣṭḍṇṅñḥṃ]+/i.test(verse.text) // Multiple Sanskrit words
    );

    if (descriptiveVerses.length >= 2) {
      // Take a contiguous sequence of descriptive verses
      const startIndex = verses.indexOf(descriptiveVerses[0]);
      const sequence = verses.slice(startIndex, startIndex + Math.min(4, descriptiveVerses.length));

      return this.createNarrativeUnit(sequence, 'description');
    }

    return null;
  }

  /**
   * Extract contiguous sequence as fallback
   */
  private extractContiguousSequence(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    options: EpicExtractionOptions
  ): EpicNarrativeUnit | null {
    if (verses.length < options.minVerses) return null;

    // Select a random starting point
    const maxStart = verses.length - options.minVerses;
    const startIndex = Math.floor(Math.random() * maxStart);
    const length = Math.min(
      options.maxVerses,
      Math.max(options.minVerses, verses.length - startIndex)
    );

    const sequence = verses.slice(startIndex, startIndex + length);
    return this.createNarrativeUnit(sequence, 'scene');
  }

  /**
   * Check if a verse continues a dialogue
   */
  private isDialogueContinuation(prevText: string, currentText: string): boolean {
    // Simple heuristic: if both verses contain dialogue markers or proper names
    const dialogueWords = /(?:uvāca|rāma|sītā|lākṣmaṇa|hanumān|rāvaṇa)/i;
    return dialogueWords.test(prevText) && dialogueWords.test(currentText);
  }

  /**
   * Check if a verse continues a scene
   */
  private isSceneContinuation(prevText: string, currentText: string): boolean {
    // Check for common scene connectors or repeated subjects
    const connectors = /(?:atha|tataḥ|tatra|evam|punar)/i;
    return connectors.test(currentText) ||
           this.shareCommonSubjects(prevText, currentText);
  }

  /**
   * Check if two verses share common subjects (simple heuristic)
   */
  private shareCommonSubjects(text1: string, text2: string): boolean {
    // Extract potential proper names/subjects
    const names1 = text1.match(/\b[a-zāīūṛśṣṭḍṇṅñḥṃ]{3,}\b/gi) || [];
    const names2 = text2.match(/\b[a-zāīūṛśṣṭḍṇṅñḥṃ]{3,}\b/gi) || [];

    // Check for overlap
    return names1.some(name => names2.includes(name));
  }

  /**
   * Extract clean verse text using boundary-based extraction
   */
  private extractVerseText(line: string, scriptureFile: string): string {
    return this.scripturePatternService.extractVerseText(line, scriptureFile);
  }

  /**
   * Create a narrative unit from verse sequence
   */
  private createNarrativeUnit(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    type: 'dialogue' | 'description' | 'action' | 'scene'
  ): EpicNarrativeUnit {
    // Parse the first reference to get context
    const firstRef = verses[0].reference;
    const ramayanaMatch = firstRef.match(/Ram_(\d+),(\d+)\.(\d+)/);

    const context = ramayanaMatch ? {
      book: parseInt(ramayanaMatch[1]),
      chapter: parseInt(ramayanaMatch[2])
    } : {};

    // Extract speaker if dialogue
    let speaker: string | undefined;
    let addressee: string | undefined;

    if (type === 'dialogue') {
      const speakerMatch = verses[0].text.match(/(\w+)(?:uvāca|āha|prāha)/i);
      if (speakerMatch) {
        speaker = speakerMatch[1];
      }
    }

    const lastVerseRef = verses[verses.length - 1].reference;
    let lastVerseNum: string;

    // Handle different reference formats
    const ramMatch = lastVerseRef.match(/Ram_\d+,\d+\.(\d+)/);
    if (ramMatch) {
      lastVerseNum = ramMatch[1];
    } else {
      // For Verse_N format, extract the number
      const verseMatch = lastVerseRef.match(/Verse_(\d+)/);
      lastVerseNum = verseMatch ? verseMatch[1] : lastVerseRef;
    }

    return {
      sanskrit: verses.map(v => v.text).join(' '),
      reference: `${verses[0].reference}-${lastVerseNum}`,
      narrativeType: type,
      speaker,
      addressee,
      verses: verses.map(v => v.text),
      verseRange: {
        start: verses[0].reference,
        end: verses[verses.length - 1].reference,
        count: verses.length
      },
      context
    };
  }

  /**
   * Convert epic unit to standard ExtractedWisdom format
   */
  toExtractedWisdom(unit: EpicNarrativeUnit, textName: string): {
    sanskrit: string;
    reference: string;
    textName: string;
    category: string;
    estimatedVerses: number;
    metadata?: any;
  } {
    return {
      sanskrit: unit.sanskrit,
      reference: `${textName} - ${unit.reference} (${unit.narrativeType})`,
      textName,
      category: 'Epics',
      estimatedVerses: unit.verseRange.count,
      metadata: {
        textType: GretilTextType.EPIC,
        narrativeUnit: unit
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
    options: Partial<EpicExtractionOptions> = {}
  ): EpicNarrativeUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`🎭 EpicLogicalUnitExtractor: Processing ${verses.length} pre-extracted verses from ${filename}`);

    if (verses.length < opts.minVerses) {
      console.log(`❌ Not enough verses for logical unit extraction (${verses.length} < ${opts.minVerses})`);
      return null;
    }

    // Convert to internal verse format
    const internalVerses = verses.map((v, i) => ({
      reference: v.reference,
      text: v.text,
      lineNumber: i + 1
    }));

    // Try dialogue extraction first
    if (opts.preferDialogue) {
      const dialogueUnit = this.extractDialogueSequence(internalVerses);
      if (dialogueUnit) {
        console.log(`✅ Found dialogue sequence from pre-extracted verses`);
        return dialogueUnit;
      }
    }

    // Try scene extraction
    const sceneUnit = this.extractSceneSequence(internalVerses);
    if (sceneUnit) {
      console.log(`✅ Found scene sequence from pre-extracted verses`);
      return sceneUnit;
    }

    // Try descriptive extraction
    if (opts.includeDescriptive) {
      const descriptiveUnit = this.extractDescriptiveSequence(internalVerses);
      if (descriptiveUnit) {
        console.log(`✅ Found descriptive sequence from pre-extracted verses`);
        return descriptiveUnit;
      }
    }

    // Fallback to contiguous sequence
    const contiguousUnit = this.extractContiguousSequence(internalVerses, opts);
    if (contiguousUnit) {
      console.log(`✅ Found contiguous sequence from pre-extracted verses`);
      return contiguousUnit;
    }

    console.log(`❌ No logical unit found in pre-extracted verses`);
    return null;
  }
}

export const epicLogicalUnitExtractor = new EpicLogicalUnitExtractor();
