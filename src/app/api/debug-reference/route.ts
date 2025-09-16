import { NextResponse } from 'next/server';
import { crossCorpusWisdomService } from '../../../lib/services/crossCorpusWisdomService';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
function initializeStorage() {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return new Storage();
    }

    if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      const credentials = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      };

      return new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials
      });
    }

    throw new Error('Google Cloud Storage credentials not found');
  } catch (error) {
    console.error('Error initializing Google Cloud Storage:', error);
    throw error;
  }
}

// Get all files from a folder in the bucket
async function getAllFilesFromFolder(folderName: string): Promise<{ fileName: string; content: string }[]> {
  try {
    const storage = initializeStorage();
    const bucketName = 'mygurukul-sacred-texts-corpus';
    const bucket = storage.bucket(bucketName);

    const [files] = await bucket.getFiles({
      prefix: folderName + '/',
    });

    console.log(`Found ${files.length} files in ${folderName} folder`);

    const fileContents = [];

    for (const file of files) {
      try {
        if (file.name.endsWith('.txt') || file.name.endsWith('.json')) {
          const [data] = await file.download();
          const content = data.toString('utf8');

          if (content.length > 100) {
            fileContents.push({
              fileName: file.name,
              content: content
            });
          }
        }
      } catch (fileError) {
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
        console.warn(`Skipping file ${file.name}:`, errorMessage);
      }
    }

    console.log(`Successfully loaded ${fileContents.length} files from ${folderName}`);
    return fileContents;

  } catch (error) {
    console.error('Error accessing folder in Google Cloud Storage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve files from ${folderName}: ${errorMessage}`);
  }
}

export async function GET() {
  try {
    // Simple test - just check Gretil sources
    const files = await getAllFilesFromFolder('Gretil_Originals');

    return NextResponse.json({
      debug: 'Working',
      filesFound: files.length,
      sampleFile: files[0]?.fileName || 'None'
    });

  } catch (error) {
    return NextResponse.json({
      debug: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
