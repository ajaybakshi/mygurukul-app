/**
 * Audio Rendition API Endpoint
 * DEPRECATED: Audio is now served directly as data URLs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { renditionId: string } }
) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated',
      message: 'Audio is now served directly as data URLs from the generation endpoint'
    },
    { status: 410 }
  );
}


/**
 * Handle HEAD requests for audio metadata
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { renditionId: string } }
) {
  try {
    const { renditionId } = params;
    
    if (!renditionId) {
      return new NextResponse(null, { status: 400 });
    }

    const gcsService = AudioGcsStorageService.getInstance();
    
    if (gcsService.isAvailable()) {
      const gcsResult = await gcsService.getAudioRendition(renditionId);
      if (gcsResult) {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Content-Type': `audio/${gcsResult.rendition.format}`,
            'Content-Length': gcsResult.audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-Audio-Duration': gcsResult.rendition.duration.toString(),
            'X-Audio-Quality': gcsResult.rendition.quality,
            'X-Audio-Language': gcsResult.rendition.metadata.language,
            'X-Audio-Voice': gcsResult.rendition.metadata.voice
          }
        });
      }
    }

    return new NextResponse(null, { status: 404 });

  } catch (error) {
    console.error('❌ Error in HEAD request:', error);
    return new NextResponse(null, { status: 500 });
  }
}

