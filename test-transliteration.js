/**
 * Comprehensive Test Suite for TransliterationService
 * Tests script detection, transliteration accuracy, and edge cases
 */

const { TransliterationService, ScriptType } = require('./src/lib/services/transliterationService.ts');

// Test cases with various script types and complexity
const testCases = [
  {
    name: 'Simple IAST to Devanagari',
    text: 'arjuna uvāca',
    expectedScript: ScriptType.IAST,
    expectedTransliterated: true,
    expectedResult: 'अर्जुन उवाच'
  },
  {
    name: 'Complex IAST with diacritics',
    text: 'bhagavad gītā',
    expectedScript: ScriptType.IAST,
    expectedTransliterated: true,
    expectedResult: 'भगवद् गीता'
  },
  {
    name: 'IAST with conjuncts',
    text: 'kṣatriya dharma',
    expectedScript: ScriptType.IAST,
    expectedTransliterated: true,
    expectedResult: 'क्षत्रिय धर्म'
  },
  {
    name: 'Already Devanagari',
    text: 'अर्जुन उवाच',
    expectedScript: ScriptType.DEVANAGARI,
    expectedTransliterated: false,
    expectedResult: 'अर्जुन उवाच'
  },
  {
    name: 'Mixed script (IAST + Devanagari)',
    text: 'arjuna अर्जुन',
    expectedScript: ScriptType.MIXED,
    expectedTransliterated: true,
    expectedResult: 'अर्जुन अर्जुन'
  },
  {
    name: 'IAST with numbers',
    text: 'rāma 2,40.20',
    expectedScript: ScriptType.IAST,
    expectedTransliterated: true,
    expectedResult: 'राम 2,40.20'
  },
  {
    name: 'Complex Sanskrit verse',
    text: 'śrīmad bhagavad gītā upaniṣad',
    expectedScript: ScriptType.IAST,
    expectedTransliterated: true,
    expectedResult: 'श्रीमद् भगवद् गीता उपनिषद्'
  },
  {
    name: 'English text (should not transliterate)',
    text: 'The Bhagavad Gita is a sacred text',
    expectedScript: ScriptType.UNKNOWN,
    expectedTransliterated: false,
    expectedResult: 'The Bhagavad Gita is a sacred text'
  },
  {
    name: 'Empty string',
    text: '',
    expectedScript: ScriptType.UNKNOWN,
    expectedTransliterated: false,
    expectedResult: ''
  },
  {
    name: 'Whitespace only',
    text: '   \n\t  ',
    expectedScript: ScriptType.UNKNOWN,
    expectedTransliterated: false,
    expectedResult: '   \n\t  '
  }
];

// Test different options
const optionTests = [
  {
    name: 'Default options (Devanagari preferred)',
    options: {
      devanagariPreferred: true,
      preserveNumbers: true,
      handleMixed: true
    }
  },
  {
    name: 'IAST preferred (should not transliterate)',
    options: {
      devanagariPreferred: false,
      preserveNumbers: true,
      handleMixed: true
    }
  },
  {
    name: 'Don\'t preserve numbers',
    options: {
      devanagariPreferred: true,
      preserveNumbers: false,
      handleMixed: true
    }
  },
  {
    name: 'Don\'t handle mixed scripts',
    options: {
      devanagariPreferred: true,
      preserveNumbers: true,
      handleMixed: false
    }
  }
];

