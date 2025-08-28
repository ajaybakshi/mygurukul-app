import { NextRequest, NextResponse } from 'next/server'
import { perplexitySearch, testPerplexityConnection, PERPLEXITY_CONFIG } from '@/lib/perplexitySearch'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Perplexity Search API Endpoint')
    
    const testResults = {
      configuration: {
        enabled: PERPLEXITY_CONFIG.enabled,
        searchWeight: PERPLEXITY_CONFIG.searchWeight,
        defaultModel: PERPLEXITY_CONFIG.defaultModel,
        hasApiKey: !!PERPLEXITY_CONFIG.apiKey
      },
      connection: false,
      mockSearch: null as any,
      error: null as string | null
    }
    
    // Test 1: Connection Test
    try {
      testResults.connection = await testPerplexityConnection()
    } catch (error) {
      testResults.error = `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    // Test 2: Real Perplexity API Test
    try {
      // Test real Perplexity API with correct model name
      process.env.USE_MOCK_PERPLEXITY = 'false'
      
      const mockResult = await perplexitySearch('How can I find inner peace?', {
        model: 'sonar-medium-online',
        includeSpiritualContext: true,
        searchFocus: 'spiritual_texts'
      })
      
      testResults.mockSearch = {
        success: true,
        answerLength: mockResult.answer.length,
        resultsCount: mockResult.results.length,
        citationsCount: mockResult.citations.length,
        referencesCount: mockResult.references.length,
        stepsCount: mockResult.steps?.length || 0,
        sampleResult: mockResult.results.length > 0 ? {
          title: mockResult.results[0].title,
          url: mockResult.results[0].url,
          snippet: mockResult.results[0].snippet.substring(0, 100) + '...'
        } : null,
        isRealAPI: true
      }
    } catch (error) {
      testResults.mockSearch = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    console.log('✅ Perplexity Search Test Results:', testResults)
    
    return NextResponse.json({
      success: true,
      message: 'Perplexity Search Implementation Test Complete',
      results: testResults,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Perplexity Search Test Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, options = {} } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Perplexity Search Request:', { query, options })
    
    // Use real Perplexity API with correct model name
    process.env.USE_MOCK_PERPLEXITY = 'false'
    
    const result = await perplexitySearch(query, options)
    
    console.log('✅ Perplexity Search Response:', {
      answerLength: result.answer.length,
      resultsCount: result.results.length,
      citationsCount: result.citations.length
    })
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Perplexity Search Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
