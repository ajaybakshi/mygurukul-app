/**
 * Enhanced Gretil Text Type Classification for Cross-Corpus Logical Unit Extraction
 * Phase 1: Text Type Classification
 */

export enum GretilTextType {
  // Major narrative epics with extended storytelling
  EPIC = 'EPIC',

  // Hymn collections with ritual and devotional content
  HYMNAL = 'HYMNAL',

  // Philosophical treatises, dialogues, and teachings
  PHILOSOPHICAL = 'PHILOSOPHICAL',

  // Dialogues between characters (Socratic method, teacher-student)
  DIALOGUE = 'DIALOGUE',

  // Mythological narratives, legends, and historical accounts
  NARRATIVE = 'NARRATIVE'
}

/**
 * Classification confidence levels for text type detection
 */
export enum ClassificationConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNCERTAIN = 'UNCERTAIN'
}

/**
 * Enhanced text classification result with confidence scoring
 */
export interface TextTypeClassification {
  textType: GretilTextType;
  confidence: ClassificationConfidence;
  detectedPatterns: string[];
  reasoning: string;
}

/**
 * Pattern recognition rules for text type classification
 */
export interface ClassificationRule {
  textType: GretilTextType;
  patterns: {
    filename?: RegExp[];
    content?: RegExp[];
    structural?: RegExp[];
  };
  keywords: string[];
  priority: number; // Higher priority = more specific patterns
}

/**
 * Legacy compatibility type for backward compatibility
 */
export type LegacyTextType = 'veda' | 'upanishad' | 'purana' | 'epic' | 'gita' | 'other';

/**
 * Mapping between legacy and new text types
 */
export const LEGACY_TYPE_MAPPING: Record<LegacyTextType, GretilTextType> = {
  'veda': GretilTextType.HYMNAL,
  'upanishad': GretilTextType.PHILOSOPHICAL,
  'purana': GretilTextType.NARRATIVE,
  'epic': GretilTextType.EPIC,
  'gita': GretilTextType.PHILOSOPHICAL,
  'other': GretilTextType.NARRATIVE
};

/**
 * Reverse mapping for backward compatibility
 * Maps new text types back to legacy types
 */
export const REVERSE_LEGACY_MAPPING: Record<GretilTextType, LegacyTextType> = {
  [GretilTextType.HYMNAL]: 'veda',
  [GretilTextType.PHILOSOPHICAL]: 'upanishad', // Default to upanishad for philosophical texts
  [GretilTextType.NARRATIVE]: 'purana', // Default to purana for narrative texts
  [GretilTextType.EPIC]: 'epic',
  [GretilTextType.DIALOGUE]: 'other' // Dialogues don't have a direct legacy equivalent
};

/**
 * Specialized reverse mapping that preserves specific text identities
 */
export function toLegacyTypeSpecialized(newType: GretilTextType, filename?: string): LegacyTextType {
  // Special case: Bhagavad Gita should map back to 'gita', not 'upanishad'
  if (filename && filename.toLowerCase().includes('gita') && newType === GretilTextType.PHILOSOPHICAL) {
    return 'gita';
  }

  return REVERSE_LEGACY_MAPPING[newType];
}

/**
 * Classification rules for Gretil texts based on sample analysis
 */
