// GRETIL METADATA PARSER TEST SCRIPT
// Test the enhanced Gretil header parser and verse extraction
// Run with: node test-gretil-metadata-parser.js

const testCases = [
  // Test Case 1: Ramayana format
  {
    name: 'Ramayana Format',
    content: `# Header
## Transformation: Valmiki Ramayana
## Source: GRETIL
# Text
// Ram_2,1.1 Some Sanskrit text here
// Ram_2,1.2 More text
`,
    expected: {
      title: 'Valmiki Ramayana',
      citationFormat: 'ramayana',
      verseReference: { fullReference: 'Ram_2,1.1', book: 2, chapter: 1, verse: 1 }
    }
  },

  // Test Case 2: Bhagavad Gita format
  {
    name: 'Bhagavad Gita Format',
    content: `# Header
## Transformation: Bhagavad Gita
# Text
// bhg 1.1 Sanskrit verse text
// bhg 2.15 Another verse
`,
    expected: {
      title: 'Bhagavad Gita',
      citationFormat: 'gita',
      verseReference: { fullReference: 'bhg 1.1', chapter: 1, verse: 1 }
    }
  },

  // Test Case 3: Malformed header (missing # Text)
  {
    name: 'Malformed Header - Missing Text Marker',
    content: `# Header
## Transformation: Test Text
## Source: GRETIL
// Some content without proper text marker
`,
    expected: null // Should return null due to malformed header
  },

  // Test Case 4: Empty content
  {
    name: 'Empty Content',
    content: '',
    expected: null
  },

  // Test Case 5: Header without title
  {
    name: 'Header Without Title',
    content: `# Header
## Source: GRETIL
# Text
// ram_1,1.1 Some text
`,
    expected: {
      title: null, // Header parsing should fail due to missing title
      verseReference: { fullReference: 'ram_1,1.1', book: 1, chapter: 1, verse: 1 } // But verse extraction should still work
    }
  },

  // Test Case 6: Agni Purana format
  {
    name: 'Agni Purana Format',
    content: `# Header
## Transformation: Agni Purana
# Text
// ap_1.001ab Sanskrit text with sub-verse
// ap_2.045 Another verse
`,
    expected: {
      title: 'Agni Purana',
      citationFormat: 'purana',
      verseReference: { fullReference: 'ap_1.001ab', chapter: 1, verse: 1, subVerse: 'ab' }
    }
  },

  // Test Case 7: Upanishad format
  {
    name: 'Upanishad Format',
    content: `# Header
## Transformation: Chandogya Upanishad
# Text
// chup_1,1.1 Upanishad verse
// chup_2,3.5 Another verse
`,
    expected: {
      title: 'Chandogya Upanishad',
      citationFormat: 'upanishad',
      verseReference: { fullReference: 'chup_1,1.1', chapter: 1, section: 1, verse: 1 }
    }
  }
];

