"use strict";
/**
 * Sanskrit Cleanup Service
 * Extends the proven verse marker elimination system for audio generation
 * Preserves scholarly integrity while optimizing for speech synthesis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanskritCleanupService = exports.DEFAULT_CLEANUP_OPTIONS = void 0;
const scripturePatternService_1 = require("./scripturePatternService");
exports.DEFAULT_CLEANUP_OPTIONS = {
    keepDandaForProsody: true,
    removeDigits: true,
    normalizeWhitespace: true,
    preserveCanonicalRefs: true,
};
/**
 * Sanskrit Cleanup Service
 * Builds on ScripturePatternService for comprehensive text cleaning
 */
class SanskritCleanupService {
    constructor() {
        this.scriptureService = scripturePatternService_1.ScripturePatternService.getInstance();
    }
    static getInstance() {
        if (!SanskritCleanupService.instance) {
            SanskritCleanupService.instance = new SanskritCleanupService();
        }
        return SanskritCleanupService.instance;
    }
    /**
     * Cleans Sanskrit text for audio generation while preserving
     * scholarly integrity. Builds on ScripturePatternService.
     */
    static cleanForAudio(text, scriptureFile, options = exports.DEFAULT_CLEANUP_OPTIONS) {
        const startTime = Date.now();
        const service = SanskritCleanupService.getInstance();
        return service.cleanTextForAudio(text, scriptureFile, options, startTime);
    }
    /**
     * Core cleaning method with comprehensive processing
     */
    cleanTextForAudio(text, scriptureFile, options, startTime) {
        const originalText = text;
        let cleaned = text;
        const patternsRemoved = [];
        const prosodyMarkers = [];
        // Step 1: Extract canonical reference before cleaning
        const canonicalReference = this.extractCanonicalReference(cleaned, scriptureFile);
        // Step 2: Remove the canonical reference from the text to prevent pattern conflicts
        if (canonicalReference) {
            // Remove the canonical reference from the text
            cleaned = cleaned.replace(canonicalReference, '');
        }
        // Step 3: Apply scripture-specific verse marker elimination
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
        // Step 4: Remove additional verse markers and references
        cleaned = this.removeAdditionalVerseMarkers(cleaned, patternsRemoved);
        // Step 4.5: Remove any remaining canonical reference patterns
        cleaned = this.removeRemainingCanonicalPatterns(cleaned);
        // Step 5: Handle prosody markers (danda, etc.)
        if (options.keepDandaForProsody) {
            const dandaMatches = cleaned.match(/[।॥]/g);
            if (dandaMatches) {
                prosodyMarkers.push(...dandaMatches);
            }
        }
        else {
            cleaned = cleaned.replace(/[।॥]/g, '');
        }
        // Step 6: Remove digits if requested (but preserve canonical references)
        if (options.removeDigits) {
            // Only remove standalone digits, not those in canonical references
            const standaloneDigits = cleaned.match(/\b\d+\b/g);
            if (standaloneDigits) {
                patternsRemoved.push(...standaloneDigits);
                cleaned = cleaned.replace(/\b\d+\b/g, '');
            }
        }
        // Step 7: Normalize whitespace
        if (options.normalizeWhitespace) {
            cleaned = this.normalizeWhitespace(cleaned);
        }
        // Step 8: Final Sanskrit-specific cleaning
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
    extractCanonicalReference(text, scriptureFile) {
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
            /([a-zA-Z]+\d+\.\d+)/g,
            // Pattern 7: word_underscore_numbers.numbers.numbers (e.g., RV_1.1.1)
            /([a-zA-Z]+_\d+\.\d+\.\d+)/g,
            // Pattern 8: word_underscore_numbers.numbers (e.g., RV_1.1)
            /([a-zA-Z]+_\d+\.\d+)/g,
            // Pattern 9: brackets with numbers (e.g., [2.40.20])
            /(\[\d+\.\d+\.\d+\])/g,
            // Pattern 10: brackets with numbers (e.g., [1.1.1])
            /(\[\d+\.\d+\])/g
        ];
        // Find all matches from all patterns and return the earliest one
        let earliestMatch = null;
        for (const pattern of canonicalPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const reference = match[0];
                const index = match.index || 0;
                // Clean up any surrounding markers but preserve the reference format
                const cleanedRef = reference
                    .replace(/^\/\/\s*/, '') // Remove leading //
                    .replace(/\s*\/\/$/, '') // Remove trailing //
                    .replace(/^\[/, '') // Remove leading [
                    .replace(/\]$/, '') // Remove trailing ]
                    .replace(/^\(/, '') // Remove leading (
                    .replace(/\)$/, '') // Remove trailing )
                    .trim();
                // Validate that it looks like a canonical reference (must contain numbers)
                if (cleanedRef && /\d/.test(cleanedRef)) {
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
    removeAdditionalVerseMarkers(text, patternsRemoved) {
        let cleaned = text;
        // Remove common verse markers
        const additionalPatterns = [
            /\[[\d,\.]+\]/g, // [1.2.3] format
            /\(\d+\)/g, // (1) format
            /^\d+\.\s*/gm, // Leading numbers with dots
            /^\d+\s*/gm, // Leading numbers
            /^[IVX]+\.\s*/gm, // Roman numerals
            /^[a-z]\)\s*/gm, // Letter markers
            /^[A-Z]\)\s*/gm, // Capital letter markers
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
     * Remove any remaining canonical reference patterns
     */
    removeRemainingCanonicalPatterns(text) {
        let cleaned = text;
        // Remove any remaining canonical reference patterns
        const canonicalPatterns = [
            /[a-zA-Z]+\d+,\d+\.\d+/g, // wordNumbers,numbers.numbers
            /[a-zA-Z]+\d+\.\d+\.\d+/g, // wordNumbers.numbers.numbers
            /[a-zA-Z]+\d+,\d+/g, // wordNumbers,numbers
            /[a-zA-Z]+\d+\.\d+/g, // wordNumbers.numbers
            /[a-zA-Z]+_\d+\.\d+\.\d+/g, // word_underscore_numbers.numbers.numbers
            /[a-zA-Z]+_\d+\.\d+/g, // word_underscore_numbers.numbers
        ];
        canonicalPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        return cleaned;
    }
    /**
     * Normalize whitespace for better audio generation
     */
    normalizeWhitespace(text) {
        return text
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
            .replace(/^\s+|\s+$/gm, '') // Trim line ends
            .trim(); // Trim overall
    }
    /**
     * Apply Sanskrit-specific cleaning rules
     * Preserves both Devanagari and IAST text for transliteration
     */
    applySanskritSpecificCleaning(text) {
        return text
            // Remove common Sanskrit text artifacts but preserve IAST characters
            .replace(/[॥।]+/g, '') // Remove danda markers if not keeping for prosody
            .replace(/[।॥]/g, '') // Remove any remaining danda
            // Remove scripture markers and brackets but preserve IAST characters
            .replace(/\/\/\s*/g, '') // Remove // markers
            .replace(/\[\s*\]/g, '') // Remove empty brackets
            .replace(/\[\d+\.\d+\.\d+\]/g, '') // Remove bracket references
            .replace(/\[\d+\.\d+\]/g, '') // Remove bracket references
            .replace(/\(\d+\)/g, '') // Remove (1) markers
            // Keep Devanagari, IAST (Latin with diacritics), spaces, and newlines
            .replace(/[^\u0900-\u097F\u0020-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u000A\u000D]/g, ' ')
            .replace(/\s+/g, ' ') // Normalize spaces again
            .trim();
    }
    /**
     * Batch clean multiple texts
     */
    static cleanBatchForAudio(texts, options = exports.DEFAULT_CLEANUP_OPTIONS) {
        return texts.map(({ text, scriptureFile }) => SanskritCleanupService.cleanForAudio(text, scriptureFile, options));
    }
    /**
     * Validate cleanup options
     */
    static validateOptions(options) {
        return {
            keepDandaForProsody: options.keepDandaForProsody ?? exports.DEFAULT_CLEANUP_OPTIONS.keepDandaForProsody,
            removeDigits: options.removeDigits ?? exports.DEFAULT_CLEANUP_OPTIONS.removeDigits,
            normalizeWhitespace: options.normalizeWhitespace ?? exports.DEFAULT_CLEANUP_OPTIONS.normalizeWhitespace,
            preserveCanonicalRefs: options.preserveCanonicalRefs ?? exports.DEFAULT_CLEANUP_OPTIONS.preserveCanonicalRefs,
        };
    }
    /**
     * Get cleanup statistics
     */
    static getCleanupStats(results) {
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
exports.SanskritCleanupService = SanskritCleanupService;
