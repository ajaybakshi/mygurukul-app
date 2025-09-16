/**
 * PHASE 1 INTEGRATION TEST - "Always Works" Methodology
 * Comprehensive integration testing of SanskritCleanupService + TransliterationService
 * 
 * This test validates that our Sanskrit processing pipeline works perfectly
 * with real contaminated data before proceeding to Phase 2 (ElevenLabs TTS)
 * 
 * Following the "Always Works" principle:
 * - Every code change must be immediately testable
 * - No "trust me, it works" commits
 * - 30-second verification before moving forward
 * - Embarrassment test: "Would I be comfortable showing this to a user?"
 */

const { SanskritCleanupService } = require('./src/lib/services/sanskritCleanupService.ts');
const { TransliterationService } = require('./src/lib/services/transliterationService.ts');

/**
 * INTEGRATION GOLDEN SAMPLES
 * Real contaminated Sanskrit from each text type - matches production data
 * These samples represent actual problematic text we encounter in the wild
 */
const INTEGRATION_GOLDEN_SAMPLES = {
  // Epic/Dialogue content with mixed contamination
  EPIC: {
    contaminated: "// bhg_2,40.20 // अर्जुन उवाच garp1,1.31 कथं भीष्ममहं संख्ये",
    expectedClean: "अर्जुन उवाच कथं भीष्ममहं संख्ये",
    canonicalRef: "bhg_2,40.20",
    textType: "DIALOGUE",
    source: "Bhagavad Gita"
  },
  
  // Philosophical content with IAST contamination
  PHILOSOPHICAL: {
    contaminated: "tat tvam asi śvetaketo krmp2,15.4 iti ha uvāca",
    expectedClean: "तत् त्वम् असि श्वेतकेतो इति ह उवाच", 
    canonicalRef: "krmp2,15.4",
    textType: "PHILOSOPHICAL",
    source: "Kurma Purana"
  },
  
  // Hymnal content with mixed scripts and verse markers
  HYMNAL: {
    contaminated: "oṃ agni-mīḷe purohitaṃ RvKh1.1.1 yajñasya devam",
    expectedClean: "ॐ अग्निमीळे पुरोहितं यज्ञस्य देवम्",
    canonicalRef: "RvKh1.1.1", 
    textType: "HYMNAL",
    source: "Rig Veda Khilani"
  },
  
  // Narrative content with complex contamination
  NARRATIVE: {
    contaminated: "rāmasya buddhimān pītā markp3.14.2 dharmo rājīva locanaḥ",
    expectedClean: "रामस्य बुद्धिमान् पिता धर्मो राजीव लोचनः",
    canonicalRef: "markp3.14.2",
    textType: "EPIC", 
    source: "Markandeya Purana"
  },
  
  // Mixed scripts with IAST and Devanagari contamination
  MIXED_SCRIPTS: {
    contaminated: "brahmā uvāca chup6.8.7 शृणु rājan वर्णयामि",
    expectedClean: "ब्रह्मा उवाच शृणु राजन् वर्णयामि",
    canonicalRef: "chup6.8.7",
    textType: "PHILOSOPHICAL",
    source: "Chandogya Upanishad"
  },

  // Complex contamination with multiple verse markers
  COMPLEX_CONTAMINATION: {
    contaminated: "// aitup_1,1.1 // [1.1.1] ॐ सह नाववतु। (1) sāma nau bhunaktu॥",
    expectedClean: "ॐ सह नाववतु। साम नौ भुनक्तु॥",
    canonicalRef: "aitup_1,1.1",
    textType: "PHILOSOPHICAL",
    source: "Aitareya Upanishad"
  },

  // Vedic content with special characters
  VEDIC: {
    contaminated: "agnimīḷe purohitaṃ yajñasya devam ṛtvījam RV_1.1.1",
    expectedClean: "अग्निमीळे पुरोहितं यज्ञस्य देवम् ऋत्वीजम्",
    canonicalRef: "RV_1.1.1",
    textType: "HYMNAL",
    source: "Rig Veda"
  },

  // Puranic content with brackets and numbers
  PURANIC: {
    contaminated: "śrīmad bhagavān uvāca [2.40.20] dharmaḥ sanātanaḥ",
    expectedClean: "श्रीमद् भगवान् उवाच धर्मः सनातनः",
    canonicalRef: "2.40.20",
    textType: "NARRATIVE",
    source: "Bhagavata Purana"
  }
};

/**
 * Run the comprehensive integration embarrassment test
 * This is the critical validation that determines if we're ready for Phase 2
 */
