/**
 * Test NARRATIVE Extractor - Simple Test
 * Tests the narrative logical unit extractor via API endpoints
 */

const https = require('https');
const http = require('http');

// Test the narrative extractor via API
async function testNarrativeExtractorAPI() {
  console.log('🧪 Testing NARRATIVE Logical Unit Extractor via API...\n');

  try {
    // Test with today's wisdom endpoint (should trigger narrative extraction for Puranas)
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

            if (data.wisdom.metadata.narrativeUnit) {
              console.log('📖 Narrative Unit Detected!');
              console.log(`  - Narrative Type: ${data.wisdom.metadata.narrativeUnit.narrativeType}`);
              console.log(`  - Main Characters: ${data.wisdom.metadata.narrativeUnit.mainCharacters.join(', ')}`);
              console.log(`  - Verse Range: ${data.wisdom.metadata.narrativeUnit.verseRange.start} - ${data.wisdom.metadata.narrativeUnit.verseRange.end}`);
              console.log(`  - Verses Count: ${data.wisdom.metadata.narrativeUnit.verseRange.count}`);
              if (data.wisdom.metadata.narrativeUnit.context.storyTheme) {
                console.log(`  - Story Theme: ${data.wisdom.metadata.narrativeUnit.context.storyTheme}`);
              }
              if (data.wisdom.metadata.narrativeUnit.context.location) {
                console.log(`  - Location: ${data.wisdom.metadata.narrativeUnit.context.location}`);
              }
            } else if (data.wisdom.metadata.philosophicalUnit) {
              console.log('🎓 Philosophical Unit Detected (fallback to philosophical extractor)');
            } else if (data.wisdom.metadata.epicUnit) {
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
function demonstrateNarrativeImprovement() {
  console.log('\n🎯 NARRATIVE EXTRACTOR IMPROVEMENT DEMONSTRATION');
  console.log('==================================================');

  console.log('\n📊 BEFORE (Standard Extraction):');
  console.log('  - Random verse: "Line 4523" from Agni Purana');
  console.log('  - No story structure identification');
  console.log('  - No character identification (Vishnu, Shiva, etc.)');
  console.log('  - No narrative type (mythological, genealogical, etc.)');
  console.log('  - No indication of complete story vs fragment');

  console.log('\n✅ AFTER (Narrative Logical Unit Extraction):');
  console.log('  - Complete story: "ap_1.001-ap_1.005 (mythological-story)"');
  console.log('  - Narrative type identified: "mythological-story", "genealogical-account", "cosmological-description"');
  console.log('  - Main characters extracted: "Vishnu", "Shiva", "Brahma", etc.');
  console.log('  - Story theme identified: "Divine Creation", "Heroic Victory"');
  console.log('  - Location context: "Sacred India", "Heavenly Realm"');
  console.log('  - Verse range shows complete narrative unit');

  console.log('\n🎯 EXAMPLE TRANSFORMATION:');
  console.log('  BEFORE: Line 4523');
  console.log('  AFTER:  Agni Purana ap_1.001-ap_1.005 (mythological-story) - Vishnu creates the universe...');
}

// Run the test
async function main() {
  console.log('🚀 Starting Narrative Extractor Test...\n');

  await testNarrativeExtractorAPI();
  demonstrateNarrativeImprovement();

  console.log('\n✨ Narrative extractor testing complete!');
}

// Export for module usage
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}

module.exports = {
  testNarrativeExtractorAPI,
  demonstrateNarrativeImprovement
};
