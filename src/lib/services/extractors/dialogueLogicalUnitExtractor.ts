/**
 * Dialogue Logical Unit Extractor - Phase 3: Multi-Text-Type Extraction
 * Specialized extractor for dialogue texts like Bhagavad Gita, teacher-student exchanges
 * Identifies and extracts complete dialogue sequences as logical units
 */

import { GretilTextType } from '../../../types/gretil-types';
import { BoundaryExtractor } from '../boundaryExtractor';
import { ScripturePatternService } from '../scripturePatternService';

export interface DialogueUnit {
  sanskrit: string;
  reference: string;
  dialogueType: 'teacher-student' | 'philosophical' | 'instructional' | 'question-answer';
  speaker: string;
  addressee: string;
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
    philosophicalTheme?: string;
    characters: string[];
  };
}

export interface DialogueExtractionOptions {
  minVerses: number; // Minimum verses for a dialogue unit
  maxVerses: number; // Maximum verses for a dialogue unit
  preferTeacherStudent: boolean; // Prioritize teacher-student dialogues
  includePhilosophical: boolean; // Include philosophical dialogues
  focusOnKeyCharacters: boolean; // Focus on main characters (Krishna, Arjuna)
}

export class DialogueLogicalUnitExtractor {
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
  }

  private readonly DEFAULT_OPTIONS: DialogueExtractionOptions = {
    minVerses: 2,
    maxVerses: 8,
    preferTeacherStudent: true,
    includePhilosophical: true,
    focusOnKeyCharacters: true
  };

  // Key characters in Bhagavad Gita and other dialogue texts
  private readonly KEY_CHARACTERS = [
    'krishna', 'kṛṣṇa', 'arjuna', 'arjunaḥ', 'sanjaya', 'sanjayaḥ',
    'dhṛtarāṣṭra', 'dhṛtarāṣṭraḥ', 'vyāsa', 'vyāsaḥ', 'guru', 'śiṣya',
    'teacher', 'student', 'ācārya', 'disciple'
  ];

  // Dialogue markers in Sanskrit
  private readonly DIALOGUE_MARKERS = [
    /(?:uvāca|āha|prāha|abravīt)/i,  // Said, spoke
    /(?:pratyuvāca|pratyāha)/i,       // Replied
    /(?:pṛṣṭa|pṛcchati)/i,            // Asked
    /(?:uttara|pratyuttara)/i,        // Answer
    /(?:kathayati|ākhyāti)/i,         // Narrates
    /(?:āmantrya|samabodhya)/i        // Addressing, instructing
  ];

  /**
   * Extract a dialogue unit from Bhagavad Gita or other dialogue text content
   * This method works on raw content and tries to find dialogue patterns
   */
  extractLogicalUnit(content: string, filename: string, options: Partial<DialogueExtractionOptions> = {}): DialogueUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`💬 DialogueLogicalUnitExtractor: Processing ${filename}`);
    console.log(`📊 Options: minVerses=${opts.minVerses}, maxVerses=${opts.maxVerses}, preferTeacherStudent=${opts.preferTeacherStudent}`);

    try {
      // Parse content into verses with references
      const verses = this.parseDialogueVerses(content, filename);
      console.log(`📖 Found ${verses.length} dialogue verses in ${filename}`);

      if (verses.length < opts.minVerses) {
        console.log(`❌ Not enough verses for dialogue unit extraction (${verses.length} < ${opts.minVerses})`);
        return null;
      }

      // Try different extraction strategies in order of preference
      let unit: DialogueUnit | null = null;

      // Strategy 1: Extract teacher-student dialogue (highest priority for Gita)
      if (opts.preferTeacherStudent) {
        unit = this.extractTeacherStudentDialogue(verses);
        if (unit) {
          console.log(`👨‍🏫 Found teacher-student dialogue: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 2: Extract philosophical dialogue sequence
      if (opts.includePhilosophical) {
        unit = this.extractPhilosophicalDialogue(verses);
        if (unit) {
          console.log(`🎭 Found philosophical dialogue: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 3: Extract instructional dialogue
      unit = this.extractInstructionalDialogue(verses);
      if (unit) {
        console.log(`📚 Found instructional dialogue: ${unit.verses.length} verses`);
        return unit;
      }

      // Strategy 4: Extract question-answer sequence
      unit = this.extractQuestionAnswerSequence(verses);
      if (unit) {
        console.log(`❓ Found Q&A sequence: ${unit.verses.length} verses`);
        return unit;
      }

      // Fallback: Extract a meaningful contiguous sequence
      unit = this.extractContiguousSequence(verses, opts);
      if (unit) {
        console.log(`🔗 Found contiguous dialogue sequence: ${unit.verses.length} verses`);
        return unit;
      }

      console.log(`❌ No suitable dialogue unit found in ${filename}`);
      return null;

    } catch (error) {
      console.error(`💥 Error extracting dialogue unit from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Parse dialogue content into individual verses with references
   * Handles both structured references (bhg 2.15) and unstructured dialogue content
   */
  private parseDialogueVerses(content: string, filename: string): Array<{ reference: string; text: string; lineNumber: number }> {
    const verses: Array<{ reference: string; text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    console.log(`📖 Parsing ${lines.length} lines for dialogue verses...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers and empty lines, but process comment lines that contain references
      if (!line || line.startsWith('#') || line.startsWith('--')) {
        continue;
      }

      let reference: string;
      let text: string;

      // Look for Bhagavad Gita reference patterns
      const gitaPatterns = [
        // Bhagavad Gita: bhg 2.15
        /bhg (\d+)\.(\d+)/i,
        // Bhagavad Gita with chapter: bhg 2.15
        /bhagavad.*gita.*(\d+)\.(\d+)/i,
        // General dialogue patterns
        /krishna.*said|arjuna.*said|said.*krishna|said.*arjuna/i,
        // Sanskrit dialogue markers
        /(?:uvāca|āha|prāha).*:/i
      ];

      let foundPattern = false;
      for (const pattern of gitaPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('bhg')) {
            reference = `bhg ${match[1]}.${match[2]}`;
          } else {
            reference = `Verse_${i + 1}`;
          }
          text = this.extractVerseText(line, filename);
          foundPattern = true;
          break;
        }
      }

      if (!foundPattern) {
        // For unstructured dialogue content, create sequential references
        reference = `Verse_${i + 1}`;
        text = line;
      }

      if (text && text.length > 10) { // Only meaningful dialogue verses
        verses.push({
          reference,
          text,
          lineNumber: i + 1
        });
      }
    }

    console.log(`✅ Parsed ${verses.length} dialogue verses from content`);
    return verses;
  }

  /**
   * Extract teacher-student dialogue (primary for Bhagavad Gita)
   */
  private extractTeacherStudentDialogue(verses: Array<{ reference: string; text: string; lineNumber: number }>): DialogueUnit | null {
    // Look for Krishna-Arjuna exchanges (primary teacher-student dialogue)
    const teacherStudentPairs = [
      { teacher: 'krishna', student: 'arjuna' },
      { teacher: 'kṛṣṇa', student: 'arjuna' },
      { teacher: 'guru', student: 'śiṣya' },
      { teacher: 'ācārya', student: 'disciple' }
    ];

    // Find sequences with teacher-student exchanges
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(currentVerse.text));

      if (hasDialogue) {
        // Check if this verse contains teacher-student dialogue
        const speaker = this.extractSpeaker(currentVerse.text);
        const isTeacherStudent = speaker && this.isTeacherStudentExchange(currentVerse.text);

        if (isTeacherStudent) {
          console.log(`👨‍🏫 Found teacher-student marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

          // Try to find the dialogue boundary (next speaker change or topic change)
          const dialogueVerses = [currentVerse];
          let j = i + 1;

          // Continue until we find a verse that doesn't continue the dialogue
          while (j < verses.length && dialogueVerses.length < 6) {
            const nextVerse = verses[j];

            // Check if this verse continues the teacher-student dialogue
            const continuesDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(nextVerse.text)) ||
                                    this.isDialogueContinuation(currentVerse.text, nextVerse.text);

            if (continuesDialogue) {
              console.log(`👨‍🏫 Adding dialogue continuation: ${nextVerse.reference}`);
              dialogueVerses.push(nextVerse);
              j++;
            } else {
              console.log(`👨‍🏫 Dialogue boundary found at: ${nextVerse.reference}`);
              break;
            }
          }

          if (dialogueVerses.length >= 2) {
            console.log(`✅ Found teacher-student dialogue sequence: ${dialogueVerses.length} verses`);
            return this.createDialogueUnit(dialogueVerses, 'teacher-student');
          }
        }
      }
    }

    console.log(`❌ No teacher-student sequences found`);
    return null;
  }

  /**
   * Extract philosophical dialogue sequence
   */
  private extractPhilosophicalDialogue(verses: Array<{ reference: string; text: string; lineNumber: number }>): DialogueUnit | null {
    // Look for philosophical discussion markers
    const philosophicalMarkers = [
      /(?:dharma|karma|yoga|bhakti|jñāna)/i,  // Core philosophical concepts
      /(?:ātman|brahman|mokṣa|saṃsāra)/i,    // Spiritual concepts
      /(?:philosophy|spiritual|divine|enlightenment)/i,  // Philosophical themes
      /(?:question|answer|doubt|wisdom)/i    // Dialogue elements
    ];

    // Find sequences with philosophical dialogue
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasPhilosophical = philosophicalMarkers.some(marker => marker.test(currentVerse.text));
      const hasDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(currentVerse.text));

      if (hasPhilosophical && hasDialogue) {
        console.log(`🎭 Found philosophical dialogue marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        const dialogueVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related philosophical dialogue verses
        while (j < verses.length && dialogueVerses.length < 5) {
          const nextVerse = verses[j];

          // Check if this continues the philosophical dialogue
          const continuesPhilosophical = philosophicalMarkers.some(marker => marker.test(nextVerse.text));
          const continuesDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(nextVerse.text)) ||
                                  this.isDialogueContinuation(currentVerse.text, nextVerse.text);

          if (continuesPhilosophical && continuesDialogue) {
            dialogueVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (dialogueVerses.length >= 2) {
          return this.createDialogueUnit(dialogueVerses, 'philosophical');
        }
      }
    }

    return null;
  }

  /**
   * Extract instructional dialogue
   */
  private extractInstructionalDialogue(verses: Array<{ reference: string; text: string; lineNumber: number }>): DialogueUnit | null {
    // Look for instructional markers
    const instructionalMarkers = [
      /(?:śikṣati|anuśāsati|upadiśati)/i,  // Teaches, instructs
      /(?:instruction|teaching|guidance|lesson)/i,
      /(?:learn|understand|practice|follow)/i,
      /(?:path|way|method|technique)/i
    ];

    // Find sequences with instructional dialogue
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasInstructional = instructionalMarkers.some(marker => marker.test(currentVerse.text));
      const hasDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(currentVerse.text));

      if (hasInstructional && hasDialogue) {
        const dialogueVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related instructional verses
        while (j < verses.length && dialogueVerses.length < 4) {
          const nextVerse = verses[j];

          // Check if this continues the instructional dialogue
          const continuesInstructional = instructionalMarkers.some(marker => marker.test(nextVerse.text));
          const continuesDialogue = this.DIALOGUE_MARKERS.some(marker => marker.test(nextVerse.text));

          if (continuesInstructional && continuesDialogue) {
            dialogueVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (dialogueVerses.length >= 2) {
          return this.createDialogueUnit(dialogueVerses, 'instructional');
        }
      }
    }

    return null;
  }

  /**
   * Extract question-answer sequence
   */
  private extractQuestionAnswerSequence(verses: Array<{ reference: string; text: string; lineNumber: number }>): DialogueUnit | null {
    // Look for Q&A markers
    const questionMarkers = [
      /(?:pṛcchati|pṛṣṭa|asks?|questions?)/i,
      /(?:kasmāt|kim|why|how|what)/i
    ];

    const answerMarkers = [
      /(?:uttaram|answers?|replies?|explains?)/i,
      /(?:tad|therefore|thus|so)/i
    ];

    // Find sequences with Q&A exchanges
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasQuestion = questionMarkers.some(marker => marker.test(currentVerse.text));
      const hasAnswer = answerMarkers.some(marker => marker.test(currentVerse.text));

      if (hasQuestion || hasAnswer) {
        const dialogueVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting Q&A verses
        while (j < verses.length && dialogueVerses.length < 4) {
          const nextVerse = verses[j];

          // Check if this continues the Q&A sequence
          const nextHasQuestion = questionMarkers.some(marker => marker.test(nextVerse.text));
          const nextHasAnswer = answerMarkers.some(marker => marker.test(nextVerse.text));

          if (nextHasQuestion || nextHasAnswer) {
            dialogueVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (dialogueVerses.length >= 2) {
          return this.createDialogueUnit(dialogueVerses, 'question-answer');
        }
      }
    }

    return null;
  }

  /**
   * Extract contiguous sequence as fallback
   */
  private extractContiguousSequence(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    options: DialogueExtractionOptions
  ): DialogueUnit | null {
    if (verses.length < options.minVerses) return null;

    // Select a random starting point
    const maxStart = verses.length - options.minVerses;
    const startIndex = Math.floor(Math.random() * maxStart);
    const length = Math.min(
      options.maxVerses,
      Math.max(options.minVerses, verses.length - startIndex)
    );

    const sequence = verses.slice(startIndex, startIndex + length);
    return this.createDialogueUnit(sequence, 'philosophical');
  }

  /**
   * Check if text contains teacher-student dialogue
   */
  private isTeacherStudentExchange(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check for teacher-student pairs
    const teacherStudentPatterns = [
      /(?:krishna|kṛṣṇa).*arjuna|arjuna.*(?:krishna|kṛṣṇa)/i,
      /(?:guru|ācārya).*śiṣya|śiṣya.*(?:guru|ācārya)/i,
      /(?:teacher|master).*student|student.*(?:teacher|master)/i
    ];

    return teacherStudentPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if a verse continues a dialogue
   */
  private isDialogueContinuation(prevText: string, currentText: string): boolean {
    // Check for dialogue continuity markers
    const continuityMarkers = [
      /(?:atha|tataḥ|then|after|further)/i,
      /(?:continued|continuing|goes on)/i,
      /(?:said|spoke|replied|answered)/i
    ];

    return continuityMarkers.some(marker => marker.test(currentText)) ||
           this.shareDialogueElements(prevText, currentText);
  }

  /**
   * Check if two verses share dialogue elements
   */
  private shareDialogueElements(text1: string, text2: string): boolean {
    // Extract potential dialogue elements
    const dialogueElements1 = this.extractDialogueElements(text1);
    const dialogueElements2 = this.extractDialogueElements(text2);

    // Check for overlap
    return dialogueElements1.some(element => dialogueElements2.includes(element));
  }

  /**
   * Extract dialogue elements from text
   */
  private extractDialogueElements(text: string): string[] {
    const elements: string[] = [];

    // Extract speakers
    const speakers = text.match(/(?:uvāca|āha|prāha)\s+(\w+)/gi);
    if (speakers) {
      elements.push(...speakers.map(s => s.toLowerCase()));
    }

    // Extract key characters
    this.KEY_CHARACTERS.forEach(character => {
      if (text.toLowerCase().includes(character)) {
        elements.push(character);
      }
    });

    return elements;
  }

  /**
   * Extract speaker from dialogue text
   */
  private extractSpeaker(text: string): string | null {
    // Look for Sanskrit dialogue patterns
    const speakerPatterns = [
      /(\w+)(?:uvāca|āha|prāha)/i,  // "Krishna uvāca" (Krishna said)
      /(\w+)\s+(?:said|spoke|replied)/i,  // English patterns
      /(?:uvāca|āha|prāha)\s+(\w+)/i   // Reverse pattern
    ];

    for (const pattern of speakerPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract clean verse text using boundary-based extraction
   */
  private extractVerseText(line: string, scriptureFile: string): string {
    return this.scripturePatternService.extractVerseText(line, scriptureFile);
  }

  /**
   * Create a dialogue unit from verse sequence
   */
  private createDialogueUnit(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    type: 'teacher-student' | 'philosophical' | 'instructional' | 'question-answer'
  ): DialogueUnit {
    // Parse the first reference to get context
    const firstRef = verses[0].reference;
    const gitaMatch = firstRef.match(/bhg\s*(\d+)\.(\d+)/i);

    let context: any = {};
    if (gitaMatch) {
      context = {
        chapter: parseInt(gitaMatch[1]),
        section: `Verse ${gitaMatch[2]}`
      };
    }

    // Extract speaker and addressee
    let speaker = 'Unknown';
    let addressee = 'Unknown';

    for (const verse of verses) {
      const extractedSpeaker = this.extractSpeaker(verse.text);
      if (extractedSpeaker) {
        speaker = extractedSpeaker;
        // Try to determine addressee based on speaker
        if (speaker.toLowerCase().includes('krishna') || speaker.toLowerCase().includes('kṛṣṇa')) {
          addressee = 'Arjuna';
        } else if (speaker.toLowerCase().includes('arjuna')) {
          addressee = 'Krishna';
        }
        break;
      }
    }

    // Identify philosophical theme if possible
    let philosophicalTheme: string | undefined;
    const themePatterns = [
      { pattern: /dharma/i, theme: 'Dharma (Righteous Duty)' },
      { pattern: /karma.*yoga|karma/i, theme: 'Karma Yoga (Path of Action)' },
      { pattern: /bhakti.*yoga|bhakti/i, theme: 'Bhakti Yoga (Path of Devotion)' },
      { pattern: /jñāna.*yoga|jñāna/i, theme: 'Jnana Yoga (Path of Knowledge)' },
      { pattern: /ātman|brahman/i, theme: 'Self-Realization' },
      { pattern: /mokṣa|liberation/i, theme: 'Spiritual Liberation' }
    ];

    for (const { pattern, theme } of themePatterns) {
      if (verses.some(verse => pattern.test(verse.text))) {
        philosophicalTheme = theme;
        break;
      }
    }

    // Extract characters involved
    const characters: string[] = [];
    this.KEY_CHARACTERS.forEach(character => {
      const charName = character.replace('ḥ', 'h').replace('ṃ', 'm').replace('ṇ', 'n');
      if (verses.some(verse => verse.text.toLowerCase().includes(character))) {
        characters.push(charName.charAt(0).toUpperCase() + charName.slice(1));
      }
    });

    const lastVerseRef = verses[verses.length - 1].reference;
    let lastVerseNum: string;

    // Handle different reference formats
    const gitaRefMatch = lastVerseRef.match(/bhg\s*\d+\.(\d+)/i);
    if (gitaRefMatch) {
      lastVerseNum = gitaRefMatch[1];
    } else {
      // For Verse_N format, extract the number
      const verseMatch = lastVerseRef.match(/Verse_(\d+)/);
      lastVerseNum = verseMatch ? verseMatch[1] : lastVerseRef;
    }

    return {
      sanskrit: verses.map(v => v.text).join(' '),
      reference: `${verses[0].reference}-${lastVerseNum}`,
      dialogueType: type,
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
        philosophicalTheme,
        characters
      }
    };
  }

  /**
   * Convert dialogue unit to standard ExtractedWisdom format
   */
  toExtractedWisdom(unit: DialogueUnit, textName: string): {
    sanskrit: string;
    reference: string;
    textName: string;
    category: string;
    estimatedVerses: number;
    metadata?: any;
  } {
    return {
      sanskrit: unit.sanskrit,
      reference: `${textName} - ${unit.reference} (${unit.dialogueType})`,
      textName,
      category: 'Philosophical Texts',
      estimatedVerses: unit.verseRange.count,
      metadata: {
        textType: GretilTextType.DIALOGUE,
        dialogueUnit: unit
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
    options: Partial<DialogueExtractionOptions> = {}
  ): DialogueUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`💬 DialogueLogicalUnitExtractor: Processing ${verses.length} pre-extracted verses from ${filename}`);

    if (verses.length < opts.minVerses) {
      console.log(`❌ Not enough verses for dialogue unit extraction (${verses.length} < ${opts.minVerses})`);
      return null;
    }

    // Convert to internal verse format
    const internalVerses = verses.map((v, i) => ({
      reference: v.reference,
      text: v.text,
      lineNumber: i + 1
    }));

    // Try teacher-student extraction first
    if (opts.preferTeacherStudent) {
      const teacherStudentUnit = this.extractTeacherStudentDialogue(internalVerses);
      if (teacherStudentUnit) {
        console.log(`✅ Found teacher-student dialogue sequence from pre-extracted verses`);
        return teacherStudentUnit;
      }
    }

    // Try philosophical extraction
    if (opts.includePhilosophical) {
      const philosophicalUnit = this.extractPhilosophicalDialogue(internalVerses);
      if (philosophicalUnit) {
        console.log(`✅ Found philosophical dialogue sequence from pre-extracted verses`);
        return philosophicalUnit;
      }
    }

    // Try instructional extraction
    const instructionalUnit = this.extractInstructionalDialogue(internalVerses);
    if (instructionalUnit) {
      console.log(`✅ Found instructional dialogue sequence from pre-extracted verses`);
      return instructionalUnit;
    }

    // Try Q&A extraction
    const qaUnit = this.extractQuestionAnswerSequence(internalVerses);
    if (qaUnit) {
      console.log(`✅ Found Q&A sequence from pre-extracted verses`);
      return qaUnit;
    }

    // Fallback to contiguous sequence
    const contiguousUnit = this.extractContiguousSequence(internalVerses, opts);
    if (contiguousUnit) {
      console.log(`✅ Found contiguous sequence from pre-extracted verses`);
      return contiguousUnit;
    }

    console.log(`❌ No dialogue unit found in pre-extracted verses`);
    return null;
  }
}

export const dialogueLogicalUnitExtractor = new DialogueLogicalUnitExtractor();
