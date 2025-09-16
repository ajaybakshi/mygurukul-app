#!/usr/bin/env node

/**
 * Simple Randomization Test Script
 * Makes 20 API calls and logs results for debugging
 */

const testRandomization = async () => {
  console.log('=== SIMPLE RANDOMIZATION TEST ===');
  console.log('Making 20 API calls to test randomization...\n');
  
  const results = [];
  
  for (let i = 0; i < 20; i++) {
    try {
      console.log(`\n🔄 Test ${i + 1}/20`);
      
      const response = await fetch('http://localhost:3000/api/todays-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      const result = {
        test: i + 1,
        source: data.selectedSource,
        method: data.selectionMethod,
        category: data.todaysWisdom?.rawTextAnnotation?.source,
        textType: data.todaysWisdom?.rawTextAnnotation?.logicalUnitType,
        content: data.todaysWisdom?.rawText?.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      console.log(`✅ Source: ${result.source}`);
      console.log(`   Method: ${result.method}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Text Type: ${result.textType}`);
      console.log(`   Content: ${result.content}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const sources = results.map(r => r.source);
  const uniqueSources = [...new Set(sources)];
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Unique sources: ${uniqueSources.length}`);
  console.log(`Sources used: ${uniqueSources.join(', ')}`);
  
  // Count each source
  const sourceCounts = {};
  sources.forEach(source => {
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\nSource distribution:');
  Object.entries(sourceCounts).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}/20 (${(count/20*100).toFixed(1)}%)`);
  });
  
  console.log('\n=== TEST COMPLETE ===');
};

// Run the test
testRandomization().catch(console.error);
