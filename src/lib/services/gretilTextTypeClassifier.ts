/**
 * Gretil Text Type Classifier - Phase 1: Text Type Classification
 * Implements advanced pattern recognition for cross-corpus logical unit extraction
 */

import {
  GretilTextType,
  ClassificationConfidence,
  TextTypeClassification,
  ClassificationRule,
  GRETIL_CLASSIFICATION_RULES,
  LEGACY_TYPE_MAPPING,
  REVERSE_LEGACY_MAPPING,
  toLegacyTypeSpecialized,
  LegacyTextType
} from '../../types/gretil-types';

export class GretilTextTypeClassifier {
  /**
   * Classify a Gretil text document based on filename and content analysis
   */
  classifyText(filename: string, content: string): TextTypeClassification {
    const fileName = filename.toLowerCase();
    const normalizedContent = this.normalizeContent(content);

    // Analyze filename patterns
    const filenameMatches = this.analyzeFilename(fileName);

    // Analyze content patterns
    const contentMatches = this.analyzeContent(normalizedContent);

    // Analyze structural patterns
    const structuralMatches = this.analyzeStructural(content);

    // Combine all matches with priority weighting
    const allMatches = [
      ...filenameMatches.map(match => ({ ...match, weight: 1.0 })), // Filename matches have highest weight
      ...contentMatches.map(match => ({ ...match, weight: 0.7 })),  // Content matches medium weight
      ...structuralMatches.map(match => ({ ...match, weight: 0.5 })) // Structural matches lower weight
    ];

    // Score each text type based on matches and priorities
    const scores = this.calculateTypeScores(allMatches);

    // Determine the best classification
    const bestMatch = this.determineBestClassification(scores);

    return {
      textType: bestMatch.textType,
      confidence: bestMatch.confidence,
      detectedPatterns: bestMatch.patterns,
      reasoning: this.generateReasoning(bestMatch, filenameMatches, contentMatches, structuralMatches)
    };
  }

  /**
   * Convert new classification to legacy type for backward compatibility
   */
  toLegacyType(newType: GretilTextType): LegacyTextType {
    // Find the closest legacy type
    for (const [legacy, modern] of Object.entries(LEGACY_TYPE_MAPPING)) {
      if (modern === newType) {
        return legacy as LegacyTextType;
      }
    }
    return 'other';
  }

  /**
   * Convert legacy type to new classification
   */
  fromLegacyType(legacyType: LegacyTextType): GretilTextType {
    return LEGACY_TYPE_MAPPING[legacyType];
  }

