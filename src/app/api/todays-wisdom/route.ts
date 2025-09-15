import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { crossCorpusWisdomService } from '../../../lib/services/crossCorpusWisdomService';
import { gretilWisdomService } from '../../../lib/services/gretilWisdomService';

interface EnhancedRawTextAnnotation {
  // Primary Information
  textName: string;           // "Bhagavad Gita", "Brahmanda Purana"
  tradition: string;          // "Hindu Philosophy", "Vedic Cosmology"
  chapter: string;            // "Chapter 2: The Yoga of Knowledge"
  section: string;            // "Arjuna's Dilemma", "Creation of Universe"
  
  // Context Information  
  spiritualTheme: string;     // "Dharma and Duty", "Divine Love"
  characters?: string[];      // ["Krishna", "Arjuna"]
  location?: string;          // "Kurukshetra Battlefield", "Cosmic Realm"
  
  // Cultural Context
  historicalPeriod?: string;  // "Classical Period", "Vedic Era"
  literaryGenre: string;      // "Philosophical Dialogue", "Cosmological Hymn"
  
  // Reference Information (for scholars)
  technicalReference?: string; // "BG 2.47", "ap_1.001ab"
  estimatedAge?: string;       // "2000+ years", "3000+ years"
  
  // Legacy fields for backward compatibility
  theme?: string;
  source?: string;
}

interface TodaysWisdom {
  // Raw sacred text (what seeker reads first)
  rawText: string;
  rawTextAnnotation: EnhancedRawTextAnnotation;
  
  // AI enhanced interpretation (Guru's wisdom)
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  timestamp: string;
  encouragement: string;
  sourceLocation?: string;
  filesSearched?: string[];
  metadata?: string;
}

interface WisdomDimensions {
  character?: string;
  theme?: string;
  location?: string;
  narrativeType?: string;
  emotionalTone?: string;
  complexity?: string;
}

interface UserWisdomHistory {
  recentSelections: string[];
  sessionCount: number;
  lastAccess: string;
  preferredComplexity: 'simple' | 'intermediate' | 'advanced';
}

interface EnhancedSection {
  content: string;
  source: string;
  metadata?: string;
  dimensions: WisdomDimensions;
  uniqueId: string;
}

const WISDOM_DIMENSIONS = {
  characters: ['Rama', 'Sita', 'Lakshmana', 'Hanuman', 'Ravana', 'Bharata', 'Dasharatha', 'Kaikeyi'],
  themes: ['dharma', 'devotion', 'courage', 'sacrifice', 'wisdom', 'love', 'duty', 'truth'],
  locations: ['Ayodhya', 'forest', 'Lanka', 'Mithila', 'Chitrakoot', 'Panchavati', 'Kishkindha'],
  narrativeTypes: ['dialogue', 'action', 'reflection', 'teaching', 'prophecy', 'ceremony', 'battle'],
  emotionalTones: ['inspiring', 'contemplative', 'dramatic', 'peaceful', 'heroic', 'compassionate'],
  complexity: ['simple', 'intermediate', 'advanced']
};

// Initialize Google Cloud Storage
function initializeStorage() {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return new Storage();
    }
    
    if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      const credentials = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      };
      
      return new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials
      });
    }
    
    throw new Error('Google Cloud Storage credentials not found');
  } catch (error) {
    console.error('Error initializing Google Cloud Storage:', error);
    throw error;
  }
}

// Get all files from a folder in the bucket
async function getAllFilesFromFolder(folderName: string): Promise<{ fileName: string; content: string }[]> {
  try {
    const storage = initializeStorage();
    const bucketName = 'mygurukul-sacred-texts-corpus';
    const bucket = storage.bucket(bucketName);
    
    const [files] = await bucket.getFiles({
      prefix: folderName + '/',
    });
    
    console.log(`Found ${files.length} files in ${folderName} folder`);
    
    const fileContents = [];
    
    for (const file of files) {
      try {
        if (file.name.endsWith('.txt') || file.name.endsWith('.json')) {
          const [data] = await file.download();
          const content = data.toString('utf8');
          
          if (content.length > 100) {
            fileContents.push({
              fileName: file.name,
              content: content
            });
          }
        }
      } catch (fileError) {
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
        console.warn(`Skipping file ${file.name}:`, errorMessage);
      }
    }
    
    console.log(`Successfully loaded ${fileContents.length} files from ${folderName}`);
    return fileContents;
    
  } catch (error) {
    console.error('Error accessing folder in Google Cloud Storage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve files from ${folderName}: ${errorMessage}`);
  }
}

// Enhanced extraction function for both metadata and narrative content
function extractMetadataAndContent(text: string, selectedIndex: number) {
  const metadataMatches = text.match(/\[.*?\]/g) || [];
  const metadata = metadataMatches.join(' ');
  
  const cleanText = text.replace(/\[.*?\]/g, '').replace(/\n{3,}/g, '\n\n');
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  const contextStart = Math.max(0, selectedIndex - 5);
  const contextEnd = Math.min(sentences.length, selectedIndex + 5);
  let narrative = sentences.slice(contextStart, contextEnd).join('. ').trim() + '.';
  
  narrative = narrative
    .replace(/^["\s\n]+/, '')
    .replace(/["\s\n]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    metadata: metadata,
    narrative: narrative,
    combined: `${metadata}\n\nNarrative: ${narrative}`
  };
}

// Extract actual story content from text, removing metadata and structural annotations
function extractActualContent(text: string): string {
  let cleanText = text.replace(/\[.*?\]/g, '');
  
  const paragraphs = cleanText.split('\n\n').filter(paragraph => {
    const trimmed = paragraph.trim();
    return trimmed.length > 100 && 
           !trimmed.match(/^(KANDA|SECTION|CHARACTERS|PLACES|THEMES|CONTEXT):/i) &&
           !trimmed.match(/^\d+\./) &&
           !trimmed.match(/^[A-Z\s]+:$/i) &&
           !trimmed.match(/^---+$/);
  });
  
  return paragraphs.slice(0, 3).join('\n\n');
}

// Multi-dimensional wisdom selection - THE CORE ENHANCEMENT
async function selectTodaysWisdomFromFiles(
  files: { fileName: string; content: string }[], 
  sourceName: string
): Promise<TodaysWisdom> {
  try {
    // Phase 1: Extract and categorize all content sections
    const enhancedSections: EnhancedSection[] = [];
    const filesSearched: string[] = [];
    
    files.forEach(file => {
      filesSearched.push(file.fileName);
      const actualContent = extractActualContent(file.content);
      
      if (actualContent.length > 200) {
        const sentences = actualContent.split(/[.!?]+/).filter(s => s.trim().length > 50);
        
        for (let i = 0; i < sentences.length; i++) {
          const extractedContent = extractMetadataAndContent(actualContent, i);
          
          if (extractedContent.narrative.length > 150 && extractedContent.narrative.length < 2000) {
            const dimensions = analyzeDimensions(extractedContent.combined, file.fileName);
            const uniqueId = generateUniqueId(extractedContent.narrative, dimensions);
            
            enhancedSections.push({
              content: extractedContent.narrative,
              source: file.fileName,
              metadata: extractedContent.metadata,
              dimensions,
              uniqueId
            });
          }
        }
      }
    });

    // Phase 2: Multi-dimensional selection with user history
    const userHistory = getUserWisdomHistory();
    const selectedSection = selectMultiDimensionalWisdom(enhancedSections, userHistory);
    
    // Phase 3: Update user history
    updateUserWisdomHistory(selectedSection.uniqueId);

    // Phase 4: Generate enhanced wisdom
    const extractedContent = extractMetadataAndContent(selectedSection.content, 0);
    
    let finalWisdom = extractedContent.narrative;
    let finalEncouragement = generateEncouragement(determineWisdomType(extractedContent.narrative));
    
    try {
      console.log('Attempting AI enhancement...');
      const enhancedWisdom = await createEnhancedWisdom(extractedContent, sourceName);
      
      if (enhancedWisdom && enhancedWisdom.length > 50) {
        finalWisdom = enhancedWisdom;
        finalEncouragement = generateContextualEncouragement(enhancedWisdom);
      }
    } catch (error) {
      console.log('AI enhancement error, using fallback');
    }
    
    // Use enhanced metadata formatting
    const enhancedMetadata = formatWisdomMetadata(
      sourceName,
      selectedSection.source,
      extractedContent.metadata,
      selectedSection.dimensions
    );

    return {
      // Raw sacred text (what seeker reads first)
      rawText: extractedContent.narrative,
      rawTextAnnotation: enhancedMetadata,
      
      // AI enhanced interpretation (Guru's wisdom)
      wisdom: finalWisdom,
      context: `Daily wisdom from ${sourceName} - ${selectedSection.dimensions.character || 'Sacred'} wisdom on ${selectedSection.dimensions.theme || 'spiritual growth'}`,
      type: determineWisdomType(finalWisdom),
      sourceName,
      timestamp: new Date().toISOString(),
      encouragement: finalEncouragement,
      sourceLocation: `From ${selectedSection.source}`,
      filesSearched: filesSearched.slice(0, 5),
      metadata: `${extractedContent.metadata} | Selection: ${JSON.stringify(selectedSection.dimensions)}`
    };
    
  } catch (error) {
    console.error('Error selecting wisdom:', error);
    return {
      rawText: `The sacred texts of ${sourceName} contain infinite wisdom. Each verse, each story carries profound meaning for those who seek truth and righteousness.`,
      rawTextAnnotation: {
        textName: sourceName,
        tradition: 'Sacred Literature',
        chapter: 'Sacred Chapter',
        section: 'Sacred Section',
        spiritualTheme: 'Divine Wisdom',
        characters: ['Sacred Beings'],
        location: 'Sacred Realm',
        literaryGenre: 'Spiritual Teaching',
        historicalPeriod: 'Ancient Tradition',
        estimatedAge: 'Timeless',
        // Legacy compatibility
        theme: 'wisdom',
        source: 'Sacred Texts'
      },
      wisdom: `The sacred texts of ${sourceName} contain infinite wisdom. Each verse, each story carries profound meaning for those who seek truth and righteousness.`,
      context: `Daily wisdom from ${sourceName}`,
      type: 'teaching',
      sourceName,
      timestamp: new Date().toISOString(),
      encouragement: "Would you like to explore this wisdom deeper? Ask me about any aspect that resonates with you.",
      filesSearched: []
    };
  }
}

function determineWisdomType(text: string): 'story' | 'verse' | 'teaching' {
  if (text.match(/once upon a time|there was|it came to pass|in days of yore|story/i)) {
    return 'story';
  }
  if (text.match(/verse|sloka|said|spoke|addressed/i)) {
    return 'verse';
  }
  return 'teaching';
}

// Enhanced Perplexity integration for AI-powered wisdom enhancement
async function createEnhancedWisdom(extractedContent: any, sourceName: string): Promise<string> {
  try {
    const prompt = `You are a wise spiritual guide sharing wisdom from the ${sourceName}. Transform this passage into beautiful, meaningful daily wisdom for modern seekers.

CONTEXT PROVIDED:
${extractedContent.combined}

Please create engaging spiritual guidance that:

1. **Sets the Scene**: Use the character and place information to paint the picture
2. **Tells the Story**: Weave the narrative into a flowing, engaging tale  
3. **Reveals the Wisdom**: Extract the deeper spiritual lesson
4. **Connects to Today**: Show how this applies to modern life challenges
5. **Inspires Action**: End with gentle guidance for the reader's journey

Format as a warm, compassionate response (300-450 words) that feels like personal guidance from a spiritual teacher. Begin with "In the sacred pages of the ${sourceName}, we discover..."

Make it personal, relatable, and deeply inspiring - not academic or distant.`;

    console.log('Making Perplexity API call...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    console.log('Perplexity API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Perplexity API response received, choices:', data.choices?.length || 0);
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.log('Unexpected Perplexity API response format:', JSON.stringify(data, null, 2));
        return extractedContent.narrative;
      }
    } else {
      const errorText = await response.text();
      console.log('Perplexity API error response:', errorText);
      return extractedContent.narrative;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('AI enhancement failed:', errorMessage);
    return extractedContent.narrative;
  }
}

// Enhanced Perplexity integration specifically for Sanskrit verses from Gretil corpus
async function createEnhancedGretilWisdom(gretilWisdom: any): Promise<string> {
  try {
    const prompt = `You are a wise Sanskrit scholar and spiritual guide sharing ancient wisdom from the sacred texts. A seeker has received this Sanskrit verse from the ${gretilWisdom.textName} and seeks understanding.

SANSKRIT VERSE:
${gretilWisdom.sanskrit}

SOURCE: ${gretilWisdom.textName} (${gretilWisdom.reference})
CATEGORY: ${gretilWisdom.category}

Please provide beautiful, meaningful spiritual guidance that:

1. **Translation**: Provide an accurate, flowing English translation of the Sanskrit
2. **Spiritual Significance**: Explain the deeper spiritual meaning and wisdom
3. **Universal Truth**: Connect this ancient teaching to timeless spiritual principles  
4. **Modern Relevance**: Show how this applies to contemporary life challenges
5. **Daily Practice**: Offer gentle, practical guidance for embodying this wisdom

Format as a warm, compassionate response (350-500 words) that feels like personal guidance from a spiritual teacher. Begin with "From the sacred verses of the ${gretilWisdom.textName}, this ancient Sanskrit wisdom speaks to us..."

Make it personal, inspiring, and deeply meaningful - bridging the ancient and modern worlds with love and wisdom.`;

    console.log('Making Perplexity API call for Gretil wisdom enhancement...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.7
      })
    });

    console.log('Perplexity API response status for Gretil:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Perplexity API response received for Gretil, choices:', data.choices?.length || 0);
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.log('Unexpected Perplexity API response format for Gretil:', JSON.stringify(data, null, 2));
        return gretilWisdom.sanskrit;
      }
    } else {
      const errorText = await response.text();
      console.log('Perplexity API error response for Gretil:', errorText);
      return gretilWisdom.sanskrit;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Gretil AI enhancement failed:', errorMessage);
    return gretilWisdom.sanskrit;
  }
}

