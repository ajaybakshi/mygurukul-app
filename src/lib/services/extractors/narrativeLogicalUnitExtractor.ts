/**
 * Narrative Logical Unit Extractor - Phase 3: Multi-Text-Type Extraction
 * Specialized extractor for narrative texts like Puranas, mythological stories
 * Identifies and extracts complete story sections as logical units
 */

import { GretilTextType } from '../../../types/gretil-types';
import { BoundaryExtractor } from '../boundaryExtractor';
import { ScripturePatternService } from '../scripturePatternService';

export interface NarrativeUnit {
  sanskrit: string;
  reference: string;
  narrativeType: 'mythological-story' | 'genealogical-account' | 'cosmological-description' | 'heroic-episode';
  mainCharacters: string[];
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
    storyTheme?: string;
    location?: string;
  };
}

export interface NarrativeExtractionOptions {
  minVerses: number; // Minimum verses for a narrative unit
  maxVerses: number; // Maximum verses for a narrative unit
  preferCompleteStories: boolean; // Prioritize complete story units
  includeGenealogical: boolean; // Include genealogical accounts
  focusOnMainCharacters: boolean; // Focus on primary characters
}

export class NarrativeLogicalUnitExtractor {
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
  }

  private readonly DEFAULT_OPTIONS: NarrativeExtractionOptions = {
    minVerses: 3,
    maxVerses: 15,
    preferCompleteStories: true,
    includeGenealogical: true,
    focusOnMainCharacters: true
  };

  // Major Puranic characters and figures
  private readonly PURANIC_CHARACTERS = [
    'vishnu', 'viṣṇu', 'shiva', 'śiva', 'brahma', 'brahmā',
    'krishna', 'kṛṣṇa', 'rama', 'rāma', 'sita', 'sītā',
    'laxman', 'lakṣmaṇa', 'hanuman', 'hanumān', 'ravana', 'rāvaṇa',
    'durga', 'durgā', 'lakshmi', 'lakṣmī', 'saraswati', 'sarasvatī',
    'indra', 'varuna', 'yama', 'kubera', 'agastya', 'vashishta', 'vāsiṣṭha'
  ];

  // Story and narrative markers
  private readonly NARRATIVE_MARKERS = [
    /(?:kathā|ākhyāna|carita|caritra)/i,  // Story, narrative, biography
    /(?:purāṇa|itihāsa)/i,                // Ancient lore, history
    /(?:janma|birth|creation)/i,          // Birth, creation stories
    /(?:yuddha|battle|war)/i,             // Battle narratives
    /(?:vamsa|vamśa|lineage)/i            // Genealogical accounts
  ];

  // Story transition markers
  private readonly STORY_TRANSITIONS = [
    /(?:atha|then|after|thereupon)/i,
    /(?:iti|thus|in this way)/i,
    /(?:tataḥ|then|after that)/i,
    /(?:evam|thus|so)/i
  ];

  /**
   * Extract a narrative unit from Puranic text content
   * This method works on raw content and tries to find story patterns
   */
  extractLogicalUnit(content: string, filename: string, options: Partial<NarrativeExtractionOptions> = {}): NarrativeUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`📖 NarrativeLogicalUnitExtractor: Processing ${filename}`);
    console.log(`📊 Options: minVerses=${opts.minVerses}, maxVerses=${opts.maxVerses}, preferCompleteStories=${opts.preferCompleteStories}`);

    try {
      // Parse content into verses with references
      const verses = this.parseNarrativeVerses(content, filename);
      console.log(`📖 Found ${verses.length} narrative verses in ${filename}`);

      if (verses.length < opts.minVerses) {
        console.log(`❌ Not enough verses for narrative unit extraction (${verses.length} < ${opts.minVerses})`);
        return null;
      }

      // Try different extraction strategies in order of preference
      let unit: NarrativeUnit | null = null;

      // Strategy 1: Extract complete mythological story (highest priority for Puranas)
      if (opts.preferCompleteStories) {
        unit = this.extractMythologicalStory(verses);
        if (unit) {
          console.log(`📚 Found mythological story: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 2: Extract genealogical account
      if (opts.includeGenealogical) {
        unit = this.extractGenealogicalAccount(verses);
        if (unit) {
          console.log(`👨‍👩‍👧‍👦 Found genealogical account: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 3: Extract cosmological description
      unit = this.extractCosmologicalDescription(verses);
      if (unit) {
        console.log(`🌌 Found cosmological description: ${unit.verses.length} verses`);
        return unit;
      }

      // Strategy 4: Extract heroic episode
      unit = this.extractHeroicEpisode(verses);
      if (unit) {
        console.log(`⚔️ Found heroic episode: ${unit.verses.length} verses`);
        return unit;
      }

      // Fallback: Extract a meaningful contiguous sequence
      unit = this.extractContiguousSequence(verses, opts);
      if (unit) {
        console.log(`🔗 Found contiguous narrative sequence: ${unit.verses.length} verses`);
        return unit;
      }

      console.log(`❌ No suitable narrative unit found in ${filename}`);
      return null;

    } catch (error) {
      console.error(`💥 Error extracting narrative unit from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Parse narrative content into individual verses with references
   * Handles both structured references (ap_1.001, LiP_1,106.6) and unstructured Puranic content
   */
  private parseNarrativeVerses(content: string, filename: string): Array<{ reference: string; text: string; lineNumber: number }> {
    const verses: Array<{ reference: string; text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    console.log(`📖 Parsing ${lines.length} lines for narrative verses...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers and empty lines, but process comment lines that contain references
      if (!line || line.startsWith('#') || line.startsWith('--')) {
        continue;
      }

      let reference: string;
      let text: string;

      // Look for Puranic reference patterns
      const puranicPatterns = [
        // Agni Purana: ap_1.001
        /ap_(\d+)\.(\d+)/i,
        // Garuda Purana: garp_1,1.31
        /garp_(\d+),(\d+)\.(\d+)/i,
        // Linga Purana: LiP_1,106.6
        /LiP_(\d+),(\d+)\.(\d+)/i,
        // Vishnu Purana: VP_1.1.1
        /VP_(\d+)\.(\d+)\.(\d+)/i,
        // Shiva Purana: SP_1.1.1
        /SP_(\d+)\.(\d+)\.(\d+)/i,
        // Bhagavata Purana: BP_1.1.1
        /BP_(\d+)\.(\d+)\.(\d+)/i,
        // General narrative patterns
        /chapter.*\d+.*verse.*\d+/i,
        /story.*\d+/i
      ];

      let foundPattern = false;
      for (const pattern of puranicPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('ap_')) {
            reference = `ap_${match[1]}.${match[2].padStart(3, '0')}`;
          } else if (pattern.source.includes('garp_')) {
            reference = `garp_${match[1]},${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('LiP_')) {
            reference = `LiP_${match[1]},${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('VP_')) {
            reference = `VP_${match[1]}.${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('SP_')) {
            reference = `SP_${match[1]}.${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('BP_')) {
            reference = `BP_${match[1]}.${match[2]}.${match[3]}`;
          } else {
            reference = `Verse_${i + 1}`;
          }
          text = this.extractVerseText(line, filename);
          foundPattern = true;
          break;
        }
      }

      if (!foundPattern) {
        // For unstructured narrative content, create sequential references
        reference = `Verse_${i + 1}`;
        text = line;
      }

      if (text && text.length > 15) { // Only meaningful narrative verses
        verses.push({
          reference,
          text,
          lineNumber: i + 1
        });
      }
    }

    console.log(`✅ Parsed ${verses.length} narrative verses from content`);
    return verses;
  }

  /**
   * Extract complete mythological story (primary for Puranas)
   */
  private extractMythologicalStory(verses: Array<{ reference: string; text: string; lineNumber: number }>): NarrativeUnit | null {
    // Look for story boundaries and complete narrative structures
    const storyBoundaries = [
      /(?:samāpta|iti|conclusion|the end)/i,  // Story completion markers
      /(?:atha|then|after|thereupon)/i,       // Story transition markers
      /(?:\|\||\/\/)/i                        // Structural separators
    ];

    // CRITICAL FIX: Start from random position for true content diversity
    const startIndex = Math.floor(Math.random() * Math.max(1, verses.length - 10));
    console.log(`🎲 Random starting index for mythological story search: ${startIndex} (out of ${verses.length} verses)`);
    
    // Find sequences that appear to be complete stories starting from random position
    for (let i = startIndex; i < verses.length - 3; i++) {
      const currentVerse = verses[i];
      const hasNarrativeContent = this.NARRATIVE_MARKERS.some(marker => marker.test(currentVerse.text));
      const hasCharacters = this.PURANIC_CHARACTERS.some(char => currentVerse.text.toLowerCase().includes(char));

      if (hasNarrativeContent || hasCharacters) {
        console.log(`📚 Found narrative marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        // Try to find the story boundary
        const storyVerses = [currentVerse];
        let j = i + 1;

        // Continue until we find a story boundary or reach maximum verses
        while (j < verses.length && storyVerses.length < 10) {
          const nextVerse = verses[j];

          // Check if this continues the story
          const continuesStory = this.isStoryContinuation(currentVerse.text, nextVerse.text);
          const isStoryBoundary = storyBoundaries.some(boundary => boundary.test(nextVerse.text));

          if (continuesStory && !isStoryBoundary) {
            console.log(`📚 Adding story continuation: ${nextVerse.reference}`);
            storyVerses.push(nextVerse);
            j++;
          } else {
            console.log(`📚 Story boundary found at: ${nextVerse.reference}`);
            break;
          }
        }

        if (storyVerses.length >= 4) {
          console.log(`✅ Found mythological story sequence: ${storyVerses.length} verses`);
          return this.createNarrativeUnit(storyVerses, 'mythological-story');
        }
      }
    }

    console.log(`❌ No mythological stories found`);
    return null;
  }

  /**
   * Extract genealogical account
   */
  private extractGenealogicalAccount(verses: Array<{ reference: string; text: string; lineNumber: number }>): NarrativeUnit | null {
    // Look for lineage and genealogical content
    const genealogicalMarkers = [
      /(?:vamśa|vamśa|lineage|descendants?)/i,
      /(?:putra|son|daughter|sutā)/i,
      /(?:janayāmāsa|begot|gave birth)/i,
      /(?:kula|family|dynasty)/i
    ];

    // CRITICAL FIX: Start from random position for true content diversity
    const startIndex = Math.floor(Math.random() * Math.max(1, verses.length - 10));
    console.log(`🎲 Random starting index for genealogical search: ${startIndex} (out of ${verses.length} verses)`);
    
    // Find sequences with genealogical content starting from random position
    for (let i = startIndex; i < verses.length - 2; i++) {
      const currentVerse = verses[i];
      const hasGenealogicalContent = genealogicalMarkers.some(marker => marker.test(currentVerse.text));

      if (hasGenealogicalContent) {
        console.log(`👨‍👩‍👧‍👦 Found genealogical marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        const genealogicalVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related genealogical verses
        while (j < verses.length && genealogicalVerses.length < 8) {
          const nextVerse = verses[j];

          // Check if this continues the genealogical account
          const continuesGenealogical = genealogicalMarkers.some(marker => marker.test(nextVerse.text)) ||
                                      this.isGenealogicalContinuation(currentVerse.text, nextVerse.text);

          if (continuesGenealogical) {
            genealogicalVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (genealogicalVerses.length >= 3) {
          return this.createNarrativeUnit(genealogicalVerses, 'genealogical-account');
        }
      }
    }

    return null;
  }

  /**
   * Extract cosmological description
   */
  private extractCosmologicalDescription(verses: Array<{ reference: string; text: string; lineNumber: number }>): NarrativeUnit | null {
    // Look for creation, universe, and cosmological content
    const cosmologicalMarkers = [
      /(?:sarga|creation|universe|cosmos)/i,
      /(?:pralaya|dissolution|destruction)/i,
      /(?:brahmāṇḍa|world|universe)/i,
      /(?:kalpa|age|cycle)/i
    ];

    // Find sequences with cosmological content
    for (let i = 0; i < verses.length - 2; i++) {
      const currentVerse = verses[i];
      const hasCosmologicalContent = cosmologicalMarkers.some(marker => marker.test(currentVerse.text));

      if (hasCosmologicalContent) {
        console.log(`🌌 Found cosmological marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        const cosmologicalVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related cosmological verses
        while (j < verses.length && cosmologicalVerses.length < 7) {
          const nextVerse = verses[j];

          // Check if this continues the cosmological description
          const continuesCosmological = cosmologicalMarkers.some(marker => marker.test(nextVerse.text));

          if (continuesCosmological) {
            cosmologicalVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (cosmologicalVerses.length >= 3) {
          return this.createNarrativeUnit(cosmologicalVerses, 'cosmological-description');
        }
      }
    }

    return null;
  }

  /**
   * Extract heroic episode
   */
  private extractHeroicEpisode(verses: Array<{ reference: string; text: string; lineNumber: number }>): NarrativeUnit | null {
    // Look for battle, heroic, and adventure content
    const heroicMarkers = [
      /(?:vīra|hero|warrior|brave)/i,
      /(?:yuddha|battle|fight|combat)/i,
      /(?:jaya|victory|triumph)/i,
      /(?:śūra|courage|valor)/i
    ];

    // Find sequences with heroic content
    for (let i = 0; i < verses.length - 2; i++) {
      const currentVerse = verses[i];
      const hasHeroicContent = heroicMarkers.some(marker => marker.test(currentVerse.text));

      if (hasHeroicContent) {
        const heroicVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related heroic verses
        while (j < verses.length && heroicVerses.length < 6) {
          const nextVerse = verses[j];

          // Check if this continues the heroic episode
          const continuesHeroic = heroicMarkers.some(marker => marker.test(nextVerse.text)) ||
                                this.isHeroicContinuation(currentVerse.text, nextVerse.text);

          if (continuesHeroic) {
            heroicVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (heroicVerses.length >= 3) {
          return this.createNarrativeUnit(heroicVerses, 'heroic-episode');
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
    options: NarrativeExtractionOptions
  ): NarrativeUnit | null {
    if (verses.length < options.minVerses) return null;

    // Select a random starting point
    const maxStart = verses.length - options.minVerses;
    const startIndex = Math.floor(Math.random() * maxStart);
    const length = Math.min(
      options.maxVerses,
      Math.max(options.minVerses, verses.length - startIndex)
    );

    const sequence = verses.slice(startIndex, startIndex + length);
    return this.createNarrativeUnit(sequence, 'mythological-story');
  }

  /**
   * Check if a verse continues a story
   */
  private isStoryContinuation(prevText: string, currentText: string): boolean {
    // Check for story continuity markers
    const continuityMarkers = [
      /(?:atha|tataḥ|then|after)/i,
      /(?:ca|and|also|further)/i,
      /(?:sa|he|she|they)/i,  // Pronouns indicating continuation
      /(?:evaṃ|thus|in this way)/i
    ];

    return continuityMarkers.some(marker => marker.test(currentText)) ||
           this.shareNarrativeElements(prevText, currentText);
  }

  /**
   * Check if a verse continues a genealogical account
   */
  private isGenealogicalContinuation(prevText: string, currentText: string): boolean {
    // Check for genealogical continuity
    const genealogicalTerms = ['putra', 'suta', 'kanya', 'janayāmāsa', 'putram', 'sutam'];
    return genealogicalTerms.some(term => currentText.toLowerCase().includes(term));
  }

  /**
   * Check if a verse continues a heroic episode
   */
  private isHeroicContinuation(prevText: string, currentText: string): boolean {
    // Check for heroic continuity
    const heroicTerms = ['yuddha', 'prahar', 'jaghana', 'hatavān', 'jitan'];
    return heroicTerms.some(term => currentText.toLowerCase().includes(term));
  }

  /**
   * Check if two verses share narrative elements
   */
  private shareNarrativeElements(text1: string, text2: string): boolean {
    // Extract potential narrative elements
    const narrativeElements1 = this.extractNarrativeElements(text1);
    const narrativeElements2 = this.extractNarrativeElements(text2);

    // Check for overlap
    return narrativeElements1.some(element => narrativeElements2.includes(element));
  }

  /**
   * Extract narrative elements from text
   */
  private extractNarrativeElements(text: string): string[] {
    const elements: string[] = [];

    // Extract characters
    this.PURANIC_CHARACTERS.forEach(character => {
      if (text.toLowerCase().includes(character)) {
        elements.push(character);
      }
    });

    // Extract narrative terms
    const narrativeTerms = ['kathā', 'ākhyāna', 'carita', 'purāṇa', 'itihāsa'];
    narrativeTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        elements.push(term);
      }
    });

    return elements;
  }

  /**
   * Extract clean verse text using scripture-specific patterns
   */
  private extractVerseText(line: string, scriptureFile: string): string {
    return this.scripturePatternService.extractVerseText(line, scriptureFile);
  }

  /**
   * Create a narrative unit from verse sequence
   */
  private createNarrativeUnit(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    type: 'mythological-story' | 'genealogical-account' | 'cosmological-description' | 'heroic-episode'
  ): NarrativeUnit {
    // Parse the first reference to get context
    const firstRef = verses[0].reference;
    const puranicPatterns = [
      /ap_(\d+)\.(\d+)/i,
      /LiP_(\d+),(\d+)\.(\d+)/i,
      /VP_(\d+)\.(\d+)\.(\d+)/i,
      /SP_(\d+)\.(\d+)\.(\d+)/i,
      /BP_(\d+)\.(\d+)\.(\d+)/i
    ];

    let context: any = {};
    for (const pattern of puranicPatterns) {
      const match = firstRef.match(pattern);
      if (match) {
        if (pattern.source.includes('ap_')) {
          context = {
            book: parseInt(match[1]),
            chapter: Math.floor(parseInt(match[2]) / 100)
          };
        } else if (pattern.source.includes('garp_')) {
          context = {
            book: parseInt(match[1]),
            chapter: parseInt(match[2])
          };
        } else if (pattern.source.includes('LiP_')) {
          context = {
            book: parseInt(match[1]),
            chapter: parseInt(match[2])
          };
        } else {
          context = {
            book: parseInt(match[1]),
            chapter: parseInt(match[2])
          };
        }
        break;
      }
    }

    // Identify main characters
    const mainCharacters: string[] = [];
    const lowerCombinedText = verses.map(v => v.text).join(' ').toLowerCase();

    this.PURANIC_CHARACTERS.forEach(character => {
      if (lowerCombinedText.includes(character)) {
        mainCharacters.push(character.charAt(0).toUpperCase() + character.slice(1));
      }
    });

    // Limit to top 3 main characters
    const topCharacters = mainCharacters.slice(0, 3);

    // Identify story theme if possible
    let storyTheme: string | undefined;
    const themePatterns = [
      { pattern: /creation|birth|origin/i, theme: 'Divine Creation' },
      { pattern: /battle|war|victory/i, theme: 'Heroic Victory' },
      { pattern: /devotion|bhakti|worship/i, theme: 'Divine Devotion' },
      { pattern: /lineage|dynasty|descendants/i, theme: 'Royal Lineage' },
      { pattern: /universe|cosmos|world/i, theme: 'Cosmic Order' }
    ];

    for (const { pattern, theme } of themePatterns) {
      if (lowerCombinedText.match(pattern)) {
        storyTheme = theme;
        break;
      }
    }

    // Identify location if possible
    let location: string | undefined;
    const locationPatterns = [
      { pattern: /ayodhya|mithila|kashi/i, location: 'Sacred India' },
      { pattern: /heaven|svarga|divine realm/i, location: 'Heavenly Realm' },
      { pattern: /ocean|sea|samudra/i, location: 'Cosmic Ocean' },
      { pattern: /forest|vana|woods/i, location: 'Sacred Forest' }
    ];

    for (const { pattern, location: loc } of locationPatterns) {
      if (lowerCombinedText.match(pattern)) {
        location = loc;
        break;
      }
    }

    const lastVerseRef = verses[verses.length - 1].reference;
    let lastVerseNum: string;

    // Handle different reference formats
    const puranicRefMatch = lastVerseRef.match(/(?:ap|garp|LiP|VP|SP|BP)_(.+)/i);
    if (puranicRefMatch) {
      lastVerseNum = puranicRefMatch[1];
    } else {
      // For Verse_N format, extract the number
      const verseMatch = lastVerseRef.match(/Verse_(\d+)/);
      lastVerseNum = verseMatch ? verseMatch[1] : lastVerseRef;
    }

    return {
      sanskrit: verses.map(v => v.text).join(' '),
      reference: `${verses[0].reference}-${lastVerseNum}`,
      narrativeType: type,
      mainCharacters: topCharacters,
      verses: verses.map(v => v.text),
      verseRange: {
        start: verses[0].reference,
        end: verses[verses.length - 1].reference,
        count: verses.length
      },
      context: {
        ...context,
        storyTheme,
        location
      }
    };
  }

  /**
   * Convert narrative unit to standard ExtractedWisdom format
   */
  toExtractedWisdom(unit: NarrativeUnit, textName: string): {
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
      category: 'Puranas',
      estimatedVerses: unit.verseRange.count,
      metadata: {
        textType: GretilTextType.NARRATIVE,
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
    options: Partial<NarrativeExtractionOptions> = {}
  ): NarrativeUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`📖 NarrativeLogicalUnitExtractor: Processing ${verses.length} pre-extracted verses from ${filename}`);

    if (verses.length < opts.minVerses) {
      console.log(`❌ Not enough verses for narrative unit extraction (${verses.length} < ${opts.minVerses})`);
      return null;
    }

    // Convert to internal verse format
    const internalVerses = verses.map((v, i) => ({
      reference: v.reference,
      text: v.text,
      lineNumber: i + 1
    }));

    // Try mythological story extraction first
    if (opts.preferCompleteStories) {
      const mythologicalStory = this.extractMythologicalStory(internalVerses);
      if (mythologicalStory) {
        console.log(`✅ Found mythological story sequence from pre-extracted verses`);
        return mythologicalStory;
      }
    }

    // Try genealogical extraction
    if (opts.includeGenealogical) {
      const genealogicalAccount = this.extractGenealogicalAccount(internalVerses);
      if (genealogicalAccount) {
        console.log(`✅ Found genealogical account sequence from pre-extracted verses`);
        return genealogicalAccount;
      }
    }

    // Try cosmological extraction
    const cosmologicalDescription = this.extractCosmologicalDescription(internalVerses);
    if (cosmologicalDescription) {
      console.log(`✅ Found cosmological description sequence from pre-extracted verses`);
      return cosmologicalDescription;
    }

    // Try heroic extraction
    const heroicEpisode = this.extractHeroicEpisode(internalVerses);
    if (heroicEpisode) {
      console.log(`✅ Found heroic episode sequence from pre-extracted verses`);
      return heroicEpisode;
    }

    // Fallback to contiguous sequence
    const contiguousUnit = this.extractContiguousSequence(internalVerses, opts);
    if (contiguousUnit) {
      console.log(`✅ Found contiguous sequence from pre-extracted verses`);
      return contiguousUnit;
    }

    console.log(`❌ No narrative unit found in pre-extracted verses`);
    return null;
  }
}

export const narrativeLogicalUnitExtractor = new NarrativeLogicalUnitExtractor();
