import type { Scripture, Category, ChapterManifest } from '@/types/library';

const MANIFEST_URL = 'https://storage.googleapis.com/mygurukul-sacred-texts-corpus/Gurukul_Library/library_manifest.json';

/**
 * Fetches the library manifest via Next.js API route (avoids CORS issues)
 * Returns empty array if fetch fails
 */
export async function fetchLibraryManifest(): Promise<Scripture[]> {
  try {
    console.log("Attempting to fetch manifest via API route");
    const response = await fetch('/api/library-manifest', {
      cache: 'no-store',
    });

    console.log("API response received. Status:", response.status, response.statusText);

    if (!response.ok) {
      console.error("API fetch failed: Response was not OK.");
      return [];
    }

    const data: Scripture[] = await response.json();
    console.log(`Successfully parsed manifest. Found ${data.length} scriptures.`);
    
    if (data.length > 0) {
      console.log("First scripture title:", data[0].title);
    }

    return data;
  } catch (error) {
    console.error("Critical error in fetchLibraryManifest:", error);
    return [];
  }
}

/**
 * Mock function that simulates checking for conversational texts
 * In production, this would query a database or service
 */
export async function getConversationalScriptureIds(): Promise<Set<string>> {
  return new Promise((resolve) => {
    resolve(new Set(['bhagavad_gita', 'caraka_samhita']));
  });
}

/**
 * Main function to fetch and organize the library data
 * Enriches scriptures with conversational status and groups by category
 */
export async function getOrganizedLibrary(): Promise<Category[]> {
  // Fetch data from both sources
  const [scriptures, conversationalIds] = await Promise.all([
    fetchLibraryManifest(),
    getConversationalScriptureIds()
  ]);

  console.log(`getOrganizedLibrary received ${scriptures.length} scriptures.`);

  // Enrich scriptures with isConversational status
  const enrichedScriptures = scriptures.map(scripture => ({
    ...scripture,
    isConversational: conversationalIds.has(scripture.id)
  }));

  // Group scriptures by category
  const categoryMap = new Map<string, Scripture[]>();
  
  enrichedScriptures.forEach(scripture => {
    const existing = categoryMap.get(scripture.category) || [];
    existing.push(scripture);
    categoryMap.set(scripture.category, existing);
  });

  // Convert map to Category array
  const categories: Category[] = Array.from(categoryMap.entries()).map(
    ([name, scriptures]) => ({
      name,
      scriptures
    })
  );

  return categories;
}

// ============================================================================
// CHAPTER MANIFEST FUNCTIONS (v4.3 - Added Oct 16, 2025)
// ============================================================================

const MANIFEST_BASE_URL = 'https://storage.googleapis.com/mygurukul-sacred-texts-corpus/Metadata';

/**
 * Normalizes scripture ID to match chapter manifest file naming convention
 * Handles variations like "Arthasastra" -> "arthashastra"
 */
function normalizeScriptureIdForManifest(scriptureId: string): string {
  // Map known variations to their manifest file names
  const idMap: Record<string, string> = {
    'Arthasastra': 'arthashastra',
    'arthashastra': 'arthashastra',
    'Arthashastra': 'arthashastra',
    'bhagvad_gita': 'bhagvad_gita',
    'Bhagvad_Gita': 'bhagvad_gita',
    'bhagavad_gita': 'bhagvad_gita',
    'Bhagavad_Gita': 'bhagvad_gita',
    'VedangaSastra_Jyotisa': 'VedangaSastra_Jyotisa',
    'vedangasastra_jyotisa': 'VedangaSastra_Jyotisa',
    'vedanga_jyotisa': 'VedangaSastra_Jyotisa',
    'Vastu_Sastra': 'Vastu_Sastra',
    'vastu_sastra': 'Vastu_Sastra',
    'vastu_shastra': 'Vastu_Sastra',
    'Bhagvata_Purana': 'Bhagvata_Purana',
    'bhagvata_purana': 'Bhagvata_Purana',
    'Bhagavata_Purana': 'Bhagvata_Purana',
    'ramayana_valmiki': 'ramayana_valmiki',
    'Ramayana_Valmiki': 'ramayana_valmiki',
    'ramayana': 'ramayana_valmiki',
  };
  
  // Return mapped ID if exists, otherwise return lowercase version
  return idMap[scriptureId] || scriptureId.toLowerCase();
}

/**
 * Fetches chapter manifest for a specific scripture from GCS
 * @param scriptureId - The unique ID of the scripture (e.g., "caraka_samhita" or "Arthasastra")
 * @returns ChapterManifest object or null if not found/error
 */
export async function fetchChapterManifest(
  scriptureId: string
): Promise<ChapterManifest | null> {
  try {
    // Normalize the ID to match manifest file naming
    const normalizedId = normalizeScriptureIdForManifest(scriptureId);
    const manifestUrl = `${MANIFEST_BASE_URL}/${normalizedId}_chapter_manifest.json`;
    
    // Add cache-busting timestamp to ensure fresh manifest
    const cacheBuster = `?t=${Date.now()}`;
    const urlWithCacheBuster = `${manifestUrl}${cacheBuster}`;
    
    console.log(`[LibraryService] Fetching chapter manifest for "${scriptureId}" (normalized: "${normalizedId}"): ${urlWithCacheBuster}`);
    
    const response = await fetch(urlWithCacheBuster, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.warn(`[LibraryService] Manifest not found for ${scriptureId} (normalized: ${normalizedId}): ${response.status}`);
      return null;
    }
    
    const manifest: ChapterManifest = await response.json();
    
    console.log(`[LibraryService] Successfully loaded manifest for ${scriptureId}: ${manifest.totalChapters} chapters`);
    
    return manifest;
  } catch (error) {
    console.error(`[LibraryService] Error fetching chapter manifest for ${scriptureId}:`, error);
    return null;
  }
}

/**
 * Checks if a scripture has a chapter manifest available
 * @param scriptureId - The unique ID of the scripture
 * @returns boolean indicating if manifest exists
 */
export async function hasChapterManifest(scriptureId: string): Promise<boolean> {
  const manifest = await fetchChapterManifest(scriptureId);
  return manifest !== null;
}
