/**
 * TransliterationService - Intelligent IAST to Devanagari conversion
 * Builds on the proven Sanskrit processing architecture using sanscript library
 * 
 * Features:
 * - Uses proven sanscript library for accurate transliteration
 * - Robust script detection using Unicode ranges
 * - Prevents double-conversion errors  
 * - Maintains scholarly accuracy
 * - Optimized for audio generation pipeline
 */

import * as sanscript from 'sanscript';

export enum ScriptType {
  DEVANAGARI = 'devanagari',
  IAST = 'iast', 
  MIXED = 'mixed',
  UNKNOWN = 'unknown'
}

export interface TransliterationOptions {
  devanagariPreferred: boolean;
  preserveNumbers: boolean; // For canonical refs like Ram2,40.20
  handleMixed: boolean;
}

export interface TransliterationResult {
  result: string;
  wasTransliterated: boolean;
  detectedScript: ScriptType;
  confidence: number;
  processingTimeMs: number;
}

/**
 * Comprehensive IAST to Devanagari mapping
 * Based on scholarly standards for Sanskrit transliteration
 */
const IAST_TO_DEVANAGARI_MAP: Record<string, string> = {
  // Vowels
  'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
  'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'ḹ': 'ॡ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  
  // Consonants - Velar
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
  
  // Consonants - Palatal
  'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
  
  // Consonants - Retroflex
  'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
  
  // Consonants - Dental
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  
  // Consonants - Labial
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  
  // Semivowels
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
  
  // Sibilants
  'ś': 'श', 'ṣ': 'ष', 's': 'स',
  
  // Aspirate
  'h': 'ह',
  
  // Special characters
  'ṃ': 'ं', 'ḥ': 'ः', '|': '।', '||': '॥'
};

/**
 * Devanagari to IAST mapping for reverse conversion detection
 */
const DEVANAGARI_TO_IAST_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(IAST_TO_DEVANAGARI_MAP).map(([iast, devanagari]) => [devanagari, iast])
);

/**
 * Unicode ranges for script detection
 */
const UNICODE_RANGES = {
  DEVANAGARI: { start: 0x0900, end: 0x097F },
  DEVANAGARI_EXTENDED: { start: 0xA8E0, end: 0xA8FF },
  DEVANAGARI_EXTENDED_A: { start: 0x11B00, end: 0x11B5F },
  LATIN_BASIC: { start: 0x0020, end: 0x007F },
  LATIN_EXTENDED_A: { start: 0x0100, end: 0x017F },
  LATIN_EXTENDED_B: { start: 0x0180, end: 0x024F },
  LATIN_EXTENDED_ADDITIONAL: { start: 0x1E00, end: 0x1EFF }
};

