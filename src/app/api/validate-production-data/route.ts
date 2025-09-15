/**
 * Production Data Validation API
 * Validates text type classification against real GCS bucket data
 */

import { NextRequest, NextResponse } from 'next/server';
import { gretilWisdomService } from '../../../lib/services/gretilWisdomService';
import { gretilTextTypeClassifier } from '../../../lib/services/gretilTextTypeClassifier';
import { GretilTextType } from '../../../types/gretil-types';

export async function GET(request: NextRequest) {
  try {
    console.log('🔬 Starting Production Data Validation');

    // Step 1: Get all available sources
    console.log('📂 Step 1: Scanning GCS bucket for actual files...');
    const sources = await gretilWisdomService.getAllAvailableGretilSources();

    console.log(`Found ${sources.length} files in Gretil_Originals`);

    // Group by category
    const byCategory: Record<string, any[]> = {};
    sources.forEach(source => {
      if (!byCategory[source.category]) byCategory[source.category] = [];
      byCategory[source.category].push({
        filename: source.folderName,
        displayName: source.displayName,
        legacyType: source.textType,
        enhancedType: source.enhancedTextType
      });
    });

    // Step 2: Define test files we want to validate (using actual filenames from bucket)
    const testFiles = [
      { filename: 'Mandukya_Upanishad.txt', expected: GretilTextType.PHILOSOPHICAL, display: 'Mandukya Upanishad' },
      { filename: 'Valmiki_Ramayana.txt', expected: GretilTextType.EPIC, display: 'Ramayana (Valmiki)' },
      { filename: 'Bhagvad_Gita.txt', expected: GretilTextType.PHILOSOPHICAL, display: 'Bhagavad Gita' },
      { filename: 'Chandogya_Upanishad.txt', expected: GretilTextType.PHILOSOPHICAL, display: 'Chandogya Upanishad' },
      { filename: 'Rig_Veda.txt', expected: GretilTextType.HYMNAL, display: 'Rig Veda' },
      { filename: 'Agni_Purana.txt', expected: GretilTextType.NARRATIVE, display: 'Agni Purana' }
    ];

    console.log('🎯 Step 2: Testing classification on specific files...');

    const validationResults = [];

    for (const testFile of testFiles) {
      console.log(`\n🔍 Testing: ${testFile.filename}`);

      try {
        // Check if file exists
        const sourceInfo = sources.find(s => s.folderName === testFile.filename);
        if (!sourceInfo) {
          validationResults.push({
            filename: testFile.filename,
            status: 'FILE_NOT_FOUND',
            expected: testFile.expected,
            availableFiles: sources.map(s => s.folderName).slice(0, 10)
          });
          continue;
        }

        // Extract wisdom to get real content
        const wisdom = await gretilWisdomService.extractWisdomFromGretilSource(testFile.filename);

        if (!wisdom) {
          validationResults.push({
            filename: testFile.filename,
            status: 'EXTRACTION_FAILED',
            expected: testFile.expected,
            sourceInfo: sourceInfo
          });
          continue;
        }

        // Now classify the actual content
        const classification = gretilTextTypeClassifier.classifyText(testFile.filename, wisdom.sanskrit);

        // Get detailed debug info
        const debugInfo = gretilTextTypeClassifier.analyzeForDebugging(testFile.filename, wisdom.sanskrit);

        const isCorrect = classification.textType === testFile.expected;

        validationResults.push({
          filename: testFile.filename,
          status: 'SUCCESS',
          expected: testFile.expected,
          classified: classification.textType,
          confidence: classification.confidence,
          passed: isCorrect,
          sourceInfo: {
            category: sourceInfo.category,
            legacyType: sourceInfo.textType,
            enhancedType: sourceInfo.enhancedTextType
          },
          extractedContent: {
            sanskrit: wisdom.sanskrit.substring(0, 200) + '...',
            reference: wisdom.reference,
            length: wisdom.sanskrit.length
          },
          patterns: classification.detectedPatterns,
          debugInfo: {
            filenameMatches: debugInfo.allMatches.filename,
            contentMatches: debugInfo.allMatches.content,
            structuralMatches: debugInfo.allMatches.structural,
            scores: debugInfo.scores
          }
        });

        console.log(`   Expected: ${testFile.expected}`);
        console.log(`   Classified: ${classification.textType} (${classification.confidence})`);
        console.log(`   Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

      } catch (error) {
        console.error(`   Error testing ${testFile.filename}:`, error);
        validationResults.push({
          filename: testFile.filename,
          status: 'ERROR',
          expected: testFile.expected,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 3: Summary statistics
    const successfulTests = validationResults.filter(r => r.status === 'SUCCESS');
    const passedTests = successfulTests.filter(r => r.passed);
    const confidenceBreakdown = successfulTests.reduce((acc: Record<string, number>, test) => {
      const confidence = test.confidence || 'unknown';
      acc[confidence] = (acc[confidence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = {
      totalFilesInBucket: sources.length,
      testFilesAttempted: testFiles.length,
      successfulExtractions: successfulTests.length,
      passedClassifications: passedTests.length,
      successRate: `${((passedTests.length / successfulTests.length) * 100).toFixed(1)}%`,
      confidenceBreakdown,
      categories: Object.keys(byCategory),
      timestamp: new Date().toISOString(),
      phase: 'Production Data Validation'
    };

    return NextResponse.json({
      summary,
      categoryBreakdown: byCategory,
      validationResults,
      allSources: sources.map(s => ({
        filename: s.folderName,
        displayName: s.displayName,
        category: s.category,
        legacyType: s.textType,
        enhancedType: s.enhancedTextType
      }))
    });

  } catch (error) {
    console.error('💥 Production validation error:', error);
    return NextResponse.json(
      {
        error: 'Production validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename required' },
        { status: 400 }
      );
    }

    console.log(`🔬 Deep validation of: ${filename}`);

    // Extract real content
    const wisdom = await gretilWisdomService.extractWisdomFromGretilSource(filename);

    if (!wisdom) {
      return NextResponse.json(
        { error: 'Could not extract wisdom from file' },
        { status: 404 }
      );
    }

    // Full content analysis
    const classification = gretilTextTypeClassifier.classifyText(filename, wisdom.sanskrit);
    const debugInfo = gretilTextTypeClassifier.analyzeForDebugging(filename, wisdom.sanskrit);

    // Also test with metadata if available
    const metadataAnalysis = wisdom.metadata ?
      gretilTextTypeClassifier.classifyText(filename, wisdom.sanskrit + ' ' + JSON.stringify(wisdom.metadata)) :
      null;

    return NextResponse.json({
      filename,
      wisdom: {
        sanskrit: wisdom.sanskrit,
        reference: wisdom.reference,
        textName: wisdom.textName,
        category: wisdom.category
      },
      classification,
      debugInfo,
      metadataAnalysis,
      fullContentLength: wisdom.sanskrit.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Deep validation error:', error);
    return NextResponse.json(
      {
        error: 'Deep validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
