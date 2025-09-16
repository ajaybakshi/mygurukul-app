/**
 * Test Epic Extraction API
 * Debug and test the EPIC logical unit extractor
 */

import { NextRequest, NextResponse } from 'next/server';
import { gretilWisdomService } from '../../../lib/services/gretilWisdomService';
import { epicLogicalUnitExtractor } from '../../../lib/services/extractors/epicLogicalUnitExtractor';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Epic Extraction Logic');

    // Test with Valmiki Ramayana
    const filename = 'Valmiki_Ramayana.txt';

    // Get the actual content from GCS
    const wisdom = await gretilWisdomService.extractWisdomFromGretilSource(filename);

    if (!wisdom) {
      return NextResponse.json({
        error: 'Could not extract wisdom from Ramayana'
      }, { status: 404 });
    }

    // Now test epic extraction directly
    console.log('🎭 Testing epic extractor directly...');

    // We need to get the full content, not just the extracted wisdom
    // For now, let's create a mock content based on what we know about Ramayana structure
    const mockRamayanaContent = `# Header
## Title: Valmiki Ramayana
# Text
// Ram_2,1.1 rāma rāma mahābāho śṛṇu me vacanaṃ priyam
// Ram_2,1.2 uvāca rāmaḥ paramadharmaṃ śṛṇu me mātulātmaja
// Ram_2,1.3 na me 'sti gurus te putraḥ kathaṃ sītāṃ parityajet
// Ram_2,1.4 uvāca vasiṣṭhaḥ dharmajñaḥ śṛṇu rāma mahāmate
// Ram_2,1.5 rājā dharmaṃ puraskṛtya na śaknoti hi dātum
// Ram_2,1.6 tasmāt sītā parityaktā bhavatā raghunandana

// Ram_2,2.1 tataḥ sītāṃ parityajya rāmaḥ śokaparāyaṇaḥ
// Ram_2,2.2 jagāma daṇḍakāraṇyaṃ saha lakṣmaṇena vai
// Ram_2,2.3 tatra sītāṃ parityajya vane lakṣmaṇam eva ca
// Ram_2,2.4 dadarśa sītāṃ rāmaḥ tu tapasā dīptatejasam

// Ram_2,3.1 uvāca sītā tapovanāśramasthā
// Ram_2,3.2 rāma rāma mahābāho kimarthaṃ māṃ parityajasi
// Ram_2,3.3 ahaṃ te priyatamā bhāryā kathaṃ māṃ tvaṃ parityajasi
// Ram_2,3.4 uvāca rāmaḥ śokārtas tapasvinīm sītāṃ
// Ram_2,3.5 na me doṣo 'sti kausalye śṛṇu me vacanaṃ satyam
`;

    const epicUnit = epicLogicalUnitExtractor.extractLogicalUnit(mockRamayanaContent, filename);

    const result = {
      filename,
      originalWisdom: {
        sanskrit: wisdom.sanskrit,
        reference: wisdom.reference,
        textName: wisdom.textName
      },
      epicExtraction: epicUnit ? {
        sanskrit: epicUnit.sanskrit,
        reference: epicUnit.reference,
        narrativeType: epicUnit.narrativeType,
        verseCount: epicUnit.verseRange.count,
        verses: epicUnit.verses
      } : null,
      mockContentUsed: true,
      testContent: mockRamayanaContent
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Epic extraction test error:', error);
    return NextResponse.json(
      {
        error: 'Epic extraction test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
