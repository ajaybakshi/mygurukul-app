/**
 * Hymnal Logical Unit Extractor - Phase 3: Multi-Text-Type Extraction
 * Specialized extractor for hymn collections like Rig Veda, Sama Veda
 * Identifies and extracts complete hymns as logical units
 */

import { GretilTextType } from '../../../types/gretil-types';
import { BoundaryExtractor } from '../boundaryExtractor';
import { ScripturePatternService } from '../scripturePatternService';

export interface HymnalUnit {
  sanskrit: string;
  reference: string;
  hymnType: 'complete-hymn' | 'hymn-fragment' | 'ritual-chant' | 'devotional-prayer';
  deity: string;
  verses: string[];
  verseRange: {
    start: string;
    end: string;
    count: number;
  };
  context: {
    book?: number;
    hymn?: number;
    section?: string;
    ritualPurpose?: string;
    meter?: string;
  };
}

export interface HymnalExtractionOptions {
  minVerses: number; // Minimum verses for a hymn unit
  maxVerses: number; // Maximum verses for a hymn unit
  preferCompleteHymns: boolean; // Prioritize complete hymns over fragments
  includeRitualChants: boolean; // Include ritual and ceremonial content
  focusOnKeyDeities: boolean; // Focus on major Vedic deities
}

export class HymnalLogicalUnitExtractor {
  private scripturePatternService: ScripturePatternService;

  constructor() {
    this.scripturePatternService = ScripturePatternService.getInstance();
  }

  private readonly DEFAULT_OPTIONS: HymnalExtractionOptions = {
    minVerses: 2,
    maxVerses: 12,
    preferCompleteHymns: true,
    includeRitualChants: true,
    focusOnKeyDeities: true
  };

  // Major Vedic deities
  private readonly VEDIC_DEITIES = [
    'agni', 'indra', 'soma', 'varuna', 'mitra', 'surya', 'savitr',
    'pūṣan', 'viṣṇu', 'rudra', 'brahmanaspati', 'vāyu', 'maruts',
    'aśvins', 'uṣas', 'pṛthivī', 'antarikṣa', 'dyauḥ'
  ];

  // Vedic meters and hymn structures
  private readonly VEDIC_METERS = [
    'gāyatrī', 'triṣṭubh', 'jagatī', 'anuṣṭubh', 'pankti'
  ];

  // Hymn markers and structural indicators
  private readonly HYMN_MARKERS = [
    /(?:sūkta|ṛc|mantra|hymn)/i,
    /(?:praisa|stuti|praise|glory)/i,
    /(?:yajña|sacrifice|offering)/i,
    /(?:devas|gods|divine)/i
  ];

