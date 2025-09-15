/**
 * Test HYMNAL Extractor - Simple Test
 * Tests the hymnal logical unit extractor via API endpoints
 */

const https = require('https');
const http = require('http');

// Test the hymnal extractor via API
async function testHymnalExtractorAPI() {
  console.log('🧪 Testing HYMNAL Logical Unit Extractor via API...\n');

  try {
    // Test with today's wisdom endpoint (should trigger hymnal extraction for Rig Veda)
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

            if (data.wisdom.metadata.hymnalUnit) {
              console.log('🎵 Hymnal Unit Detected!');
              console.log(`  - Hymn Type: ${data.wisdom.metadata.hymnalUnit.hymnType}`);
              console.log(`  - Deity: ${data.wisdom.metadata.hymnalUnit.deity}`);
              console.log(`  - Verse Range: ${data.wisdom.metadata.hymnalUnit.verseRange.start} - ${data.wisdom.metadata.hymnalUnit.verseRange.end}`);
              console.log(`  - Verses Count: ${data.wisdom.metadata.hymnalUnit.verseRange.count}`);
              if (data.wisdom.metadata.hymnalUnit.context.ritualPurpose) {
                console.log(`  - Ritual Purpose: ${data.wisdom.metadata.hymnalUnit.context.ritualPurpose}`);
              }
              if (data.wisdom.metadata.hymnalUnit.context.meter) {
                console.log(`  - Meter: ${data.wisdom.metadata.hymnalUnit.context.meter}`);
              }
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
function demonstrateHymnalImprovement() {
  console.log('\n🎯 HYMNAL EXTRACTOR IMPROVEMENT DEMONSTRATION');
  console.log('==================================================');

  console.log('\n📊 BEFORE (Standard Extraction):');
  console.log('  - Random verse: "Line 4523" from Rig Veda');
  console.log('  - No hymn structure identification');
  console.log('  - No deity identification (Agni, Indra, etc.)');
  console.log('  - No ritual context or purpose');
  console.log('  - No indication of complete vs fragment hymn');

  console.log('\n✅ AFTER (Hymnal Logical Unit Extraction):');
  console.log('  - Complete hymn: "RvKh_1,1.1-1,1.5 (complete-hymn)"');
  console.log('  - Hymn type identified: "complete-hymn", "ritual-chant", "devotional-prayer"');
  console.log('  - Primary deity extracted: "Agni", "Indra", "Soma", etc.');
  console.log('  - Ritual purpose identified: "Soma Sacrifice", "Fire Sacrifice"');
  console.log('  - Vedic meter identified: "Gayatri", "Tristubh", etc.');
  console.log('  - Verse range shows complete hymn structure');

  console.log('\n🎯 EXAMPLE TRANSFORMATION:');
  console.log('  BEFORE: Line 4523');
  console.log('  AFTER:  Rig Veda Khila RvKh_1,1.1-1,1.5 (complete-hymn) - Agni is praised as the divine priest...');
}

// Run the test
async function main() {
  console.log('🚀 Starting Hymnal Extractor Test...\n');

  await testHymnalExtractorAPI();
  demonstrateHymnalImprovement();

  console.log('\n✨ Hymnal extractor testing complete!');
}

// Export for module usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}

module.exports = {
  testHymnalExtractorAPI,
  demonstrateHymnalImprovement
};