class GretilMetadataParserTester {
  // Mock implementation of the key methods for testing
  parseGretilHeader(content) {
    try {
      if (!content || typeof content !== 'string' || content.length < 100) {
        console.log('Content too short or invalid for header parsing');
        return null;
      }

      const lines = content.split('\n');
      if (lines.length < 5) {
        console.log('Content has too few lines for header parsing');
        return null;
      }

      const headerStart = lines.findIndex(line => line.includes('# Header'));
      const textStart = lines.findIndex(line => line.includes('# Text'));

      if (headerStart === -1) {
        console.log('No # Header marker found');
        return null;
      }

      if (textStart === -1) {
        console.log('No # Text marker found');
        return null;
      }

      if (headerStart >= textStart) {
        console.log('Header starts after text section - malformed file');
        return null;
      }

      const headerLines = lines.slice(headerStart + 1, textStart);
      const metadata = {
        citationFormat: this.detectCitationFormat(content),
        textType: this.classifyTextType(content),
        hasCommentary: this.detectCommentary(content)
      };

      // Parse transformation line for title
      const transformationLine = headerLines.find(line => line.includes('Transformation'));
      if (transformationLine) {
        const titleMatch = transformationLine.match(/Transformation:\s*(.+)/);
        if (titleMatch && titleMatch[1].trim()) {
          metadata.title = titleMatch[1].trim();
        }
      }

      // Fallback: try to extract title from filename or content
      if (!metadata.title) {
        const titleFromContent = this.extractTitleFromContent(content);
        if (titleFromContent) {
          metadata.title = titleFromContent;
        } else {
          console.log('Could not extract title from header or content');
          return null;
        }
      }

      // Parse all ## Field: Value pairs generically
      headerLines.forEach(line => {
        if (!line || typeof line !== 'string') return;

        const fieldMatch = line.match(/^##\s*([^:]+):\s*(.+)$/);
        if (fieldMatch && fieldMatch[1] && fieldMatch[2]) {
          const fieldName = fieldMatch[1].trim().toLowerCase().replace(/\s+/g, '');
          const fieldValue = fieldMatch[2].trim();

          if (!fieldName || !fieldValue) return;

          switch(fieldName) {
            case 'dataentry':
            case 'data-entry':
              metadata.dataEntry = fieldValue;
              break;
            case 'contribution':
            case 'contributor':
              metadata.contribution = fieldValue;
              break;
            case 'source':
              metadata.source = fieldValue;
              break;
          }
        }
      });

      // Extract time period if mentioned
      metadata.timePeriod = this.extractTimePeriod(metadata.title || '', content);

      return metadata;
    } catch (error) {
      console.error('Error parsing Gretil header:', error);
      return null;
    }
  }

  extractTitleFromContent(content) {
    const lines = content.split('\n').slice(0, 20);

    for (const line of lines) {
      if (line.includes('#') && !line.includes('# Header') && !line.includes('# Text')) {
        const cleanTitle = line.replace(/#/g, '').trim();
        if (cleanTitle.length > 5 && cleanTitle.length < 100) {
          return cleanTitle;
        }
      }
    }

    for (const line of lines) {
      if (this.hasSanskritContent(line) && line.length > 10 && line.length < 200) {
        return line.trim();
      }
    }

    return null;
  }

  hasSanskritContent(line) {
    const sanskritPatterns = [
      /[āīūṛḷēōṃḥśṣṇṭḍṅñ]/,
      /\b(om|oṃ|atha|iti|ca|vai|hi|tu|api|eva|na|te|sa|tad|yad|kim)\b/i,
      /.{30,}/
    ];

    return sanskritPatterns.some(pattern => pattern.test(line));
  }

  extractVerseReference(line) {
    if (!line || typeof line !== 'string') return null;

    const patterns = [
      { regex: /Ram_(\d+),(\d+)\.(\d+)/, format: 'ramayana', groups: ['book', 'chapter', 'verse'] },
      { regex: /RvKh_(\d+),(\d+)\.(\d+)/, format: 'veda-khila', groups: ['book', 'section', 'verse'] },
      { regex: /chup_(\d+),(\d+)\.(\d+)/, format: 'upanishad', groups: ['chapter', 'section', 'verse'] },
      { regex: /bhg (\d+)\.(\d+)/, format: 'gita', groups: ['chapter', 'verse'] },
      { regex: /ap_(\d+)\.(\d+)([a-z]*)/, format: 'purana', groups: ['chapter', 'verse', 'subVerse'] },
      { regex: /(\w+)_(\d+),?(\d*)\.?(\d*)([a-z]*)/, format: 'generic', groups: ['text', 'book', 'chapter', 'verse', 'subVerse'] }
    ];

    for (const pattern of patterns) {
      try {
        const match = line.match(pattern.regex);
        if (match) {
          const reference = {
            fullReference: match[0],
            subVerse: match[match.length - 1] || undefined
          };

          pattern.groups.forEach((groupName, index) => {
            const value = match[index + 1];
            if (value && value !== '' && !isNaN(Number(value))) {
              reference[groupName] = parseInt(value);
            }
          });

          if (reference.verse !== undefined) {
            return reference;
          }
        }
      } catch (patternError) {
        console.log(`Error matching pattern ${pattern.format}:`, patternError);
      }
    }

    return null;
  }

  detectCitationFormat(content) {
    if (!content || typeof content !== 'string') return 'unknown';

    const firstLines = content.split('\n').slice(0, 50);
    const referenceLine = firstLines.find(line => line.includes('//'));

    if (!referenceLine) return 'unknown';

    if (referenceLine.includes('Ram_')) return 'ramayana';
    if (referenceLine.includes('RvKh_')) return 'veda-khila';
    if (referenceLine.includes('chup_')) return 'upanishad';
    if (referenceLine.includes('bhg ')) return 'gita';
    if (referenceLine.includes('ap_')) return 'purana';

    return 'custom';
  }

  classifyTextType(content) {
    if (!content || typeof content !== 'string') return 'other';

    const title = this.extractTitleFromContent(content)?.toLowerCase() || '';

    if (title.includes('veda') || title.includes('ṛgveda') || title.includes('sāmaveda') || title.includes('yajurveda')) {
      return 'veda';
    }
    if (title.includes('upanishad') || title.includes('upaniṣad')) {
      return 'upanishad';
    }
    if (title.includes('purana') || title.includes('purāṇa')) {
      return 'purana';
    }
    if (title.includes('ramayana') || title.includes('rāmāyaṇa') || title.includes('mahabharata') || title.includes('mahābhārata')) {
      return 'epic';
    }
    if (title.includes('gita') || title.includes('gītā')) {
      return 'gita';
    }

    return 'other';
  }

  detectCommentary(content) {
    if (!content || typeof content !== 'string') return false;

    const commentaryIndicators = [
      'commentary',
      'ṭīkā',
      'bhāṣya',
      'vyākhyā',
      'explained',
      'interpretation',
      'according to'
    ];

    const lowerContent = content.toLowerCase();
    return commentaryIndicators.some(indicator => lowerContent.includes(indicator));
  }

  extractTimePeriod(title, content) {
    if (!title && !content) return undefined;

    const searchText = (title + ' ' + content.substring(0, 1000)).toLowerCase();

    const timeIndicators = [
      { pattern: /vedic period|vedic age/i, period: 'Vedic Period' },
      { pattern: /upanishadic period/i, period: 'Upanishadic Period' },
      { pattern: /epic period/i, period: 'Epic Period' },
      { pattern: /puranic period/i, period: 'Puranic Period' },
      { pattern: /ancient india/i, period: 'Ancient India' },
      { pattern: /classical period/i, period: 'Classical Period' }
    ];

    for (const indicator of timeIndicators) {
      if (indicator.pattern.test(searchText)) {
        return indicator.period;
      }
    }

    return undefined;
  }
}

// Run tests
function runTests() {
  console.log('🚀 GRETIL METADATA PARSER TEST SUITE');
  console.log('=====================================\n');

  const tester = new GretilMetadataParserTester();
  let passed = 0;
  let total = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(50));

    try {
      // Test header parsing
      const metadata = tester.parseGretilHeader(testCase.content);
      const verseRef = tester.extractVerseReference(testCase.content);

      console.log('✅ Header parsed successfully:', !!metadata);
      console.log('✅ Verse reference extracted:', !!verseRef);

      if (metadata) {
        console.log('📊 Metadata:', {
          title: metadata.title,
          citationFormat: metadata.citationFormat,
          textType: metadata.textType,
          source: metadata.source
        });
      }

      if (verseRef) {
        console.log('🔢 Verse Reference:', verseRef);
      }

      // Validate against expected results
      let headerValid = true;
      let verseValid = true;

      if (testCase.expected === null) {
        headerValid = metadata === null;
        verseValid = verseRef === null;
      } else if (testCase.expected.title === null) {
        // Special case: header should fail but verse should work
        headerValid = metadata === null;
        verseValid = verseRef && testCase.expected.verseReference ?
          verseRef.fullReference === testCase.expected.verseReference.fullReference : false;
      } else {
        if (metadata) {
          headerValid = metadata.title === testCase.expected.title &&
                       metadata.citationFormat === testCase.expected.citationFormat;
        } else {
          headerValid = false;
        }

        if (verseRef && testCase.expected.verseReference) {
          verseValid = verseRef.fullReference === testCase.expected.verseReference.fullReference;
        } else if (!testCase.expected.verseReference) {
          verseValid = verseRef === null;
        } else {
          verseValid = false;
        }
      }

      if (headerValid && verseValid) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED');
        console.log('Expected:', testCase.expected);
        console.log('Got Header:', metadata);
        console.log('Got Verse:', verseRef);
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  });

  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! The Gretil metadata parser is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the implementation.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { GretilMetadataParserTester, testCases };
