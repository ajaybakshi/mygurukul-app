/**
 * Test PHILOSOPHICAL Extractor - Phase 3: Multi-Text-Type Extraction
 * Tests the philosophical logical unit extractor with real GCS Upanishad data
 */

const { GretilWisdomService } = require('./src/lib/services/gretilWisdomService.ts');

// Test the philosophical extractor with real GCS data
async function testPhilosophicalExtractor() {
  console.log('🧪 Testing PHILOSOPHICAL Logical Unit Extractor...\n');

  const service = new GretilWisdomService();

  try {
    // Get all available Gretil sources
    console.log('📚 Fetching available Gretil sources...');
    const sources = await service.getAllAvailableGretilSources();

    // Filter for philosophical texts (Upanishads)
    const philosophicalSources = sources.filter(source =>
      source.enhancedTextType === 'PHILOSOPHICAL' ||
      source.category === 'Upanishads' ||
      source.displayName.toLowerCase().includes('upanishad')
    );

    console.log(`📖 Found ${philosophicalSources.length} philosophical sources:`);
    philosophicalSources.forEach(source => {
      console.log(`  - ${source.displayName} (${source.category})`);
    });

    if (philosophicalSources.length === 0) {
      console.log('❌ No philosophical sources found. Checking all sources...');
      sources.slice(0, 5).forEach(source => {
        console.log(`  - ${source.displayName} (${source.category}) - ${source.enhancedTextType || 'unknown'}`);
      });
      return;
    }

    // Test extraction from first Upanishad
    const testSource = philosophicalSources[0];
    console.log(`\n🎯 Testing extraction from: ${testSource.displayName}`);

    const result = await service.extractWisdomFromGretilSource(testSource.folderName);

    if (result) {
      console.log('✅ Extraction successful!');
      console.log('📊 Results:');
      console.log(`  - Text: ${result.textName}`);
      console.log(`  - Category: ${result.category}`);
      console.log(`  - Verses: ${result.estimatedVerses}`);
      console.log(`  - Reference: ${result.reference}`);
      console.log(`  - Sanskrit (first 200 chars): ${result.sanskrit.substring(0, 200)}...`);

      if (result.metadata) {
        console.log('📋 Metadata:');
        console.log(`  - Text Type: ${result.metadata.textType}`);
        console.log(`  - Enhanced Type: ${result.metadata.enhancedTextType}`);
        console.log(`  - Confidence: ${result.metadata.textTypeConfidence}`);

        if (result.metadata.philosophicalUnit) {
          console.log('🎓 Philosophical Unit Details:');
          console.log(`  - Teaching Type: ${result.metadata.philosophicalUnit.teachingType}`);
          console.log(`  - Verse Range: ${result.metadata.philosophicalUnit.verseRange.start} - ${result.metadata.philosophicalUnit.verseRange.end}`);
          console.log(`  - Verses Count: ${result.metadata.philosophicalUnit.verseRange.count}`);
          if (result.metadata.philosophicalUnit.context.philosophicalConcept) {
            console.log(`  - Concept: ${result.metadata.philosophicalUnit.context.philosophicalConcept}`);
          }
        }
      }
    } else {
      console.log('❌ Extraction failed or returned null');
    }

    // Test a few more sources for comparison
    console.log('\n🔄 Testing additional philosophical sources...');
    for (let i = 1; i < Math.min(3, philosophicalSources.length); i++) {
      const source = philosophicalSources[i];
      console.log(`\n📖 Testing ${source.displayName}...`);

      const result = await service.extractWisdomFromGretilSource(source.folderName);

      if (result) {
        console.log(`✅ ${source.displayName}: ${result.estimatedVerses} verses, ${result.reference}`);
        if (result.metadata?.philosophicalUnit) {
          console.log(`   Teaching type: ${result.metadata.philosophicalUnit.teachingType}`);
        }
      } else {
        console.log(`❌ ${source.displayName}: Extraction failed`);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Demonstrate the improvement (like EPIC extractor did)
function demonstratePhilosophicalImprovement() {
  console.log('\n🎯 PHILOSOPHICAL EXTRACTOR IMPROVEMENT DEMONSTRATION');
  console.log('==================================================');

  console.log('\n📊 BEFORE (Standard Extraction):');
  console.log('  - Random verse: "Line 4523" → Single verse from Chandogya Upanishad');
  console.log('  - No context about philosophical teaching');
  console.log('  - No indication of commentary vs teaching vs dialogue');
  console.log('  - No grouping of related concepts');

  console.log('\n✅ AFTER (Philosophical Logical Unit Extraction):');
  console.log('  - Structured unit: "chup_4,1.1-chup_4,1.3" → Complete teaching unit');
  console.log('  - Teaching type identified: "commentary", "dialogue", "teaching", "explanation"');
  console.log('  - Philosophical concepts extracted: "Brahman", "Atman", "Moksha", etc.');
  console.log('  - Context preserved: chapter, section, speaker information');
  console.log('  - Related verses grouped as logical units');

  console.log('\n🎯 EXAMPLE TRANSFORMATION:');
  console.log('  BEFORE: Line 4523');
  console.log('  AFTER:  Chandogya Upanishad 4.1.1-4.1.3 (commentary) - "The teaching of Brahman..."');
}

// Run the test
if (require.main === module) {
  testPhilosophicalExtractor()
    .then(() => {
      demonstratePhilosophicalImprovement();
      console.log('\n✨ Philosophical extractor testing complete!');
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
    });
}

module.exports = {
  testPhilosophicalExtractor,
  demonstratePhilosophicalImprovement
};
