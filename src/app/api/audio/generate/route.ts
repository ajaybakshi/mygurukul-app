/**
 * Audio Generation API Endpoint
 * Generates audio using ElevenLabs TTS service
 * Integrates with Sanskrit processing pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { SanskritCleanupService } from '../../../../lib/services/sanskritCleanupService';
import { TransliterationService } from '../../../../lib/services/transliterationService';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { text, language, voice, speed, pitch, format, quality } = body;

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    console.log(`🎵 Generating audio for text: "${text.substring(0, 50)}..."`);

    // Process text through Sanskrit pipeline
    let processedText = text.trim();
    if (language === 'sanskrit' || language === 'sa') {
      // Apply Sanskrit cleanup
      const cleaned = SanskritCleanupService.cleanForAudio(processedText, 'unknown');
      console.log(`🔍 After cleanup: "${cleaned.cleanedText}"`);
      
      // Apply transliteration
      const transliterated = TransliterationService.transliterate(cleaned.cleanedText, {
        devanagariPreferred: true,
        preserveNumbers: true,
        handleMixed: true
      });
      console.log(`🔍 After transliteration: "${transliterated.result}"`);
      
      processedText = transliterated.result;
    }

    // Generate audio directly with ElevenLabs API
    const ttsRequest = {
      text: processedText,
      voice_id: voice || 'FVlJRjSBkHratGRXBKRG',
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      },
      pronunciation_dictionary_locators: [],
      speed: 0.125,
      output_format: 'mp3_44100_128'
    };

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + ttsRequest.voice_id, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify(ttsRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}` },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const processingTime = Date.now() - startTime;
    
    // Return audio data directly as base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
      renditionId: `direct_${Date.now()}`,
      duration: Math.round(audioBuffer.byteLength / 16000),
      format: 'mp3',
      quality: 'medium',
      processingTime,
      metadata: {
        text: text.trim(),
        language: language || 'sanskrit',
        voice: voice || 'FVlJRjSBkHratGRXBKRG',
        source: 'elevenlabs-direct',
      }
    });

  } catch (error) {
    console.error('❌ Audio generation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

