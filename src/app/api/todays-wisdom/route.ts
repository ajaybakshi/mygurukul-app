import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

interface TodaysWisdom {
  wisdom: string;
  context: string;
  type: 'story' | 'verse' | 'teaching';
  sourceName: string;
  timestamp: string;
  encouragement: string;
  sourceLocation?: string;
  filesSearched?: string[];
  metadata?: string; // Include metadata for transparency
}

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
    
    // List all files in the folder
    const [files] = await bucket.getFiles({
      prefix: folderName + '/',
    });
    
    console.log(`Found ${files.length} files in ${folderName} folder`);
    
    const fileContents = [];
    
    // Download content from each file
    for (const file of files) {
      try {
        if (file.name.endsWith('.txt') || file.name.endsWith('.json')) {
          const [data] = await file.download();
          const content = data.toString('utf8');
          
          if (content.length > 100) { // Only include files with substantial content
            fileContents.push({
              fileName: file.name,
              content: content
            });
          }
        }
      } catch (fileError) {
        console.warn(`Skipping file ${file.name}:`, fileError.message);
      }
    }
    
    console.log(`Successfully loaded ${fileContents.length} files from ${folderName}`);
    return fileContents;
    
  } catch (error) {
    console.error('Error accessing folder in Google Cloud Storage:', error);
    throw new Error(`Failed to retrieve files from ${folderName}: ${error.message}`);
  }
}

// Enhanced extraction function for both metadata and narrative content
function extractMetadataAndContent(text: string, selectedIndex: number) {
  // Extract metadata tags
  const metadataMatches = text.match(/\[.*?\]/g) || [];
  const metadata = metadataMatches.join(' ');
  
  // Extract clean narrative content
  const cleanText = text.replace(/\[.*?\]/g, '').replace(/\n{3,}/g, '\n\n');
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Get 3-5 sentences of context around the selected wisdom
  const contextStart = Math.max(0, selectedIndex - 2);
  const contextEnd = Math.min(sentences.length, selectedIndex + 3);
  let narrative = sentences.slice(contextStart, contextEnd).join('. ').trim() + '.';
  
  // Clean up formatting: remove extra quotes, newlines, and normalize spacing
  narrative = narrative
    .replace(/^["\s\n]+/, '') // Remove leading quotes and whitespace
    .replace(/["\s\n]+$/, '') // Remove trailing quotes and whitespace
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
  
  return {
    metadata: metadata,
    narrative: narrative,
    combined: `${metadata}\n\nNarrative: ${narrative}`
  };
}

// Extract actual story content from text, removing metadata and structural annotations
function extractActualContent(text: string): string {
  // Remove all metadata tags in brackets
  let cleanText = text.replace(/\[.*?\]/g, '');
  
  // Split into paragraphs and filter for meaningful content
  const paragraphs = cleanText.split('\n\n').filter(paragraph => {
    const trimmed = paragraph.trim();
    return trimmed.length > 100 && 
           !trimmed.match(/^(KANDA|SECTION|CHARACTERS|PLACES|THEMES|CONTEXT):/i) &&
           !trimmed.match(/^\d+\./) && // Remove numbered sections
           !trimmed.match(/^[A-Z\s]+:$/i) && // Remove section headers
           !trimmed.match(/^---+$/); // Remove separator lines
  });
  
  // Return the most story-like paragraphs
  return paragraphs.slice(0, 3).join('\n\n');
}

// Extract wisdom from multiple files
async function selectTodaysWisdomFromFiles(
  files: { fileName: string; content: string }[], 
  sourceName: string
): Promise<TodaysWisdom> {
  try {
    // Combine all content for analysis
    const allSections = [];
    const filesSearched = [];
    
    files.forEach(file => {
      filesSearched.push(file.fileName);
      
      // Extract actual story content, not metadata
      const actualContent = extractActualContent(file.content);
      
      if (actualContent.length > 200) {
        // Split into sentences for better context extraction
        const sentences = actualContent.split(/[.!?]+/).filter(s => s.trim().length > 50);
        
        // Create content chunks with full context (3-5 sentences each)
        for (let i = 0; i < sentences.length; i++) {
          const extractedContent = extractMetadataAndContent(actualContent, i);
          
          if (extractedContent.narrative.length > 150 && extractedContent.narrative.length < 2000) {
            allSections.push({
              content: extractedContent.narrative,
              source: file.fileName,
              metadata: extractedContent.metadata
            });
          }
        }
      }
    });
    
    if (allSections.length === 0) {
      // Fallback: extract any meaningful content with context
      files.forEach(file => {
        const cleanText = file.content.replace(/\[.*?\]/g, '');
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 50);
        
        // Create fallback chunks with context
        for (let i = 0; i < sentences.length; i++) {
          const extractedContent = extractMetadataAndContent(cleanText, i);
          
          if (extractedContent.narrative.length > 150 && extractedContent.narrative.length < 2000) {
            allSections.push({
              content: extractedContent.narrative,
              source: file.fileName,
              metadata: extractedContent.metadata
            });
          }
        }
      });
    }
    
    // Use current date to select wisdom
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const selectedIndex = dayOfYear % Math.max(allSections.length, 1);
    
    const selectedSection = allSections[selectedIndex];
    
    // Extract both metadata and narrative content
    const extractedContent = extractMetadataAndContent(selectedSection?.content || "", 0);
    
    // Get AI-enhanced wisdom using both metadata and narrative
    console.log('Extracted content:', extractedContent);
    
    let finalWisdom = extractedContent.narrative;
    let finalEncouragement = generateEncouragement(determineWisdomType(extractedContent.narrative));
    
    try {
      const enhancedWisdom = await createEnhancedWisdom(extractedContent, sourceName);
      if (enhancedWisdom && enhancedWisdom.length > 50) {
        finalWisdom = enhancedWisdom;
        finalEncouragement = generateContextualEncouragement(enhancedWisdom);
        console.log('AI enhancement successful, length:', enhancedWisdom.length);
      } else {
        console.log('AI enhancement failed or returned short content, using fallback');
      }
    } catch (error) {
      console.log('AI enhancement error:', error.message);
    }
    
    const type = determineWisdomType(finalWisdom);
    
    const result = {
      wisdom: finalWisdom,
      context: `Daily wisdom from ${sourceName} - Selected for ${today.toLocaleDateString()}`,
      type,
      sourceName,
      timestamp: new Date().toISOString(),
      encouragement: finalEncouragement,
      sourceLocation: `From ${selectedSection?.source || 'sacred texts'}`,
      filesSearched: filesSearched.slice(0, 5),
      metadata: extractedContent.metadata // Include metadata for transparency
    };
    
    console.log('Returning result:', result);
    return result;
    
  } catch (error) {
    console.error('Error selecting wisdom:', error);
    return {
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

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    
    return extractedContent.narrative; // Fallback to clean narrative
  } catch (error) {
    console.log('AI enhancement failed:', error.message);
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
    
    // Get all files from the folder
    const files = await getAllFilesFromFolder(sourceName);
    
    if (files.length === 0) {
      throw new Error(`No files found in folder ${sourceName}`);
    }
    
    // Select today's wisdom from all files
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        fallbackWisdom: {
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