export class TransliterationService {
  private static instance: TransliterationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): TransliterationService {
    if (!TransliterationService.instance) {
      TransliterationService.instance = new TransliterationService();
    }
    return TransliterationService.instance;
  }

  /**
   * Initialize the service with validation
   */
  initialize(): void {
    if (this.initialized) return;
    
    console.log('🔤 Initializing TransliterationService...');
    
    // Validate mapping completeness
    const missingMappings = this.validateMappings();
    if (missingMappings.length > 0) {
      console.warn(`⚠️ Missing mappings: ${missingMappings.join(', ')}`);
    }
    
    console.log('✅ TransliterationService initialized successfully');
    this.initialized = true;
  }

  /**
   * Main transliteration method with intelligent script detection
   */
  static transliterate(
    text: string,
    options: TransliterationOptions = {
      devanagariPreferred: true,
      preserveNumbers: true,
      handleMixed: true
    }
  ): TransliterationResult {
    const startTime = Date.now();
    const service = TransliterationService.getInstance();
    return service.performTransliteration(text, options, startTime);
  }

  /**
   * Core transliteration logic with script detection
   */
  private performTransliteration(
    text: string,
    options: TransliterationOptions,
    startTime: number
  ): TransliterationResult {
    if (!this.initialized) {
      this.initialize();
    }

    // Step 1: Detect script type
    const scriptDetection = this.detectScript(text);
    
    // Step 2: Determine if transliteration is needed
    const needsTransliteration = this.shouldTransliterate(scriptDetection, options);
    
    // Step 3: Perform transliteration if needed
    let result = text;
    let wasTransliterated = false;
    
    if (needsTransliteration) {
      result = this.convertIASTToDevanagari(text, options);
      wasTransliterated = true;
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      result,
      wasTransliterated,
      detectedScript: scriptDetection.scriptType,
      confidence: scriptDetection.confidence,
      processingTimeMs
    };
  }

  /**
   * Intelligent script detection using Unicode ranges and pattern analysis
   */
  private detectScript(text: string): { scriptType: ScriptType; confidence: number } {
    if (!text || text.trim().length === 0) {
      return { scriptType: ScriptType.UNKNOWN, confidence: 0 };
    }

    let devanagariCount = 0;
    let iastCount = 0;
    let otherCount = 0;
    let totalChars = 0;

    // Analyze each character
    for (const char of text) {
      const codePoint = char.codePointAt(0) || 0;
      
      if (this.isDevanagari(codePoint)) {
        devanagariCount++;
      } else if (this.isIAST(char)) {
        iastCount++;
      } else if (this.isWhitespaceOrPunctuation(char)) {
        // Skip whitespace and punctuation in analysis
        continue;
      } else {
        otherCount++;
      }
      
      totalChars++;
    }

    // Calculate confidence based on character distribution
    const devanagariRatio = devanagariCount / totalChars;
    const iastRatio = iastCount / totalChars;
    const otherRatio = otherCount / totalChars;

    // Determine script type with confidence
    if (devanagariRatio > 0.7) {
      return { scriptType: ScriptType.DEVANAGARI, confidence: devanagariRatio };
    } else if (iastRatio > 0.7) {
      return { scriptType: ScriptType.IAST, confidence: iastRatio };
    } else if (devanagariRatio > 0.3 && iastRatio > 0.3) {
      return { scriptType: ScriptType.MIXED, confidence: Math.min(devanagariRatio, iastRatio) };
    } else if (otherRatio > 0.5) {
      return { scriptType: ScriptType.UNKNOWN, confidence: otherRatio };
    } else {
      // Default to IAST if ambiguous but has some IAST characters
      return { scriptType: ScriptType.IAST, confidence: iastRatio };
    }
  }

  /**
   * Check if character is in Devanagari Unicode range
   */
  private isDevanagari(codePoint: number): boolean {
    return (
      (codePoint >= UNICODE_RANGES.DEVANAGARI.start && codePoint <= UNICODE_RANGES.DEVANAGARI.end) ||
      (codePoint >= UNICODE_RANGES.DEVANAGARI_EXTENDED.start && codePoint <= UNICODE_RANGES.DEVANAGARI_EXTENDED.end) ||
      (codePoint >= UNICODE_RANGES.DEVANAGARI_EXTENDED_A.start && codePoint <= UNICODE_RANGES.DEVANAGARI_EXTENDED_A.end)
    );
  }

  /**
   * Check if character is IAST (Latin with diacritics)
   */
  private isIAST(char: string): boolean {
    const codePoint = char.codePointAt(0) || 0;
    
    // Check if it's in Latin ranges
    const isLatin = (
      (codePoint >= UNICODE_RANGES.LATIN_BASIC.start && codePoint <= UNICODE_RANGES.LATIN_BASIC.end) ||
      (codePoint >= UNICODE_RANGES.LATIN_EXTENDED_A.start && codePoint <= UNICODE_RANGES.LATIN_EXTENDED_A.end) ||
      (codePoint >= UNICODE_RANGES.LATIN_EXTENDED_B.start && codePoint <= UNICODE_RANGES.LATIN_EXTENDED_B.end) ||
      (codePoint >= UNICODE_RANGES.LATIN_EXTENDED_ADDITIONAL.start && codePoint <= UNICODE_RANGES.LATIN_EXTENDED_ADDITIONAL.end)
    );

    // Check if it's a known IAST character
    const isKnownIAST = Object.keys(IAST_TO_DEVANAGARI_MAP).includes(char.toLowerCase());
    
    return isLatin && (isKnownIAST || /[a-zA-Z]/.test(char));
  }

  /**
   * Check if character is whitespace or punctuation
   */
  private isWhitespaceOrPunctuation(char: string): boolean {
    return /[\s\.,;:!?()[\]{}'"`~@#$%^&*+=|\\/<>]/.test(char);
  }

  /**
   * Determine if transliteration should be performed
   */
  private shouldTransliterate(
    scriptDetection: { scriptType: ScriptType; confidence: number },
    options: TransliterationOptions
  ): boolean {
    const { scriptType, confidence } = scriptDetection;

    // Don't transliterate if already in Devanagari and confidence is high
    if (scriptType === ScriptType.DEVANAGARI && confidence > 0.8) {
      return false;
    }

    // Don't transliterate if unknown script
    if (scriptType === ScriptType.UNKNOWN) {
      return false;
    }

    // Transliterate IAST to Devanagari if preferred
    if (scriptType === ScriptType.IAST && options.devanagariPreferred) {
      return true;
    }

    // Handle mixed scripts based on options
    if (scriptType === ScriptType.MIXED && options.handleMixed) {
      return options.devanagariPreferred;
    }

    return false;
  }

  /**
   * Convert IAST text to Devanagari using proven sanscript library
   */
  private convertIASTToDevanagari(text: string, options: TransliterationOptions): string {
    try {
      // Use sanscript library for accurate transliteration
      let result = sanscript.t(text, 'iast', 'devanagari');
      
      // Fix known sanscript library issues
      result = this.fixSanscriptIssues(result);
      
      // Preserve numbers if requested
      if (options.preserveNumbers) {
        result = this.restoreNumbers(result, text);
      }

      // Clean up any remaining artifacts
      result = this.cleanupResult(result);

      return result;
    } catch (error) {
      console.warn('Sanscript transliteration failed, falling back to custom logic:', error);
      // Fallback to custom logic if sanscript fails
      return this.fallbackTransliteration(text, options);
    }
  }

  /**
   * Fix known issues with sanscript library transliteration
   */
  private fixSanscriptIssues(result: string): string {
    // Fix ḷ character issue - sanscript produces ऌ instead of ळ
    result = result.replace(/ऌ/g, 'ळ');
    
    // Fix e vowel mark issue - sanscript sometimes produces ए instead of े
    // This happens when e follows a consonant with a hyphen
    result = result.replace(/ळए/g, 'ळे');
    
    // Fix other known issues if any
    // Add more fixes as needed
    
    return result;
  }

  /**
   * Fallback transliteration method using custom logic
   * Used when sanscript library fails
   */
  private fallbackTransliteration(text: string, options: TransliterationOptions): string {
    let result = text;

    // Handle special cases first (conjuncts, vowel combinations)
    result = this.handleSpecialCases(result);

    // Convert individual characters
    result = this.convertCharacters(result);

    // Preserve numbers if requested
    if (options.preserveNumbers) {
      result = this.restoreNumbers(result, text);
    }

    // Clean up any remaining artifacts
    result = this.cleanupResult(result);

    return result;
  }

  /**
   * Handle special cases like conjuncts and vowel combinations
   */
  private handleSpecialCases(text: string): string {
    let result = text;

    // Handle common conjuncts first (order matters)
    const conjuncts = [
      { iast: 'kṣ', devanagari: 'क्ष' },
      { iast: 'jñ', devanagari: 'ज्ञ' },
      { iast: 'tr', devanagari: 'त्र' },
      { iast: 'śr', devanagari: 'श्र' },
      { iast: 'ai', devanagari: 'ऐ' },
      { iast: 'au', devanagari: 'औ' }
    ];

    for (const conjunct of conjuncts) {
      result = result.replace(new RegExp(conjunct.iast, 'g'), conjunct.devanagari);
    }

    return result;
  }

  /**
   * Convert individual IAST characters to Devanagari
   */
  private convertCharacters(text: string): string {
    let result = text;

    // Convert each character using the mapping
    for (const [iast, devanagari] of Object.entries(IAST_TO_DEVANAGARI_MAP)) {
      const regex = new RegExp(iast, 'g');
      result = result.replace(regex, devanagari);
    }

    return result;
  }

  /**
   * Restore numbers that were converted
   */
  private restoreNumbers(result: string, originalText: string): string {
    // Extract numbers from original text
    const numbers = originalText.match(/\d+/g) || [];
    
    // Replace converted numbers back
    let restored = result;
    let numberIndex = 0;
    
    // This is a simplified approach - in practice, you'd need more sophisticated
    // logic to match numbers to their original positions
    for (const number of numbers) {
      const devanagariNumber = this.convertNumberToDevanagari(number);
      restored = restored.replace(devanagariNumber, number);
    }

    return restored;
  }

  /**
   * Convert Arabic numerals to Devanagari (if needed)
   */
  private convertNumberToDevanagari(number: string): string {
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return number.replace(/\d/g, digit => devanagariDigits[parseInt(digit)]);
  }

  /**
   * Clean up the final result
   */
  private cleanupResult(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  /**
   * Validate mapping completeness
   */
  private validateMappings(): string[] {
    const missing: string[] = [];
    
    // Check for common IAST characters that might be missing
    const commonIAST = ['ā', 'ī', 'ū', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'ṃ', 'ḥ', 'ś', 'ṣ', 'ṭ', 'ḍ', 'ṇ', 'ñ', 'ṅ'];
    
    for (const char of commonIAST) {
      if (!IAST_TO_DEVANAGARI_MAP[char]) {
        missing.push(char);
      }
    }
    
    return missing;
  }

  /**
   * Batch transliteration for multiple texts
   */
  static transliterateBatch(
    texts: string[],
    options: TransliterationOptions = {
      devanagariPreferred: true,
      preserveNumbers: true,
      handleMixed: true
    }
  ): TransliterationResult[] {
    return texts.map(text => TransliterationService.transliterate(text, options));
  }

  /**
   * Get transliteration statistics
   */
  static getTransliterationStats(results: TransliterationResult[]): {
    totalProcessed: number;
    totalTransliterated: number;
    averageProcessingTime: number;
    scriptDistribution: Record<ScriptType, number>;
  } {
    const totalProcessed = results.length;
    const totalTransliterated = results.filter(r => r.wasTransliterated).length;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0) / totalProcessed;
    
    const scriptDistribution: Record<ScriptType, number> = {
      [ScriptType.DEVANAGARI]: 0,
      [ScriptType.IAST]: 0,
      [ScriptType.MIXED]: 0,
      [ScriptType.UNKNOWN]: 0
    };
    
    results.forEach(result => {
      scriptDistribution[result.detectedScript]++;
    });

    return {
      totalProcessed,
      totalTransliterated,
      averageProcessingTime,
      scriptDistribution
    };
  }
}
