import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage using existing pattern
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

// Get all available folders in the corpus
async function getAllAvailableFolders(storage: Storage) {
  try {
    const bucketName = 'mygurukul-sacred-texts-corpus';
    const bucket = storage.bucket(bucketName);
    
    console.log('🔍 Scanning GCS bucket for available scripture folders...');
    const [files] = await bucket.getFiles();
    
    // Group files by folder
    const folderCounts = new Map();
    const folderFiles = new Map();
    
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length > 1 && pathParts[0].trim()) {
        const folderName = pathParts[0];
        folderCounts.set(folderName, (folderCounts.get(folderName) || 0) + 1);
        
        if (!folderFiles.has(folderName)) {
          folderFiles.set(folderName, []);
        }
        folderFiles.get(folderName).push(file.name);
      }
    });
    
    // Filter folders with substantial content (more than 2 files)
    const availableFolders = Array.from(folderCounts.entries())
      .filter(([folder, count]) => count > 2)
      .map(([folder, count]) => ({
        name: folder,
        fileCount: count,
        files: folderFiles.get(folder)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Found ${availableFolders.length} folders with content:`);
    availableFolders.forEach(folder => {
      console.log(`   ${folder.name}: ${folder.fileCount} files`);
    });
    
    return availableFolders;
  } catch (error) {
    console.error('❌ Error scanning GCS for available folders:', error);
    throw error;
  }
}

// Analyze verse patterns in a single file
function analyzeVersePatterns(content: string, fileName: string) {
  const patterns = {
    verseMarkers: new Set(),
    chapterMarkers: new Set(),
    sectionMarkers: new Set(),
    metadataMarkers: new Set(),
    irregularPatterns: new Set()
  };
  
  const lines = content.split('\n');
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // Verse marker patterns (various formats)
    const versePatterns = [
      // Standard verse patterns
      /^(\d+\.\d+\.\d+)/,           // 1.2.3
      /^(\d+\.\d+)/,                // 1.2
      /^(\d+\.)/,                   // 1.
      /^(\d+)/,                     // 1
      /^(\d+:\d+)/,                 // 1:2
      /^(\d+:\d+:\d+)/,             // 1:2:3
      /^(\d+-\d+)/,                 // 1-2
      /^(\d+\.\d+\.\d+\.\d+)/,      // 1.2.3.4
      
      // Sanskrit/Devanagari patterns
      /^([१-९]+\.)/,                // Devanagari numerals
      /^([१-९]+:[१-९]+)/,           // Devanagari with colon
      
      // Chapter patterns
      /^(Chapter\s+\d+)/i,          // Chapter 1
      /^(अध्याय\s+[१-९]+)/,         // Devanagari chapter
      /^(Adhyaya\s+\d+)/i,          // Adhyaya 1
      /^(Sarga\s+\d+)/i,            // Sarga 1
      /^(Canto\s+\d+)/i,            // Canto 1
      
      // Section patterns
      /^(Section\s+\d+)/i,          // Section 1
      /^(Part\s+\d+)/i,             // Part 1
      /^(Book\s+\d+)/i,             // Book 1
      
      // Metadata patterns
      /^\[([^\]]+)\]/,              // [metadata]
      /^(\*\*[^*]+\*\*)/,           // **bold**
      /^(\*[^*]+\*)/,               // *italic*
      
      // Special markers
      /^(॥\s*\d+\s*॥)/,             // ॥ 1 ॥
      /^(॥[१-९]+॥)/,                // ॥१॥
      /^(OM\s+)/i,                  // OM
      /^(ॐ\s*)/,                    // ॐ
    ];
    
    let matched = false;
    for (const pattern of versePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        patterns.verseMarkers.add(match[1]);
        matched = true;
        break;
      }
    }
    
    // Check for irregular patterns (lines that look like verse markers but don't match standard patterns)
    if (!matched && trimmedLine.length < 20 && /^[\d\s\.:-\u0900-\u097F]+$/.test(trimmedLine)) {
      patterns.irregularPatterns.add(trimmedLine);
    }
    
    // Check for metadata patterns
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      patterns.metadataMarkers.add(trimmedLine);
    }
  }
  
  return {
    fileName,
    totalLines: lines.length,
    verseMarkers: Array.from(patterns.verseMarkers),
    irregularPatterns: Array.from(patterns.irregularPatterns),
    metadataMarkers: Array.from(patterns.metadataMarkers),
    hasComplexPatterns: patterns.irregularPatterns.size > 0,
    patternComplexity: patterns.verseMarkers.size + patterns.irregularPatterns.size
  };
}

// Get all files from a folder and analyze them
async function analyzeFolder(storage: Storage, folderName: string) {
  try {
    const bucketName = 'mygurukul-sacred-texts-corpus';
    const bucket = storage.bucket(bucketName);
    
    console.log(`\n📁 Analyzing folder: ${folderName}`);
    
    const [files] = await bucket.getFiles({
      prefix: folderName + '/',
    });
    
    const analysisResults = [];
    
    for (const file of files) {
      if (file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        try {
          console.log(`   📄 Analyzing: ${file.name.split('/').pop()}`);
          const [data] = await file.download();
          const content = data.toString('utf8');
          
          if (content.length > 100) {
            const analysis = analyzeVersePatterns(content, file.name);
            analysisResults.push(analysis);
          }
        } catch (fileError) {
          console.warn(`   ⚠️  Skipping file ${file.name}: ${fileError.message}`);
        }
      }
    }
    
    return {
      folderName,
      fileCount: analysisResults.length,
      files: analysisResults
    };
  } catch (error) {
    console.error(`❌ Error analyzing folder ${folderName}:`, error);
    return {
      folderName,
      fileCount: 0,
      files: [],
      error: error.message
    };
  }
}

// Generate comprehensive lookup table
function generateLookupTable(allAnalyses: any[]) {
  const lookupTable = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalScriptures: 0,
      totalFiles: 0,
      totalPatterns: 0,
      edgeCases: []
    },
    scriptures: {},
    patternFrequency: {},
    edgeCases: [],
    preprocessingTemplates: {}
  };
  
  // Process each scripture
  for (const analysis of allAnalyses) {
    if (analysis.error) continue;
    
    lookupTable.metadata.totalScriptures++;
    lookupTable.metadata.totalFiles += analysis.fileCount;
    
    const scriptureData = {
      folderName: analysis.folderName,
      fileCount: analysis.fileCount,
      files: {},
      allPatterns: new Set(),
      hasComplexPatterns: false,
      recommendedParsingStrategy: 'standard'
    };
    
    // Analyze each file in the scripture
    for (const fileAnalysis of analysis.files) {
      scriptureData.files[fileAnalysis.fileName] = {
        totalLines: fileAnalysis.totalLines,
        verseMarkers: fileAnalysis.verseMarkers,
        irregularPatterns: fileAnalysis.irregularPatterns,
        metadataMarkers: fileAnalysis.metadataMarkers,
        hasComplexPatterns: fileAnalysis.hasComplexPatterns,
        patternComplexity: fileAnalysis.patternComplexity
      };
      
      // Collect all patterns
      fileAnalysis.verseMarkers.forEach((pattern: string) => {
        scriptureData.allPatterns.add(pattern);
        lookupTable.patternFrequency[pattern] = (lookupTable.patternFrequency[pattern] || 0) + 1;
      });
      
      fileAnalysis.irregularPatterns.forEach((pattern: string) => {
        scriptureData.allPatterns.add(pattern);
        lookupTable.patternFrequency[pattern] = (lookupTable.patternFrequency[pattern] || 0) + 1;
      });
      
      if (fileAnalysis.hasComplexPatterns) {
        scriptureData.hasComplexPatterns = true;
      }
    }
    
    // Determine parsing strategy
    if (scriptureData.hasComplexPatterns) {
      scriptureData.recommendedParsingStrategy = 'complex';
      lookupTable.edgeCases.push({
        scripture: analysis.folderName,
        reason: 'Contains irregular verse marker patterns',
        complexity: scriptureData.files[Object.keys(scriptureData.files)[0]]?.patternComplexity || 0
      });
    }
    
    lookupTable.scriptures[analysis.folderName] = scriptureData;
  }
  
  // Generate preprocessing templates
  lookupTable.preprocessingTemplates = {
    standard: {
      description: 'Standard verse marker extraction',
      regex: [
        '^(\\d+\\.\\d+\\.\\d+)',  // 1.2.3
        '^(\\d+\\.\\d+)',         // 1.2
        '^(\\d+\\.)',             // 1.
        '^(\\d+)',                // 1
        '^(\\d+:\\d+)',           // 1:2
        '^(\\d+:\\d+:\\d+)'       // 1:2:3
      ],
      pythonTemplate: `
def extract_standard_verses(text):
    import re
    verses = []
    lines = text.split('\\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Try standard patterns
        for pattern in [
            r'^(\\d+\\.\\d+\\.\\d+)',
            r'^(\\d+\\.\\d+)',
            r'^(\\d+\\.)',
            r'^(\\d+)',
            r'^(\\d+:\\d+)',
            r'^(\\d+:\\d+:\\d+)'
        ]:
            match = re.match(pattern, line)
            if match:
                verses.append({
                    'marker': match.group(1),
                    'content': line,
                    'type': 'verse'
                })
                break
    
    return verses`
    },
    
    complex: {
      description: 'Complex pattern extraction with fallback',
      regex: [
        '^(\\d+\\.\\d+\\.\\d+)',  // Standard patterns first
        '^(\\d+\\.\\d+)',
        '^(\\d+\\.)',
        '^(\\d+)',
        '^([१-९]+\\.)',           // Devanagari
        '^([१-९]+:[१-९]+)',       // Devanagari with colon
        '^(॥\\s*\\d+\\s*॥)',      // ॥ 1 ॥
        '^(॥[१-९]+॥)'             // ॥१॥
      ],
      pythonTemplate: `
def extract_complex_verses(text):
    import re
    verses = []
    lines = text.split('\\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Try complex patterns
        for pattern in [
            r'^(\\d+\\.\\d+\\.\\d+)',
            r'^(\\d+\\.\\d+)',
            r'^(\\d+\\.)',
            r'^(\\d+)',
            r'^([१-९]+\\.)',
            r'^([१-९]+:[१-९]+)',
            r'^(॥\\s*\\d+\\s*॥)',
            r'^(॥[१-९]+॥)'
        ]:
            match = re.match(pattern, line)
            if match:
                verses.append({
                    'marker': match.group(1),
                    'content': line,
                    'type': 'verse'
                })
                break
        else:
            # Fallback for irregular patterns
            if len(line) < 20 and re.match(r'^[\\d\\s\\.:-\\u0900-\\u097F]+$', line):
                verses.append({
                    'marker': line,
                    'content': line,
                    'type': 'irregular'
                })
    
    return verses`
    }
  };
  
  lookupTable.metadata.totalPatterns = Object.keys(lookupTable.patternFrequency).length;
  lookupTable.metadata.edgeCases = lookupTable.edgeCases;
  
  return lookupTable;
}

export async function GET() {
  try {
    console.log('🚀 Starting comprehensive verse pattern analysis...\n');
    
    const storage = initializeStorage();
    const availableFolders = await getAllAvailableFolders(storage);
    
    console.log(`\n📊 Analyzing ${availableFolders.length} scripture folders...\n`);
    
    const allAnalyses = [];
    
    for (const folder of availableFolders) {
      const analysis = await analyzeFolder(storage, folder.name);
      allAnalyses.push(analysis);
    }
    
    console.log('\n🔧 Generating comprehensive lookup table...');
    const lookupTable = generateLookupTable(allAnalyses);
    
    console.log(`\n✅ Analysis complete!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total Scriptures: ${lookupTable.metadata.totalScriptures}`);
    console.log(`   • Total Files: ${lookupTable.metadata.totalFiles}`);
    console.log(`   • Total Patterns: ${lookupTable.metadata.totalPatterns}`);
    console.log(`   • Edge Cases: ${lookupTable.metadata.edgeCases.length}`);
    
    if (lookupTable.metadata.edgeCases.length > 0) {
      console.log(`\n⚠️  Edge Cases Found:`);
      lookupTable.metadata.edgeCases.forEach((edgeCase: any) => {
        console.log(`   • ${edgeCase.scripture}: ${edgeCase.reason}`);
      });
    }
    
    return NextResponse.json({
      success: true,
      lookupTable,
      summary: {
        totalScriptures: lookupTable.metadata.totalScriptures,
        totalFiles: lookupTable.metadata.totalFiles,
        totalPatterns: lookupTable.metadata.totalPatterns,
        edgeCases: lookupTable.metadata.edgeCases.length,
        generatedAt: lookupTable.metadata.generatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze verse patterns',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}
