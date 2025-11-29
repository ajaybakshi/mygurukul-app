import { NextResponse } from 'next/server';
import { getLibraryStats } from '@/utils/libraryStats';

export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  try {
    const stats = await getLibraryStats();

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Failed to generate library stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch library stats',
        totalScriptures: 0,
        totalCategories: 0,
        categoryNames: [],
        scriptureTypes: []
      },
      { status: 500 }
    );
  }
}

