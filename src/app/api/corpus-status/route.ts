import { NextRequest, NextResponse } from 'next/server';
import { corpusChecker } from '@/lib/services/corpusChecker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloudFolderPath } = body;
    
    if (!cloudFolderPath) {
      return NextResponse.json(
        { error: 'cloudFolderPath is required' },
        { status: 400 }
      );
    }
    
    console.log(`API: Checking corpus status for: ${cloudFolderPath}`);
    const status = await corpusChecker.checkCorpusAvailability(cloudFolderPath);
    
    return NextResponse.json({
      success: true,
      cloudFolderPath,
      status
    });
    
  } catch (error) {
    console.error('Corpus status API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check corpus status',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}
