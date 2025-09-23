/**
 * TEST: CollectorService Slice Error Debugging
 * This test will trigger the CollectorService with a query that should reproduce the slice error
 * and capture detailed debug logs to identify the root cause.
 */

const { CollectorService } = require('./agents/sanskrit-collector/CollectorService.js');

async function testCollectorSliceError() {
  console.log('🔍 TESTING COLLECTOR SERVICE SLICE ERROR');
  console.log('=' .repeat(60));

  // Create CollectorService instance
  const CollectorService = require('./agents/sanskrit-collector/CollectorService.js');
  const collector = new CollectorService();

  // Test queries that might trigger the slice error
  const testQueries = [
    'What does Aitareya Upanishad teach about Brahma?',
    'What is the nature of Atman in Upanishads?',
    'Explain the concept of Brahman in Vedanta',
    'What are the main teachings of Upanishads?',
    'Tell me about the philosophical concepts in ancient Indian texts'
  ];

  for (const query of testQueries) {
    console.log(`\n🧪 Testing query: "${query}"`);
    console.log('-'.repeat(60));

    try {
      // Create mock semantics for testing
      const mockSemantics = {
        concepts: ['brahman', 'atman', 'upanishad'],
        themes: ['philosophy', 'spirituality'],
        keywords: ['teach', 'explain', 'nature'],
        queryType: 'philosophical'
      };

      // Call the CollectorService retrieveVerses method
      console.log('📡 Calling CollectorService.retrieveVerses...');
      const verses = await collector.retrieveVerses(mockSemantics, {
        correlationId: `test-${Date.now()}`,
        question: query
      });

      console.log('✅ SUCCESS: Retrieved verses:', verses.length);
      if (verses.length > 0) {
        console.log('📚 Sample verse:', {
          id: verses[0].id,
          reference: verses[0].reference,
          relevance: verses[0].relevance,
          hasSanskrit: !!verses[0].sanskrit
        });
      }

    } catch (error) {
      console.log('❌ ERROR occurred:');
      console.log('   Message:', error.message);
      console.log('   Stack:', error.stack);
      console.log('   Error Code:', error.code);

      // Check if this is the slice error we're looking for
      if (error.message.includes('slice') || error.stack?.includes('slice')) {
        console.log('🎯 SLICE ERROR DETECTED! 🎯');
        console.log('This is the error we need to fix!');
      }
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST COMPLETE');
  console.log('Check the debug logs above to identify:');
  console.log('1. Which line throws the slice error (605 or 1568)');
  console.log('2. What the Discovery Engine observation structure contains');
  console.log('3. Whether lines array is properly populated before parsing');
}

// Run the test
if (require.main === module) {
  testCollectorSliceError().catch(console.error);
}

module.exports = { testCollectorSliceError };