export const GRETIL_CLASSIFICATION_RULES: ClassificationRule[] = [
  // EPIC - High priority for well-known epics
  {
    textType: GretilTextType.EPIC,
    priority: 100,
    keywords: ['ramayana', 'rāmāyaṇa', 'mahabharata', 'mahābhārata', 'epic', 'itihāsa'],
    patterns: {
      filename: [
        /ramayana/i,
        /rāmāyaṇa/i,
        /mahabharata/i,
        /mahābhārata/i,
        /valmiki/i,
        /vyasa/i
      ],
      content: [
        /sarga/i,  // Chapter indicator in epics
        /kāṇḍa/i,  // Book division in Ramayana
        /parva/i,  // Book division in Mahabharata
        /rāma/i,
        /arjuna/i,
        /bhīma/i,
        /yudhiṣṭhira/i
      ]
    }
  },

  // HYMNAL - Vedas and hymn collections
  {
    textType: GretilTextType.HYMNAL,
    priority: 90,
    keywords: ['veda', 'ṛgveda', 'sāmaveda', 'yajurveda', 'atharvaveda', 'saṃhitā', 'hymn', 'ṛc'],
    patterns: {
      filename: [
        /veda/i,
        /ṛgveda/i,
        /sāmaveda/i,
        /yajurveda/i,
        /atharvaveda/i,
        /saṃhitā/i,
        /khila/i
      ],
      content: [
        /indra/i,  // Common Vedic deity
        /agni/i,   // Common Vedic deity
        /soma/i,   // Vedic ritual drink
        /ṛta/i,    // Vedic concept of cosmic order
        /asvamedha/i,  // Vedic ritual
        /yajña/i   // Vedic sacrifice
      ],
      structural: [
        /RvKh_\d+,\d+\.\d+/i  // Rig Veda Khila reference format
      ]
    }
  },

  // BHAGAVAD GITA - Special case: Dialogue between Krishna and Arjuna
  {
    textType: GretilTextType.DIALOGUE,
    priority: 85, // Higher than PHILOSOPHICAL (80) to override
    keywords: ['bhagavad gita', 'bhagvad gita', 'gita', 'gītā', 'krishna', 'kṛṣṇa', 'arjuna'],
    patterns: {
      filename: [
        /bhagavad.*gita/i,
        /bhagvad.*gita/i,
        /gita/i,
        /gītā/i
      ],
      content: [
        /krishna.*arjuna|arjuna.*krishna/i,
        /dhṛtarāṣṭra.*sañjaya|sañjaya.*dhṛtarāṣṭra/i,
        /uvāca.*arjuna|arjuna.*uvāca/i,
        /uvāca.*krishna|krishna.*uvāca/i
      ],
      structural: [
        /bhg \d+\.\d+/i  // Bhagavad Gita format: bhg 2.15
      ]
    }
  },

  // PHILOSOPHICAL - Upanishads, Sutras (excluding Bhagavad Gita)
  {
    textType: GretilTextType.PHILOSOPHICAL,
    priority: 80,
    keywords: ['upanishad', 'upaniṣad', 'sutra', 'darśana', 'philosophy', 'brahman', 'ātman'],
    patterns: {
      filename: [
        /upanishad/i,
        /upaniṣad/i,
        /brahmasutra/i,
        /nyāyasutra/i
      ],
      content: [
        /brahman/i,
        /ātman/i,
        /mokṣa/i,
        /saṃsāra/i,
        /karma/i,
        /dharma/i,
        /jñāna/i,
        /bhakti/i,
        /yoga/i,
        /tattva/i,
        /ahaṃkāra/i
      ],
      structural: [
        /chup_\d+,\d+\.\d+/i,  // Chandogya Upanishad format
        /BU_\d+,\d+\.\d+/i,    // Brihadaranyaka Upanishad format
        /KU_\d+,\d+\.\d+/i,    // Katha Upanishad format
        /IU_\d+\.\d+/i,        // Isha Upanishad format
        /MU_\d+\.\d+/i         // Mandukya Upanishad format
      ]
    }
  },

  // DIALOGUE - Structured question-answer format
  {
    textType: GretilTextType.DIALOGUE,
    priority: 70,
    keywords: ['dialogue', 'saṃvāda', 'praśna', 'uttara', 'question', 'answer', 'asked', 'replied'],
    patterns: {
      filename: [
        /dialogue/i,
        /saṃvāda/i,
        /praśna/i,
        /kathā/i
      ],
      content: [
        /(?:atha|iti|uvāca|āha|prāha|abravīt)/i,  // Sanskrit dialogue markers
        /pṛṣṭa/i,  // Asked
        /pratyuvāca/i,  // Replied
        /uvāca/i,   // Said
        /kathayati/i  // Narrates
      ],
      structural: [
        /["']([^"']+)["']\s+(?:uvāca|āha|prāha)/i  // Dialogue format with quotes
      ]
    }
  },

  // NARRATIVE - Puranas, stories, myths
  {
    textType: GretilTextType.NARRATIVE,
    priority: 60,
    keywords: ['purana', 'purāṇa', 'myth', 'legend', 'story', 'kathā', 'ākhyāna', 'narrative'],
    patterns: {
      filename: [
        /purana/i,
        /purāṇa/i,
        /mahapurana/i,
        /upapurana/i
      ],
      content: [
        /śloka/i,   // Verse indicator
        /ākhyāna/i, // Narrative
        /kathā/i,   // Story
        /itihāsa/i, // History/legend
        /devī/i,    // Goddess
        /deva/i,    // God
        /ṛṣi/i,     // Sage
        /rāja/i,    // King
        /rājā/i
      ],
      structural: [
        /ap_\d+\.\d+[a-z]*/i,  // Agni Purana format
        /LiP_\d+,\d+\.\d+/i    // Linga Purana format
      ]
    }
  }
];
