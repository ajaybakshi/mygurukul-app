# Discovery Engine Slice Error Debug Log

## 1. Exact Error Message
```
VERSE_RETRIEVAL_FAILED: Failed to retrieve relevant verses
```

**Location**: Line 605 in CollectorService.js
```javascript
throw new CollectorError('VERSE_RETRIEVAL_FAILED', 'Failed to retrieve relevant verses', error);
```

**Root Cause**: The error originates from the `simulateVerseRetrieval` method which calls `retrieveVersesFromDiscoveryEngine`. The actual failure point is in the response parsing logic.

## 2. Line 605 Analysis in CollectorService.js

**Context**: Line 605 is within the error handling block of the `retrieveVerses` method:

```javascript:589:607:/Users/AJ/Desktop/mygurukul-app/agents/sanskrit-collector/CollectorService.js
async retrieveVerses(semantics, { correlationId, question }) {
  try {
    logger.info('Starting verse retrieval', { correlationId });

    // Simulate RAG retrieval - in production, this would call Discovery Engine
    const verses = await this.simulateVerseRetrieval(semantics, question);

    logger.info('Verse retrieval completed', { 
      correlationId,
      verseCount: verses.length
    });

    return verses;

  } catch (error) {
    logger.error('Verse retrieval failed', { correlationId, error: error.message });
    throw new CollectorError('VERSE_RETRIEVAL_FAILED', 'Failed to retrieve relevant verses', error);
  }
}
```

**Issue**: The `simulateVerseRetrieval` method delegates to `retrieveVersesFromDiscoveryEngine`, which fails during response parsing.

## 3. Expected vs Actual Discovery Engine Response Format

### Expected Format (from working JSONL files):
```json
{
  "id": "Upanishads_verse_1",
  "verse_number": 1,
  "uri": "gs://mygurukul-sacred-texts-corpus/Processed_Documents/Upanishads/Upanishads_verse_1.txt",
  "gcs_path": "gs://your-bucket/Upanishads/Upanishads_verse_1.txt",
  "lemmas": ["oṃ", "vāk", "mad", "manas", "pratiṣṭhā"],
  "verified": true,
  "word_count": 12,
  "iast_content": "oṃ vāk mad manas pratiṣṭhā manas mad vāc pratiṣṭhā āvirāv mā as"
}
```

### Actual Response Format (from API logs):
```json
{
  "answer": {
    "state": "SUCCEEDED",
    "answerText": "A summary could not be generated for your search query. Here are some search results.",
    "steps": [
      {
        "state": "SUCCEEDED",
        "actions": [
          {
            "searchAction": {
              "query": "What are the places in \"rudrasya auṣadhi śakti\"?"
            },
            "observation": {}
          }
        ]
      }
    ],
    "answerSkippedReasons": ["OUT_OF_DOMAIN_QUERY_IGNORED"]
  }
}
```

**Key Issue**: The `observation` objects in the actual responses are **empty** (`{}`), while the code expects them to contain `searchResults` with `content`, `text`, or `snippetInfo` fields.

## 4. Working TXT File Format Confirmed

### File Structure:
- **Individual verse files**: Each verse is stored as a separate `.txt` file
- **Metadata format**: JSONL files contain structured metadata with:
  - `id`: Unique verse identifier
  - `uri`: Google Cloud Storage path
  - `gcs_path`: Alternative storage path
  - `iast_content`: Sanskrit text in IAST transliteration
  - `lemmas`: Word-level analysis
  - `word_count`: Character/word count
  - `verified`: Quality flag

### Expected Processing Flow:
1. Discovery Engine returns search results with verse URIs
2. Parser extracts content from individual verse files
3. Content is split into lines using `\n` delimiter
4. Each line becomes a potential verse with metadata mapping

### Current Issue Location:
The slice error likely occurs in `parseVerseLevelContent` method around line 1568:

```javascript:1563:1570:/Users/AJ/Desktop/mygurukul-app/agents/sanskrit-collector/CollectorService.js
// Split multi-line content by lines
const lines = contentText.split('\n').filter(line => line.trim());

logger.info('📖 Parsing verse-level content', {
  totalLines: lines.length,
  preview: lines.slice(0, 3).join(' | ')  // <-- POTENTIAL SLICE ERROR HERE
});
```

**Potential Fix**: Add safety check before slice operation:
```javascript
preview: lines.length > 0 ? lines.slice(0, Math.min(3, lines.length)).join(' | ') : 'No lines found'
```

## 5. Recommended Debugging Steps

1. **Add null/undefined checks** before all slice operations
2. **Validate response structure** before parsing
3. **Add fallback handling** for empty observation objects
4. **Implement response format normalization**
5. **Add detailed logging** for response structure analysis

## 6. Environment Variables Status
- `GOOGLE_CLOUD_PROJECT_ID`: ✅ Confirmed present
- `GOOGLE_CLOUD_CLIENT_EMAIL`: ✅ Confirmed present
- `GOOGLE_CLOUD_PRIVATE_KEY`: ✅ Confirmed present
- `GOOGLE_DISCOVERY_ENGINE_ENDPOINT`: ✅ Confirmed present

**Next Action**: Implement defensive programming in `parseDiscoveryEngineResponse` method to handle empty observation objects gracefully.