function generateEncouragement(type: 'story' | 'verse' | 'teaching'): string {
  const encouragements = {
    story: "This story holds deeper meanings. Would you like to explore the spiritual significance behind these events?",
    verse: "These verses contain profound wisdom. Ask me about any aspect that resonates with you.",
    teaching: "This teaching offers guidance for daily life. Feel free to ask how you can apply this wisdom to your own journey."
  };
  
  return encouragements[type];
}

// Generate contextual encouragement based on enhanced wisdom content
function generateContextualEncouragement(wisdom: string): string {
  if (wisdom.includes('challenge') || wisdom.includes('difficulty')) {
    return "This wisdom speaks to life's challenges. How might you apply this guidance to your current situation?";
  } else if (wisdom.includes('love') || wisdom.includes('compassion')) {
    return "This teaching about love and compassion invites reflection. What does it reveal about your own heart?";
  } else if (wisdom.includes('journey') || wisdom.includes('path')) {
    return "This wisdom illuminates your spiritual path. What step might you take today to honor this guidance?";
  } else {
    return "This sacred wisdom offers guidance for your journey. What aspect resonates most deeply with you?";
  }
}

// Multi-dimensional analysis and selection functions
function analyzeDimensions(combinedContent: string, fileName: string): WisdomDimensions {
  const content = combinedContent.toLowerCase();
  
  const character = WISDOM_DIMENSIONS.characters.find(char => 
    content.includes(char.toLowerCase())) || 'unknown';
  
  const theme = WISDOM_DIMENSIONS.themes.find(theme => 
    content.includes(theme) || 
    (theme === 'dharma' && (content.includes('righteousness') || content.includes('duty'))) ||
    (theme === 'devotion' && (content.includes('devotion') || content.includes('bhakti'))) ||
    (theme === 'courage' && (content.includes('brave') || content.includes('fearless')))
  ) || 'wisdom';
  
  const location = WISDOM_DIMENSIONS.locations.find(loc => 
    content.includes(loc.toLowerCase())) || 'sacred realm';
  
  let narrativeType = 'teaching';
  if (content.includes('said') || content.includes('spoke')) narrativeType = 'dialogue';
  else if (content.includes('battle') || content.includes('fought')) narrativeType = 'action';
  else if (content.includes('meditat') || content.includes('reflect')) narrativeType = 'reflection';
  
  let emotionalTone = 'contemplative';
  if (content.includes('joy') || content.includes('celebration')) emotionalTone = 'inspiring';
  else if (content.includes('battle') || content.includes('conflict')) emotionalTone = 'dramatic';
  else if (content.includes('peace') || content.includes('calm')) emotionalTone = 'peaceful';
  else if (content.includes('hero') || content.includes('victory')) emotionalTone = 'heroic';
  
  let complexity: 'simple' | 'intermediate' | 'advanced' = 'intermediate';
  if (content.length < 500 && !content.includes('philosophy')) complexity = 'simple';
  else if (content.includes('metaphysical') || content.includes('cosmic') || content.includes('brahman')) complexity = 'advanced';
  
  return { character, theme, location, narrativeType, emotionalTone, complexity };
}

function generateUniqueId(content: string, dimensions: WisdomDimensions): string {
  const contentHash = content.substring(0, 50).replace(/\s+/g, '');
  const dimensionString = `${dimensions.character}-${dimensions.theme}-${dimensions.location}`;
  return `${dimensionString}-${contentHash.length}`;
}

// Simple user history management
let globalUserHistory: UserWisdomHistory = {
  recentSelections: [],
  sessionCount: 0,
  lastAccess: '',
  preferredComplexity: 'simple'
};

function getUserWisdomHistory(): UserWisdomHistory {
  const today = new Date().toDateString();
  if (globalUserHistory.lastAccess !== today) {
    globalUserHistory.sessionCount++;
    globalUserHistory.lastAccess = today;
  }
  return globalUserHistory;
}

