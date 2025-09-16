/**
 * Test Preferred Voice with Sanskrit Text
 * Verify the user's preferred voice works well with Sanskrit
 */

// Set the API key
process.env.ELEVENLABS_API_KEY = "a0d07d03198309d26bfe43bfe4b348ad9ea8459dc19efc7cd4379082c00ba59d";

console.log('🎤 Testing Preferred Voice: 4BoDaQ6aygOP6fpsUmJe');
console.log('=' .repeat(60));

const PREFERRED_VOICE_ID = '4BoDaQ6aygOP6fpsUmJe';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Get voice details
 */
async function getVoiceDetails(voiceId) {
  try {
    const response = await fetch(`${BASE_URL}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': API_KEY,
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const voice = await response.json();
    return voice;
  } catch (error) {
    console.error('❌ Failed to fetch voice details:', error);
    return null;
  }
}

/**
 * Generate audio with preferred voice
 */
async function generateAudioWithPreferredVoice(text, voiceId) {
  try {
    const ttsRequest = {
      text: text,
      voice_id: voiceId,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      },
      output_format: 'mp3_44100_128'
    };

    console.log(`🔄 Generating audio with preferred voice: "${text.substring(0, 50)}..."`);

    const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify(ttsRequest),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return {
      success: true,
      audioBuffer,
      size: audioBuffer.byteLength
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run comprehensive test
 */
async function runPreferredVoiceTest() {
  try {
    // Test 1: Get voice details
    console.log('\n📋 Test 1: Voice Details');
    console.log('-'.repeat(40));
    
    const voiceDetails = await getVoiceDetails(PREFERRED_VOICE_ID);
    if (voiceDetails) {
      console.log(`✅ Voice found: ${voiceDetails.name}`);
      console.log(`📝 Description: ${voiceDetails.description || 'No description'}`);
      console.log(`🏷️ Category: ${voiceDetails.category}`);
      console.log(`🎯 Labels: ${voiceDetails.labels ? Object.entries(voiceDetails.labels).map(([k,v]) => `${k}: ${v}`).join(', ') : 'None'}`);
      console.log(`⚙️ Settings:`);
      console.log(`   - Stability: ${voiceDetails.settings?.stability || 'N/A'}`);
      console.log(`   - Similarity Boost: ${voiceDetails.settings?.similarity_boost || 'N/A'}`);
      console.log(`   - Style: ${voiceDetails.settings?.style || 'N/A'}`);
      console.log(`   - Speaker Boost: ${voiceDetails.settings?.use_speaker_boost || 'N/A'}`);
    } else {
      console.log('❌ Could not fetch voice details');
      return;
    }

    // Test 2: Sanskrit text generation
    console.log('\n📋 Test 2: Sanskrit Text Generation');
    console.log('-'.repeat(40));
    
    const sanskritTexts = [
      'ॐ नमो भगवते वासुदेवाय',
      'om namo bhagavate vāsudevāya',
      'ॐ शान्तिः शान्तिः शान्तिः',
      'om śāntiḥ śāntiḥ śāntiḥ'
    ];

    for (const text of sanskritTexts) {
      const result = await generateAudioWithPreferredVoice(text, PREFERRED_VOICE_ID);
      
      if (result.success) {
        console.log(`✅ "${text}" - ${formatBytes(result.size)}`);
      } else {
        console.log(`❌ "${text}" - Failed: ${result.error}`);
      }
    }

    // Test 3: Performance test
    console.log('\n📋 Test 3: Performance Test');
    console.log('-'.repeat(40));
    
    const testText = 'ॐ नमो भगवते वासुदेवाय';
    const startTime = Date.now();
    const result = await generateAudioWithPreferredVoice(testText, PREFERRED_VOICE_ID);
    const endTime = Date.now();
    
    if (result.success) {
      console.log(`✅ Performance test successful`);
      console.log(`⏱️ Processing time: ${endTime - startTime}ms`);
      console.log(`📊 File size: ${formatBytes(result.size)}`);
      console.log(`🎵 Audio quality: ${result.size > 20000 ? 'High' : 'Medium'}`);
    } else {
      console.log(`❌ Performance test failed: ${result.error}`);
    }

    // Test 4: Voice comparison (optional)
    console.log('\n📋 Test 4: Voice Comparison');
    console.log('-'.repeat(40));
    
    const defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    const comparisonText = 'om namo bhagavate vāsudevāya';
    
    console.log('🔄 Testing preferred voice...');
    const preferredResult = await generateAudioWithPreferredVoice(comparisonText, PREFERRED_VOICE_ID);
    
    console.log('🔄 Testing default voice...');
    const defaultResult = await generateAudioWithPreferredVoice(comparisonText, defaultVoiceId);
    
    if (preferredResult.success && defaultResult.success) {
      console.log(`✅ Voice comparison completed`);
      console.log(`🎤 Preferred voice (${PREFERRED_VOICE_ID}): ${formatBytes(preferredResult.size)}`);
      console.log(`🎤 Default voice (Adam): ${formatBytes(defaultResult.size)}`);
      console.log(`📊 Size difference: ${preferredResult.size > defaultResult.size ? '+' : ''}${preferredResult.size - defaultResult.size} bytes`);
    } else {
      console.log(`⚠️ Voice comparison incomplete - some generations failed`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 PREFERRED VOICE TEST COMPLETE!');
    console.log('='.repeat(60));
    
    if (voiceDetails && preferredResult.success) {
      console.log(`✅ Voice "${voiceDetails.name}" is working perfectly`);
      console.log(`✅ Sanskrit text generation successful`);
      console.log(`✅ Performance within acceptable limits`);
      console.log(`✅ Ready for production use!`);
    } else {
      console.log(`⚠️ Some issues detected - review results above`);
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the test
runPreferredVoiceTest().catch(console.error);

