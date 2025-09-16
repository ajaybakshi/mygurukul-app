/**
 * Sanskrit Cleanup Service
 * Extends the proven verse marker elimination system for audio generation
 * Preserves scholarly integrity while optimizing for speech synthesis
 */

import { ScripturePatternService } from './scripturePatternService';

export interface CleanupOptions {
  keepDandaForProsody: boolean; // Config flag for recitation style
  removeDigits: boolean;
  normalizeWhitespace: boolean;
  preserveCanonicalRefs: boolean; // Maintain Ram2,40.20 format in metadata
}

export interface CleanedSanskritText {
  cleanedText: string;
  originalText: string;
  canonicalReference?: string;
  metadata: {
    scriptureFile: string;
    cleanupOptions: CleanupOptions;
    patternsRemoved: string[];
    prosodyMarkers: string[];
    processingTime: number;
  };
}

export const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
  keepDandaForProsody: true,
  removeDigits: true,
  normalizeWhitespace: true,
  preserveCanonicalRefs: true,
};

/**
 * Sanskrit Cleanup Service
 * Builds on ScripturePatternService for comprehensive text cleaning
 */
export class SanskritCleanupService {
  private scriptureService: ScripturePatternService;
  private static instance: SanskritCleanupService;

  private constructor() {
    this.scriptureService = ScripturePatternService.getInstance();
  }

  static getInstance(): SanskritCleanupService {
    if (!SanskritCleanupService.instance) {
      SanskritCleanupService.instance = new SanskritCleanupService();
    }
    return SanskritCleanupService.instance;
  }

  /**
   * Cleans Sanskrit text for audio generation while preserving 
   * scholarly integrity. Builds on ScripturePatternService.
   */
  static cleanForAudio(
    text: string, 
    scriptureFile: string,
    options: CleanupOptions = DEFAULT_CLEANUP_OPTIONS
  ): CleanedSanskritText {
    const startTime = Date.now();
    const service = SanskritCleanupService.getInstance();
    return service.cleanTextForAudio(text, scriptureFile, options, startTime);
  }

  /**
   * Core cleaning method with comprehensive processing
   */
  private cleanTextForAudio(
    text: string,
    scriptureFile: string,
    options: CleanupOptions,
    startTime: number
  ): CleanedSanskritText {
    const originalText = text;
    let cleaned = text;
    const patternsRemoved: string[] = [];
    const prosodyMarkers: string[] = [];

    // Step 1: Extract canonical reference before cleaning
    const canonicalReference = this.extractCanonicalReference(cleaned, scriptureFile);

    // Step 2: Apply scripture-specific verse marker elimination
    const scriptureConfig = this.scriptureService.getScriptureConfig(scriptureFile);
    if (scriptureConfig) {
      scriptureConfig.patterns.forEach(pattern => {
        const matches = cleaned.match(pattern);
        if (matches) {
          patternsRemoved.push(...matches);
          cleaned = cleaned.replace(pattern, '');
        }
      });
    }

    // Step 3: Remove additional verse markers and references
    cleaned = this.removeAdditionalVerseMarkers(cleaned, patternsRemoved);

    // Step 4: Handle prosody markers (danda, etc.)
    if (options.keepDandaForProsody) {
      const dandaMatches = cleaned.match(/[।॥]/g);
      if (dandaMatches) {
        prosodyMarkers.push(...dandaMatches);
      }
    } else {
      cleaned = cleaned.replace(/[।॥]/g, '');
    }

    // Step 5: Remove digits if requested
    if (options.removeDigits) {
      const digitMatches = cleaned.match(/\d+/g);
      if (digitMatches) {
        patternsRemoved.push(...digitMatches);
        cleaned = cleaned.replace(/\d+/g, '');
      }
    }

    // Step 6: Normalize whitespace
    if (options.normalizeWhitespace) {
      cleaned = this.normalizeWhitespace(cleaned);
    }

    // Step 7: Final Sanskrit-specific cleaning
    cleaned = this.applySanskritSpecificCleaning(cleaned);

    const processingTime = Date.now() - startTime;

    return {
      cleanedText: cleaned,
      originalText,
      canonicalReference,
      metadata: {
        scriptureFile,
        cleanupOptions: options,
        patternsRemoved,
        prosodyMarkers,
        processingTime,
      },
    };
  }