function updateUserWisdomHistory(uniqueId: string): void {
  globalUserHistory.recentSelections.push(uniqueId);
  if (globalUserHistory.recentSelections.length > 10) {
    globalUserHistory.recentSelections = globalUserHistory.recentSelections.slice(-10);
  }
}

function selectMultiDimensionalWisdom(sections: EnhancedSection[], userHistory: UserWisdomHistory): EnhancedSection {
  const availableSections = sections.filter(section => 
    !userHistory.recentSelections.includes(section.uniqueId));
  
  const candidateSections = availableSections.length > 0 ? availableSections : sections;
  
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  
  const scoredSections = candidateSections.map(section => {
    let score = Math.random() * 0.3;
    
    if (timeOfDay === 'morning' && ['inspiring', 'peaceful'].includes(section.dimensions.emotionalTone || '')) score += 0.2;
    if (timeOfDay === 'afternoon' && ['heroic', 'dramatic'].includes(section.dimensions.emotionalTone || '')) score += 0.2;
    if (timeOfDay === 'evening' && ['contemplative', 'peaceful'].includes(section.dimensions.emotionalTone || '')) score += 0.2;
    
    if (userHistory.sessionCount < 5 && section.dimensions.complexity === 'simple') score += 0.15;
    else if (userHistory.sessionCount < 15 && section.dimensions.complexity === 'intermediate') score += 0.15;
    else if (userHistory.sessionCount >= 15 && section.dimensions.complexity === 'advanced') score += 0.15;
    
    const recentCharacters = userHistory.recentSelections.slice(-5);
    if (!recentCharacters.some(id => id.includes(section.dimensions.character || ''))) score += 0.15;
    
    const dayOfWeek = new Date().getDay();
    const preferredThemes = ['dharma', 'devotion', 'courage', 'wisdom', 'love', 'truth', 'sacrifice'];
    if (section.dimensions.theme === preferredThemes[dayOfWeek]) score += 0.1;
    
    return { section, score };
  });
  
  scoredSections.sort((a, b) => b.score - a.score);
  return scoredSections[0].section;
}

