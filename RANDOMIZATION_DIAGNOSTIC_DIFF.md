# Randomization Diagnostic Logging - Diff

## 1. Enhanced Today's Wisdom API Route (`src/app/api/todays-wisdom/route.ts`)

### Current State (lines 522-574):
```typescript
  console.log('=== RANDOMIZATION DIAGNOSTIC START ===');

  try {
    const body = await request.json();
    
    if (body.sourceName && body.sourceName.trim()) {
      // Traditional single-source selection (backward compatibility)
      sourceName = body.sourceName.trim();
      selectionMethod = 'user-specified';
      console.log(`Traditional source selection: ${sourceName}`);
    } else {
      // New GCS-first intelligent selection using gretilWisdomService
      console.log('Using GCS-first selection...');
      const gretilSources = await gretilWisdomService.getAllAvailableGretilSources();
      
      console.log('Available sources:', gretilSources.map(s => s.folderName));
      
      if (gretilSources.length > 0) {
        const randomIndex = Math.floor(Math.random() * gretilSources.length);
        const randomSource = gretilSources[randomIndex];
        sourceName = randomSource.folderName;
        selectedSourceInfo = {
          folderName: randomSource.folderName,
          displayName: randomSource.displayName,
          category: randomSource.category,
          selectionReason: 'random-gcs-selection'
        };
        selectionMethod = 'cross-corpus';
        console.log(`GCS-first selection: ${selectedSourceInfo.displayName} from ${selectedSourceInfo.category}`);
        console.log(`Random index used: ${randomIndex} out of ${gretilSources.length} sources`);
      } else {
        sourceName = 'Bhagvad_Gita';
        selectionMethod = 'user-specified';
        console.log('No GCS sources available, using fallback: Bhagvad_Gita');
      }
    }
    
    if (!sourceName) {
      console.log('No source selected, using fallback');
      sourceName = 'Ramayana';
      selectionMethod = 'user-specified';
    }
    
  } catch (requestError) {
    console.error('Error processing wisdom request:', requestError);
    sourceName = 'Ramayana';
    selectionMethod = 'user-specified';
  }

  console.log('Selected source:', sourceName);
  console.log('Selection method:', selectionMethod);
  console.log('Selected source info:', selectedSourceInfo);
```

### Enhanced Version:
```typescript
  console.log('=== RANDOMIZATION DIAGNOSTIC START ===');
  console.log('🕐 Request timestamp:', new Date().toISOString());
  console.log('📥 Request body:', body);

  try {
    const body = await request.json();
    
    if (body.sourceName && body.sourceName.trim()) {
      // Traditional single-source selection (backward compatibility)
      sourceName = body.sourceName.trim();
      selectionMethod = 'user-specified';
      console.log(`🎯 Traditional source selection: ${sourceName}`);
      console.log(`📋 Selection reason: User explicitly requested ${sourceName}`);
    } else {
      // New GCS-first intelligent selection using gretilWisdomService
      console.log('🔄 Using GCS-first selection...');
      console.log('📡 Calling gretilWisdomService.getAllAvailableGretilSources()...');
      
      const gretilSources = await gretilWisdomService.getAllAvailableGretilSources();
      
      console.log('📊 Available sources count:', gretilSources.length);
      console.log('📋 Available sources:', gretilSources.map(s => s.folderName));
      console.log('📋 Source details:', gretilSources.map(s => ({
        folder: s.folderName,
        display: s.displayName,
        category: s.category
      })));
      
      if (gretilSources.length > 0) {
        const randomIndex = Math.floor(Math.random() * gretilSources.length);
        const randomSource = gretilSources[randomIndex];
        
        console.log(`🎲 Random selection: index ${randomIndex} from ${gretilSources.length} sources`);
        console.log(`🎯 Selected source: ${randomSource.folderName}`);
        console.log(`📋 Source metadata:`, {
          displayName: randomSource.displayName,
          category: randomSource.category,
          textType: randomSource.textType
        });
        
        sourceName = randomSource.folderName;
        selectedSourceInfo = {
          folderName: randomSource.folderName,
          displayName: randomSource.displayName,
          category: randomSource.category,
          selectionReason: 'random-gcs-selection',
          randomIndex: randomIndex,
          totalSources: gretilSources.length
        };
        selectionMethod = 'cross-corpus';
        console.log(`✅ GCS-first selection complete: ${selectedSourceInfo.displayName} from ${selectedSourceInfo.category}`);
      } else {
        sourceName = 'Bhagvad_Gita';
        selectionMethod = 'user-specified';
        console.log('⚠️ No GCS sources available, using fallback: Bhagvad_Gita');
        console.log('📋 Fallback reason: No sources returned from gretilWisdomService');
      }
    }
    
    if (!sourceName) {
      console.log('⚠️ No source selected, using fallback');
      sourceName = 'Ramayana';
      selectionMethod = 'user-specified';
      console.log('📋 Final fallback reason: No source name determined');
    }
    
  } catch (requestError) {
    console.error('❌ Error processing wisdom request:', requestError);
    sourceName = 'Ramayana';
    selectionMethod = 'user-specified';
    console.log('📋 Error fallback: Using Ramayana due to request processing error');
  }

  console.log('🎯 FINAL SELECTION SUMMARY:');
  console.log('  Selected source:', sourceName);
  console.log('  Selection method:', selectionMethod);
  console.log('  Selected source info:', selectedSourceInfo);
  console.log('  Selection timestamp:', new Date().toISOString());
```

