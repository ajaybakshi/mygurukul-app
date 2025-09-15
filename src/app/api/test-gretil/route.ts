import { NextRequest, NextResponse } from 'next/server';
import { gretilWisdomService } from '../../../lib/services/gretilWisdomService';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Gretil service...');
    
    // Get the source parameter if provided
    const { searchParams } = new URL(request.url);
    const specificSource = searchParams.get('source');
    
    // Test 1: Get available sources
    const sources = await gretilWisdomService.getAllAvailableGretilSources();
    console.log(`Found ${sources.length} Gretil sources`);
    
    if (sources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No Gretil sources found in bucket',
        sources: []
      });
    }
    
    // Test 2: Extract wisdom from specified source or first source
    let sourceToTest = sources[0].folderName; // Default to first source
    
    if (specificSource) {
      // Check if the specific source exists by filename
      const foundSource = sources.find(s => s.folderName === specificSource);
      if (foundSource) {
        sourceToTest = specificSource;
        console.log(`Using specified source: ${sourceToTest}`);
      } else {
        console.log(`Specified source ${specificSource} not found, using default: ${sourceToTest}`);
      }
    }
    
    console.log(`Testing extraction from: ${sourceToTest}`);
    
    const wisdom = await gretilWisdomService.extractWisdomFromGretilSource(sourceToTest);
    
    // Debug info
    console.log(`Extraction result for ${sourceToTest}:`, wisdom ? 'SUCCESS' : 'NULL');
    if (wisdom) {
      console.log(`- Sanskrit length: ${wisdom.sanskrit.length}`);
      console.log(`- Reference: ${wisdom.reference}`);
      console.log(`- Text name: ${wisdom.textName}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Gretil service test successful',
      availableSources: sources.length,
      testedFile: sourceToTest,
      sources: sources,
      testWisdom: wisdom,
      debugInfo: {
        extractionSuccessful: wisdom !== null,
        sanskritLength: wisdom?.sanskrit?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Gretil service test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Gretil service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