async function runTests() {
  console.log('🔤 Starting TransliterationService Tests\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test individual transliteration scenarios
  console.log('📝 Testing Individual Transliteration Scenarios:');
  console.log('=' .repeat(60));

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n${totalTests}. ${testCase.name}`);
    console.log(`   Input: "${testCase.text}"`);
    
    try {
      const result = TransliterationService.transliterate(testCase.text);

      console.log(`   Output: "${result.result}"`);
      console.log(`   Detected Script: ${result.detectedScript}`);
      console.log(`   Was Transliterated: ${result.wasTransliterated}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Processing Time: ${result.processingTimeMs}ms`);

      // Validate results
      const scriptMatch = result.detectedScript === testCase.expectedScript;
      const transliterationMatch = result.wasTransliterated === testCase.expectedTransliterated;
      const resultMatch = result.result === testCase.expectedResult;

      if (scriptMatch && transliterationMatch && resultMatch) {
        console.log('   ✅ PASSED');
        passedTests++;
      } else {
        console.log('   ❌ FAILED');
        if (!scriptMatch) console.log(`      Expected script: ${testCase.expectedScript}, got: ${result.detectedScript}`);
        if (!transliterationMatch) console.log(`      Expected transliterated: ${testCase.expectedTransliterated}, got: ${result.wasTransliterated}`);
        if (!resultMatch) console.log(`      Expected result: "${testCase.expectedResult}", got: "${result.result}"`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedTests++;
    }
  }

  // Test different options
  console.log('\n\n🔧 Testing Transliteration Options:');
  console.log('=' .repeat(60));

  const sampleText = 'arjuna uvāca rāma 2,40.20';

  for (const optionTest of optionTests) {
    totalTests++;
    console.log(`\n${totalTests}. ${optionTest.name}`);
    console.log(`   Options:`, optionTest.options);
    
    try {
      const result = TransliterationService.transliterate(sampleText, optionTest.options);

      console.log(`   Input: "${sampleText}"`);
      console.log(`   Output: "${result.result}"`);
      console.log(`   Detected Script: ${result.detectedScript}`);
      console.log(`   Was Transliterated: ${result.wasTransliterated}`);
      console.log(`   Processing Time: ${result.processingTimeMs}ms`);

      // Basic validation - should not throw errors
      if (result.result && result.processingTimeMs >= 0) {
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
  console.log('=' .repeat(60));

  totalTests++;
  console.log(`\n${totalTests}. Batch Transliteration Test`);
  
  try {
    const batchInput = [
      'arjuna uvāca',
      'अर्जुन उवाच',
      'bhagavad gītā',
      'The Bhagavad Gita'
    ];

    const batchResults = TransliterationService.transliterateBatch(batchInput);

    const stats = TransliterationService.getTransliterationStats(batchResults);

    console.log(`   Processed: ${stats.totalProcessed} texts`);
    console.log(`   Transliterated: ${stats.totalTransliterated} texts`);
    console.log(`   Average Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   Script Distribution:`);
    Object.entries(stats.scriptDistribution).forEach(([script, count]) => {
      console.log(`     ${script}: ${count}`);
    });

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

  // Test script detection accuracy
  console.log('\n\n🔍 Testing Script Detection Accuracy:');
  console.log('=' .repeat(60));

  const scriptDetectionTests = [
    { text: 'arjuna', expected: ScriptType.IAST },
    { text: 'अर्जुन', expected: ScriptType.DEVANAGARI },
    { text: 'arjuna अर्जुन', expected: ScriptType.MIXED },
    { text: 'The quick brown fox', expected: ScriptType.UNKNOWN },
    { text: '123456', expected: ScriptType.UNKNOWN },
    { text: 'ā ī ū ṛ ṝ ḷ ḹ', expected: ScriptType.IAST }
  ];

  for (const detectionTest of scriptDetectionTests) {
    totalTests++;
    console.log(`\n${totalTests}. Script Detection: "${detectionTest.text}"`);
    
    try {
      const result = TransliterationService.transliterate(detectionTest.text);
      
      console.log(`   Detected: ${result.detectedScript}`);
      console.log(`   Expected: ${detectionTest.expected}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      if (result.detectedScript === detectionTest.expected) {
        console.log('   ✅ PASSED');
        passedTests++;
      } else {
        console.log('   ❌ FAILED');
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedTests++;
    }
  }

  // Test edge cases
  console.log('\n\n⚠️  Testing Edge Cases:');
  console.log('=' .repeat(60));

  const edgeCases = [
    { name: 'Very long text', text: 'arjuna '.repeat(100) },
    { name: 'Special characters', text: 'arjuna!@#$%^&*()' },
    { name: 'Numbers and punctuation', text: 'rāma 1,2,3.4;5:6' },
    { name: 'Mixed scripts with numbers', text: 'arjuna अर्जुन 123' }
  ];

  for (const edgeCase of edgeCases) {
    totalTests++;
    console.log(`\n${totalTests}. ${edgeCase.name}`);
    
    try {
      const result = TransliterationService.transliterate(edgeCase.text);
      
      console.log(`   Input length: ${edgeCase.text.length}`);
      console.log(`   Detected Script: ${result.detectedScript}`);
      console.log(`   Processing Time: ${result.processingTimeMs}ms`);
      console.log(`   Result length: ${result.result.length}`);

      // Should not throw errors and should return valid result
      if (result.result !== undefined && result.processingTimeMs >= 0) {
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

  // Final results
  console.log('\n\n📊 Test Results Summary:');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! TransliterationService is working correctly.');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the implementation.`);
  }

  return { totalTests, passedTests, failedTests };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCases, optionTests };