## 2. Enhanced Gretil Wisdom Service (`src/lib/services/gretilWisdomService.ts`)

### Current State (lines 287-295):
```typescript
      console.log('=== GRETIL SERVICE DIAGNOSTIC ===');
      console.log('File selected for extraction:', sourceName);
      console.log('Text type classified as:', textClassification.textType);

      let result: ExtractedWisdom | null = null;

      // Get source categorization for fallback display names
      const source = this.categorizeGretilText(sourceName);
```

### Enhanced Version:
```typescript
      console.log('=== GRETIL SERVICE DIAGNOSTIC ===');
      console.log('🕐 Extraction start timestamp:', new Date().toISOString());
      console.log('📁 File selected for extraction:', sourceName);
      console.log('📊 File size:', textContent.length, 'characters');
      console.log('🔍 Text type classified as:', textClassification.textType);
      console.log('📈 Classification confidence:', textClassification.confidence);
      console.log('📋 Classification details:', {
        textType: textClassification.textType,
        confidence: textClassification.confidence,
        fileName: sourceName,
        fileSize: textContent.length
      });

      let result: ExtractedWisdom | null = null;

      // Get source categorization for fallback display names
      const source = this.categorizeGretilText(sourceName);
      console.log('📂 Source categorization:', {
        folderName: source?.folderName,
        displayName: source?.displayName,
        category: source?.category,
        textType: source?.textType
      });
```

### Enhanced Extractor Selection (lines 297-307):
```typescript
      // Use specialized extractors for different text types
      if (textClassification.textType === GretilTextType.EPIC && (textClassification.confidence === 'HIGH' || textClassification.confidence === 'MEDIUM')) {
        console.log('🎭 Extractor selection: EpicLogicalUnitExtractor');
        console.log('📋 Selection criteria: EPIC text type with', textClassification.confidence, 'confidence');
        console.log(`🎭 Using EPIC logical unit extractor for ${sourceName} (${textClassification.confidence} confidence)`);
        
        const extractionStartTime = Date.now();
        const epicUnit = epicLogicalUnitExtractor.extractLogicalUnit(textContent, sourceName);
        const extractionTime = Date.now() - extractionStartTime;
        
        console.log('⏱️ Epic extraction time:', extractionTime, 'ms');
        
        if (epicUnit) {
          result = epicLogicalUnitExtractor.toExtractedWisdom(epicUnit, metadata?.title || source?.displayName || sourceName);
          console.log(`✅ EPIC extraction successful: ${epicUnit.verseRange.count} verses, ${epicUnit.narrativeType} type`);
          console.log('📊 Epic unit details:', {
            verseCount: epicUnit.verseRange.count,
            narrativeType: epicUnit.narrativeType,
            reference: epicUnit.reference,
            extractionTime: extractionTime
          });
        } else {
          console.log(`⚠️ EPIC extraction failed, falling back to standard extraction`);
          console.log('📋 Fallback reason: EpicLogicalUnitExtractor returned null');
        }
      }
```

### Enhanced Random Line Selection (lines 891-897):
```typescript
      // Select random verse
      const randomIndex = Math.floor(Math.random() * verses.length);
      const randomVerse = verses[randomIndex];
      const source = this.categorizeGretilText(fileName);
      
      console.log('🎲 Random line selection details:');
      console.log('  Total verses available:', verses.length);
      console.log('  Random index selected:', randomIndex);
      console.log('  Selected verse reference:', randomVerse.reference);
      console.log('  Selected verse index:', randomVerse.index);
      console.log('  Raw extracted content preview:', randomVerse.text.substring(0, 100));
      console.log('  Content length:', randomVerse.text.length, 'characters');
      console.log('  Selection timestamp:', new Date().toISOString());
```

## 3. Simple Test Script (`simple-randomization-test.js`)

### New File:
```javascript
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
```

## Summary of Changes

### 1. Today's Wisdom API Route Enhancements:
- Added request timestamp and body logging
- Enhanced source selection logging with detailed metadata
- Added random index tracking and source details
- Added fallback reason logging
- Added final selection summary with timestamp

### 2. Gretil Wisdom Service Enhancements:
- Added extraction start timestamp
- Enhanced file and classification logging
- Added source categorization details
- Enhanced extractor selection with criteria and timing
- Added detailed random line selection logging
- Added content preview and length tracking

### 3. Simple Test Script:
- Creates a lightweight test that makes 20 API calls
- Logs key information for each call
- Provides summary statistics
- Shows source distribution

These changes will provide comprehensive visibility into the entire randomization pipeline from source selection through content extraction.
