/**
 * Comprehensive Hardcoded Scripture Pattern System
 * Maps all 36 scriptures to their specific verse patterns and extractors
 * Zero chance of missing patterns - guaranteed clean extraction
 */

export interface ScripturePattern {
  abbreviation: string;
  patterns: RegExp[];
  extractor: 'NarrativeLogicalUnitExtractor' | 'PhilosophicalLogicalUnitExtractor' | 'HymnalLogicalUnitExtractor' | 'DialogueLogicalUnitExtractor' | 'EpicLogicalUnitExtractor';
}

export interface ScripturePatterns {
  [scriptureFile: string]: ScripturePattern;
}

/**
 * COMPLETE PATTERN MAP FOR ALL 36 SCRIPTURES
 * Every scripture file has explicit pattern definition
 */
export const SCRIPTURE_PATTERNS: ScripturePatterns = {
  // PURANAS - Narrative/Philosophical Content
  'Agni_Purana.txt': {
    abbreviation: 'ap',
    patterns: [
      /\/\/\s*ap_[\d,\.]+\s*\/\//g,
      /ap_[\d,\.]+/g,
      /\/\/\s*Agni-Purana\s*\/\//g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Bhagvata_Purana.txt': {
    abbreviation: 'bp',
    patterns: [
      /\/\/\s*bp_[\d,\.]+\s*\/\//g,
      /BP_[\d,\.]+/g,
      /bhagvata_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Bhramanda_Purana.txt': {
    abbreviation: 'bramp',
    patterns: [
      /\/\/\s*bramp_[\d,\.]+\s*\/\//g,
      /bramp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Brahma_Purana.txt': {
    abbreviation: 'brap',
    patterns: [
      /\/\/\s*brap_[\d,\.]+\s*\/\//g,
      /brap_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'DeviBhagvata_Purana.txt': {
    abbreviation: 'dbp',
    patterns: [
      /\/\/\s*dbp_[\d,\.]+\s*\/\//g,
      /dbp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Garuda_Purana.txt': {
    abbreviation: 'garp',
    patterns: [
      /\/\/\s*garp_[\d,\.]+\s*\/\//g,
      /garp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Kurma_Purana.txt': {
    abbreviation: 'kūrmp',
    patterns: [
      /\/\/\s*kūrmp_[\d,\.]+\s*\/\//g,
      /kūrmp_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Linga_Purana.txt': {
    abbreviation: 'lip',
    patterns: [
      /\/\/\s*lip_[\d,\.]+\s*\/\//g,
      /LiP_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Markandya_Purana.txt': {
    abbreviation: 'markp',
    patterns: [
      /\/\/\s*markp_[\d\.]+\s*\/\//g,
      /markp_[\d\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Matasya_Purana.txt': {
    abbreviation: 'matp',
    patterns: [
      /\/\/\s*matp_[\d,\.]+\s*\/\//g,
      /matp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Narada-Purana.txt': {
    abbreviation: 'narp',
    patterns: [
      /\/\/\s*narp_[\d,\.]+\s*\/\//g,
      /narp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Revakhanda_Skanda_Purana.txt': {
    abbreviation: 'skp',
    patterns: [
      /\/\/\s*skp_[\d,\.]+\s*\/\//g,
      /skp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Revakhanda_Vayu_Purana.txt': {
    abbreviation: 'vayp',
    patterns: [
      /\/\/\s*vayp_[\d,\.]+\s*\/\//g,
      /vayp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Siva_Purana.txt': {
    abbreviation: 'sivp',
    patterns: [
      /\/\/\s*sivp_[\d,\.]+\s*\/\//g,
      /sivp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Vamana_Purana.txt': {
    abbreviation: 'vamp',
    patterns: [
      /\/\/\s*vamp_[\d,\.]+\s*\/\//g,
      /vamp_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  'Vishnu_Purana.txt': {
    abbreviation: 'vp',
    patterns: [
      /\/\/\s*vp_[\d,\.]+\s*\/\//g,
      /VP_[\d,\.]+/g
    ],
    extractor: 'NarrativeLogicalUnitExtractor'
  },
  
  // UPANISHADS - Philosophical Content
  'Aiteryo_Upanishad.txt': {
    abbreviation: 'aitup',
    patterns: [
      /\/\/\s*aitup_[\d,\.]+\s*\/\//g,
      /aitup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'BrahadAranyaka_Upanishad.txt': {
    abbreviation: 'bu',
    patterns: [
      /\/\/\s*bu_[\d,\.]+\s*\/\//g,
      /BU_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Brahmabindu_Upanishad.txt': {
    abbreviation: 'bbup',
    patterns: [
      /\/\/\s*bbup_[\d,\.]+\s*\/\//g,
      /bbup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Chandogya_Upanishad.txt': {
    abbreviation: 'chup',
    patterns: [
      /\/\/\s*chup_[\d,\.]+\s*\/\//g,
      /chup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Garbh_Upanishad.txt': {
    abbreviation: 'garbup',
    patterns: [
      /\/\/\s*garbup_[\d,\.]+\s*\/\//g,
      /garbup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Iso_Upanishad.txt': {
    abbreviation: 'iu',
    patterns: [
      /\/\/\s*iu_[\d,\.]+\s*\/\//g,
      /IU_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Kaivalya_Upanishad.txt': {
    abbreviation: 'kaivup',
    patterns: [
      /\/\/\s*kaivup_[\d,\.]+\s*\/\//g,
      /kaivup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Katha_Upanishad.txt': {
    abbreviation: 'ku',
    patterns: [
      /\/\/\s*ku_[\d,\.]+\s*\/\//g,
      /KU_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Mandukya_Upanishad.txt': {
    abbreviation: 'mu',
    patterns: [
      /\/\/\s*mu_[\d,\.]+\s*\/\//g,
      /MU_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'NadaBindu_Upanishad.txt': {
    abbreviation: 'nadup',
    patterns: [
      /\/\/\s*nadup_[\d,\.]+\s*\/\//g,
      /nadup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Prashan_Upanishad.txt': {
    abbreviation: 'prup',
    patterns: [
      /\/\/\s*prup_[\d,\.]+\s*\/\//g,
      /prup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Sira_Upanishad.txt': {
    abbreviation: 'sirup',
    patterns: [
      /\/\/\s*sirup_[\d,\.]+\s*\/\//g,
      /sirup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'SivaSankalpa_Upanishad.txt': {
    abbreviation: 'sivsankup',
    patterns: [
      /\/\/\s*sivsankup_[\d,\.]+\s*\/\//g,
      /sivsankup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Svetasvatra_Upanishda.txt': {
    abbreviation: 'svetup',
    patterns: [
      /\/\/\s*svetup_[\d,\.]+\s*\/\//g,
      /svetup_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  'Taittiriya_Upanishad.txt': {
    abbreviation: 'taitt',
    patterns: [
      /\/\/\s*taitt_[\d,\.]+\s*\/\//g,
      /Taitt_[\d,\.]+/g
    ],
    extractor: 'PhilosophicalLogicalUnitExtractor'
  },
  
  // VEDAS - Hymnal Content
  'Rig_Veda.txt': {
    abbreviation: 'rv',
    patterns: [
      /\/\/\s*rv_[\d,\.]+\s*\/\//g,
      /RV_[\d,\.]+/g,
      /RvKh_[\d,\.]+/g
    ],
    extractor: 'HymnalLogicalUnitExtractor'
  },
  
  'Sama_Veda.txt': {
    abbreviation: 'sv',
    patterns: [
      /\/\/\s*sv_[\d,\.]+\s*\/\//g,
      /SV_[\d,\.]+/g
    ],
    extractor: 'HymnalLogicalUnitExtractor'
  },
  
  'Paippalada_Samhita.txt': {
    abbreviation: 'paip',
    patterns: [
      /\/\/\s*paip_[\d,\.]+\s*\/\//g,
      /paip_[\d,\.]+/g
    ],
    extractor: 'HymnalLogicalUnitExtractor'
  },
  
  // EPIC - Dialogue/Narrative Content
  'Valmiki_Ramayana.txt': {
    abbreviation: 'ram',
    patterns: [
      /\/\/\s*ram_[\d,\.]+\s*\/\//g,
      /ram_[\d,\.]+/g
    ],
    extractor: 'EpicLogicalUnitExtractor'
  },
  
  // PHILOSOPHICAL TEXT - Dialogue Content
  'Bhagvad_Gita.txt': {
    abbreviation: 'bhg',
    patterns: [
      /\/\/\s*bhg_[\d,\.]+\s*\/\//g,
      /bhg\s+[\d,\.]+/g
    ],
    extractor: 'DialogueLogicalUnitExtractor'
  }
};

/**
 * UNIVERSAL EXTRACTION METHOD
 * Uses scripture-specific patterns for guaranteed clean extraction
 */
export class ScripturePatternService {
  private static instance: ScripturePatternService;
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): ScripturePatternService {
    if (!ScripturePatternService.instance) {
      ScripturePatternService.instance = new ScripturePatternService();
    }
    return ScripturePatternService.instance;
  }
  
  /**
   * VALIDATION ON STARTUP
   * Check every scripture file has pattern definition
   * Throw error if any missing
   */
  initialize(): void {
    if (this.initialized) return;
    
    console.log('🔍 Validating scripture pattern definitions...');
    
    const expectedScriptures = [
      'Agni_Purana.txt', 'Aiteryo_Upanishad.txt', 'Bhagvad_Gita.txt', 'Bhagvata_Purana.txt',
      'Bhramanda_Purana.txt', 'BrahadAranyaka_Upanishad.txt', 'Brahma_Purana.txt', 'Brahmabindu_Upanishad.txt',
      'Chandogya_Upanishad.txt', 'DeviBhagvata_Purana.txt', 'Garbh_Upanishad.txt', 'Garuda_Purana.txt',
      'Iso_Upanishad.txt', 'Kaivalya_Upanishad.txt', 'Katha_Upanishad.txt', 'Kurma_Purana.txt',
      'Linga_Purana.txt', 'Mandukya_Upanishad.txt', 'Markandya_Purana.txt', 'Matasya_Purana.txt',
      'NadaBindu_Upanishad.txt', 'Narada-Purana.txt', 'Paippalada_Samhita.txt', 'Prashan_Upanishad.txt',
      'Revakhanda_Skanda_Purana.txt', 'Revakhanda_Vayu_Purana.txt', 'Rig_Veda.txt', 'Sama_Veda.txt',
      'Sira_Upanishad.txt', 'SivaSankalpa_Upanishad.txt', 'Siva_Purana.txt', 'Svetasvatra_Upanishda.txt',
      'Taittiriya_Upanishad.txt', 'Valmiki_Ramayana.txt', 'Vamana_Purana.txt', 'Vishnu_Purana.txt'
    ];
    
    const missingScriptures = expectedScriptures.filter(scripture => !SCRIPTURE_PATTERNS[scripture]);
    
    if (missingScriptures.length > 0) {
      const error = `❌ MISSING PATTERN DEFINITIONS FOR: ${missingScriptures.join(', ')}`;
      console.error(error);
      throw new Error(error);
    }
    
    console.log(`✅ All ${expectedScriptures.length} scripture patterns validated successfully`);
    this.initialized = true;
  }
  
  /**
   * UNIVERSAL EXTRACTION METHOD
   * Extract clean verse text using scripture-specific patterns
   */
  extractVerseText(line: string, scriptureFile: string): string {
    if (!this.initialized) {
      this.initialize();
    }
    
    const config = SCRIPTURE_PATTERNS[scriptureFile];
    if (!config) {
      console.error(`❌ MISSING PATTERN FOR: ${scriptureFile}`);
      return line; // Fail safe
    }
    
    let cleaned = line;
    
    // Apply all patterns for this scripture
    config.patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Additional universal cleaning
    cleaned = cleaned
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    return cleaned;
  }
  
  /**
   * Get scripture configuration
   */
  getScriptureConfig(scriptureFile: string): ScripturePattern | null {
    if (!this.initialized) {
      this.initialize();
    }
    
    return SCRIPTURE_PATTERNS[scriptureFile] || null;
  }
  
  /**
   * Get all scripture files
   */
  getAllScriptureFiles(): string[] {
    return Object.keys(SCRIPTURE_PATTERNS);
  }
  
  /**
   * Get extractor type for scripture
   */
  getExtractorType(scriptureFile: string): string | null {
    const config = this.getScriptureConfig(scriptureFile);
    return config ? config.extractor : null;
  }
}