  /**
   * Extract canonical reference before cleaning
   * Handles patterns like: garp1,1.31, krmp2,15.4, bhg_2,40.20, RvKh1.1.1, chup6.8.7
   */
  private extractCanonicalReference(text: string, scriptureFile: string): string | undefined {
    // Comprehensive regex patterns to match canonical references
    // Must contain numbers to be considered a canonical reference
    const canonicalPatterns = [
      // Pattern 1: word_optionalNumbers,numbers.numbers (e.g., bhg_2,40.20, garp1,1.31)
      /([a-zA-Z]+(?:_\d+)?,\d+\.\d+)/g,
      // Pattern 2: wordNumbers,numbers.numbers (e.g., krmp2,15.4)
      /([a-zA-Z]+\d+,\d+\.\d+)/g,
      // Pattern 3: wordNumbers.numbers.numbers (e.g., RvKh1.1.1, chup6.8.7)
      /([a-zA-Z]+\d+\.\d+\.\d+)/g,
      // Pattern 4: word_optionalNumbers,numbers (e.g., krmp2,15)
      /([a-zA-Z]+(?:_\d+)?,\d+)/g,
      // Pattern 5: wordNumbers,numbers (e.g., krmp2,15)
      /([a-zA-Z]+\d+,\d+)/g,
      // Pattern 6: wordNumbers.numbers (e.g., Rv1.1)
      /([a-zA-Z]+\d+\.\d+)/g
    ];

    // Find all matches from all patterns and return the earliest one
    let earliestMatch: { reference: string; index: number } | null = null;
    
    for (const pattern of canonicalPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const reference = match[0];
        const index = match.index || 0;
        
        // Clean up any surrounding markers but preserve the reference format
        const cleanedRef = reference
          .replace(/^\/\/\s*/, '')  // Remove leading //
          .replace(/\s*\/\/$/, '')  // Remove trailing //
          .replace(/^\[/, '')       // Remove leading [
          .replace(/\]$/, '')       // Remove trailing ]
          .replace(/^\(/, '')       // Remove leading (
          .replace(/\)$/, '')       // Remove trailing )
          .trim();
        
        // Validate that it looks like a canonical reference (must contain numbers)
        if (cleanedRef && /\d/.test(cleanedRef) && /^[a-zA-Z]+/.test(cleanedRef)) {
          // Check if this is the earliest match so far
          if (!earliestMatch || index < earliestMatch.index) {
            earliestMatch = { reference: cleanedRef, index };
          }
        }
      }
    }
    
    return earliestMatch ? earliestMatch.reference : undefined;
  }

  /**
   * Remove additional verse markers not covered by scripture patterns
   */
  private removeAdditionalVerseMarkers(text: string, patternsRemoved: string[]): string {
    let cleaned = text;

    // Remove common verse markers
    const additionalPatterns = [
      /\[[\d,\.]+\]/g,           // [1.2.3] format
      /\(\d+\)/g,                // (1) format
      /^\d+\.\s*/gm,             // Leading numbers with dots
      /^\d+\s*/gm,               // Leading numbers
      /^[IVX]+\.\s*/gm,          // Roman numerals
      /^[a-z]\)\s*/gm,           // Letter markers
      /^[A-Z]\)\s*/gm,           // Capital letter markers
    ];

    additionalPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        patternsRemoved.push(...matches);
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  /**
   * Normalize whitespace for better audio generation
   */
  private normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces to single
      .replace(/\n\s*\n/g, '\n')      // Multiple newlines to single
      .replace(/^\s+|\s+$/gm, '')     // Trim line ends
      .trim();                        // Trim overall
  }

  /**
   * Apply Sanskrit-specific cleaning rules
   */
  private applySanskritSpecificCleaning(text: string): string {
    return text
      // Remove common Sanskrit text artifacts
      .replace(/[॥।]+/g, '')          // Remove danda markers if not keeping for prosody
      .replace(/[।॥]/g, '')           // Remove any remaining danda
      .replace(/[^\u0900-\u097F\u0020\u000A\u000D]/g, ' ') // Keep only Devanagari, space, newline, carriage return
      .replace(/\s+/g, ' ')           // Normalize spaces again
      .trim();
  }

  /**
   * Batch clean multiple texts
   */
  static cleanBatchForAudio(
    texts: Array<{ text: string; scriptureFile: string }>,
    options: CleanupOptions = DEFAULT_CLEANUP_OPTIONS
  ): CleanedSanskritText[] {
    return texts.map(({ text, scriptureFile }) =>
      SanskritCleanupService.cleanForAudio(text, scriptureFile, options)
    );
  }

  /**
   * Validate cleanup options
   */
  static validateOptions(options: Partial<CleanupOptions>): CleanupOptions {
    return {
      keepDandaForProsody: options.keepDandaForProsody ?? DEFAULT_CLEANUP_OPTIONS.keepDandaForProsody,
      removeDigits: options.removeDigits ?? DEFAULT_CLEANUP_OPTIONS.removeDigits,
      normalizeWhitespace: options.normalizeWhitespace ?? DEFAULT_CLEANUP_OPTIONS.normalizeWhitespace,
      preserveCanonicalRefs: options.preserveCanonicalRefs ?? DEFAULT_CLEANUP_OPTIONS.preserveCanonicalRefs,
    };
  }

  /**
   * Get cleanup statistics
   */
  static getCleanupStats(results: CleanedSanskritText[]): {
    totalProcessed: number;
    averageProcessingTime: number;
    totalPatternsRemoved: number;
    scripturesProcessed: string[];
  } {
    const totalProcessed = results.length;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / totalProcessed;
    const totalPatternsRemoved = results.reduce((sum, r) => sum + r.metadata.patternsRemoved.length, 0);
    const scripturesProcessed = [...new Set(results.map(r => r.metadata.scriptureFile))];

    return {
      totalProcessed,
      averageProcessingTime,
      totalPatternsRemoved,
      scripturesProcessed,
    };
  }
}
