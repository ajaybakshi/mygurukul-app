/**
 * Test DIALOGUE Classification - Debug script
 * Tests the classification of Bhagavad Gita to see if it's being classified as DIALOGUE
 */

const { gretilTextTypeClassifier } = require('./src/lib/services/gretilTextTypeClassifier.ts');
const fs = require('fs');
const path = require('path');

// Read a sample of Bhagavad Gita content to test classification
function readSampleContent() {
  // For now, let's create a sample Bhagavad Gita content
  return `dhṛtarāṣṭra uvāca
dharmakṣetre kurukṣetre samavetā yuyutsavaḥ
māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya

sañjaya uvāca
dṛṣṭvā tu pāṇḍavānīkaṃ vyūḍhaṃ duryodhanas tadā
ācāryam upasaṅgamya rājā vacanam abravīt

arjuna uvāca
senayor ubhayor madhye rathaṃ sthāpaya me 'cyuta
yāvad etān nirīkṣe 'haṃ yoddhukāmān avasthitān

bhg 1.1 dhṛtarāṣṭra uvāca
bhg 1.2 sañjaya uvāca
bhg 1.21 arjuna uvāca

kṛṣṇa uvāca
kaṭhamaṃ karmaṇi ghore māṃ niyojayasi keśava
buddhiḥ mohayate me ca naṣṭaṃ śreyaḥ param avāpnuhi

arjuna uvāca
kārpaṇyadoṣopahatasvabhāvaḥ pṛcchāmi tvāṃ dharmaṃ saṃmūḍhacetāḥ
yac chreyaḥ syān niścitam brūhi tan me śiṣyas te 'haṃ śādhi māṃ tvāṃ prapannam`;
}

async function testClassification() {
  console.log('🧪 Testing Bhagavad Gita Classification...\n');

  try {
    const sampleContent = readSampleContent();
    console.log('📖 Sample content length:', sampleContent.length);
    console.log('📄 First 200 chars:', sampleContent.substring(0, 200));

    // Test classification
    const filename = 'Bhagvad_Gita.txt';
    const classification = gretilTextTypeClassifier.classifyText(filename, sampleContent);

    console.log('\n📊 CLASSIFICATION RESULTS:');
    console.log('  - Text Type:', classification.textType);
    console.log('  - Confidence:', classification.confidence);
    console.log('  - Reasoning:', classification.reasoning);

    console.log('\n🎯 EXPECTED: DIALOGUE');
    console.log('✅ ACTUAL:', classification.textType);

    if (classification.textType === 'DIALOGUE') {
      console.log('\n🎉 SUCCESS! Bhagavad Gita is correctly classified as DIALOGUE');
    } else {
      console.log('\n❌ FAILED! Bhagavad Gita should be DIALOGUE but got:', classification.textType);
    }

    // Debug: Show detailed analysis
    console.log('\n🔍 DETAILED ANALYSIS:');
    const debugAnalysis = gretilTextTypeClassifier.analyzeForDebugging(filename, sampleContent);

    console.log('📋 Filename matches:');
    debugAnalysis.allMatches.filename.forEach(match => {
      console.log(`   - ${match.pattern} (priority: ${match.priority})`);
    });

    console.log('📋 Content matches:');
    debugAnalysis.allMatches.content.forEach(match => {
      console.log(`   - ${match.pattern} (priority: ${match.priority})`);
    });

    console.log('📋 Structural matches:');
    debugAnalysis.allMatches.structural.forEach(match => {
      console.log(`   - ${match.pattern} (priority: ${match.priority})`);
    });

    console.log('\n📊 Scores by text type:');
    Object.entries(debugAnalysis.scores).forEach(([type, data]) => {
      console.log(`   - ${type}: ${data.score} (patterns: ${data.patterns.join(', ')})`);
    });

  } catch (error) {
    console.error('💥 Classification test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testClassification().catch(error => {
  console.error('💥 Test execution failed:', error);
});
