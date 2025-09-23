/**
 * BASIC TEST: CollectorService Instantiation
 * Simple test to see if CollectorService loads without errors
 */

console.log('🔍 TESTING COLLECTOR SERVICE BASIC FUNCTIONALITY');
console.log('=' .repeat(60));

try {
  // Try to load CollectorService
  const CollectorService = require('./agents/sanskrit-collector/CollectorService.js');
  console.log('✅ CollectorService loaded successfully');

  // Try to instantiate
  const collector = new CollectorService();
  console.log('✅ CollectorService instantiated successfully');

  // Try a simple method call
  console.log('🔍 Testing CollectorService methods...');
  console.log('Available methods:', Object.getOwnPropertyNames(CollectorService.prototype).filter(name => name !== 'constructor'));

} catch (error) {
  console.error('❌ ERROR loading CollectorService:', error.message);
  console.error('Stack:', error.stack);
}
