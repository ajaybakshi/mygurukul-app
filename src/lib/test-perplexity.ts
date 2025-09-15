import { perplexitySearch, testPerplexityConnection, PERPLEXITY_CONFIG } from './perplexitySearch'

async function testPerplexityImplementation() {
  console.log('🧪 Testing Perplexity Search Implementation')
  console.log('=' .repeat(50))
  
  // Test 1: Configuration
  console.log('\n📋 Test 1: Configuration Check')
  console.log('Perplexity enabled:', PERPLEXITY_CONFIG.enabled)
  console.log('Search weight:', PERPLEXITY_CONFIG.searchWeight)
  console.log('Default model:', PERPLEXITY_CONFIG.defaultModel)
  
  // Test 2: Connection Test
  console.log('\n🔗 Test 2: API Connection Test')
  try {
    const connectionSuccess = await testPerplexityConnection()
    console.log('Connection test result:', connectionSuccess ? '✅ SUCCESS' : '❌ FAILED')
  } catch (error) {
    console.log('Connection test error:', error)
  }
  
  // Test 3: Mock Search (Development Mode)
  console.log('\n🔍 Test 3: Mock Search Test')
  try {
    // Set environment variable for mock testing
    process.env.USE_MOCK_PERPLEXITY = 'true'
    
    const mockResult = await perplexitySearch('How can I find inner peace?', {
      model: 'sonar',
      includeSpiritualContext: true,
      searchFocus: 'spiritual_texts'
    })
    
    console.log('Mock search successful ✅')
    console.log('Answer length:', mockResult.answer.length)
    console.log('Results count:', mockResult.results.length)
    console.log('Citations count:', mockResult.citations.length)
    console.log('References count:', mockResult.references.length)
    console.log('Steps count:', mockResult.steps?.length || 0)
    
    // Show sample result
    if (mockResult.results.length > 0) {
      console.log('\n📖 Sample Result:')
      console.log('Title:', mockResult.results[0].title)
      console.log('URL:', mockResult.results[0].url)
      console.log('Snippet:', mockResult.results[0].snippet.substring(0, 100) + '...')
    }
    
  } catch (error) {
    console.log('Mock search error:', error)
  }
  
  console.log('\n✅ Perplexity Search Implementation Test Complete')
}

// Export for use in other files
export { testPerplexityImplementation }

// Run test if this file is executed directly
if (require.main === module) {
  testPerplexityImplementation().catch(console.error)
}
