/**
 * Browser-Compatible Randomization Test
 * Run this in the browser console to test randomization
 */

const testRandomization = async () => {
  console.log('=== RANDOMIZATION TEST HARNESS ===');
  console.log('Testing 20 consecutive API calls to verify randomization...\n');
  
  const results = [];
  const sourceCounts = {};
  const methodCounts = {};
  
  for (let i = 0; i < 20; i++) {
    try {
      console.log(`🔄 Test ${i + 1}/20 - Making API call...`);
      
      const response = await fetch('/api/todays-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract key information
      const testResult = {
        testNumber: i + 1,
        source: data.selectedSource,
        verse: data.todaysWisdom?.rawTextAnnotation?.technicalReference || 'No reference',
        title: data.todaysWisdom?.rawTextAnnotation?.chapter || 'No title',
        method: data.selectionMethod,
        category: data.todaysWisdom?.rawTextAnnotation?.source || 'Unknown',
        textType: data.todaysWisdom?.rawTextAnnotation?.logicalUnitType || 'Unknown',
        extractionMethod: data.todaysWisdom?.rawTextAnnotation?.extractionMethod || 'Unknown',
        contentPreview: data.todaysWisdom?.rawText?.substring(0, 50) + '...' || 'No content',
        availableSources: data.totalAvailableSources || 0
      };
      
      results.push(testResult);
      
      // Count sources and methods
      sourceCounts[testResult.source] = (sourceCounts[testResult.source] || 0) + 1;
      methodCounts[testResult.method] = (methodCounts[testResult.method] || 0) + 1;
      
      console.log(`✅ Test ${i + 1}:`, {
        source: testResult.source,
        verse: testResult.verse,
        title: testResult.title,
        method: testResult.method,
        category: testResult.category,
        textType: testResult.textType
      });
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} failed:`, error.message);
      results.push({
        testNumber: i + 1,
        error: error.message,
        source: 'ERROR',
        method: 'ERROR'
      });
    }
  }
  
  // Analysis and reporting
  console.log('\n=== RANDOMIZATION ANALYSIS ===');
  
  // Source distribution
  console.log('\n📊 SOURCE DISTRIBUTION:');
  const sortedSources = Object.entries(sourceCounts)
    .sort(([,a], [,b]) => b - a);
  
  sortedSources.forEach(([source, count]) => {
    const percentage = ((count / 20) * 100).toFixed(1);
    console.log(`  ${source}: ${count}/20 (${percentage}%)`);
  });
  
  // Method distribution
  console.log('\n🎯 SELECTION METHOD DISTRIBUTION:');
  Object.entries(methodCounts).forEach(([method, count]) => {
    const percentage = ((count / 20) * 100).toFixed(1);
    console.log(`  ${method}: ${count}/20 (${percentage}%)`);
  });
  
  // Diversity analysis
  console.log('\n🔍 DIVERSITY ANALYSIS:');
  const uniqueSources = Object.keys(sourceCounts).length;
  const uniqueMethods = Object.keys(methodCounts).length;
  const totalTests = results.filter(r => !r.error).length;
  
  console.log(`  Unique sources: ${uniqueSources}/${totalTests}`);
  console.log(`  Unique methods: ${uniqueMethods}`);
  console.log(`  Success rate: ${totalTests}/20 (${((totalTests/20)*100).toFixed(1)}%)`);
  
  // Check for patterns
  console.log('\n🔬 PATTERN ANALYSIS:');
  
  // Check for consecutive same sources
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  let lastSource = null;
  
  results.forEach(result => {
    if (result.source === lastSource && result.source !== 'ERROR') {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 1;
    }
    lastSource = result.source;
  });
  
  console.log(`  Max consecutive same source: ${maxConsecutive}`);
  
  // Check for balanced distribution
  const expectedPerSource = totalTests / uniqueSources;
  const isBalanced = Object.values(sourceCounts).every(count => 
    Math.abs(count - expectedPerSource) <= 2
  );
  
  console.log(`  Distribution balanced: ${isBalanced ? 'YES' : 'NO'}`);
  console.log(`  Expected per source: ${expectedPerSource.toFixed(1)}`);
  
  // Content diversity
  const uniqueTitles = new Set(results.map(r => r.title)).size;
  const uniqueVerses = new Set(results.map(r => r.verse)).size;
  
  console.log(`  Unique titles: ${uniqueTitles}/${totalTests}`);
  console.log(`  Unique verses: ${uniqueVerses}/${totalTests}`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (uniqueSources < 3) {
    console.log('  ⚠️  Low source diversity - consider checking source availability');
  }
  
  if (maxConsecutive > 3) {
    console.log('  ⚠️  High consecutive repetition - randomization may need improvement');
  }
  
  if (!isBalanced) {
    console.log('  ⚠️  Unbalanced distribution - some sources may be over/under-represented');
  }
  
  if (uniqueTitles < totalTests * 0.8) {
    console.log('  ⚠️  Low content diversity - similar titles appearing frequently');
  }
  
  if (totalTests === 20 && uniqueSources >= 5 && maxConsecutive <= 2 && isBalanced) {
    console.log('  ✅ Randomization appears to be working well!');
  }
  
  console.log('\n=== TEST COMPLETE ===');
  
  return {
    results,
    sourceCounts,
    methodCounts,
    analysis: {
      uniqueSources,
      uniqueMethods,
      totalTests,
      maxConsecutive,
      isBalanced,
      uniqueTitles,
      uniqueVerses
    }
  };
};

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  window.testRandomization = testRandomization;
  console.log('Randomization test available as: testRandomization()');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRandomization };
}