function runIntegrationEmbarrassmentTest() {
  console.log('🧪 PHASE 1 INTEGRATION TEST - "Always Works" Validation');
  console.log('=' .repeat(80));
  console.log('Testing SanskritCleanupService + TransliterationService Integration');
  console.log('=' .repeat(80));
  
  let passCount = 0;
  let totalTests = 0;
  const results = [];
  const startTime = Date.now();
  
  // Test each golden sample
  for (const [testName, sample] of Object.entries(INTEGRATION_GOLDEN_SAMPLES)) {
    totalTests++;
    console.log(`\n🔍 Testing: ${testName} (${sample.source})`);
    console.log(`   Type: ${sample.textType}`);
    console.log(`   Input: "${sample.contaminated}"`);
    
    try {
      // Step 1: Clean the Sanskrit text using SanskritCleanupService
      const cleanResult = SanskritCleanupService.cleanForAudio(
        sample.contaminated,
        `${sample.source.replace(' ', '_')}.txt`,
        {
          keepDandaForProsody: false,  // Remove danda for clean audio
          removeDigits: true,          // Remove numeric artifacts
          normalizeWhitespace: true,   // Optimize spacing
          preserveCanonicalRefs: true  // Keep canonical references
        }
      );
      
      console.log(`   🧹 Cleaned: "${cleanResult.cleanedText}"`);
      console.log(`   📍 Canonical: ${cleanResult.canonicalReference || 'None'}`);
      console.log(`   ⚡ Clean Time: ${cleanResult.metadata.processingTime}ms`);
      
      // Step 2: Transliterate to Devanagari using TransliterationService
      const translitResult = TransliterationService.transliterate(
        cleanResult.cleanedText,
        {
          devanagariPreferred: true,   // Convert IAST to Devanagari
          preserveNumbers: true,       // Keep canonical references
          handleMixed: true           // Handle mixed scripts
        }
      );
      
      console.log(`   🔤 Transliterated: "${translitResult.result}"`);
      console.log(`   📊 Script Detected: ${translitResult.detectedScript}`);
      console.log(`   🎯 Confidence: ${(translitResult.confidence * 100).toFixed(1)}%`);
      console.log(`   ⚡ Trans Time: ${translitResult.processingTimeMs}ms`);
      
      // Step 3: Comprehensive validation - The Embarrassment Test
      const finalResult = translitResult.result;
      const expectedResult = sample.expectedClean;
      
      // Critical validations
      const exactMatch = finalResult === expectedResult;
      const noContamination = !finalResult.match(/[a-zA-Z0-9_,.\/\[\]()]/);
      const canonicalPreserved = cleanResult.canonicalReference === sample.canonicalRef;
      const noDoubleConversion = !translitResult.wasTransliterated || translitResult.detectedScript !== 'devanagari';
      
      // The embarrassment test: Would we be comfortable showing this to a user?
      const passed = exactMatch && noContamination && canonicalPreserved && noDoubleConversion;
      
      if (passed) {
        passCount++;
        console.log(`   ✅ PASS: Perfect result!`);
        console.log(`   🎉 Ready for audio generation`);
      } else {
        console.log(`   ❌ FAIL: Embarrassment test failed!`);
        console.log(`   🔍 Exact Match: ${exactMatch} (Expected: "${expectedResult}")`);
        console.log(`   🧹 No Contamination: ${noContamination}`);
        console.log(`   📍 Canonical Preserved: ${canonicalPreserved} (Expected: "${sample.canonicalRef}")`);
        console.log(`   🔄 No Double Conversion: ${noDoubleConversion}`);
      }
      
      // Store results for analysis
      results.push({
        testName,
        passed,
        input: sample.contaminated,
        expected: expectedResult,
        actual: finalResult,
        canonical: cleanResult.canonicalReference,
        processingTime: cleanResult.metadata.processingTime + translitResult.processingTimeMs,
        cleanTime: cleanResult.metadata.processingTime,
        transTime: translitResult.processingTimeMs,
        scriptDetected: translitResult.detectedScript,
        confidence: translitResult.confidence
      });
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      console.log(`   📍 Stack: ${error.stack?.split('\n')[1]?.trim()}`);
      results.push({
        testName,
        passed: false,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  // Final validation and embarrassment test
  const totalTime = Date.now() - startTime;
  const successRate = (passCount / totalTests * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 INTEGRATION TEST RESULTS SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${totalTests - passCount} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Total Processing Time: ${totalTime}ms`);
  
  // Performance analysis
  const passedResults = results.filter(r => r.passed);
  if (passedResults.length > 0) {
    const avgTime = (passedResults.reduce((sum, r) => sum + r.processingTime, 0) / passedResults.length).toFixed(1);
    const avgCleanTime = (passedResults.reduce((sum, r) => sum + r.cleanTime, 0) / passedResults.length).toFixed(1);
    const avgTransTime = (passedResults.reduce((sum, r) => sum + r.transTime, 0) / passedResults.length).toFixed(1);
    
    console.log(`⚡ Average Processing Time: ${avgTime}ms per sample`);
    console.log(`🧹 Average Clean Time: ${avgCleanTime}ms`);
    console.log(`🔤 Average Trans Time: ${avgTransTime}ms`);
  }
  
  // The crucial embarrassment test
  console.log('\n' + '='.repeat(80));
  if (successRate < 100) {
    console.log('🚨 EMBARRASSMENT TEST FAILED!');
    console.log('   Phase 1 is NOT ready for Phase 2');
    console.log('   Fix all issues before proceeding to ElevenLabs TTS Integration');
    console.log('   Issues found:');
    
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   - ${result.testName}: ${result.error || 'Validation failed'}`);
    });
    
    return false;
  }
  
  console.log('🎉 EMBARRASSMENT TEST PASSED!');
  console.log('   ✅ Phase 1 ready for Phase 2 - ElevenLabs TTS Integration');
  console.log('   ✅ All Sanskrit processing working perfectly');
  console.log('   ✅ Ready for production audio generation');
  
  // Detailed results for debugging
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.testName}: ${result.processingTime}ms`);
    } else {
      console.log(`❌ ${result.testName}: ${result.error || 'Failed validation'}`);
    }
  });
  
  return true;
}

/**
 * Run additional stress tests
 */
function runStressTests() {
  console.log('\n🔥 STRESS TESTS');
  console.log('=' .repeat(50));
  
  const stressTests = [
    {
      name: 'Very Long Text',
      text: 'arjuna uvāca '.repeat(50) + 'krmp1,1.1',
      expected: 'अर्जुन उवाच '.repeat(50)
    },
    {
      name: 'Special Characters',
      text: 'arjuna!@#$%^&*()_+{}|:"<>?[]\\;\',./ uvāca',
      expected: 'अर्जुन उवाच'
    },
    {
      name: 'Multiple Verse Markers',
      text: '// bhg_1,1.1 // [1.1.1] (1) arjuna uvāca // bhg_1,1.2 // [1.1.2] (2)',
      expected: 'अर्जुन उवाच'
    }
  ];
  
  let stressPassed = 0;
  for (const test of stressTests) {
    try {
      const cleanResult = SanskritCleanupService.cleanForAudio(test.text, 'Bhagvad_Gita.txt');
      const transResult = TransliterationService.transliterate(cleanResult.cleanedText);
      
      if (transResult.result.includes('अर्जुन') && transResult.result.includes('उवाच')) {
        console.log(`✅ ${test.name}: Handled gracefully`);
        stressPassed++;
      } else {
        console.log(`❌ ${test.name}: Failed to handle`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  console.log(`Stress Tests: ${stressPassed}/${stressTests.length} passed`);
  return stressPassed === stressTests.length;
}

/**
 * Main test runner
 */
async function runAllIntegrationTests() {
  console.log('🚀 Starting Phase 1 Integration Tests...\n');
  
  const mainTestPassed = runIntegrationEmbarrassmentTest();
  const stressTestPassed = runStressTests();
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 FINAL PHASE 1 VALIDATION');
  console.log('=' .repeat(80));
  
  if (mainTestPassed && stressTestPassed) {
    console.log('🎉 PHASE 1 COMPLETE - READY FOR PHASE 2!');
    console.log('   ✅ SanskritCleanupService working perfectly');
    console.log('   ✅ TransliterationService working perfectly');
    console.log('   ✅ Integration pipeline validated');
    console.log('   ✅ Ready for ElevenLabs TTS integration');
    return true;
  } else {
    console.log('🚨 PHASE 1 NOT READY - FIX ISSUES FIRST!');
    console.log('   ❌ Main integration test failed');
    console.log('   ❌ Stress tests failed');
    console.log('   ❌ Not ready for Phase 2');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllIntegrationTests().catch(console.error);
}

module.exports = { 
  runAllIntegrationTests, 
  runIntegrationEmbarrassmentTest, 
  runStressTests,
  INTEGRATION_GOLDEN_SAMPLES 
};
