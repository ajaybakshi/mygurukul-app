const axios = require('axios');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 3002}`;
const COLLECTOR_URL = process.env.SANSKRIT_COLLECTOR_URL || 'http://localhost:3001';

/**
 * Integration test for Spiritual Synthesizer Agent
 * Tests end-to-end conversation flow with Sanskrit Collector integration
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Spiritual Synthesizer Integration Tests...\n');

  let sessionId = null;

  try {
    // Test 1: Health Check
    console.log('📊 Test 1: Health Check');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: First Wisdom Synthesis
    console.log('\n🧘 Test 2: First Wisdom Synthesis');
    const firstQuestion = "How can I find peace in difficult times according to Hindu teachings?";

    // First get verse data from collector (simulating real flow)
    console.log('   📚 Getting verse data from Sanskrit Collector...');
    const collectorResponse = await axios.post(`${COLLECTOR_URL}/api/v1/collect-verses`, {
      question: firstQuestion,
      context: { userId: 'test-user-123' }
    });

    console.log('   ✅ Collector returned', collectorResponse.data.data.clusters?.length || 0, 'clusters');

    // Now synthesize wisdom
    console.log('   🧠 Synthesizing wisdom narrative...');
    const synthesisResponse = await axios.post(`${BASE_URL}/api/v1/synthesize-wisdom`, {
      question: firstQuestion,
      verseData: collectorResponse.data.data,
      context: {
        userId: 'test-user-123',
        preferences: {
          tone: 'conversational',
          detailLevel: 'balanced',
          includeSanskrit: true
        }
      }
    });

    sessionId = synthesisResponse.data.data.sessionId;
    console.log('✅ Wisdom synthesis completed');
    console.log('   📝 Narrative length:', synthesisResponse.data.data.narrative.length, 'characters');
    console.log('   📚 Citations:', synthesisResponse.data.data.citations?.length || 0);
    console.log('   🔗 Session ID:', sessionId);

    // Test 3: Conversation Continuation
    console.log('\n💬 Test 3: Conversation Continuation');
    const followUpQuestion = "Can you tell me more about how this applies to dealing with anxiety?";

    const continueResponse = await axios.post(`${BASE_URL}/api/v1/continue-conversation`, {
      question: followUpQuestion,
      sessionId: sessionId,
      context: {
        userId: 'test-user-123',
        preferences: {
          tone: 'meditative',
          detailLevel: 'detailed'
        }
      }
    });

    console.log('✅ Conversation continuation completed');
    console.log('   📝 Follow-up narrative length:', continueResponse.data.data.narrative.length, 'characters');
    console.log('   🔍 Follow-up analysis:', continueResponse.data.data.metadata.followUpAnalysis.reason);

    // Test 4: Conversation History Retrieval
    console.log('\n📜 Test 4: Conversation History Retrieval');
    const historyResponse = await axios.get(`${BASE_URL}/api/v1/conversation/${sessionId}`);

    console.log('✅ Conversation history retrieved');
    console.log('   📊 Total turns:', historyResponse.data.data.turns.length);
    console.log('   🎯 Primary themes:', historyResponse.data.data.metadata?.primaryThemes || []);

    // Test 5: Second Follow-up with Topic Shift
    console.log('\n🔄 Test 5: Topic Shift Handling');
    const topicShiftQuestion = "What does the Bhagavad Gita say about leadership and decision making?";

    const topicShiftResponse = await axios.post(`${BASE_URL}/api/v1/continue-conversation`, {
      question: topicShiftQuestion,
      sessionId: sessionId,
      context: {
        userId: 'test-user-123'
      }
    });

    console.log('✅ Topic shift handled');
    console.log('   🔄 Topic shift detected:', topicShiftResponse.data.data.metadata.followUpAnalysis.topicShift);
    console.log('   📝 New narrative length:', topicShiftResponse.data.data.narrative.length, 'characters');

    // Test 6: Final History Check
    console.log('\n📈 Test 6: Final Conversation State');
    const finalHistoryResponse = await axios.get(`${BASE_URL}/api/v1/conversation/${sessionId}`);

    console.log('✅ Final conversation state:');
    console.log('   📊 Total conversation turns:', finalHistoryResponse.data.data.turns.length);
    console.log('   🎯 All themes explored:', finalHistoryResponse.data.data.metadata?.primaryThemes || []);
    console.log('   📅 Last activity:', finalHistoryResponse.data.data.metadata?.lastActivity);

    console.log('\n🎉 All integration tests passed successfully!');
    console.log('📊 Test Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ First Wisdom Synthesis');
    console.log('   ✅ Conversation Continuation');
    console.log('   ✅ History Retrieval');
    console.log('   ✅ Topic Shift Handling');
    console.log('   ✅ State Persistence');

  } catch (error) {
    console.error('\n❌ Integration test failed:');
    console.error('   Error:', error.message);

    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }

    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Make sure Sanskrit Collector is running on port 3001');
    console.error('   2. Check that all dependencies are installed');
    console.error('   3. Verify environment variables are set correctly');

    process.exit(1);
  }
}

/**
 * Simple service availability check
 */
async function checkServiceAvailability() {
  console.log('🔍 Checking service availability...');

  try {
    // Check Spiritual Synthesizer
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Spiritual Synthesizer is running');

    // Check Sanskrit Collector
    await axios.get(`${COLLECTOR_URL}/health`, { timeout: 5000 });
    console.log('✅ Sanskrit Collector is running');

    return true;
  } catch (error) {
    console.error('❌ Service availability check failed:');
    console.error('   Make sure both services are running:');
    console.error('   - Spiritual Synthesizer on port', process.env.PORT || 3002);
    console.error('   - Sanskrit Collector on port 3001');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  checkServiceAvailability()
    .then(available => {
      if (available) {
        return runIntegrationTests();
      }
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runIntegrationTests,
  checkServiceAvailability
};
