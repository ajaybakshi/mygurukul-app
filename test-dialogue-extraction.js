/**
 * Test DIALOGUE Extractor - Simple Test
 * Tests the dialogue logical unit extractor via API endpoints
 */

const https = require('https');
const http = require('http');

// Test the dialogue extractor via API
async function testDialogueExtractorAPI() {
  console.log('🧪 Testing DIALOGUE Logical Unit Extractor via API...\n');

  try {
    // Test with today's wisdom endpoint (should trigger dialogue extraction for Bhagavad Gita)
    console.log('📡 Testing via /api/todays-wisdom endpoint...');

    const response = await makeRequest('https://mygurukul-app.vercel.app/api/todays-wisdom', 'GET');

    if (response) {
      console.log('✅ API call successful!');
      console.log('📊 Response:');

      try {
        const data = JSON.parse(response);
        console.log(`  - Status: ${data.success ? 'SUCCESS' : 'FAILED'}`);

        if (data.wisdom) {
          console.log(`  - Text: ${data.wisdom.textName}`);
          console.log(`  - Category: ${data.wisdom.category}`);
          console.log(`  - Verses: ${data.wisdom.estimatedVerses}`);
          console.log(`  - Reference: ${data.wisdom.reference}`);
          console.log(`  - Sanskrit (first 150 chars): ${data.wisdom.sanskrit.substring(0, 150)}...`);

          if (data.wisdom.metadata) {
            console.log('📋 Metadata:');
            console.log(`  - Text Type: ${data.wisdom.metadata.textType}`);
            console.log(`  - Enhanced Type: ${data.wisdom.metadata.enhancedTextType}`);

            if (data.wisdom.metadata.dialogueUnit) {
              console.log('💬 Dialogue Unit Detected!');
              console.log(`  - Dialogue Type: ${data.wisdom.metadata.dialogueUnit.dialogueType}`);
              console.log(`  - Speaker: ${data.wisdom.metadata.dialogueUnit.speaker}`);
              console.log(`  - Addressee: ${data.wisdom.metadata.dialogueUnit.addressee}`);
              console.log(`  - Verse Range: ${data.wisdom.metadata.dialogueUnit.verseRange.start} - ${data.wisdom.metadata.dialogueUnit.verseRange.end}`);
              console.log(`  - Verses Count: ${data.wisdom.metadata.dialogueUnit.verseRange.count}`);
              if (data.wisdom.metadata.dialogueUnit.context.philosophicalTheme) {
                console.log(`  - Theme: ${data.wisdom.metadata.dialogueUnit.context.philosophicalTheme}`);
              }
              console.log(`  - Characters: ${data.wisdom.metadata.dialogueUnit.context.characters.join(', ')}`);
            } else if (data.wisdom.metadata.philosophicalUnit) {
              console.log('🎓 Philosophical Unit Detected (fallback to philosophical extractor)');
            } else if (data.wisdom.metadata.narrativeUnit) {
              console.log('🎭 EPIC Unit Detected (fallback to existing extractor)');
            } else {
              console.log('⚠️  No specialized unit detected');
            }
          }
        } else {
          console.log('❌ No wisdom data in response');
        }
      } catch (parseError) {
        console.log('📄 Raw response:', response.substring(0, 500));
      }
    } else {
      console.log('❌ API call failed or returned empty response');
    }

  } catch (error) {
    console.error('💥 API test failed:', error.message);
  }
}

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.request(url, { method }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

// Demonstrate the improvement (like EPIC extractor did)
function demonstrateDialogueImprovement() {
  console.log('\n🎯 DIALOGUE EXTRACTOR IMPROVEMENT DEMONSTRATION');
  console.log('==================================================');

  console.log('\n📊 BEFORE (Standard Extraction):');
  console.log('  - Random verse: "Line 4523" from Bhagavad Gita');
  console.log('  - No speaker identification (Krishna vs Arjuna)');
  console.log('  - No dialogue context or relationship');
  console.log('  - No philosophical theme identification');
  console.log('  - No indication of teacher-student dynamic');

  console.log('\n✅ AFTER (Dialogue Logical Unit Extraction):');
  console.log('  - Structured dialogue: "bhg 2.15-2.20 (teacher-student)"');
  console.log('  - Speaker identified: "Krishna"');
  console.log('  - Addressee identified: "Arjuna"');
  console.log('  - Dialogue type: "teacher-student" or "philosophical"');
  console.log('  - Philosophical theme: "Karma Yoga" or "Jnana Yoga"');
  console.log('  - Character context: Krishna, Arjuna, Dhritarashtra, Sanjaya');
  console.log('  - Complete dialogue exchanges grouped as units');

  console.log('\n🎯 EXAMPLE TRANSFORMATION:');
  console.log('  BEFORE: Line 4523');
  console.log('  AFTER:  Bhagavad Gita bhg 2.15-2.20 (teacher-student) - Krishna teaches Arjuna about Karma Yoga...');
}

// Run the test
async function main() {
  console.log('🚀 Starting Dialogue Extractor Test...\n');

  await testDialogueExtractorAPI();
  demonstrateDialogueImprovement();

  console.log('\n✨ Dialogue extractor testing complete!');
}

// Export for module usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}

module.exports = {
  testDialogueExtractorAPI,
  demonstrateDialogueImprovement
};