  /**
   * Extract a hymn unit from Vedic text content
   * This method works on raw content and tries to find hymn patterns
   */
  extractLogicalUnit(content: string, filename: string, options: Partial<HymnalExtractionOptions> = {}): HymnalUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`🎵 HymnalLogicalUnitExtractor: Processing ${filename}`);
    console.log(`📊 Options: minVerses=${opts.minVerses}, maxVerses=${opts.maxVerses}, preferCompleteHymns=${opts.preferCompleteHymns}`);

    try {
      // Parse content into verses with references
      const verses = this.parseHymnalVerses(content, filename);
      console.log(`📖 Found ${verses.length} hymnal verses in ${filename}`);

      if (verses.length < opts.minVerses) {
        console.log(`❌ Not enough verses for hymn unit extraction (${verses.length} < ${opts.minVerses})`);
        return null;
      }

      // Try different extraction strategies in order of preference
      let unit: HymnalUnit | null = null;

      // Strategy 1: Extract complete hymn (highest priority for Vedas)
      if (opts.preferCompleteHymns) {
        unit = this.extractCompleteHymn(verses);
        if (unit) {
          console.log(`🎵 Found complete hymn: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 2: Extract hymn fragment with deity focus
      unit = this.extractHymnFragment(verses);
      if (unit) {
        console.log(`🎵 Found hymn fragment: ${unit.verses.length} verses`);
        return unit;
      }

      // Strategy 3: Extract ritual chant sequence
      if (opts.includeRitualChants) {
        unit = this.extractRitualChant(verses);
        if (unit) {
          console.log(`🔥 Found ritual chant: ${unit.verses.length} verses`);
          return unit;
        }
      }

      // Strategy 4: Extract devotional prayer
      unit = this.extractDevotionalPrayer(verses);
      if (unit) {
        console.log(`🙏 Found devotional prayer: ${unit.verses.length} verses`);
        return unit;
      }

      // Fallback: Extract a meaningful contiguous sequence
      unit = this.extractContiguousSequence(verses, opts);
      if (unit) {
        console.log(`🔗 Found contiguous hymnal sequence: ${unit.verses.length} verses`);
        return unit;
      }

      console.log(`❌ No suitable hymn unit found in ${filename}`);
      return null;

    } catch (error) {
      console.error(`💥 Error extracting hymn unit from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Parse hymnal content into individual verses with references
   * Handles both structured references (RvKh_1,1.1) and unstructured Vedic content
   */
  private parseHymnalVerses(content: string, filename: string): Array<{ reference: string; text: string; lineNumber: number }> {
    const verses: Array<{ reference: string; text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    console.log(`📖 Parsing ${lines.length} lines for hymnal verses...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers and empty lines, but process comment lines that contain references
      if (!line || line.startsWith('#') || line.startsWith('--')) {
        continue;
      }

      let reference: string;
      let text: string;

      // Look for Vedic reference patterns
      const vedicPatterns = [
        // Rig Veda Khila: RvKh_1,1.1
        /RvKh_(\d+),(\d+)\.(\d+)/i,
        // Rig Veda: RV_1,1.1
        /RV_(\d+),(\d+)\.(\d+)/i,
        // Sama Veda: SV_1,1.1
        /SV_(\d+),(\d+)\.(\d+)/i,
        // Yajur Veda: YV_1,1.1
        /YV_(\d+),(\d+)\.(\d+)/i,
        // General hymn patterns
        /hymn.*\d+.*verse.*\d+/i,
        /sūkta.*\d+/i
      ];

      let foundPattern = false;
      for (const pattern of vedicPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('RvKh')) {
            reference = `RvKh_${match[1]},${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('RV')) {
            reference = `RV_${match[1]},${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('SV')) {
            reference = `SV_${match[1]},${match[2]}.${match[3]}`;
          } else if (pattern.source.includes('YV')) {
            reference = `YV_${match[1]},${match[2]}.${match[3]}`;
          } else {
            reference = `Hymn_${i + 1}`;
          }
          text = this.extractVerseText(line, filename);
          foundPattern = true;
          break;
        }
      }

      if (!foundPattern) {
        // For unstructured hymnal content, create sequential references
        reference = `Verse_${i + 1}`;
        text = line;
      }

      if (text && text.length > 10) { // Only meaningful hymnal verses
        verses.push({
          reference,
          text,
          lineNumber: i + 1
        });
      }
    }

    console.log(`✅ Parsed ${verses.length} hymnal verses from content`);
    return verses;
  }

  /**
   * Extract complete hymn (primary for Vedic texts)
   */
  private extractCompleteHymn(verses: Array<{ reference: string; text: string; lineNumber: number }>): HymnalUnit | null {
    // Look for hymn boundaries and complete hymn structures
    const hymnBoundaries = [
      /(?:iti|sūkta|samāpta)/i,  // Hymn completion markers
      /(?:namaḥ|svāhā|vaṣaṭ)/i,  // Ritual completion markers
      /(?:\|\||\/\/)/i           // Structural separators
    ];

    // Find sequences that appear to be complete hymns
    for (let i = 0; i < verses.length - 2; i++) {
      const currentVerse = verses[i];
      const hasHymnContent = this.HYMN_MARKERS.some(marker => marker.test(currentVerse.text));

      if (hasHymnContent) {
        console.log(`🎵 Found hymn marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        // Try to find the hymn boundary (next hymn start or completion marker)
        const hymnVerses = [currentVerse];
        let j = i + 1;

        // Continue until we find a hymn boundary or reach maximum verses
        while (j < verses.length && hymnVerses.length < 8) {
          const nextVerse = verses[j];

          // Check if this continues the current hymn
          const continuesHymn = this.isHymnContinuation(currentVerse.text, nextVerse.text);
          const isHymnBoundary = hymnBoundaries.some(boundary => boundary.test(nextVerse.text));

          if (continuesHymn && !isHymnBoundary) {
            console.log(`🎵 Adding hymn continuation: ${nextVerse.reference}`);
            hymnVerses.push(nextVerse);
            j++;
          } else {
            console.log(`🎵 Hymn boundary found at: ${nextVerse.reference}`);
            break;
          }
        }

        if (hymnVerses.length >= 3) {
          console.log(`✅ Found complete hymn sequence: ${hymnVerses.length} verses`);
          return this.createHymnalUnit(hymnVerses, 'complete-hymn');
        }
      }
    }

    console.log(`❌ No complete hymns found`);
    return null;
  }

  /**
   * Extract hymn fragment focused on specific deity
   */
  private extractHymnFragment(verses: Array<{ reference: string; text: string; lineNumber: number }>): HymnalUnit | null {
    // Look for verses addressing specific deities
    const deityFocusedVerses = verses.filter(verse => {
      const lowerText = verse.text.toLowerCase();
      return this.VEDIC_DEITIES.some(deity => lowerText.includes(deity));
    });

    if (deityFocusedVerses.length >= 2) {
      // Group by deity and find clusters
      const deityClusters: { [deity: string]: Array<{ reference: string; text: string; lineNumber: number }> } = {};

      deityFocusedVerses.forEach(verse => {
        const lowerText = verse.text.toLowerCase();
        const deity = this.VEDIC_DEITIES.find(d => lowerText.includes(d));

        if (deity) {
          if (!deityClusters[deity]) {
            deityClusters[deity] = [];
          }
          deityClusters[deity].push(verse);
        }
      });

      // Find the largest cluster
      let largestCluster: Array<{ reference: string; text: string; lineNumber: number }> = [];
      let primaryDeity = '';

      Object.entries(deityClusters).forEach(([deity, cluster]) => {
        if (cluster.length > largestCluster.length) {
          largestCluster = cluster;
          primaryDeity = deity;
        }
      });

      if (largestCluster.length >= 2) {
        console.log(`🎵 Found deity-focused fragment for ${primaryDeity}: ${largestCluster.length} verses`);
        return this.createHymnalUnit(largestCluster, 'hymn-fragment');
      }
    }

    return null;
  }

  /**
   * Extract ritual chant sequence
   */
  private extractRitualChant(verses: Array<{ reference: string; text: string; lineNumber: number }>): HymnalUnit | null {
    // Look for ritual and sacrificial content
    const ritualMarkers = [
      /(?:yajña|sacrifice|offering|homa)/i,
      /(?:soma|havan|fire|agni)/i,
      /(?:ṛtvij|hotṛ|udgātṛ)/i,  // Vedic priests
      /(?:svāhā|vaṣaṭ|namaḥ)/i   // Ritual formulas
    ];

    // Find sequences with ritual content
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasRitualContent = ritualMarkers.some(marker => marker.test(currentVerse.text));

      if (hasRitualContent) {
        console.log(`🔥 Found ritual marker in verse ${currentVerse.reference}: ${currentVerse.text.substring(0, 50)}...`);

        const ritualVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related ritual verses
        while (j < verses.length && ritualVerses.length < 6) {
          const nextVerse = verses[j];

          // Check if this continues the ritual sequence
          const continuesRitual = ritualMarkers.some(marker => marker.test(nextVerse.text)) ||
                                this.isRitualContinuation(currentVerse.text, nextVerse.text);

          if (continuesRitual) {
            ritualVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (ritualVerses.length >= 2) {
          return this.createHymnalUnit(ritualVerses, 'ritual-chant');
        }
      }
    }

    return null;
  }

  /**
   * Extract devotional prayer
   */
  private extractDevotionalPrayer(verses: Array<{ reference: string; text: string; lineNumber: number }>): HymnalUnit | null {
    // Look for devotional and prayer content
    const devotionalMarkers = [
      /(?:praisa|praise|glory|bless)/i,
      /(?:devotion|worship|adoration)/i,
      /(?:grace|mercy|protection)/i,
      /(?:divine|god|deva)/i
    ];

    // Find sequences with devotional content
    for (let i = 0; i < verses.length - 1; i++) {
      const currentVerse = verses[i];
      const hasDevotionalContent = devotionalMarkers.some(marker => marker.test(currentVerse.text));

      if (hasDevotionalContent) {
        const prayerVerses = [currentVerse];
        let j = i + 1;

        // Continue collecting related devotional verses
        while (j < verses.length && prayerVerses.length < 5) {
          const nextVerse = verses[j];

          // Check if this continues the devotional sequence
          const continuesDevotional = devotionalMarkers.some(marker => marker.test(nextVerse.text));

          if (continuesDevotional) {
            prayerVerses.push(nextVerse);
            j++;
          } else {
            break;
          }
        }

        if (prayerVerses.length >= 2) {
          return this.createHymnalUnit(prayerVerses, 'devotional-prayer');
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
    options: HymnalExtractionOptions
  ): HymnalUnit | null {
    if (verses.length < options.minVerses) return null;

    // Select a random starting point
    const maxStart = verses.length - options.minVerses;
    const startIndex = Math.floor(Math.random() * maxStart);
    const length = Math.min(
      options.maxVerses,
      Math.max(options.minVerses, verses.length - startIndex)
    );

    const sequence = verses.slice(startIndex, startIndex + length);
    return this.createHymnalUnit(sequence, 'hymn-fragment');
  }

  /**
   * Check if a verse continues a hymn
   */
  private isHymnContinuation(prevText: string, currentText: string): boolean {
    // Check for hymn continuity markers
    const continuityMarkers = [
      /(?:ca|and|then|thus)/i,
      /(?:indra|agni|soma|varuna)/i,  // Same deity mentioned
      /(?:devas|gods|divine)/i,       // Similar divine context
      /(?:praise|glory|worship)/i     // Similar devotional content
    ];

    return continuityMarkers.some(marker => marker.test(currentText)) ||
           this.shareHymnalElements(prevText, currentText);
  }

  /**
   * Check if a verse continues a ritual
   */
  private isRitualContinuation(prevText: string, currentText: string): boolean {
    // Check for ritual continuity
    const ritualElements = [
      /(?:yajña|homa|offering)/i,
      /(?:soma|havan|fire)/i,
      /(?:svāhā|vaṣaṭ)/i
    ];

    return ritualElements.some(element => element.test(currentText));
  }

  /**
   * Check if two verses share hymnal elements
   */
  private shareHymnalElements(text1: string, text2: string): boolean {
    // Extract potential hymnal elements
    const hymnalElements1 = this.extractHymnalElements(text1);
    const hymnalElements2 = this.extractHymnalElements(text2);

    // Check for overlap
    return hymnalElements1.some(element => hymnalElements2.includes(element));
  }

  /**
   * Extract hymnal elements from text
   */
  private extractHymnalElements(text: string): string[] {
    const elements: string[] = [];

    // Extract deities
    this.VEDIC_DEITIES.forEach(deity => {
      if (text.toLowerCase().includes(deity)) {
        elements.push(deity);
      }
    });

    // Extract ritual terms
    const ritualTerms = ['yajña', 'soma', 'havana', 'homa', 'svāhā', 'vaṣaṭ'];
    ritualTerms.forEach(term => {
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
   * Create a hymnal unit from verse sequence
   */
  private createHymnalUnit(
    verses: Array<{ reference: string; text: string; lineNumber: number }>,
    type: 'complete-hymn' | 'hymn-fragment' | 'ritual-chant' | 'devotional-prayer'
  ): HymnalUnit {
    // Parse the first reference to get context
    const firstRef = verses[0].reference;
    const vedicPatterns = [
      /RvKh_(\d+),(\d+)\.(\d+)/i,
      /RV_(\d+),(\d+)\.(\d+)/i,
      /SV_(\d+),(\d+)\.(\d+)/i,
      /YV_(\d+),(\d+)\.(\d+)/i
    ];

    let context: any = {};
    for (const pattern of vedicPatterns) {
      const match = firstRef.match(pattern);
      if (match) {
        context = {
          book: parseInt(match[1]),
          hymn: parseInt(match[2])
        };
        break;
      }
    }

    // Identify the primary deity
    let primaryDeity = 'Unknown';
    const lowerCombinedText = verses.map(v => v.text).join(' ').toLowerCase();

    for (const deity of this.VEDIC_DEITIES) {
      if (lowerCombinedText.includes(deity)) {
        primaryDeity = deity.charAt(0).toUpperCase() + deity.slice(1);
        break;
      }
    }

    // Identify ritual purpose if applicable
    let ritualPurpose: string | undefined;
    if (type === 'ritual-chant') {
      if (lowerCombinedText.includes('soma')) {
        ritualPurpose = 'Soma Sacrifice';
      } else if (lowerCombinedText.includes('yajña') || lowerCombinedText.includes('havan')) {
        ritualPurpose = 'Fire Sacrifice';
      } else if (lowerCombinedText.includes('praise') || lowerCombinedText.includes('prayer')) {
        ritualPurpose = 'Devotional Worship';
      }
    }

    // Identify meter if possible
    let meter: string | undefined;
    for (const vedicMeter of this.VEDIC_METERS) {
      if (lowerCombinedText.includes(vedicMeter)) {
        meter = vedicMeter.charAt(0).toUpperCase() + vedicMeter.slice(1);
        break;
      }
    }

    const lastVerseRef = verses[verses.length - 1].reference;
    let lastVerseNum: string;

    // Handle different reference formats
    const vedicRefMatch = lastVerseRef.match(/(?:RvKh|RV|SV|YV)_(\d+),(\d+)\.(\d+)/i);
    if (vedicRefMatch) {
      lastVerseNum = `${vedicRefMatch[2]}.${vedicRefMatch[3]}`;
    } else {
      // For Verse_N format, extract the number
      const verseMatch = lastVerseRef.match(/Verse_(\d+)/);
      lastVerseNum = verseMatch ? verseMatch[1] : lastVerseRef;
    }

    return {
      sanskrit: verses.map(v => v.text).join(' '),
      reference: `${verses[0].reference}-${lastVerseNum}`,
      hymnType: type,
      deity: primaryDeity,
      verses: verses.map(v => v.text),
      verseRange: {
        start: verses[0].reference,
        end: verses[verses.length - 1].reference,
        count: verses.length
      },
      context: {
        ...context,
        ritualPurpose,
        meter
      }
    };
  }

  /**
   * Convert hymnal unit to standard ExtractedWisdom format
   */
  toExtractedWisdom(unit: HymnalUnit, textName: string): {
    sanskrit: string;
    reference: string;
    textName: string;
    category: string;
    estimatedVerses: number;
    metadata?: any;
  } {
    return {
      sanskrit: unit.sanskrit,
      reference: `${textName} - ${unit.reference} (${unit.hymnType})`,
      textName,
      category: 'Vedas',
      estimatedVerses: unit.verseRange.count,
      metadata: {
        textType: GretilTextType.HYMNAL,
        hymnalUnit: unit
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
    options: Partial<HymnalExtractionOptions> = {}
  ): HymnalUnit | null {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log(`🎵 HymnalLogicalUnitExtractor: Processing ${verses.length} pre-extracted verses from ${filename}`);

    if (verses.length < opts.minVerses) {
      console.log(`❌ Not enough verses for hymn unit extraction (${verses.length} < ${opts.minVerses})`);
      return null;
    }

    // Convert to internal verse format
    const internalVerses = verses.map((v, i) => ({
      reference: v.reference,
      text: v.text,
      lineNumber: i + 1
    }));

    // Try complete hymn extraction first
    if (opts.preferCompleteHymns) {
      const completeHymn = this.extractCompleteHymn(internalVerses);
      if (completeHymn) {
        console.log(`✅ Found complete hymn sequence from pre-extracted verses`);
        return completeHymn;
      }
    }

    // Try hymn fragment extraction
    const hymnFragment = this.extractHymnFragment(internalVerses);
    if (hymnFragment) {
      console.log(`✅ Found hymn fragment sequence from pre-extracted verses`);
      return hymnFragment;
    }

    // Try ritual chant extraction
    if (opts.includeRitualChants) {
      const ritualChant = this.extractRitualChant(internalVerses);
      if (ritualChant) {
        console.log(`✅ Found ritual chant sequence from pre-extracted verses`);
        return ritualChant;
      }
    }

    // Try devotional prayer extraction
    const devotionalPrayer = this.extractDevotionalPrayer(internalVerses);
    if (devotionalPrayer) {
      console.log(`✅ Found devotional prayer sequence from pre-extracted verses`);
      return devotionalPrayer;
    }

    // Fallback to contiguous sequence
    const contiguousUnit = this.extractContiguousSequence(internalVerses, opts);
    if (contiguousUnit) {
      console.log(`✅ Found contiguous sequence from pre-extracted verses`);
      return contiguousUnit;
    }

    console.log(`❌ No hymnal unit found in pre-extracted verses`);
    return null;
  }
}

export const hymnalLogicalUnitExtractor = new HymnalLogicalUnitExtractor();