// Comprehensive spiritual text mappings
const SPIRITUAL_TEXT_MAPPINGS = {
  // Sanskrit/Gretil Sources
  gretil: {
    'Agni_Purana': {
      textName: 'Agni Purana',
      tradition: 'Hindu Cosmology & Sacred Rituals',
      historicalPeriod: 'Classical Period (8th-11th century CE)',
      literaryGenre: 'Cosmological & Ritual Compendium',
      estimatedAge: '1000+ years',
      themes: {
        creation: 'Divine Fire and Cosmic Creation',
        rituals: 'Sacred Fire Ceremonies',
        cosmology: 'Universal Principles and Divine Order'
      }
    },
    'Bhagvad_Gita': {
      textName: 'Bhagavad Gita',
      tradition: 'Hindu Philosophy & Spiritual Guidance',
      historicalPeriod: 'Classical Period (5th-2nd century BCE)',
      literaryGenre: 'Philosophical Dialogue',
      estimatedAge: '2000+ years',
      themes: {
        dharma: 'Righteous Action and Duty',
        yoga: 'Paths to Self-Realization',
        devotion: 'Divine Love and Surrender'
      }
    },
    'Chandogya_Upanishad': {
      textName: 'Chandogya Upanishad',
      tradition: 'Vedic Philosophy & Mysticism',
      historicalPeriod: 'Vedic Period (8th-6th century BCE)',
      literaryGenre: 'Mystical Teaching Dialogues',
      estimatedAge: '2500+ years',
      themes: {
        brahman: 'The Ultimate Reality',
        meditation: 'Inner Sound and Sacred Syllables',
        self: 'True Nature of the Soul'
      }
    },
    'NadaBindu_Upanishad': {
      textName: 'NadaBindu Upanishad',
      tradition: 'Vedic Philosophy & Yoga',
      historicalPeriod: 'Medieval Period (10th-15th century CE)',
      literaryGenre: 'Yogic Mystical Teachings',
      estimatedAge: '800+ years',
      themes: {
        nada: 'Inner Sound and Divine Vibration',
        bindu: 'Point of Cosmic Consciousness',
        yoga: 'Union through Sound Meditation',
        meditation: 'Transcendental Sound Practice'
      }
    },
    'Nada Bindu Upanishad': {  // This matches the displayName format
      textName: 'NadaBindu Upanishad',
      tradition: 'Vedic Philosophy & Yoga',
      historicalPeriod: 'Medieval Period (10th-15th century CE)',
      literaryGenre: 'Yogic Mystical Teachings',
      estimatedAge: '800+ years',
      themes: {
        nada: 'Inner Sound and Divine Vibration',
        bindu: 'Point of Cosmic Consciousness',
        yoga: 'Union through Sound Meditation',
        meditation: 'Transcendental Sound Practice'
      }
    },
    'Mandukya_Upanishad': {
      textName: 'Mandukya Upanishad',
      tradition: 'Vedic Philosophy & Consciousness Studies',
      historicalPeriod: 'Vedic Period (8th-6th century BCE)',
      literaryGenre: 'Mystical Philosophy',
      estimatedAge: '2500+ years',
      themes: {
        om: 'Sacred Sound AUM and Consciousness',
        consciousness: 'Four States of Awareness',
        reality: 'Ultimate Reality and Self-Knowledge'
      }
    },
    'Mandukya Upanishad': {
      textName: 'Mandukya Upanishad',
      tradition: 'Vedic Philosophy & Consciousness Studies',
      historicalPeriod: 'Vedic Period (8th-6th century BCE)',
      literaryGenre: 'Mystical Philosophy',
      estimatedAge: '2500+ years',
      themes: {
        om: 'Sacred Sound AUM and Consciousness',
        consciousness: 'Four States of Awareness',
        reality: 'Ultimate Reality and Self-Knowledge'
      }
    },
    
    // === REMAINING UPANISHADS ===
    'Katha_Upanishad': {
      textName: 'Katha Upanishad',
      tradition: 'Vedic Philosophy & Death Mysticism',
      historicalPeriod: 'Vedic Period (6th-4th century BCE)',
      literaryGenre: 'Allegorical Teaching Story',
      estimatedAge: '2400+ years',
      themes: {
        death: 'Transcending Death and Immortality',
        chariot: 'Allegory of Self-Control',
        yoga: 'Path to Liberation'
      }
    },
    'Katha Upanishad': {
      textName: 'Katha Upanishad',
      tradition: 'Vedic Philosophy & Death Mysticism',
      historicalPeriod: 'Vedic Period (6th-4th century BCE)',
      literaryGenre: 'Allegorical Teaching Story',
      estimatedAge: '2400+ years',
      themes: {
        death: 'Transcending Death and Immortality',
        chariot: 'Allegory of Self-Control',
        yoga: 'Path to Liberation'
      }
    },
    'Isha_Upanishad': {
      textName: 'Isha Upanishad',
      tradition: 'Vedic Philosophy & Renunciation',
      historicalPeriod: 'Vedic Period (8th-6th century BCE)',
      literaryGenre: 'Poetic Mystical Verses',
      estimatedAge: '2500+ years',
      themes: {
        renunciation: 'True Renunciation and Enjoyment',
        unity: 'All-Pervading Divine Presence',
        action: 'Desireless Action'
      }
    },
    'Isha Upanishad': {
      textName: 'Isha Upanishad',
      tradition: 'Vedic Philosophy & Renunciation',
      historicalPeriod: 'Vedic Period (8th-6th century BCE)',
      literaryGenre: 'Poetic Mystical Verses',
      estimatedAge: '2500+ years',
      themes: {
        renunciation: 'True Renunciation and Enjoyment',
        unity: 'All-Pervading Divine Presence',
        action: 'Desireless Action'
      }
    },
    'Brihadaranyaka_Upanishad': {
      textName: 'Brihadaranyaka Upanishad',
      tradition: 'Vedic Philosophy & Metaphysics',
      historicalPeriod: 'Vedic Period (8th-7th century BCE)',
      literaryGenre: 'Extensive Philosophical Treatise',
      estimatedAge: '2700+ years',
      themes: {
        atman: 'The Great Self - Aham Brahmasmi',
        creation: 'Cosmic Creation and Dissolution',
        knowledge: 'Supreme Knowledge and Reality'
      }
    },
    'Brihadaranyaka Upanishad': {
      textName: 'Brihadaranyaka Upanishad',
      tradition: 'Vedic Philosophy & Metaphysics',
      historicalPeriod: 'Vedic Period (8th-7th century BCE)',
      literaryGenre: 'Extensive Philosophical Treatise',
      estimatedAge: '2700+ years',
      themes: {
        atman: 'The Great Self - Aham Brahmasmi',
        creation: 'Cosmic Creation and Dissolution',
        knowledge: 'Supreme Knowledge and Reality'
      }
    },
    'Taittiriya_Upanishad': {
      textName: 'Taittiriya Upanishad',
      tradition: 'Vedic Philosophy & Meditation',
      historicalPeriod: 'Vedic Period (7th-6th century BCE)',
      literaryGenre: 'Systematic Spiritual Teaching',
      estimatedAge: '2600+ years',
      themes: {
        koshas: 'Five Sheaths of Existence',
        bliss: 'Ananda - Divine Bliss as Reality',
        meditation: 'Progressive Spiritual Realization'
      }
    },
    'Taittiriya Upanishad': {
      textName: 'Taittiriya Upanishad',
      tradition: 'Vedic Philosophy & Meditation',
      historicalPeriod: 'Vedic Period (7th-6th century BCE)',
      literaryGenre: 'Systematic Spiritual Teaching',
      estimatedAge: '2600+ years',
      themes: {
        koshas: 'Five Sheaths of Existence',
        bliss: 'Ananda - Divine Bliss as Reality',
        meditation: 'Progressive Spiritual Realization'
      }
    },
    'Prashna_Upanishad': {
      textName: 'Prashna Upanishad',
      tradition: 'Vedic Philosophy & Cosmic Principles',
      historicalPeriod: 'Vedic Period (6th-4th century BCE)',
      literaryGenre: 'Question-Answer Teaching',
      estimatedAge: '2400+ years',
      themes: {
        prana: 'Life Force and Vital Energy',
        om: 'Sacred Syllable and Cosmic Sound',
        meditation: 'Breath and Consciousness'
      }
    },
    'Prashna Upanishad': {
      textName: 'Prashna Upanishad',
      tradition: 'Vedic Philosophy & Cosmic Principles',
      historicalPeriod: 'Vedic Period (6th-4th century BCE)',
      literaryGenre: 'Question-Answer Teaching',
      estimatedAge: '2400+ years',
      themes: {
        prana: 'Life Force and Vital Energy',
        om: 'Sacred Syllable and Cosmic Sound',
        meditation: 'Breath and Consciousness'
      }
    },
    'Mundaka_Upanishad': {
      textName: 'Mundaka Upanishad',
      tradition: 'Vedic Philosophy & Higher Knowledge',
      historicalPeriod: 'Vedic Period (5th-4th century BCE)',
      literaryGenre: 'Poetic Mystical Teaching',
      estimatedAge: '2300+ years',
      themes: {
        knowledge: 'Higher vs Lower Knowledge',
        bird: 'Two Birds on Tree Allegory',
        fire: 'Sacred Fire of Wisdom'
      }
    },
    'Mundaka Upanishad': {
      textName: 'Mundaka Upanishad',
      tradition: 'Vedic Philosophy & Higher Knowledge',
      historicalPeriod: 'Vedic Period (5th-4th century BCE)',
      literaryGenre: 'Poetic Mystical Teaching',
      estimatedAge: '2300+ years',
      themes: {
        knowledge: 'Higher vs Lower Knowledge',
        bird: 'Two Birds on Tree Allegory',
        fire: 'Sacred Fire of Wisdom'
      }
    },
    'Kaivalya_Upanishad': {
      textName: 'Kaivalya Upanishad',
      tradition: 'Vedic Philosophy & Liberation',
      historicalPeriod: 'Medieval Period (8th-12th century CE)',
      literaryGenre: 'Liberation Teaching',
      estimatedAge: '1000+ years',
      themes: {
        liberation: 'Absolute Freedom - Kaivalya',
        devotion: 'Devotion to Shiva',
        realization: 'Self-Realization and Unity'
      }
    },
    'Kaivalya Upanishad': {
      textName: 'Kaivalya Upanishad',
      tradition: 'Vedic Philosophy & Liberation',
      historicalPeriod: 'Medieval Period (8th-12th century CE)',
      literaryGenre: 'Liberation Teaching',
      estimatedAge: '1000+ years',
      themes: {
        liberation: 'Absolute Freedom - Kaivalya',
        devotion: 'Devotion to Shiva',
        realization: 'Self-Realization and Unity'
      }
    },
    'Shvetashvatara_Upanishad': {
      textName: 'Shvetashvatara Upanishad',
      tradition: 'Vedic Philosophy & Theistic Devotion',
      historicalPeriod: 'Vedic Period (4th-2nd century BCE)',
      literaryGenre: 'Devotional Philosophy',
      estimatedAge: '2200+ years',
      themes: {
        devotion: 'Devotion to Supreme Ishvara',
        yoga: 'Yoga and Divine Grace',
        god: 'Personal God and Absolute Reality'
      }
    },
    'Shvetashvatara Upanishad': {
      textName: 'Shvetashvatara Upanishad',
      tradition: 'Vedic Philosophy & Theistic Devotion',
      historicalPeriod: 'Vedic Period (4th-2nd century BCE)',
      literaryGenre: 'Devotional Philosophy',
      estimatedAge: '2200+ years',
      themes: {
        devotion: 'Devotion to Supreme Ishvara',
        yoga: 'Yoga and Divine Grace',
        god: 'Personal God and Absolute Reality'
      }
    },

    // === VEDAS & PRINCIPAL TEXTS ===
    'Rigveda': {
      textName: 'Rigveda',
      tradition: 'Vedic Hymns & Ancient Wisdom',
      historicalPeriod: 'Vedic Period (1500-1200 BCE)',
      literaryGenre: 'Sacred Hymns & Prayers',
      estimatedAge: '3500+ years',
      themes: {
        hymns: 'Sacred Hymns to Divine Forces',
        fire: 'Agni - Sacred Fire Worship',
        cosmos: 'Cosmic Order and Divine Truth'
      }
    },
    'Rig Veda': {
      textName: 'Rigveda',
      tradition: 'Vedic Hymns & Ancient Wisdom',
      historicalPeriod: 'Vedic Period (1500-1200 BCE)',
      literaryGenre: 'Sacred Hymns & Prayers',
      estimatedAge: '3500+ years',
      themes: {
        hymns: 'Sacred Hymns to Divine Forces',
        fire: 'Agni - Sacred Fire Worship',
        cosmos: 'Cosmic Order and Divine Truth'
      }
    },
    'Samaveda': {
      textName: 'Samaveda',
      tradition: 'Vedic Chants & Sacred Music',
      historicalPeriod: 'Vedic Period (1200-1000 BCE)',
      literaryGenre: 'Sacred Chants & Melodies',
      estimatedAge: '3000+ years',
      themes: {
        chants: 'Sacred Musical Chants',
        sound: 'Divine Sound and Vibration',
        sacrifice: 'Ritual Worship and Offerings'
      }
    },
    'Sama Veda': {
      textName: 'Samaveda',
      tradition: 'Vedic Chants & Sacred Music',
      historicalPeriod: 'Vedic Period (1200-1000 BCE)',
      literaryGenre: 'Sacred Chants & Melodies',
      estimatedAge: '3000+ years',
      themes: {
        chants: 'Sacred Musical Chants',
        sound: 'Divine Sound and Vibration',
        sacrifice: 'Ritual Worship and Offerings'
      }
    },
    'Bhagavad Gita': {
      textName: 'Bhagavad Gita',
      tradition: 'Hindu Philosophy & Spiritual Guidance',
      historicalPeriod: 'Classical Period (5th-2nd century BCE)',
      literaryGenre: 'Philosophical Dialogue',
      estimatedAge: '2000+ years',
      themes: {
        dharma: 'Righteous Action and Sacred Duty',
        yoga: 'Paths to Self-Realization',
        devotion: 'Divine Love and Surrender'
      }
    },
    'Ramayana': {
      textName: 'Ramayana',
      tradition: 'Hindu Epic Literature & Dharma',
      historicalPeriod: 'Ancient Period (5th century BCE - 2nd century CE)',
      literaryGenre: 'Epic Narrative Poetry',
      estimatedAge: '2000+ years',
      themes: {
        dharma: 'Righteous Living and Divine Virtue',
        devotion: 'Pure Love and Dedication',
        victory: 'Victory of Good over Evil'
      }
    },

    // === PURANAS ===
    'Agni Purana': {
      textName: 'Agni Purana',
      tradition: 'Hindu Cosmology & Sacred Rituals',
      historicalPeriod: 'Classical Period (8th-11th century CE)',
      literaryGenre: 'Cosmological & Ritual Compendium',
      estimatedAge: '1000+ years',
      themes: {
        fire: 'Divine Fire and Cosmic Creation',
        rituals: 'Sacred Fire Ceremonies',
        cosmology: 'Universal Principles and Divine Order'
      }
    },
    'Bhagavata_Purana': {
      textName: 'Bhagavata Purana',
      tradition: 'Hindu Devotion & Krishna Bhakti',
      historicalPeriod: 'Classical Period (9th-10th century CE)',
      literaryGenre: 'Devotional Epic Literature',
      estimatedAge: '1100+ years',
      themes: {
        krishna: 'Krishna\'s Divine Life and Teachings',
        devotion: 'Pure Devotional Love - Bhakti',
        liberation: 'Liberation through Divine Love'
      }
    },
    'Bhagavata Purana': {
      textName: 'Bhagavata Purana',
      tradition: 'Hindu Devotion & Krishna Bhakti',
      historicalPeriod: 'Classical Period (9th-10th century CE)',
      literaryGenre: 'Devotional Epic Literature',
      estimatedAge: '1100+ years',
      themes: {
        krishna: 'Krishna\'s Divine Life and Teachings',
        devotion: 'Pure Devotional Love - Bhakti',
        liberation: 'Liberation through Divine Love'
      }
    },
    'Brahmanda_Purana': {
      textName: 'Brahmanda Purana',
      tradition: 'Hindu Cosmology & Universe Creation',
      historicalPeriod: 'Classical Period (4th-10th century CE)',
      literaryGenre: 'Cosmological Treatise',
      estimatedAge: '1200+ years',
      themes: {
        cosmos: 'Cosmic Egg and Universe Creation',
        brahma: 'Creator God Brahma\'s Domain',
        time: 'Cycles of Time and Creation'
      }
    },
    'Brahmanda Purana': {
      textName: 'Brahmanda Purana',
      tradition: 'Hindu Cosmology & Universe Creation',
      historicalPeriod: 'Classical Period (4th-10th century CE)',
      literaryGenre: 'Cosmological Treatise',
      estimatedAge: '1200+ years',
      themes: {
        cosmos: 'Cosmic Egg and Universe Creation',
        brahma: 'Creator God Brahma\'s Domain',
        time: 'Cycles of Time and Creation'
      }
    },
    'Brahma_Purana': {
      textName: 'Brahma Purana',
      tradition: 'Hindu Cosmology & Sacred Geography',
      historicalPeriod: 'Classical Period (10th-13th century CE)',
      literaryGenre: 'Cosmological & Geographical Text',
      estimatedAge: '800+ years',
      themes: {
        creation: 'Divine Creation and Cosmic Order',
        pilgrimage: 'Sacred Places and Pilgrimage',
        brahma: 'Creator Brahma\'s Wisdom'
      }
    },
    'Brahma Purana': {
      textName: 'Brahma Purana',
      tradition: 'Hindu Cosmology & Sacred Geography',
      historicalPeriod: 'Classical Period (10th-13th century CE)',
      literaryGenre: 'Cosmological & Geographical Text',
      estimatedAge: '800+ years',
      themes: {
        creation: 'Divine Creation and Cosmic Order',
        pilgrimage: 'Sacred Places and Pilgrimage',
        brahma: 'Creator Brahma\'s Wisdom'
      }
    },
    'Garuda_Purana': {
      textName: 'Garuda Purana',
      tradition: 'Hindu Afterlife & Spiritual Journey',
      historicalPeriod: 'Classical Period (8th-12th century CE)',
      literaryGenre: 'Afterlife & Spiritual Guidance',
      estimatedAge: '1000+ years',
      themes: {
        death: 'Death, Afterlife, and Soul\'s Journey',
        vishnu: 'Vishnu\'s Divine Protection',
        liberation: 'Path to Final Liberation'
      }
    },
    'Garuda Purana': {
      textName: 'Garuda Purana',
      tradition: 'Hindu Afterlife & Spiritual Journey',
      historicalPeriod: 'Classical Period (8th-12th century CE)',
      literaryGenre: 'Afterlife & Spiritual Guidance',
      estimatedAge: '1000+ years',
      themes: {
        death: 'Death, Afterlife, and Soul\'s Journey',
        vishnu: 'Vishnu\'s Divine Protection',
        liberation: 'Path to Final Liberation'
      }
    },
    'Kurma_Purana': {
      textName: 'Kurma Purana',
      tradition: 'Hindu Cosmology & Vishnu Incarnation',
      historicalPeriod: 'Classical Period (6th-11th century CE)',
      literaryGenre: 'Incarnation Literature',
      estimatedAge: '1100+ years',
      themes: {
        kurma: 'Vishnu as Cosmic Turtle Avatar',
        ocean: 'Churning of Cosmic Ocean',
        dharma: 'Righteousness and Cosmic Order'
      }
    },
    'Kurma Purana': {
      textName: 'Kurma Purana',
      tradition: 'Hindu Cosmology & Vishnu Incarnation',
      historicalPeriod: 'Classical Period (6th-11th century CE)',
      literaryGenre: 'Incarnation Literature',
      estimatedAge: '1100+ years',
      themes: {
        kurma: 'Vishnu as Cosmic Turtle Avatar',
        ocean: 'Churning of Cosmic Ocean',
        dharma: 'Righteousness and Cosmic Order'
      }
    },
    'Linga_Purana': {
      textName: 'Linga Purana',
      tradition: 'Hindu Shaivism & Divine Symbols',
      historicalPeriod: 'Classical Period (5th-10th century CE)',
      literaryGenre: 'Shaivite Devotional Text',
      estimatedAge: '1200+ years',
      themes: {
        linga: 'Sacred Linga as Divine Symbol',
        shiva: 'Lord Shiva\'s Cosmic Manifestation',
        creation: 'Creation, Preservation, Destruction'
      }
    },
    'Linga Purana': {
      textName: 'Linga Purana',
      tradition: 'Hindu Shaivism & Divine Symbols',
      historicalPeriod: 'Classical Period (5th-10th century CE)',
      literaryGenre: 'Shaivite Devotional Text',
      estimatedAge: '1200+ years',
      themes: {
        linga: 'Sacred Linga as Divine Symbol',
        shiva: 'Lord Shiva\'s Cosmic Manifestation',
        creation: 'Creation, Preservation, Destruction'
      }
    },
    'Markandeya_Purana': {
      textName: 'Markandeya Purana',
      tradition: 'Hindu Devotion & Divine Mother',
      historicalPeriod: 'Classical Period (3rd-6th century CE)',
      literaryGenre: 'Divine Mother Literature',
      estimatedAge: '1500+ years',
      themes: {
        devi: 'Divine Mother Durga\'s Glory',
        protection: 'Divine Protection from Evil',
        devotion: 'Mother\'s Compassionate Grace'
      }
    },
    'Markandeya Purana': {
      textName: 'Markandeya Purana',
      tradition: 'Hindu Devotion & Divine Mother',
      historicalPeriod: 'Classical Period (3rd-6th century CE)',
      literaryGenre: 'Divine Mother Literature',
      estimatedAge: '1500+ years',
      themes: {
        devi: 'Divine Mother Durga\'s Glory',
        protection: 'Divine Protection from Evil',
        devotion: 'Mother\'s Compassionate Grace'
      }
    },
    'Matsya_Purana': {
      textName: 'Matsya Purana',
      tradition: 'Hindu Cosmology & Divine Preservation',
      historicalPeriod: 'Classical Period (3rd-10th century CE)',
      literaryGenre: 'Preservation Mythology',
      estimatedAge: '1300+ years',
      themes: {
        matsya: 'Vishnu as Fish Avatar',
        flood: 'Great Flood and Divine Rescue',
        preservation: 'Divine Preservation of Life'
      }
    },
    'Matsya Purana': {
      textName: 'Matsya Purana',
      tradition: 'Hindu Cosmology & Divine Preservation',
      historicalPeriod: 'Classical Period (3rd-10th century CE)',
      literaryGenre: 'Preservation Mythology',
      estimatedAge: '1300+ years',
      themes: {
        matsya: 'Vishnu as Fish Avatar',
        flood: 'Great Flood and Divine Rescue',
        preservation: 'Divine Preservation of Life'
      }
    },
    'Narada_Purana': {
      textName: 'Narada Purana',
      tradition: 'Hindu Devotion & Divine Sage Wisdom',
      historicalPeriod: 'Classical Period (8th-12th century CE)',
      literaryGenre: 'Sage Teachings & Devotion',
      estimatedAge: '1000+ years',
      themes: {
        narada: 'Sage Narada\'s Divine Wisdom',
        devotion: 'Pure Devotional Practice',
        pilgrimage: 'Sacred Pilgrimage and Worship'
      }
    },
    'Narada Purana': {
      textName: 'Narada Purana',
      tradition: 'Hindu Devotion & Divine Sage Wisdom',
      historicalPeriod: 'Classical Period (8th-12th century CE)',
      literaryGenre: 'Sage Teachings & Devotion',
      estimatedAge: '1000+ years',
      themes: {
        narada: 'Sage Narada\'s Divine Wisdom',
        devotion: 'Pure Devotional Practice',
        pilgrimage: 'Sacred Pilgrimage and Worship'
      }
    },
    'Vishnu_Purana': {
      textName: 'Vishnu Purana',
      tradition: 'Hindu Cosmology & Vishnu Devotion',
      historicalPeriod: 'Classical Period (3rd-10th century CE)',
      literaryGenre: 'Devotional Cosmology',
      estimatedAge: '1400+ years',
      themes: {
        vishnu: 'Lord Vishnu as Supreme Reality',
        avatars: 'Divine Incarnations and Purpose',
        preservation: 'Cosmic Preservation and Order'
      }
    },
    'Vishnu Purana': {
      textName: 'Vishnu Purana',
      tradition: 'Hindu Cosmology & Vishnu Devotion',
      historicalPeriod: 'Classical Period (3rd-10th century CE)',
      literaryGenre: 'Devotional Cosmology',
      estimatedAge: '1400+ years',
      themes: {
        vishnu: 'Lord Vishnu as Supreme Reality',
        avatars: 'Divine Incarnations and Purpose',
        preservation: 'Cosmic Preservation and Order'
      }
    },
    'Shiva_Purana': {
      textName: 'Shiva Purana',
      tradition: 'Hindu Shaivism & Divine Consciousness',
      historicalPeriod: 'Classical Period (10th-14th century CE)',
      literaryGenre: 'Shaivite Philosophy & Devotion',
      estimatedAge: '800+ years',
      themes: {
        shiva: 'Lord Shiva as Supreme Consciousness',
        yoga: 'Yogic Path to Divine Union',
        transformation: 'Spiritual Transformation'
      }
    },
    'Shiva Purana': {
      textName: 'Shiva Purana',
      tradition: 'Hindu Shaivism & Divine Consciousness',
      historicalPeriod: 'Classical Period (10th-14th century CE)',
      literaryGenre: 'Shaivite Philosophy & Devotion',
      estimatedAge: '800+ years',
      themes: {
        shiva: 'Lord Shiva as Supreme Consciousness',
        yoga: 'Yogic Path to Divine Union',
        transformation: 'Spiritual Transformation'
      }
    },
    'Vamana_Purana': {
      textName: 'Vamana Purana',
      tradition: 'Hindu Cosmology & Divine Humility',
      historicalPeriod: 'Classical Period (9th-13th century CE)',
      literaryGenre: 'Avatar Literature',
      estimatedAge: '900+ years',
      themes: {
        vamana: 'Vishnu as Dwarf Avatar',
        humility: 'Power of Divine Humility',
        cosmos: 'Three Worlds and Cosmic Order'
      }
    },
    'Vamana Purana': {
      textName: 'Vamana Purana',
      tradition: 'Hindu Cosmology & Divine Humility',
      historicalPeriod: 'Classical Period (9th-13th century CE)',
      literaryGenre: 'Avatar Literature',
      estimatedAge: '900+ years',
      themes: {
        vamana: 'Vishnu as Dwarf Avatar',
        humility: 'Power of Divine Humility',
        cosmos: 'Three Worlds and Cosmic Order'
      }
    },
    'Skanda_Purana': {
      textName: 'Skanda Purana',
      tradition: 'Hindu Devotion & Sacred Geography',
      historicalPeriod: 'Classical Period (7th-12th century CE)',
      literaryGenre: 'Pilgrimage & Devotional Literature',
      estimatedAge: '1100+ years',
      themes: {
        skanda: 'Lord Skanda (Kartikeya) Devotion',
        pilgrimage: 'Sacred Places and Spiritual Journey',
        victory: 'Victory of Good over Evil'
      }
    },
    'Skanda Purana': {
      textName: 'Skanda Purana',
      tradition: 'Hindu Devotion & Sacred Geography',
      historicalPeriod: 'Classical Period (7th-12th century CE)',
      literaryGenre: 'Pilgrimage & Devotional Literature',
      estimatedAge: '1100+ years',
      themes: {
        skanda: 'Lord Skanda (Kartikeya) Devotion',
        pilgrimage: 'Sacred Places and Spiritual Journey',
        victory: 'Victory of Good over Evil'
      }
    },
    'Vayu_Purana': {
      textName: 'Vayu Purana',
      tradition: 'Hindu Cosmology & Divine Wind',
      historicalPeriod: 'Classical Period (4th-10th century CE)',
      literaryGenre: 'Cosmological Philosophy',
      estimatedAge: '1200+ years',
      themes: {
        vayu: 'Divine Wind and Life Force',
        cosmos: 'Cosmic Creation and Evolution',
        genealogy: 'Divine and Royal Lineages'
      }
    },
    'Vayu Purana': {
      textName: 'Vayu Purana',
      tradition: 'Hindu Cosmology & Divine Wind',
      historicalPeriod: 'Classical Period (4th-10th century CE)',
      literaryGenre: 'Cosmological Philosophy',
      estimatedAge: '1200+ years',
      themes: {
        vayu: 'Divine Wind and Life Force',
        cosmos: 'Cosmic Creation and Evolution',
        genealogy: 'Divine and Royal Lineages'
      }
    }
  } as Record<string, any>,
  
  // Traditional Epic Sources
  traditional: {
    'Ramayana': {
      textName: 'Ramayana',
      tradition: 'Hindu Epic Literature',
      historicalPeriod: 'Ancient Period (5th century BCE - 2nd century CE)',
      literaryGenre: 'Epic Narrative Poetry',
      estimatedAge: '2000+ years',
      kandas: {
        '1': { name: 'Bala Kanda', theme: 'Divine Birth and Early Life', focus: 'Origins of virtue and dharma' },
        '2': { name: 'Ayodhya Kanda', theme: 'Exile and Sacrifice', focus: 'Duty, honor, and family bonds' },
        '3': { name: 'Aranya Kanda', theme: 'Forest Teachings', focus: 'Simple living and spiritual wisdom' },
        '4': { name: 'Kishkindha Kanda', theme: 'Divine Friendship', focus: 'Loyalty, service, and alliance' },
        '5': { name: 'Sundara Kanda', theme: 'Devotional Service', focus: 'Courage, faith, and dedication' },
        '6': { name: 'Yuddha Kanda', theme: 'Victory of Good', focus: 'Justice, righteousness, and divine grace' },
        '7': { name: 'Uttara Kanda', theme: 'Divine Realm', focus: 'Eternal principles and cosmic order' }
      }
    },
    'Mahabharata': {
      textName: 'Mahabharata',
      tradition: 'Hindu Epic Literature & Philosophy',
      historicalPeriod: 'Ancient Period (8th century BCE - 4th century CE)',
      literaryGenre: 'Epic Historical Narrative',
      estimatedAge: '2000+ years'
    }
  } as Record<string, any>
};

