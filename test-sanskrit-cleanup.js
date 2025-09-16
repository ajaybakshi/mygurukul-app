/**
 * Comprehensive Test Suite for SanskritCleanupService
 * Tests all cleanup scenarios with real scripture examples
 */

const { SanskritCleanupService, DEFAULT_CLEANUP_OPTIONS } = require('./src/lib/services/sanskritCleanupService.ts');

// Test data with real scripture examples
const testCases = [
  {
    name: 'Bhagavad Gita with verse markers',
    text: '// bhg_2,40.20 // अर्जुन उवाच कथं भीष्ममहं संख्ये द्रोणं च मधुसूदन।',
    scriptureFile: 'Bhagvad_Gita.txt',
    expectedCleaned: 'अर्जुन उवाच कथं भीष्ममहं संख्ये द्रोणं च मधुसूदन।',
    expectedReference: 'bhg2,40.20'
  },
  {
    name: 'Rig Veda with multiple patterns',
    text: '// rv_1,1.1 // अग्निमीळे पुरोहितं यज्ञस्य देवं रत्वीजम।',
    scriptureFile: 'Rig_Veda.txt',
    expectedCleaned: 'अग्निमीळे पुरोहितं यज्ञस्य देवं रत्वीजम।',
    expectedReference: 'rv1,1.1'
  },
  {
    name: 'Upanishad with danda markers',
    text: '// aitup_1,1.1 // ॐ सह नाववतु। सह नौ भुनक्तु॥',
    scriptureFile: 'Aiteryo_Upanishad.txt',
    expectedCleaned: 'ॐ सह नाववतु। सह नौ भुनक्तु॥',
    expectedReference: 'aitup1,1.1'
  },
  {
    name: 'Purana with digits and brackets',
    text: '// ap_1,2.3 // [1.2.3] तत् सत् इति निर्देशः। (1) एवं वदन्ति।',
    scriptureFile: 'Agni_Purana.txt',
    expectedCleaned: 'तत् सत् इति निर्देशः। एवं वदन्ति।',
    expectedReference: 'ap1,2.3'
  },
  {
    name: 'Complex text with multiple artifacts',
    text: '// ram_2,40.20 // [2.40.20] रामः उवाच (1) सीता मे प्राणाधिका। 123 अयोध्या नगरी।',
    scriptureFile: 'Valmiki_Ramayana.txt',
    expectedCleaned: 'रामः उवाच सीता मे प्राणाधिका। अयोध्या नगरी।',
    expectedReference: 'ram2,40.20'
  }
];

// Test cleanup options
const testOptions = [
  {
    name: 'Default options',
    options: DEFAULT_CLEANUP_OPTIONS
  },
  {
    name: 'Remove danda for prosody',
    options: { ...DEFAULT_CLEANUP_OPTIONS, keepDandaForProsody: false }
  },
  {
    name: 'Keep digits',
    options: { ...DEFAULT_CLEANUP_OPTIONS, removeDigits: false }
  },
  {
    name: 'Minimal cleanup',
    options: {
      keepDandaForProsody: false,
      removeDigits: false,
      normalizeWhitespace: false,
      preserveCanonicalRefs: false
    }
  }
];

async function runTests() {
  console.log('🧪 Starting SanskritCleanupService Tests\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test individual cleanup scenarios
  console.log('📝 Testing Individual Cleanup Scenarios:');
  console.log('=' .repeat(50));

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n${totalTests}. ${testCase.name}`);
    console.log(`   Input: "${testCase.text}"`);
    
    try {
      const result = SanskritCleanupService.cleanForAudio(
        testCase.text,
        testCase.scriptureFile,
        DEFAULT_CLEANUP_OPTIONS
      );

      console.log(`   Output: "${result.cleanedText}"`);
      console.log(`   Reference: ${result.canonicalReference || 'None'}`);
      console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
      console.log(`   Patterns Removed: ${result.metadata.patternsRemoved.length}`);

      // Validate results
      const textMatch = result.cleanedText === testCase.expectedCleaned;
      const refMatch = result.canonicalReference === testCase.expectedReference;

      if (textMatch && refMatch) {
        console.log('   ✅ PASSED');
        passedTests++;
      } else {
        console.log('   ❌ FAILED');
        if (!textMatch) console.log(`      Expected text: "${testCase.expectedCleaned}"`);
        if (!refMatch) console.log(`      Expected reference: "${testCase.expectedReference}"`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedTests++;
    }
  }

  // Test different cleanup options
  console.log('\n\n🔧 Testing Cleanup Options:');
  console.log('=' .repeat(50));

  const sampleText = '// bhg_2,40.20 // अर्जुन उवाच। 123 तत् सत्॥';
  const sampleScripture = 'Bhagvad_Gita.txt';

  for (const optionTest of testOptions) {
    totalTests++;
    console.log(`\n${totalTests}. ${optionTest.name}`);
    console.log(`   Options:`, optionTest.options);
    
    try {
      const result = SanskritCleanupService.cleanForAudio(
        sampleText,
        sampleScripture,
        optionTest.options
      );

      console.log(`   Input: "${sampleText}"`);
      console.log(`   Output: "${result.cleanedText}"`);
      console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
      console.log(`   Patterns Removed: ${result.metadata.patternsRemoved.length}`);
      console.log(`   Prosody Markers: ${result.metadata.prosodyMarkers.length}`);

      // Basic validation - should not throw errors
      if (result.cleanedText && result.metadata.processingTime > 0) {
        console.log('   ✅ PASSED');
        passedTests++;
      } else {
        console.log('   ❌ FAILED - Invalid result');
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedTests++;
    }
  }

  // Test batch processing
  console.log('\n\n📦 Testing Batch Processing:');
  console.log('=' .repeat(50));

  totalTests++;
  console.log(`\n${totalTests}. Batch Cleanup Test`);
  
  try {
    const batchInput = testCases.slice(0, 3).map(tc => ({
      text: tc.text,
      scriptureFile: tc.scriptureFile
    }));

    const batchResults = SanskritCleanupService.cleanBatchForAudio(
      batchInput,
      DEFAULT_CLEANUP_OPTIONS
    );

    const stats = SanskritCleanupService.getCleanupStats(batchResults);

    console.log(`   Processed: ${stats.totalProcessed} texts`);
    console.log(`   Average Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   Total Patterns Removed: ${stats.totalPatternsRemoved}`);
    console.log(`   Scriptures: ${stats.scripturesProcessed.join(', ')}`);

    if (batchResults.length === batchInput.length && stats.totalProcessed > 0) {
      console.log('   ✅ PASSED');
      passedTests++;
    } else {
      console.log('   ❌ FAILED - Batch processing error');
      failedTests++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failedTests++;
  }

  // Test error handling
  console.log('\n\n⚠️  Testing Error Handling:');
  console.log('=' .repeat(50));

  totalTests++;
  console.log(`\n${totalTests}. Invalid Scripture File Test`);
  
  try {
    const result = SanskritCleanupService.cleanForAudio(
      'Test text',
      'NonExistent_Scripture.txt',
      DEFAULT_CLEANUP_OPTIONS
    );

    // Should still work but with fallback behavior
    if (result.cleanedText && result.metadata.scriptureFile === 'NonExistent_Scripture.txt') {
      console.log('   ✅ PASSED - Graceful fallback');
      passedTests++;
    } else {
      console.log('   ❌ FAILED - Unexpected behavior');
      failedTests++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failedTests++;
  }

  // Final results
  console.log('\n\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! SanskritCleanupService is working correctly.');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the implementation.`);
  }

  return { totalTests, passedTests, failedTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCases, testOptions };
