import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

interface TodaysWisdom {
  // Raw sacred text (what seeker reads first)
  rawText: string;
  rawTextAnnotation: {
    chapter: string;
    section: string;
    source: string;
    characters?: string;
    location?: string;
    theme?: string;
  };
  
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
    
    const chapterInfo = extractChapterInfo(selectedSection.source, extractedContent.metadata);

    return {
      // Raw sacred text (what seeker reads first)
      rawText: extractedContent.narrative,
      rawTextAnnotation: {
        chapter: chapterInfo.chapter,
        section: chapterInfo.section,
        source: selectedSection.source,
        characters: selectedSection.dimensions.character,
        location: selectedSection.dimensions.location,
        theme: selectedSection.dimensions.theme
      },
      
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
        chapter: 'Unknown Chapter',
        section: 'Unknown Section',
        source: 'Sacred Texts',
        characters: 'Unknown',
        location: 'Sacred Realm',
        theme: 'wisdom'
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
  
  try {
    const body = await request.json();
    sourceName = body.sourceName || '';
    
    if (!sourceName) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    console.log(`Today's Wisdom request for folder: ${sourceName}`);
    
    const files = await getAllFilesFromFolder(sourceName);
    
    if (files.length === 0) {
      throw new Error(`No files found in folder ${sourceName}`);
    }
    
    const todaysWisdom = await selectTodaysWisdomFromFiles(files, sourceName);
    
    return NextResponse.json({
      success: true,
      todaysWisdom: todaysWisdom
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