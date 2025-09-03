// CITATION DEBUGGING TEST SCRIPT
// Run with: node test-citations.js

const BASE_URL = 'http://localhost:3000/api/discovery-engine';

// Test 1: MINIMAL MODE (bypass all enhancements)
async function testMinimalMode() {
  console.log('\n🎯 TEST 1: MINIMAL MODE - Basic Discovery Engine call');
  console.log('==================================================');

  const payload = {
    question: 'What is dharma?',
    minimalTest: true
  };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('✅ Response Status:', response.status);
    console.log('📊 Citations Count:', data.answer?.citations?.length || 0);
    console.log('📚 References Count:', data.answer?.references?.length || 0);
    console.log('🔍 Has Citations Field:', !!data.answer?.citations);
    console.log('📖 Has References Field:', !!data.answer?.references);
    console.log('🎯 Minimal Test Mode:', data.minimalTest);

    if (data.answer?.citations && data.answer.citations.length > 0) {
      console.log('📚 CITATIONS FOUND:', JSON.stringify(data.answer.citations, null, 2));
    } else {
      console.log('❌ NO CITATIONS FOUND');
    }

    if (data.debugInfo) {
      console.log('🐛 Debug Info:', data.debugInfo);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 2: FULL MODE (with all enhancements)
async function testFullMode() {
  console.log('\n🔄 TEST 2: FULL MODE - All enhancements enabled');
  console.log('===============================================');

  const payload = {
    question: 'What is dharma?',
    minimalTest: false
  };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('✅ Response Status:', response.status);
    console.log('📊 Citations Count:', data.answer?.citations?.length || 0);
    console.log('📚 References Count:', data.answer?.references?.length || 0);
    console.log('🔍 Has Citations Field:', !!data.answer?.citations);
    console.log('📖 Has References Field:', !!data.answer?.references);

    if (data.answer?.citations && data.answer.citations.length > 0) {
      console.log('📚 CITATIONS FOUND:', JSON.stringify(data.answer.citations, null, 2));
    } else {
      console.log('❌ NO CITATIONS FOUND');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 3: HYDE DISABLED MODE
async function testHydeDisabled() {
  console.log('\n🚫 TEST 3: HYDE DISABLED MODE');
  console.log('==============================');

  // Temporarily disable HYDE by setting env var
  process.env.HYDE_ENABLED = 'false';

  const payload = {
    question: 'What is dharma?',
    minimalTest: false
  };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('✅ Response Status:', response.status);
    console.log('📊 Citations Count:', data.answer?.citations?.length || 0);
    console.log('📚 References Count:', data.answer?.references?.length || 0);

    if (data.answer?.citations && data.answer.citations.length > 0) {
      console.log('📚 CITATIONS FOUND:', JSON.stringify(data.answer.citations, null, 2));
    } else {
      console.log('❌ NO CITATIONS FOUND');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 CITATION DEBUGGING TESTS');
  console.log('===========================');
  console.log('Testing Google Discovery Engine citations systematically...\n');

  await testMinimalMode();
  await testFullMode();
  await testHydeDisabled();

  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  console.log('If minimal mode works but full mode fails: Issue is in enhancements');
  console.log('If minimal mode fails: Issue is in dataStore configuration');
  console.log('If HYDE disabled works but full fails: Issue is in HYDE integration');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testMinimalMode, testFullMode, testHydeDisabled };
