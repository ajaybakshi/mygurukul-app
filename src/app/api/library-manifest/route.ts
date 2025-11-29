import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MANIFEST_URL = 'https://storage.googleapis.com/mygurukul-sacred-texts-corpus/Gurukul_Library/library_manifest.json';

// Local fallback path for development
const LOCAL_MANIFEST_PATH = path.join(process.cwd(), 'Gurukul_Library', 'library_manifest.json');

export async function GET() {
  try {
    console.log('[API] Fetching library manifest from:', MANIFEST_URL);
    
    const response = await fetch(MANIFEST_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] Response status:', response.status, response.statusText);
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error('[API] Manifest fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500),
      });
      
      // Try local fallback in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Attempting local fallback...');
        try {
          if (fs.existsSync(LOCAL_MANIFEST_PATH)) {
            const localData = JSON.parse(fs.readFileSync(LOCAL_MANIFEST_PATH, 'utf-8'));
            console.log('[API] Using local fallback, found', localData.length, 'scriptures');
            return NextResponse.json(localData);
          }
        } catch (localError) {
          console.error('[API] Local fallback failed:', localError);
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch library manifest',
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    // Get response text first to check for encoding issues
    const responseText = await response.text();
    console.log('[API] Response received, length:', responseText.length);
    console.log('[API] First 200 chars:', responseText.substring(0, 200));
    
    // Validate JSON structure
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[API] JSON parse error:', {
        message: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
        responsePreview: responseText.substring(0, 500),
      });
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Validate data structure
    if (!Array.isArray(data)) {
      console.error('[API] Invalid data structure: expected array, got:', typeof data);
      throw new Error('Library manifest must be an array');
    }

    console.log(`[API] Successfully parsed manifest with ${data.length} scriptures`);
    
    if (data.length > 0) {
      console.log('[API] First scripture:', {
        id: data[0].id,
        title: data[0].title,
        editions: data[0].editions?.length || 0,
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    };
    
    console.error('[API] Critical error fetching library manifest:', errorDetails);
    
    // Try local fallback on any error in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Attempting local fallback after error...');
      try {
        if (fs.existsSync(LOCAL_MANIFEST_PATH)) {
          const localData = JSON.parse(fs.readFileSync(LOCAL_MANIFEST_PATH, 'utf-8'));
          console.log('[API] Using local fallback, found', localData.length, 'scriptures');
          return NextResponse.json(localData);
        }
      } catch (localError) {
        console.error('[API] Local fallback failed:', localError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching manifest',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
