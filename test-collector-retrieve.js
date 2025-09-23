/**
 * TEST: CollectorService retrieveVerses Method
 * Simple test to call retrieveVerses and see where the error occurs
 */

console.log('🔍 TESTING COLLECTOR SERVICE retrieveVerses METHOD');
console.log('=' .repeat(60));

try {
  const CollectorService = require('./agents/sanskrit-collector/CollectorService.js');
  const collector = new CollectorService();
  console.log('✅ CollectorService loaded and instantiated');

  // Simple test parameters
  const testSemantics = {
    concepts: ['test'],
    themes: ['test'],
    keywords: ['test'],
    queryType: 'test'
  };

  const testOptions = {
    correlationId: 'test-debug-123',
    question: 'test question'
  };

  console.log('🔍 Calling retrieveVerses with test parameters...');
  const result = collector.retrieveVerses(testSemantics, testOptions);
  console.log('✅ retrieveVerses call completed');

} catch (error) {
  console.error('❌ ERROR in retrieveVerses:', error.message);
  console.error('Stack:', error.stack);
}
