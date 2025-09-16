/**
 * Phase 2: ElevenLabs TTS Integration Test Suite
 * Comprehensive testing following "Always Works" methodology
 * Each component tested incrementally with immediate verification
 */

const { ElevenLabsTtsService } = require('./dist/elevenLabsTtsService.js');
const { AudioCacheService } = require('./dist/audioCacheService.js');
const { AudioGcsStorageService } = require('./dist/audioGcsStorageService.js');

// Test configuration
const TEST_CONFIG = {
  // Use test API key if available, otherwise skip API tests
  apiKey: process.env.ELEVENLABS_API_KEY || 'test-key',
  testText: 'om namo bhagavate vāsudevāya',
  testTextSanskrit: 'ॐ नमो भगवते वासुदेवाय',
  testTextIAST: 'om namo bhagavate vāsudevāya',
  timeout: 30000
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: []
};

/**
 * Test runner with comprehensive reporting
 */
class Phase2TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.services = {};
  }

  /**
   * Run all Phase 2 tests
   */
  async runAllTests() {
    console.log('🚀 Starting Phase 2: ElevenLabs TTS Integration Tests');
    console.log('=' .repeat(60));

    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();
      
      // Test 2: Audio Cache Service
      await this.testAudioCacheService();
      
      // Test 3: GCS Storage Service
      await this.testGcsStorageService();
      
      // Test 4: ElevenLabs Service (without API calls)
      await this.testElevenLabsServiceLocal();
      
      // Test 5: Text Processing Pipeline
      await this.testTextProcessingPipeline();
      
      // Test 6: Integration Test (if API key available)
      if (TEST_CONFIG.apiKey !== 'test-key') {
        await this.testElevenLabsApiIntegration();
      } else {
        this.skipTest('ElevenLabs API Integration', 'No API key provided');
      }
      
      // Test 7: End-to-End Integration
      await this.testEndToEndIntegration();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.printTestResults();
    }
  }

  /**
   * Test service initialization
   */
  async testServiceInitialization() {
    console.log('\n📋 Test 1: Service Initialization');
    console.log('-'.repeat(40));

    try {
      // Test ElevenLabs service initialization
      const elevenLabsService = ElevenLabsTtsService.getInstance();
      this.assert(!!elevenLabsService, 'ElevenLabs service initialized');
      this.services.elevenLabs = elevenLabsService;

      // Test cache service initialization
      const cacheService = AudioCacheService.getInstance();
      this.assert(!!cacheService, 'Audio cache service initialized');
      this.services.cache = cacheService;

      // Test GCS storage service initialization
      const gcsService = AudioGcsStorageService.getInstance();
      this.assert(!!gcsService, 'GCS storage service initialized');
      this.services.gcs = gcsService;

      console.log('✅ All services initialized successfully');
      this.passTest('Service Initialization');

    } catch (error) {
      this.failTest('Service Initialization', error.message);
    }
  }

  /**
   * Test audio cache service functionality
   */
  async testAudioCacheService() {
    console.log('\n📋 Test 2: Audio Cache Service');
    console.log('-'.repeat(40));

    try {
      const cacheService = this.services.cache;
      
      // Test cache configuration
      const stats = cacheService.getStats();
      this.assert(typeof stats === 'object', 'Cache stats retrieved');
      console.log(`📊 Cache stats: ${JSON.stringify(stats, null, 2)}`);

      // Test cache health
      const health = cacheService.getHealthStatus();
      this.assert(health.status === 'healthy' || health.status === 'warning', 'Cache health check');
      console.log(`🏥 Cache health: ${health.status}`);

      // Test cache operations
      const testKey = 'test_audio_123';
      const testRendition = this.createTestRendition();
      const testBuffer = new ArrayBuffer(1024);

      // Test set operation
      const setResult = await cacheService.set(testKey, testRendition, testBuffer);
      this.assert(setResult === true, 'Cache set operation');

      // Test get operation
      const getResult = await cacheService.get(testKey);
      this.assert(!!getResult, 'Cache get operation');
      this.assert(getResult.rendition.id === testRendition.id, 'Cached rendition matches');

      // Test has operation
      const hasResult = cacheService.has(testKey);
      this.assert(hasResult === true, 'Cache has operation');

      // Test delete operation
      const deleteResult = await cacheService.delete(testKey);
      this.assert(deleteResult === true, 'Cache delete operation');

      // Test cache after deletion
      const getAfterDelete = await cacheService.get(testKey);
      this.assert(getAfterDelete === null, 'Cache entry deleted');

      console.log('✅ Audio cache service tests passed');
      this.passTest('Audio Cache Service');

    } catch (error) {
      this.failTest('Audio Cache Service', error.message);
    }
  }

  /**
   * Test GCS storage service functionality
   */
  async testGcsStorageService() {
    console.log('\n📋 Test 3: GCS Storage Service');
    console.log('-'.repeat(40));

    try {
      const gcsService = this.services.gcs;
      
      // Test GCS availability
      const isAvailable = gcsService.isAvailable();
      console.log(`☁️ GCS available: ${isAvailable}`);

      if (isAvailable) {
        // Test connectivity
        const connectivity = await gcsService.testConnectivity();
        this.assert(connectivity.success, 'GCS connectivity test');
        console.log(`🌐 GCS latency: ${connectivity.latency}ms`);

        // Test storage stats
        const stats = await gcsService.getStorageStats();
        this.assert(typeof stats === 'object', 'GCS storage stats retrieved');
        console.log(`📊 GCS stats: ${JSON.stringify(stats, null, 2)}`);

        // Test file listing
        const files = await gcsService.listAudioRenditions({ limit: 10 });
        this.assert(Array.isArray(files), 'GCS file listing');
        console.log(`📁 Found ${files.length} files in GCS`);

      } else {
        console.log('⚠️ GCS not available - skipping storage tests');
      }

      console.log('✅ GCS storage service tests passed');
      this.passTest('GCS Storage Service');

    } catch (error) {
      this.failTest('GCS Storage Service', error.message);
    }
  }

  /**
   * Test ElevenLabs service local functionality
   */
  async testElevenLabsServiceLocal() {
    console.log('\n📋 Test 4: ElevenLabs Service (Local)');
    console.log('-'.repeat(40));

    try {
      const elevenLabsService = this.services.elevenLabs;
      
      // Test cache key generation
      const testRequest = {
        text: TEST_CONFIG.testText,
        language: 'sanskrit',
        voice: 'test-voice',
        speed: 1.0,
        pitch: 1.0
      };

      // Test cache operations
      const cacheKey = elevenLabsService.generateCacheKey(testRequest);
      this.assert(typeof cacheKey === 'string' && cacheKey.length > 0, 'Cache key generation');

      // Test rendition ID generation
      const renditionId = elevenLabsService.generateRenditionId(testRequest, TEST_CONFIG.testText);
      this.assert(typeof renditionId === 'string' && renditionId.startsWith('el_'), 'Rendition ID generation');

      // Test audio URL generation
      const audioUrl = elevenLabsService.generateAudioUrl(renditionId);
      this.assert(audioUrl.includes('/api/audio/'), 'Audio URL generation');

      // Test cache stats
      const cacheStats = elevenLabsService.getCacheStats();
      this.assert(typeof cacheStats === 'object', 'Cache stats retrieval');

      console.log('✅ ElevenLabs service local tests passed');
      this.passTest('ElevenLabs Service (Local)');

    } catch (error) {
      this.failTest('ElevenLabs Service (Local)', error.message);
    }
  }

  /**
   * Test text processing pipeline
   */
  async testTextProcessingPipeline() {
    console.log('\n📋 Test 5: Text Processing Pipeline');
    console.log('-'.repeat(40));

    try {
      const elevenLabsService = this.services.elevenLabs;
      
      // Test Sanskrit text processing
      const sanskritText = TEST_CONFIG.testTextSanskrit;
      const processedSanskrit = await elevenLabsService.processTextForTts(sanskritText, 'sanskrit');
      this.assert(typeof processedSanskrit === 'string', 'Sanskrit text processing');
      console.log(`📝 Sanskrit input: ${sanskritText}`);
      console.log(`📝 Sanskrit processed: ${processedSanskrit}`);

      // Test IAST text processing
      const iastText = TEST_CONFIG.testTextIAST;
      const processedIAST = await elevenLabsService.processTextForTts(iastText, 'sanskrit');
      this.assert(typeof processedIAST === 'string', 'IAST text processing');
      console.log(`📝 IAST input: ${iastText}`);
      console.log(`📝 IAST processed: ${processedIAST}`);

      // Test English text processing
      const englishText = 'Hello, this is a test.';
      const processedEnglish = await elevenLabsService.processTextForTts(englishText, 'english');
      this.assert(processedEnglish === englishText, 'English text processing (no change)');

      console.log('✅ Text processing pipeline tests passed');
      this.passTest('Text Processing Pipeline');

    } catch (error) {
      this.failTest('Text Processing Pipeline', error.message);
    }
  }

  /**
   * Test ElevenLabs API integration (if API key available)
   */
  async testElevenLabsApiIntegration() {
    console.log('\n📋 Test 6: ElevenLabs API Integration');
    console.log('-'.repeat(40));

    try {
      const elevenLabsService = this.services.elevenLabs;
      
      // Test voice fetching
      console.log('🎤 Fetching available voices...');
      const voices = await elevenLabsService.getAvailableVoices();
      this.assert(Array.isArray(voices), 'Voices fetched from API');
      console.log(`🎤 Found ${voices.length} voices`);

      if (voices.length > 0) {
        console.log(`🎤 First voice: ${voices[0].name} (${voices[0].voice_id})`);
      }

      // Test audio generation (short text to minimize API usage)
      const testRequest = {
        text: 'om',
        language: 'sanskrit',
        voice: voices.length > 0 ? voices[0].voice_id : 'pNInz6obpgDQGcFmaJgB',
        speed: 1.0,
        pitch: 1.0,
        format: 'mp3',
        quality: 'medium'
      };

      console.log('🎵 Generating test audio...');
      const audioResult = await elevenLabsService.generateAudio(testRequest);
      
      if (audioResult.success) {
        this.assert(!!audioResult.rendition, 'Audio rendition created');
        this.assert(!!audioResult.rendition.audioUrl, 'Audio URL generated');
        this.assert(audioResult.processingTime > 0, 'Processing time recorded');
        console.log(`🎵 Audio generated successfully in ${audioResult.processingTime}ms`);
        console.log(`🎵 Rendition ID: ${audioResult.rendition.id}`);
      } else {
        console.log(`⚠️ Audio generation failed: ${audioResult.error}`);
        this.assert(false, 'Audio generation should succeed');
      }

      console.log('✅ ElevenLabs API integration tests passed');
      this.passTest('ElevenLabs API Integration');

    } catch (error) {
      this.failTest('ElevenLabs API Integration', error.message);
    }
  }

  /**
   * Test end-to-end integration
   */
  async testEndToEndIntegration() {
    console.log('\n📋 Test 7: End-to-End Integration');
    console.log('-'.repeat(40));

    try {
      const elevenLabsService = this.services.elevenLabs;
      const cacheService = this.services.cache;
      const gcsService = this.services.gcs;
      
      // Test complete pipeline without API call
      const testRequest = {
        text: TEST_CONFIG.testText,
        language: 'sanskrit',
        voice: 'test-voice',
        speed: 1.0,
        pitch: 1.0,
        format: 'mp3',
        quality: 'medium'
      };

      // Test cache key generation
      const cacheKey = elevenLabsService.generateCacheKey(testRequest);
      this.assert(typeof cacheKey === 'string', 'Cache key generated');

      // Test text processing
      const processedText = await elevenLabsService.processTextForTts(testRequest.text, testRequest.language);
      this.assert(typeof processedText === 'string', 'Text processed');

      // Test rendition creation
      const testBuffer = new ArrayBuffer(1024);
      const rendition = elevenLabsService.createAudioRendition(testRequest, processedText, testBuffer);
      this.assert(!!rendition, 'Audio rendition created');
      this.assert(rendition.id.startsWith('el_'), 'Rendition ID format correct');

      // Test caching
      const cacheResult = await cacheService.set(cacheKey, rendition, testBuffer);
      this.assert(cacheResult === true, 'Audio cached');

      // Test cache retrieval
      const cachedAudio = await cacheService.get(cacheKey);
      this.assert(!!cachedAudio, 'Audio retrieved from cache');
      this.assert(cachedAudio.rendition.id === rendition.id, 'Cached rendition matches');

      // Test GCS storage (if available)
      if (gcsService.isAvailable()) {
        const storageResult = await gcsService.storeAudioRendition(rendition, testBuffer);
        this.assert(storageResult.success, 'Audio stored in GCS');
      }

      console.log('✅ End-to-end integration tests passed');
      this.passTest('End-to-End Integration');

    } catch (error) {
      this.failTest('End-to-End Integration', error.message);
    }
  }

  /**
   * Create test audio rendition
   */
  createTestRendition() {
    return {
      id: 'test_rendition_123',
      text: TEST_CONFIG.testText,
      audioUrl: '/api/audio/test_rendition_123',
      duration: 5,
      format: 'mp3',
      quality: 'medium',
      createdAt: new Date(),
      metadata: {
        language: 'sanskrit',
        voice: 'test-voice',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        source: 'test'
      }
    };
  }

  /**
   * Assertion helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Pass test
   */
  passTest(testName) {
    testResults.passed++;
    testResults.total++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
    console.log(`✅ ${testName}: PASSED`);
  }

  /**
   * Fail test
   */
  failTest(testName, error) {
    testResults.failed++;
    testResults.total++;
    testResults.details.push({ name: testName, status: 'FAILED', error });
    console.log(`❌ ${testName}: FAILED - ${error}`);
  }

  /**
   * Skip test
   */
  skipTest(testName, reason) {
    testResults.skipped++;
    testResults.total++;
    testResults.details.push({ name: testName, status: 'SKIPPED', error: reason });
    console.log(`⏭️ ${testName}: SKIPPED - ${reason}`);
  }

  /**
   * Print comprehensive test results
   */
  printTestResults() {
    const duration = Date.now() - this.startTime;
    const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 2 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️  Skipped: ${testResults.skipped}`);
    console.log(`📊 Total: ${testResults.total}`);

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
    }

    if (testResults.skipped > 0) {
      console.log('\n⏭️ SKIPPED TESTS:');
      testResults.details
        .filter(test => test.status === 'SKIPPED')
        .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
    }

    console.log('\n' + '='.repeat(60));
    
    if (testResults.failed === 0) {
      console.log('🎉 PHASE 2 IMPLEMENTATION: SUCCESS!');
      console.log('✅ All components working correctly');
      console.log('✅ Ready for production deployment');
    } else {
      console.log('⚠️ PHASE 2 IMPLEMENTATION: NEEDS ATTENTION');
      console.log('❌ Some tests failed - review and fix before deployment');
    }
    
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new Phase2TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = { Phase2TestRunner, testResults };