  /**
   * Convert new classification back to legacy type with context awareness
   */
  toLegacyTypeWithContext(newType: GretilTextType, filename?: string): LegacyTextType {
    return toLegacyTypeSpecialized(newType, filename);
  }

  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[āīūṛḷēōṃḥśṣṇṭḍṅñ]/g, match => {
        // Normalize IAST characters for better pattern matching
        const map: Record<string, string> = {
          'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ḷ': 'l',
          'ē': 'e', 'ō': 'o', 'ṃ': 'm', 'ḥ': 'h',
          'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ṭ': 't', 'ḍ': 'd', 'ṅ': 'n', 'ñ': 'n'
        };
        return map[match] || match;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  private analyzeFilename(filename: string): Array<{ type: GretilTextType; pattern: string; priority: number }> {
    const matches: Array<{ type: GretilTextType; pattern: string; priority: number }> = [];

    for (const rule of GRETIL_CLASSIFICATION_RULES) {
      if (rule.patterns.filename) {
        for (const pattern of rule.patterns.filename) {
          if (pattern.test(filename)) {
            matches.push({
              type: rule.textType,
              pattern: `filename:${pattern.source}`,
              priority: rule.priority
            });
          }
        }
      }
    }

    return matches;
  }

  private analyzeContent(content: string): Array<{ type: GretilTextType; pattern: string; priority: number }> {
    const matches: Array<{ type: GretilTextType; pattern: string; priority: number }> = [];

    // Sample content for analysis (first 10KB to avoid performance issues)
    const sampleContent = content.substring(0, 10000);

    for (const rule of GRETIL_CLASSIFICATION_RULES) {
      // Check keyword frequency
      const keywordMatches = rule.keywords.filter(keyword =>
        sampleContent.includes(keyword.toLowerCase())
      );

      if (keywordMatches.length > 0) {
        matches.push({
          type: rule.textType,
          pattern: `keywords:[${keywordMatches.join(',')}]`,
          priority: rule.priority
        });
      }

      // Check content patterns
      if (rule.patterns.content) {
        for (const pattern of rule.patterns.content) {
          if (pattern.test(sampleContent)) {
            matches.push({
              type: rule.textType,
              pattern: `content:${pattern.source}`,
              priority: rule.priority
            });
          }
        }
      }
    }

    return matches;
  }

  private analyzeStructural(content: string): Array<{ type: GretilTextType; pattern: string; priority: number }> {
    const matches: Array<{ type: GretilTextType; pattern: string; priority: number }> = [];

    // Sample first 100 lines for structural analysis
    const lines = content.split('\n').slice(0, 100);

    for (const rule of GRETIL_CLASSIFICATION_RULES) {
      if (rule.patterns.structural) {
        for (const pattern of rule.patterns.structural) {
          // Check if any line matches the structural pattern
          const hasMatch = lines.some(line => pattern.test(line));
          if (hasMatch) {
            matches.push({
              type: rule.textType,
              pattern: `structural:${pattern.source}`,
              priority: rule.priority
            });
          }
        }
      }
    }

    return matches;
  }

  private calculateTypeScores(matches: Array<{ type: GretilTextType; pattern: string; priority: number; weight: number }>): Map<GretilTextType, { score: number; patterns: string[] }> {
    const scores = new Map<GretilTextType, { score: number; patterns: string[] }>();

    for (const match of matches) {
      const existing = scores.get(match.type) || { score: 0, patterns: [] };
      existing.score += match.priority * match.weight;
      existing.patterns.push(match.pattern);
      scores.set(match.type, existing);
    }

    return scores;
  }

  private determineBestClassification(scores: Map<GretilTextType, { score: number; patterns: string[] }>): {
    textType: GretilTextType;
    confidence: ClassificationConfidence;
    patterns: string[];
    score: number;
  } {
    if (scores.size === 0) {
      return {
        textType: GretilTextType.NARRATIVE,
        confidence: ClassificationConfidence.UNCERTAIN,
        patterns: [],
        score: 0
      };
    }

    // Sort by score descending
    const sortedScores = Array.from(scores.entries())
      .sort((a, b) => b[1].score - a[1].score);

    const [bestType, bestData] = sortedScores[0];
    const bestScore = bestData.score;

    // Determine confidence based on score and competition
    let confidence: ClassificationConfidence;

    if (bestScore >= 100) {
      confidence = ClassificationConfidence.HIGH;
    } else if (bestScore >= 50) {
      confidence = ClassificationConfidence.MEDIUM;
    } else if (sortedScores.length === 1 || bestScore > sortedScores[1][1].score * 1.5) {
      confidence = ClassificationConfidence.LOW;
    } else {
      confidence = ClassificationConfidence.UNCERTAIN;
    }

    return {
      textType: bestType,
      confidence,
      patterns: bestData.patterns,
      score: bestScore
    };
  }

  private generateReasoning(
    bestMatch: { textType: GretilTextType; confidence: ClassificationConfidence; patterns: string[]; score: number },
    filenameMatches: Array<{ type: GretilTextType; pattern: string; priority: number }>,
    contentMatches: Array<{ type: GretilTextType; pattern: string; priority: number }>,
    structuralMatches: Array<{ type: GretilTextType; pattern: string; priority: number }>
  ): string {
    const reasons: string[] = [];

    reasons.push(`Primary classification: ${bestMatch.textType} (score: ${bestMatch.score})`);

    if (filenameMatches.length > 0) {
      reasons.push(`Filename patterns: ${filenameMatches.map(m => m.pattern).join(', ')}`);
    }

    if (contentMatches.length > 0) {
      reasons.push(`Content patterns: ${contentMatches.map(m => m.pattern).join(', ')}`);
    }

    if (structuralMatches.length > 0) {
      reasons.push(`Structural patterns: ${structuralMatches.map(m => m.pattern).join(', ')}`);
    }

    reasons.push(`Confidence: ${bestMatch.confidence}`);

    return reasons.join('; ');
  }

  /**
   * Get detailed analysis for debugging purposes
   */
  analyzeForDebugging(filename: string, content: string): {
    filename: string;
    classification: TextTypeClassification;
    allMatches: {
      filename: Array<{ type: GretilTextType; pattern: string; priority: number }>;
      content: Array<{ type: GretilTextType; pattern: string; priority: number }>;
      structural: Array<{ type: GretilTextType; pattern: string; priority: number }>;
    };
    scores: Record<string, { score: number; patterns: string[] }>;
  } {
    const fileName = filename.toLowerCase();
    const normalizedContent = this.normalizeContent(content);

    const filenameMatches = this.analyzeFilename(fileName);
    const contentMatches = this.analyzeContent(normalizedContent);
    const structuralMatches = this.analyzeStructural(content);

    const allMatches = [
      ...filenameMatches.map(match => ({ ...match, weight: 1.0 })),
      ...contentMatches.map(match => ({ ...match, weight: 0.7 })),
      ...structuralMatches.map(match => ({ ...match, weight: 0.5 }))
    ];

    const scores = this.calculateTypeScores(allMatches);
    const classification = this.classifyText(filename, content);

    return {
      filename,
      classification,
      allMatches: {
        filename: filenameMatches,
        content: contentMatches,
        structural: structuralMatches
      },
      scores: Object.fromEntries(scores)
    };
  }
}

export const gretilTextTypeClassifier = new GretilTextTypeClassifier();