const SPIRITUAL_THEMES: Record<string, string> = {
  dharma: 'Righteous Living and Moral Duty',
  devotion: 'Divine Love and Surrender',
  courage: 'Spiritual Bravery and Inner Strength',
  sacrifice: 'Selfless Service and Offering',
  wisdom: 'Sacred Knowledge and Understanding',
  love: 'Divine Love and Compassion',
  duty: 'Sacred Responsibility and Service',
  truth: 'Eternal Truth and Reality',
  meditation: 'Inner Peace and Self-Realization',
  yoga: 'Union with the Divine',
  karma: 'Action and Spiritual Consequence',
  moksha: 'Liberation and Freedom'
};

const CHARACTER_CONTEXT: Record<string, string> = {
  'Rama': 'Divine prince and embodiment of dharma',
  'Sita': 'Goddess of devotion and inner strength',
  'Lakshmana': 'Model of loyalty and service',
  'Hanuman': 'Devotee exemplifying courage and faith',
  'Ravana': 'Ego and the fall from grace',
  'Krishna': 'Divine teacher and guide',
  'Arjuna': 'Spiritual seeker facing moral dilemma',
  'Dasharatha': 'Righteous king torn by duty'
};

const LOCATION_CONTEXT: Record<string, string> = {
  'Ayodhya': 'Ideal kingdom of righteousness',
  'forest': 'Spiritual retreat and simple living',
  'Lanka': 'Kingdom of material power and ego',
  'Kurukshetra': 'Battlefield of inner spiritual conflict',
  'Mithila': 'Realm of wisdom and learning',
  'Chitrakoot': 'Sacred mountain of meditation',
  'Panchavati': 'Hermitage of peaceful contemplation'
};

