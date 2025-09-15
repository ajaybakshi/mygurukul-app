/**
 * Sample Content API - Show actual content from GCS files
 */

import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'Bhagvad_Gita.txt';
    const lines = parseInt(searchParams.get('lines') || '100');

    console.log(`📖 Sampling raw content from: ${filename} (${lines} lines)`);

    // Initialize storage directly to access raw file content
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    const bucketName = 'mygurukul-sacred-texts-corpus';
    const filePath = `Gretil_Originals/${filename}`;
    const file = storage.bucket(bucketName).file(filePath);

    try {
      const [content] = await file.download();
      const textContent = content.toString('utf-8');

      // Split into lines and show structure
      const allLines = textContent.split('\n');
      const sampleLines = allLines.slice(0, lines);

      // Find header boundaries
      const headerStart = allLines.findIndex(line => line.includes('# Header'));
      const textStart = allLines.findIndex(line => line.includes('# Text'));

      return NextResponse.json({
        filename,
        filePath,
        totalLines: allLines.length,
        totalCharacters: textContent.length,
        headerStartIndex: headerStart,
        textStartIndex: textStart,
        firstLines: sampleLines,
        hasHeaderMarker: headerStart !== -1,
        hasTextMarker: textStart !== -1,
        sampleContent: textContent.substring(0, 2000),
        structureAnalysis: {
          headerSection: headerStart !== -1 ? allLines.slice(headerStart, Math.min(headerStart + 20, allLines.length)) : 'No header marker found',
          textSection: textStart !== -1 ? allLines.slice(textStart, Math.min(textStart + 20, allLines.length)) : 'No text marker found'
        }
      });

    } catch (fileError) {
      return NextResponse.json({
        error: 'File not found',
        filename,
        filePath,
        availableFiles: await getAvailableFiles(storage, bucketName),
        message: `Could not access ${filePath}`
      }, { status: 404 });
    }

  } catch (error) {
    console.error('💥 Sample content error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sample content',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getAvailableFiles(storage: Storage, bucketName: string): Promise<string[]> {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'Gretil_Originals/' });
    return files.map(file => file.name).filter(name => name.endsWith('.txt')).slice(0, 10);
  } catch (error) {
    return [];
  }
}
