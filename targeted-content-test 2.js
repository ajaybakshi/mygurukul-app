#!/usr/bin/env node

/**
 * Targeted Content Selection Test
 * Tests the same source multiple times to investigate content repetition
 */

const testSameSourceMultipleTimes = async (sourceName, testCount = 10) => {
  console.log(`=== TARGETED CONTENT TEST: ${sourceName} ===`);
  console.log(`Testing ${sourceName} ${testCount} times to check content diversity...\n`);
  
  const results = [];
  
  for (let i = 0; i < testCount; i++) {
    try {
      console.log(`🔄 Test ${i + 1}/${testCount} - ${sourceName}`);
      
      const response = await fetch('http://localhost:3000/api/todays-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceName: sourceName })
      });
      
      const data = await response.json();
      
      const result = {
        test: i + 1,
        source: data.selectedSource,
        method: data.selectionMethod,
        content: data.todaysWisdom?.rawText?.substring(0, 100) + '...',
        fullContent: data.todaysWisdom?.rawText,
        reference: data.todaysWisdom?.rawTextAnnotation?.technicalReference,
        textType: data.todaysWisdom?.rawTextAnnotation?.logicalUnitType,
        extractionMethod: data.todaysWisdom?.rawTextAnnotation?.extractionMethod,
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      console.log(`✅ Content: ${result.content}`);
      console.log(`   Reference: ${result.reference}`);
      console.log(`   Text Type: ${result.textType}`);
      console.log(`   Extraction: ${result.extractionMethod}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
    }
  }
  
  // Analysis
  console.log('\n=== CONTENT DIVERSITY ANALYSIS ===');
  
  // Check for duplicate content
  const contentHashes = results.map(r => r.fullContent?.substring(0, 200) || '');
  const uniqueContent = [...new Set(contentHashes)];
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Unique content pieces: ${uniqueContent.length}`);
  console.log(`Content diversity: ${(uniqueContent.length / results.length * 100).toFixed(1)}%`);
  
  // Show duplicate content
  if (uniqueContent.length < results.length) {
    console.log('\n⚠️ DUPLICATE CONTENT DETECTED:');
    
    const contentGroups = {};
    results.forEach((result, index) => {
      const contentKey = result.fullContent?.substring(0, 200) || '';
      if (!contentGroups[contentKey]) {
        contentGroups[contentKey] = [];
      }
      contentGroups[contentKey].push(index + 1);
    });
    
    Object.entries(contentGroups).forEach(([content, testNumbers]) => {
      if (testNumbers.length > 1) {
        console.log(`  Tests ${testNumbers.join(', ')}: Same content`);
        console.log(`    Content: ${content}...`);
      }
    });
  }
  
  // Show all unique content
  console.log('\n📋 ALL UNIQUE CONTENT:');
  uniqueContent.forEach((content, index) => {
    console.log(`${index + 1}. ${content}...`);
  });
  
  console.log('\n=== TEST COMPLETE ===');
  
  return {
    results,
    uniqueContentCount: uniqueContent.length,
    totalTests: results.length,
    diversityPercentage: (uniqueContent.length / results.length * 100)
  };
};

// Test multiple sources
const runTargetedTests = async () => {
  const sourcesToTest = [
    'Svetasvatra_Upanishda.txt',
    'Brahma_Purana.txt', 
    'Katha_Upanishad.txt',
    'Taittiriya_Upanishad.txt'
  ];
  
  console.log('=== COMPREHENSIVE TARGETED TESTING ===\n');
  
  for (const source of sourcesToTest) {
    await testSameSourceMultipleTimes(source, 5);
    console.log('\n' + '='.repeat(60) + '\n');
  }
};

// Run the test
runTargetedTests().catch(console.error);
