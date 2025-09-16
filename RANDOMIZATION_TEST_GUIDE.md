# Randomization Test Harness Guide

## Overview
This test harness verifies the randomization behavior of the Today's Wisdom API by making 20 consecutive calls and analyzing the results.

## Files Created

### 1. `debug-randomization-test.js` (Node.js)
- Full-featured test harness for server-side testing
- Includes comprehensive analysis and reporting
- Can be run from command line

### 2. `browser-randomization-test.js` (Browser)
- Browser-compatible version for client-side testing
- Can be run in browser console
- Same analysis capabilities as Node.js version

## Usage

### Node.js Testing
```bash
# Run the test harness
node debug-randomization-test.js

# Or run with npm script (if configured)
npm run test:randomization
```

### Browser Testing
1. Open your browser's developer console
2. Copy and paste the contents of `browser-randomization-test.js`
3. Run: `testRandomization()`

## What the Test Measures

### 📊 Source Distribution
- Counts how many times each source is selected
- Calculates percentage distribution
- Identifies over/under-represented sources

### 🎯 Selection Method Distribution
- Tracks which selection methods are used
- Verifies user-specified vs random selection
- Monitors cross-corpus selection usage

### 🔍 Diversity Analysis
- Counts unique sources selected
- Measures content diversity
- Tracks unique titles and verses

### 🔬 Pattern Analysis
- Detects consecutive same-source selections
- Checks for balanced distribution
- Identifies potential randomization issues

## Expected Results

### ✅ Good Randomization
- **Unique sources**: 5+ different sources selected
- **Max consecutive**: ≤2 consecutive same sources
- **Balanced distribution**: Sources distributed relatively evenly
- **Content diversity**: 80%+ unique titles/verses

### ⚠️ Potential Issues
- **Low source diversity**: <3 unique sources
- **High repetition**: >3 consecutive same sources
- **Unbalanced distribution**: Some sources heavily over/under-represented
- **Low content diversity**: <80% unique content

## Sample Output

```
=== RANDOMIZATION TEST HARNESS ===
Testing 20 consecutive API calls to verify randomization...

🔄 Test 1/20 - Making API call...
✅ Test 1: { source: 'Bhagvad_Gita', method: 'cross-corpus', ... }

📊 SOURCE DISTRIBUTION:
  Bhagvad_Gita: 3/20 (15.0%)
  Rig_Veda: 3/20 (15.0%)
  Ramayana: 2/20 (10.0%)
  ...

🎯 SELECTION METHOD DISTRIBUTION:
  cross-corpus: 18/20 (90.0%)
  user-specified: 2/20 (10.0%)

🔍 DIVERSITY ANALYSIS:
  Unique sources: 8/20
  Unique methods: 2
  Success rate: 20/20 (100.0%)

🔬 PATTERN ANALYSIS:
  Max consecutive same source: 2
  Distribution balanced: YES
  Expected per source: 2.5
  Unique titles: 18/20
  Unique verses: 19/20

💡 RECOMMENDATIONS:
  ✅ Randomization appears to be working well!
```

## Troubleshooting

### Common Issues

1. **All requests fail**
   - Check if the development server is running
   - Verify API endpoint is accessible
   - Check network connectivity

2. **Low source diversity**
   - Verify GCS bucket has multiple scripture folders
   - Check if `getAllAvailableGretilSources()` is working
   - Review source selection logic

3. **High repetition**
   - Check random number generation
   - Verify source filtering logic
   - Review diversity selection algorithm

4. **Unbalanced distribution**
   - Check if some sources have more content
   - Verify source availability
   - Review weighting algorithms

## Integration with Existing Logging

The test harness works alongside the diagnostic logging added to:
- `src/app/api/todays-wisdom/route.ts`
- `src/lib/services/gretilWisdomService.ts`
- `src/lib/services/crossCorpusWisdomService.ts`

The server logs will show detailed extraction paths while the test harness provides statistical analysis of the results.

## Customization

### Modify Test Parameters
```javascript
// Change number of tests
for (let i = 0; i < 50; i++) { // Test 50 times instead of 20

// Change delay between requests
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

// Test specific source
body: JSON.stringify({ sourceName: 'Bhagvad_Gita' })
```

### Add Custom Analysis
```javascript
// Add custom metrics
const customMetric = results.filter(r => r.textType === 'Philosophical').length;
console.log(`Philosophical texts: ${customMetric}/20`);
```

## Best Practices

1. **Run tests during low-traffic periods** to avoid overwhelming the server
2. **Use appropriate delays** between requests (100-500ms)
3. **Monitor server logs** while running tests for complete picture
4. **Run multiple test cycles** to verify consistency
5. **Test both random and user-specified selections**

## Next Steps

After running the test harness:
1. Review the analysis results
2. Check server logs for any errors
3. Investigate any warnings or recommendations
4. Adjust randomization algorithms if needed
5. Re-run tests to verify improvements