function formatWisdomMetadata(
  sourceName: string, 
  fileName: string, 
  metadata: string, 
  dimensions: WisdomDimensions,
  gretilWisdom?: any
): EnhancedRawTextAnnotation {
  
  console.log('🔍 formatWisdomMetadata DEBUG - INPUT:', { 
    sourceName, 
    fileName, 
    metadata, 
    dimensions, 
    gretilWisdom: gretilWisdom ? {
      textName: gretilWisdom.textName,
      reference: gretilWisdom.reference,
      category: gretilWisdom.category,
      sanskrit: gretilWisdom.sanskrit?.substring(0, 50) + '...'
    } : null
  });
  
  // Handle Gretil/Sanskrit sources
  if (sourceName.startsWith('Gretil_') || gretilWisdom) {
    const textKey = gretilWisdom?.textName || fileName.replace('.txt', '').replace(/[_-]/g, '_');
    
    // Try exact match first
    let mapping = SPIRITUAL_TEXT_MAPPINGS.gretil[textKey];
    
    // If no exact match, try partial matching
    if (!mapping) {
      mapping = Object.values(SPIRITUAL_TEXT_MAPPINGS.gretil).find(m => 
        m.textName.toLowerCase().includes(textKey.toLowerCase().split('_')[0]));
    }
    
    // If still no match, try filename-based matching
    if (!mapping) {
      const cleanFileName = fileName.replace('.txt', '').replace(/[_-]/g, '_');
      mapping = SPIRITUAL_TEXT_MAPPINGS.gretil[cleanFileName];
    }
    
    if (mapping) {
      const reference = gretilWisdom?.reference || 'Sacred Verse';
      const category = gretilWisdom?.category || 'Sacred Texts';
      
      // Determine spiritual theme based on content
      let spiritualTheme = 'Sacred Wisdom';
      if (mapping.themes) {
        for (const [key, theme] of Object.entries(mapping.themes)) {
          if (reference.toLowerCase().includes(key) || 
              category.toLowerCase().includes(key) ||
              (gretilWisdom?.sanskrit && gretilWisdom.sanskrit.toLowerCase().includes(key))) {
            spiritualTheme = String(theme);
            break;
          }
        }
      }
      
      // Fallback theme based on text type if no specific theme found
      if (spiritualTheme === 'Sacred Wisdom') {
        if (mapping.textName.toLowerCase().includes('upanishad')) {
          spiritualTheme = 'Self-Realization and Cosmic Unity';
        } else if (mapping.textName.toLowerCase().includes('purana')) {
          spiritualTheme = 'Divine Manifestation and Cosmic Order';
        } else if (mapping.textName.toLowerCase().includes('veda')) {
          spiritualTheme = 'Sacred Sound and Divine Invocation';
        } else if (mapping.textName.toLowerCase().includes('gita')) {
          spiritualTheme = 'Dharma and Spiritual Liberation';
        }
      }
      
      const result = {
        textName: mapping.textName,
        tradition: mapping.tradition,
        chapter: formatGretilChapter(reference, mapping.textName),
        section: formatGretilSection(reference, category, mapping.textName),
        spiritualTheme,
        literaryGenre: mapping.literaryGenre,
        historicalPeriod: mapping.historicalPeriod,
        estimatedAge: mapping.estimatedAge,
        technicalReference: reference,
        // Legacy compatibility
        theme: spiritualTheme,
        source: mapping.textName
      };
      
      console.log('🔍 formatWisdomMetadata DEBUG - RESULT:', result);
      return result;
    }
  }
  
  // Handle traditional sources (Ramayana, etc.)
  const traditionalMapping = SPIRITUAL_TEXT_MAPPINGS.traditional[sourceName];
  if (traditionalMapping) {
    const chapterInfo = extractChapterInfo(fileName, metadata);
    const enhancedChapter = enhanceTraditionalChapter(chapterInfo.chapter, traditionalMapping);
    const enhancedSection = enhanceTraditionalSection(chapterInfo.section, metadata, dimensions);
    
    // Determine characters and locations
    const characters = dimensions.character ? 
      [dimensions.character] : 
      extractCharactersFromMetadata(metadata);
    
    const location = dimensions.location || extractLocationFromMetadata(metadata);
    const spiritualTheme = enhanceTheme(dimensions.theme || 'spiritual growth');
    
    return {
      textName: traditionalMapping.textName,
      tradition: traditionalMapping.tradition,
      chapter: enhancedChapter.name,
      section: enhancedSection,
      spiritualTheme,
      characters,
      location: location === 'sacred realm' ? undefined : location,
      literaryGenre: traditionalMapping.literaryGenre,
      historicalPeriod: traditionalMapping.historicalPeriod,
      estimatedAge: traditionalMapping.estimatedAge,
      technicalReference: `${fileName} | ${metadata.substring(0, 50)}...`,
      // Legacy compatibility
      theme: spiritualTheme,
      source: fileName
    };
  }
  
  // Fallback for unknown sources
  return {
    textName: sourceName,
    tradition: 'Sacred Literature',
    chapter: 'Sacred Chapter',
    section: 'Sacred Section',
    spiritualTheme: 'Divine Wisdom',
    literaryGenre: 'Spiritual Teaching',
    historicalPeriod: 'Ancient Tradition',
    estimatedAge: 'Timeless',
    // Legacy compatibility
    theme: 'wisdom',
    source: sourceName
  };
}

