import { fetchLibraryManifest, getOrganizedLibrary } from '@/lib/libraryService';
import type { Scripture, Category } from '@/types/library';
import { categoryService } from '@/lib/database/categoryService';

// GCS manifest URL - used for server-side fetching
const MANIFEST_URL = 'https://storage.googleapis.com/mygurukul-sacred-texts-corpus/Gurukul_Library/library_manifest.json';

export interface LibraryStats {
  totalScriptures: number;
  totalCategories: number;
  categoryNames: string[];
  scriptureTypes: string[];
}

/**
 * Extracts unique scripture types from the manifest
 * Scripture types are derived from the 'class' field in Scripture objects
 */
function extractScriptureTypes(scriptures: Scripture[]): string[] {
  const types = new Set<string>();

  scriptures.forEach(scripture => {
    // Extract type from the 'class' field
    if (scripture.class) {
      // Clean and normalize the class name
      const className = scripture.class.trim();
      if (className) {
        types.add(className);
      }
    }
  });

  return Array.from(types).sort();
}

/**
 * Fallback stats using categoryService when GCS fetch fails
 */
function getFallbackStats(): LibraryStats {
  try {
    const categories = categoryService.getCategories();
    const allTexts = categoryService.getAllTexts();
    const availableTexts = allTexts.filter(text => text.status === 'available');

    // Common scripture types based on categoryService structure
    const scriptureTypes = ['Vedas', 'Upanishads', 'Puranas', 'Itihasa', 'Sutras', 'Shastras'];

    return {
      totalScriptures: availableTexts.length,
      totalCategories: categories.length,
      categoryNames: categories.map(cat => cat.name),
      scriptureTypes
    };
  } catch (error) {
    console.error('Error in fallback stats:', error);
    // Ultimate fallback
    return {
      totalScriptures: 0,
      totalCategories: 0,
      categoryNames: [],
      scriptureTypes: []
    };
  }
}

/**
 * Server-side function to fetch manifest directly from GCS
 * Use this in API routes instead of fetchLibraryManifest() which uses relative URLs
 */
async function fetchManifestFromGCS(): Promise<Scripture[]> {
  try {
    const response = await fetch(MANIFEST_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[LibraryStats] GCS fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: Scripture[] = await response.json();
    console.log(`[LibraryStats] Successfully fetched ${data.length} scriptures from GCS`);
    return data;
  } catch (error) {
    console.error('[LibraryStats] Error fetching from GCS:', error);
    return [];
  }
}

/**
 * Fetches and calculates library statistics from the manifest
 * Uses server-side GCS fetch when in API route context, falls back to categoryService if needed
 */
export async function getLibraryStats(): Promise<LibraryStats> {
  try {
    // Try server-side GCS fetch first (works in API routes)
    let manifest: Scripture[] = [];
    let organizedLibrary: Category[] = [];

    // Check if we're in a server context (API route)
    // In server context, fetch directly from GCS
    try {
      manifest = await fetchManifestFromGCS();
      
      if (manifest && manifest.length > 0) {
        // If we got data from GCS, organize it
        const categoryMap = new Map<string, Scripture[]>();
        manifest.forEach(scripture => {
          const existing = categoryMap.get(scripture.category) || [];
          existing.push(scripture);
          categoryMap.set(scripture.category, existing);
        });
        organizedLibrary = Array.from(categoryMap.entries()).map(
          ([name, scriptures]) => ({ name, scriptures })
        );
      }
    } catch (gcsError) {
      console.log('[LibraryStats] GCS fetch failed, trying API route...');
      // Fallback to API route (works in client components)
      try {
        manifest = await fetchLibraryManifest();
        organizedLibrary = await getOrganizedLibrary();
      } catch (apiError) {
        console.error('[LibraryStats] API route fetch also failed:', apiError);
      }
    }

    // If manifest is still empty, use fallback
    if (!manifest || manifest.length === 0) {
      console.log('[LibraryStats] Manifest is empty, using fallback stats from categoryService');
      return getFallbackStats();
    }

    // Calculate total scriptures
    const totalScriptures = manifest.length;

    // Get categories from organized library
    const categories: Category[] = organizedLibrary || [];
    const totalCategories = categories.length;
    const categoryNames = categories.map(cat => cat.name);

    // Extract unique scripture types from the 'class' field
    const scriptureTypes = extractScriptureTypes(manifest);

    return {
      totalScriptures,
      totalCategories,
      categoryNames,
      scriptureTypes
    };
  } catch (error) {
    console.error('[LibraryStats] Failed to fetch library stats:', error);
    // Fallback to categoryService if everything fails
    return getFallbackStats();
  }
}

