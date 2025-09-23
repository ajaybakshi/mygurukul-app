try {
  console.log('🔍 Testing imports and instantiation...');
  
  // Test all imports used in the updated CollectorService
  require('dotenv').config({ path: '../../.env.local' });
  const { Storage } = require('@google-cloud/storage');
  const { GoogleAuth } = require('google-auth-library');
  const logger = require('./logger');
  const { CollectorError } = require('./errors');
  const fs = require('fs');
  const path = require('path');
  
  console.log('✅ All imports resolved successfully');
  
  // Test CollectorService import and instantiation
  const { CollectorService } = require('./CollectorService');
  const collector = new CollectorService();
  
  console.log('✅ CollectorService imported and instantiated');
  console.log('✅ CollectorService has collect method:', typeof collector.collect);
  console.log('✅ CollectorService has queryVertexAI method:', typeof collector.queryVertexAI);
  
  console.log('\n🎉 All validations passed - no new problems detected!');
  
} catch (error) {
  console.log('❌ Error detected:', error.message);
  console.log('Stack trace:', error.stack.substring(0, 300) + '...');
  process.exit(1);
}