function formatGretilChapter(reference: string, textName: string): string {
  console.log('🔍 formatGretilChapter DEBUG:', { reference, textName });
  
  if (textName.includes('Bhagavad Gita')) {
    const chapterMatch = reference.match(/bhg\s*(\d+)/);
    if (chapterMatch) {
      const chapterNum = chapterMatch[1];
      const chapterNames: Record<string, string> = {
        '1': 'The Yoga of Dejection',
        '2': 'The Yoga of Knowledge',
        '3': 'The Yoga of Action',
        '4': 'The Yoga of Wisdom',
        '5': 'The Yoga of Renunciation',
        '6': 'The Yoga of Self-Control',
        '7': 'The Yoga of Spiritual Knowledge',
        '8': 'The Yoga of the Imperishable Brahman',
        '9': 'The Yoga of Royal Knowledge',
        '10': 'The Yoga of Divine Manifestations',
        '11': 'The Yoga of the Vision of the Universal Form',
        '12': 'The Yoga of Devotion',
        '13': 'The Yoga of the Division of the Three Gunas',
        '14': 'The Yoga of the Division of the Three Gunas',
        '15': 'The Yoga of the Supreme Spirit',
        '16': 'The Yoga of the Division of the Divine and Demoniacal',
        '17': 'The Yoga of the Threefold Faith',
        '18': 'The Yoga of Liberation through Renunciation'
      };
      return `Chapter ${chapterNum}: ${chapterNames[chapterNum] || 'Sacred Teaching'}`;
    }
  }
  
  if (textName.includes('Purana')) {
    const bookMatch = reference.match(/(\d+)/);
    if (bookMatch) {
      return `Book ${bookMatch[1]}: Sacred Cosmology`;
    }
  }
  
  if (textName.includes('Upanishad')) {
    // Handle specific reference patterns
    const sectionMatch = reference.match(/(\d+),(\d+)/);
    if (sectionMatch) {
      return `Chapter ${sectionMatch[1]}: Mystical Teachings`;
    }
    
    // Handle fallback patterns from gretilWisdomService
    if (reference === 'General Passage') {
      return 'Mystical Teaching: Sacred Wisdom';
    }
    
    if (reference.startsWith('Line ')) {
      const lineNum = reference.replace('Line ', '');
      const section = Math.ceil(parseInt(lineNum) / 10);
      return `Section ${section}: Vedantic Wisdom`;
    }
    
    // Default for Upanishads
    return 'Upanishadic Teaching: Inner Knowledge';
  }
  
  // Handle Purana references more thoroughly
  if (textName.includes('Purana')) {
    // Handle specific Agni Purana pattern
    if (reference.match(/ap_\d+\.\d+/)) {
      const match = reference.match(/ap_(\d+)\.(\d+)/);
      if (match) {
        return `Book ${match[1]}: Sacred Cosmology`;
      }
    }
    
    // Handle general patterns
    if (reference === 'General Passage') {
      return 'Cosmic Teaching: Divine Wisdom';
    }
    
    if (reference.startsWith('Line ')) {
      const lineNum = reference.replace('Line ', '');
      const book = Math.ceil(parseInt(lineNum) / 50);
      return `Book ${book}: Sacred Cosmology`;
    }
  }
  
  // Handle Vedas
  if (textName.toLowerCase().includes('veda')) {
    if (reference === 'General Passage') {
      return 'Vedic Hymn: Sacred Sound';
    }
    
    if (reference.match(/RvKh_\d+,\d+\.\d+/)) {
      return 'Rig Veda Khila: Sacred Hymn';
    }
    
    if (reference.startsWith('Line ')) {
      return 'Vedic Mantra: Divine Invocation';
    }
  }
  
  // Generic fallback based on reference type
  if (reference === 'General Passage') {
    return 'Sacred Teaching: Divine Wisdom';
  }
  
  if (reference.startsWith('Line ')) {
    return 'Sacred Discourse: Spiritual Guidance';
  }
  
  return 'Sacred Chapter';
}

function formatGretilSection(reference: string, category: string, textName: string): string {
  console.log('🔍 formatGretilSection DEBUG:', { reference, category, textName });
  
  if (textName.includes('Bhagavad Gita')) {
    const verseMatch = reference.match(/bhg\s*\d+\.(\d+)/);
    if (verseMatch) {
      return `Verse ${verseMatch[1]}: Divine Guidance`;
    }
  }
  
  if (category.toLowerCase().includes('purana')) {
    return 'Cosmic Principles and Divine Order';
  }
  
  if (category.toLowerCase().includes('upanishad')) {
    return 'Mystical Wisdom and Inner Truth';
  }
  
  return 'Sacred Wisdom';
}

function enhanceTraditionalChapter(chapter: string, mapping: any): { name: string, theme?: string } {
  if (mapping.kandas) {
    const kandaMatch = chapter.match(/Kanda\s*(\d+)/);
    if (kandaMatch && mapping.kandas[kandaMatch[1]]) {
      const kanda = mapping.kandas[kandaMatch[1]];
      return {
        name: `${kanda.name}: ${kanda.theme}`,
        theme: kanda.focus
      };
    }
  }
  
  return { name: chapter };
}

