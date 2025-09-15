/**
 * Test PHILOSOPHICAL Extractor - Simple Test
 * Tests the philosophical logical unit extractor via API endpoints
 */

const https = require('https');
const http = require('http');

// Test the philosophical extractor via API
async function testPhilosophicalExtractorAPI() {
  console.log('🧪 Testing PHILOSOPHICAL Logical Unit Extractor via API...\n');

  try {
    // Test with today's wisdom endpoint (should trigger philosophical extraction for Upanishads)
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

            if (data.wisdom.metadata.philosophicalUnit) {
              console.log('🎓 Philosophical Unit Detected!');
              console.log(`  - Teaching Type: ${data.wisdom.metadata.philosophicalUnit.teachingType}`);
              console.log(`  - Verse Range: ${data.wisdom.metadata.philosophicalUnit.verseRange.start} - ${data.wisdom.metadata.philosophicalUnit.verseRange.end}`);
              console.log(`  - Verses Count: ${data.wisdom.metadata.philosophicalUnit.verseRange.count}`);
              if (data.wisdom.metadata.philosophicalUnit.context.philosophicalConcept) {
                console.log(`  - Concept: ${data.wisdom.metadata.philosophicalUnit.context.philosophicalConcept}`);
              }
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
async function main() {
  console.log('🚀 Starting Philosophical Extractor Test...\n');

  await testPhilosophicalExtractorAPI();
  demonstratePhilosophicalImprovement();

  console.log('\n✨ Philosophical extractor testing complete!');
}

// Export for module usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}

module.exports = {
  testPhilosophicalExtractorAPI,
  demonstratePhilosophicalImprovement
};
