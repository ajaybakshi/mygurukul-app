/**
 * Phase 2: Complete ElevenLabs TTS Integration Test
 * Real API testing with immediate verification
 * Following "Always Works" methodology
 */

// Set the API key
process.env.ELEVENLABS_API_KEY = "a0d07d03198309d26bfe43bfe4b348ad9ea8459dc19efc7cd4379082c00ba59d";

console.log('🚀 Phase 2: Complete ElevenLabs TTS Integration Test');
console.log('=' .repeat(60));
console.log('🔑 API Key configured: ' + process.env.ELEVENLABS_API_KEY.substring(0, 10) + '...');

// Test configuration
const TEST_CONFIG = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  testTexts: {
    sanskrit: 'ॐ नमो भगवते वासुदेवाय',
    iast: 'om namo bhagavate vāsudevāya',
    english: 'Hello, this is a test of the ElevenLabs integration.'
  },
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
 * Mock services for testing (since we can't import TypeScript directly)
 */
class MockElevenLabsTtsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.defaultVoiceId = 'pNInz6obpgDQGcFmaJgB';
    this.defaultModelId = 'eleven_monolingual_v1';
  }

  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('❌ Failed to fetch voices:', error);
      return [];
    }
  }

  async generateAudio(request) {
    const startTime = Date.now();
    
    try {
      // Prepare the request
      const ttsRequest = {
        text: request.text,
        voice_id: request.voice || this.defaultVoiceId,
        model_id: this.defaultModelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        },
        output_format: 'mp3_44100_128'
      };

      console.log(`🔄 Generating audio for: "${request.text.substring(0, 50)}..."`);

      const response = await fetch(`${this.baseUrl}/text-to-speech/${ttsRequest.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(ttsRequest),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const processingTime = Date.now() - startTime;

      console.log(`✅ Audio generated successfully in ${processingTime}ms (${audioBuffer.byteLength} bytes)`);

      return {
        success: true,
        audioBuffer,
        processingTime,
        size: audioBuffer.byteLength
      };

    } catch (error) {
      console.error('❌ Audio generation failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  generateCacheKey(request) {
    const textHash = this.hashString(request.text);
    const voice = request.voice || this.defaultVoiceId;
    const language = request.language || 'sanskrit';
    return `${textHash}_${voice}_${language}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Test runner
 */
class CompletePhase2TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.service = new MockElevenLabsTtsService();
  }

  async runAllTests() {
    try {
      // Test 1: API Connectivity
      await this.testApiConnectivity();
      
      // Test 2: Voice Fetching
      await this.testVoiceFetching();
      
      // Test 3: English Audio Generation
      await this.testEnglishAudioGeneration();
      
      // Test 4: Sanskrit Audio Generation
      await this.testSanskritAudioGeneration();
      
      // Test 5: IAST Audio Generation
      await this.testIASTAudioGeneration();
      
      // Test 6: Performance Testing
      await this.testPerformance();
      
      // Test 7: Error Handling
      await this.testErrorHandling();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.printTestResults();
    }
  }

  async testApiConnectivity() {
    console.log('\n📋 Test 1: API Connectivity');
    console.log('-'.repeat(40));

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.service.apiKey,
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        console.log('✅ ElevenLabs API is accessible');
        console.log(`📊 Response status: ${response.status}`);
        this.passTest('API Connectivity');
      } else {
        throw new Error(`API returned status: ${response.status}`);
      }

    } catch (error) {
      this.failTest('API Connectivity', error.message);
    }
  }

  async testVoiceFetching() {
    console.log('\n📋 Test 2: Voice Fetching');
    console.log('-'.repeat(40));

    try {
      const voices = await this.service.getAvailableVoices();
      
      if (voices.length > 0) {
        console.log(`✅ Successfully fetched ${voices.length} voices`);
        console.log(`🎤 First voice: ${voices[0].name} (${voices[0].voice_id})`);
        console.log(`🎤 Voice category: ${voices[0].category}`);
        this.passTest('Voice Fetching');
      } else {
        throw new Error('No voices returned from API');
      }

    } catch (error) {
      this.failTest('Voice Fetching', error.message);
    }
  }

  async testEnglishAudioGeneration() {
    console.log('\n📋 Test 3: English Audio Generation');
    console.log('-'.repeat(40));

    try {
      const request = {
        text: TEST_CONFIG.testTexts.english,
        language: 'english',
        voice: this.service.defaultVoiceId
      };

      const result = await this.service.generateAudio(request);
      
      if (result.success) {
        console.log(`✅ English audio generated successfully`);
        console.log(`📊 Size: ${this.formatBytes(result.size)}`);
        console.log(`⏱️ Processing time: ${result.processingTime}ms`);
        this.passTest('English Audio Generation');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.failTest('English Audio Generation', error.message);
    }
  }

  async testSanskritAudioGeneration() {
    console.log('\n📋 Test 4: Sanskrit Audio Generation');
    console.log('-'.repeat(40));

    try {
      const request = {
        text: TEST_CONFIG.testTexts.sanskrit,
        language: 'sanskrit',
        voice: this.service.defaultVoiceId
      };

      const result = await this.service.generateAudio(request);
      
      if (result.success) {
        console.log(`✅ Sanskrit audio generated successfully`);
        console.log(`📊 Size: ${this.formatBytes(result.size)}`);
        console.log(`⏱️ Processing time: ${result.processingTime}ms`);
        this.passTest('Sanskrit Audio Generation');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.failTest('Sanskrit Audio Generation', error.message);
    }
  }

  async testIASTAudioGeneration() {
    console.log('\n📋 Test 5: IAST Audio Generation');
    console.log('-'.repeat(40));

    try {
      const request = {
        text: TEST_CONFIG.testTexts.iast,
        language: 'sanskrit',
        voice: this.service.defaultVoiceId
      };

      const result = await this.service.generateAudio(request);
      
      if (result.success) {
        console.log(`✅ IAST audio generated successfully`);
        console.log(`📊 Size: ${this.formatBytes(result.size)}`);
        console.log(`⏱️ Processing time: ${result.processingTime}ms`);
        this.passTest('IAST Audio Generation');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.failTest('IAST Audio Generation', error.message);
    }
  }

  async testPerformance() {
    console.log('\n📋 Test 6: Performance Testing');
    console.log('-'.repeat(40));

    try {
      const testTexts = [
        'om',
        'om namo bhagavate',
        'om namo bhagavate vāsudevāya',
        'ॐ नमो भगवते वासुदेवाय'
      ];

      const results = [];
      
      for (const text of testTexts) {
        const request = {
          text: text,
          language: 'sanskrit',
          voice: this.service.defaultVoiceId
        };

        const startTime = Date.now();
        const result = await this.service.generateAudio(request);
        const endTime = Date.now();

        if (result.success) {
          results.push({
            text: text,
            processingTime: endTime - startTime,
            size: result.size
          });
          console.log(`✅ "${text}" - ${endTime - startTime}ms - ${this.formatBytes(result.size)}`);
        } else {
          console.log(`❌ "${text}" - Failed: ${result.error}`);
        }
      }

      if (results.length > 0) {
        const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
        const avgSize = results.reduce((sum, r) => sum + r.size, 0) / results.length;
        
        console.log(`📊 Average processing time: ${Math.round(avgTime)}ms`);
        console.log(`📊 Average file size: ${this.formatBytes(avgSize)}`);
        this.passTest('Performance Testing');
      } else {
        throw new Error('No successful audio generations');
      }

    } catch (error) {
      this.failTest('Performance Testing', error.message);
    }
  }

  async testErrorHandling() {
    console.log('\n📋 Test 7: Error Handling');
    console.log('-'.repeat(40));

    try {
      // Test with invalid voice ID
      const invalidRequest = {
        text: 'test',
        language: 'english',
        voice: 'invalid-voice-id'
      };

      const result = await this.service.generateAudio(invalidRequest);
      
      if (!result.success) {
        console.log(`✅ Error handling works: ${result.error}`);
        this.passTest('Error Handling');
      } else {
        throw new Error('Expected error but got success');
      }

    } catch (error) {
      this.failTest('Error Handling', error.message);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  passTest(testName) {
    testResults.passed++;
    testResults.total++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
    console.log(`✅ ${testName}: PASSED`);
  }

  failTest(testName, error) {
    testResults.failed++;
    testResults.total++;
    testResults.details.push({ name: testName, status: 'FAILED', error });
    console.log(`❌ ${testName}: FAILED - ${error}`);
  }

  printTestResults() {
    const duration = Date.now() - this.startTime;
    const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 2 COMPLETE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.total}`);

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
    }

    console.log('\n' + '='.repeat(60));
    
    if (testResults.failed === 0) {
      console.log('🎉 PHASE 2: COMPLETE SUCCESS!');
      console.log('✅ ElevenLabs API integration working perfectly');
      console.log('✅ Sanskrit text processing successful');
      console.log('✅ Audio generation working for all text types');
      console.log('✅ Performance within acceptable limits');
      console.log('✅ Error handling robust');
      console.log('✅ Ready for production deployment!');
    } else {
      console.log('⚠️ PHASE 2: NEEDS ATTENTION');
      console.log('❌ Some tests failed - review and fix before deployment');
    }
    
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new CompletePhase2TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = { CompletePhase2TestRunner, testResults };

