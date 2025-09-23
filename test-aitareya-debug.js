/**
 * TEST: Aitareya Upanishad Query Debug
 * This test will simulate the exact question the user asked about Aitareya Upanishad
 * and show what happens in the Collector with comprehensive debugging
 */

console.log('🔍 TESTING AITAREYA UPANISHAD QUERY: "What does the Aitareya Upanishad teach about Brahma"');
console.log('=' .repeat(80));
console.log('This will show the complete Collector processing flow with debug logs');
console.log('=' .repeat(80));

const { CollectorService } = require('./agents/sanskrit-collector/CollectorService.js');

async function testAitareyaQuery() {
  console.log('📋 Test Setup:');
  console.log('- Query: What does the Aitareya Upanishad teach about Brahma');
  console.log('- Expected: Find relevant verses from Aitareya Upanishad about Brahma');
  console.log('- Collector will process this query through:');
  console.log('  1. Query expansion with Sanskrit lemmas');
  console.log('  2. Discovery Engine API call');
  console.log('  3. Response parsing and verse extraction');
  console.log('  4. Filtering and ranking');
  console.log('');

  // Create CollectorService instance
  const collector = new CollectorService();
  console.log('✅ CollectorService instantiated successfully');
  console.log('');

  // Test the exact question the user asked
  const question = 'What does the Aitareya Upanishad teach about Brahma';

  try {
    // Create semantic analysis
    const semantics = {
      concepts: ['aitareya', 'upanishad', 'brahma', 'brahman', 'teaching', 'philosophy'],
      themes: ['upanishadic_teaching', 'brahman_realization', 'spiritual_wisdom'],
      keywords: ['teach', 'brahma', 'aitareya', 'upanishad'],
      queryType: 'philosophical_inquiry'
    };

    console.log('📊 Semantic Analysis:');
    console.log(JSON.stringify(semantics, null, 2));
    console.log('');

    // Call CollectorService
    console.log('🚀 Calling CollectorService.retrieveVerses...');
    const verses = await collector.retrieveVerses(semantics, {
      correlationId: `test-aitareya-${Date.now()}`,
      question: question
    });

    console.log('✅ SUCCESS: Retrieved', verses?.length || 0, 'verses');
    console.log('');

    if (verses && verses.length > 0) {
      console.log('📚 Sample Results:');
      verses.slice(0, 3).forEach((verse, index) => {
        console.log(`  ${index + 1}. ${verse.reference || 'Unknown Reference'}`);
        console.log(`     Sanskrit: ${verse.sanskrit?.substring(0, 100) || 'Not available'}...`);
        console.log(`     Relevance: ${verse.relevance || 'N/A'}`);
        console.log('');
      });
    }

    return verses;

  } catch (error) {
    console.error('❌ ERROR in CollectorService:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code || 'N/A');
    console.error('   Stack:', error.stack);
    console.error('');

    // Show additional debugging info
    console.log('🔍 Debug Info:');
    console.log('   Question length:', question.length);
    console.log('   Semantics keys:', Object.keys(semantics));
    console.log('   Error type:', typeof error);
    console.log('');

    throw error;
  }
}

// Run the test
testAitareyaQuery().catch(error => {
  console.error('💥 Test failed with error:', error.message);
  process.exit(1);
});