function enhanceTraditionalSection(section: string, metadata: string, dimensions: WisdomDimensions): string {
  // Extract meaningful episode names from metadata
  const episodeMatch = metadata.match(/\[SECTION[:]?\s*([^\]]+)\]/i);
  if (episodeMatch) {
    const episode = episodeMatch[1].trim();
    // Enhance common episode patterns
    if (episode.toLowerCase().includes('birth')) return 'Divine Birth and Destiny';
    if (episode.toLowerCase().includes('exile')) return 'Journey into Exile';
    if (episode.toLowerCase().includes('forest')) return 'Forest Teachings and Trials';
    if (episode.toLowerCase().includes('battle')) return 'Victory of Righteousness';
    if (episode.toLowerCase().includes('marriage')) return 'Sacred Union and Commitment';
    if (episode.toLowerCase().includes('coronation')) return 'Righteous Leadership';
    return episode;
  }
  
  // Character-based enhancement
  if (dimensions.character && CHARACTER_CONTEXT[dimensions.character]) {
    return `Episode of ${dimensions.character}: ${CHARACTER_CONTEXT[dimensions.character]}`;
  }
  
  return section;
}

function extractCharactersFromMetadata(metadata: string): string[] {
  const charMatch = metadata.match(/\[CHARACTERS[:]?\s*([^\]]+)\]/i);
  if (charMatch) {
    return charMatch[1].split(',').map(c => c.trim());
  }
  return [];
}

function extractLocationFromMetadata(metadata: string): string | undefined {
  const locMatch = metadata.match(/\[PLACES[:]?\s*([^\]]+)\]/i);
  if (locMatch) {
    const location = locMatch[1].trim();
    return LOCATION_CONTEXT[location] ? `${location}: ${LOCATION_CONTEXT[location]}` : location;
  }
  return undefined;
}

function enhanceTheme(theme: string): string {
  return SPIRITUAL_THEMES[theme] || theme.charAt(0).toUpperCase() + theme.slice(1);
}

function extractChapterInfo(fileName: string, metadata: string): { chapter: string, section: string } {
    let chapter = 'Sacred Chapter';
    let section = 'Sacred Section';

    // Extract Kanda from filename (Ramayana_Kanda_1_Balakandam_Cleaned.txt)
    const kandaMatch = fileName.match(/Kanda_(\d+)_([A-Z][a-z]+)kandam/i);
    if (kandaMatch) {
        const num = kandaMatch[1];
        const name = kandaMatch[2].replace(/([A-Z])/g, ' $1').trim();
        chapter = `Kanda ${num} - ${name} Kandam`;
    }

    // Extract section from metadata [SECTION: xyz] or fallback to [CHARACTERS: abc]
    const sectionMatch = metadata.match(/\[SECTION[:]?\s*([^\]]+)\]/i);
    if (sectionMatch) {
        section = sectionMatch[1].trim();
    } else {
        const charMatch = metadata.match(/\[CHARACTERS[:]?\s*([^\]]+)\]/i);
        if (charMatch) {
            section = `Episode featuring ${charMatch[1].trim()}`;
        }
    }

    return { chapter, section };
}

export async function POST(request: NextRequest) {
  let sourceName: string = '';
  
  // Enhanced source selection using existing infrastructure
  let selectionMethod: 'user-specified' | 'random' | 'cross-corpus' = 'user-specified';
  let selectedSourceInfo: any = null;

  try {
    const body = await request.json();
    
    if (body.sourceName && body.sourceName.trim()) {
      // Traditional single-source selection (backward compatibility)
      sourceName = body.sourceName.trim();
      selectionMethod = 'user-specified';
      console.log(`Traditional source selection: ${sourceName}`);
    } else {
      // New cross-corpus intelligent selection
      console.log('Using cross-corpus selection...');
      selectedSourceInfo = await crossCorpusWisdomService.selectWisdomSource({
        userPreference: body.sourcePreference || 'random',
        excludeRecent: body.excludeRecent || [],
        diversityMode: body.diversityMode || 'balanced'
      });
      
      sourceName = selectedSourceInfo.folderName;
      selectionMethod = 'cross-corpus';
      console.log(`Cross-corpus selection: ${selectedSourceInfo.displayName} from ${selectedSourceInfo.category} (${selectedSourceInfo.selectionReason})`);
    }
    
    if (!sourceName) {
      console.log('No source selected, using fallback');
      sourceName = 'Ramayana';
      selectionMethod = 'user-specified';
    }
    
  } catch (requestError) {
    console.error('Error processing wisdom request:', requestError);
    sourceName = 'Ramayana';
    selectionMethod = 'user-specified';
  }

  try {
    console.log(`Today's Wisdom request for folder: ${sourceName}`);
    
    // Handle Gretil source selection
    if (sourceName.startsWith('Gretil_')) {
      console.log('Processing Gretil source request...');
      const gretilFileName = sourceName.replace('Gretil_', '');
      
      try {
        const gretilWisdom = await gretilWisdomService.extractWisdomFromGretilSource(gretilFileName);
        
        if (gretilWisdom) {
          // Generate AI-enhanced wisdom or use fallback
          let enhancedWisdom = gretilWisdom.sanskrit;
          let finalEncouragement = "This ancient wisdom from the Gretil corpus offers timeless guidance. Would you like to explore its deeper meaning?";
          
          try {
            console.log('Attempting AI enhancement for Gretil wisdom...');
            const aiEnhancedWisdom = await createEnhancedGretilWisdom(gretilWisdom);
            
            if (aiEnhancedWisdom && aiEnhancedWisdom.length > 50) {
              enhancedWisdom = aiEnhancedWisdom;
              finalEncouragement = generateContextualEncouragement(aiEnhancedWisdom);
            }
          } catch (error) {
            console.log('Gretil AI enhancement error, using fallback:', error);
          }
          
          // Use enhanced metadata formatting for Gretil sources
          const enhancedGretilMetadata = formatWisdomMetadata(
            sourceName,
            gretilFileName,
            '',
            { character: undefined, theme: gretilWisdom.category, location: undefined },
            gretilWisdom
          );

          const gretilResponse = {
            rawText: gretilWisdom.sanskrit,
            rawTextAnnotation: enhancedGretilMetadata,
            wisdom: enhancedWisdom,
            context: `Daily wisdom from ${gretilWisdom.textName} - ${gretilWisdom.category}`,
            type: 'verse' as const,
            sourceName: gretilWisdom.textName,
            timestamp: new Date().toISOString(),
            encouragement: finalEncouragement,
            sourceLocation: `From ${gretilWisdom.textName} (${gretilWisdom.reference})`,
            filesSearched: [`Gretil: ${gretilFileName}`],
            metadata: `Gretil source: ${gretilWisdom.category} | Estimated verses: ${gretilWisdom.estimatedVerses}`
          };
          
          return NextResponse.json({
            success: true,
            todaysWisdom: gretilResponse,
            selectedSource: gretilWisdom.textName,
            selectionMethod: selectionMethod,
            message: `Wisdom selected from Gretil corpus: ${gretilWisdom.textName}`
          });
        }
      } catch (gretilError) {
        console.error('Gretil processing error:', gretilError);
        // Continue with regular processing as fallback
      }
    }
    
    const files = await getAllFilesFromFolder(sourceName);
    
    if (files.length === 0) {
      throw new Error(`No files found in folder ${sourceName}`);
    }
    
    const todaysWisdom = await selectTodaysWisdomFromFiles(files, sourceName);
    
    // Get available sources for frontend dropdown
    const availableSources = await crossCorpusWisdomService.getAllAvailableSources();

    return NextResponse.json({
      success: true,
      todaysWisdom: todaysWisdom,
      selectedSource: sourceName,
      selectionMethod: selectionMethod,
      selectedSourceInfo: selectedSourceInfo,
      availableSources: availableSources.map(source => ({
        folderName: source,
        displayName: source.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())
      })),
      totalAvailableSources: availableSources.length,
      message: selectionMethod === 'cross-corpus' ? 
        `Wisdom selected from ${selectedSourceInfo?.displayName || sourceName} using intelligent cross-corpus selection` :
        `Wisdom from ${sourceName} as specifically requested`
    });

  } catch (error) {
    console.error('Today\'s Wisdom API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch today\'s wisdom',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
        fallbackWisdom: {
          rawText: "The path to wisdom begins with a single step. Each day brings new opportunities for spiritual growth and understanding.",
          rawTextAnnotation: {
            chapter: 'Unknown Chapter',
            section: 'Unknown Section',
            source: 'Sacred Texts',
            characters: 'Unknown',
            location: 'Sacred Realm',
            theme: 'wisdom'
          },
          wisdom: "The path to wisdom begins with a single step. Each day brings new opportunities for spiritual growth and understanding.",
          context: "Daily inspiration from the sacred texts",
          type: "teaching",
          sourceName: sourceName || "Sacred Texts",
          timestamp: new Date().toISOString(),
          encouragement: "Would you like to explore the wisdom of our sacred texts? I'm here to guide you on your spiritual journey."
        }
      },
      { status: 200 }
    );
  }
}