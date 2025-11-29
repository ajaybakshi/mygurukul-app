'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Scripture } from '@/types/library';
import EditionsModal from './EditionsModal';
import { fetchChapterManifest } from '@/lib/libraryService';
import type { ChapterManifest } from '@/types/library';

interface ScriptureCardProps {
  scripture: Scripture;
}

export default function ScriptureCard({ scripture }: ScriptureCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapterManifest, setChapterManifest] = useState<ChapterManifest | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);

  useEffect(() => {
    const loadManifest = async () => {
      // Check if this scripture has a chapter manifest (case-insensitive check)
      const normalizedId = scripture.id.toLowerCase();
      const hasManifest = 
        normalizedId === 'caraka_samhita' ||
        normalizedId === 'sushruta_samhita' ||
        normalizedId === 'arthashastra' ||
        normalizedId === 'arthasastra' || // Handle library manifest variation
        scripture.id === 'Arthasastra' || // Handle exact library manifest ID
        normalizedId === 'kamasutra' ||
        normalizedId === 'natyashastra' ||
        normalizedId === 'manu_smriti' ||
        normalizedId === 'aryabhatia' ||
        normalizedId === 'yoga_sutra' ||
        normalizedId === 'panchatantra' ||
        normalizedId === 'bhagvad_gita' ||
        normalizedId === 'vedangasastra_jyotisa' ||
        scripture.id === 'VedangaSastra_Jyotisa' ||
        normalizedId === 'vastu_sastra' ||
        scripture.id === 'Vastu_Sastra' ||
        scripture.id === 'Bhagvata_Purana' ||
        normalizedId === 'ramayana_valmiki' ||
        scripture.id === 'ramayana_valmiki';
      
      if (hasManifest) {
        setLoadingManifest(true);
        const manifest = await fetchChapterManifest(scripture.id);
        setChapterManifest(manifest);
        setLoadingManifest(false);
      }
    };
    loadManifest();
  }, [scripture.id]);

  const handleBrowseChapters = () => {
    router.push(`/library/${scripture.id}`);
  };

  return (
    <>
      <div className="flex-shrink-0 w-full sm:w-80 bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {scripture.title}
        </h3>
        
        {chapterManifest && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {chapterManifest.totalChapters} Chapters • {chapterManifest.sections.length} Sections
          </p>
        )}
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {scripture.description}
        </p>

        <div className="mt-auto">
          {chapterManifest ? (
            // Scripture has chapter manifest - show Browse Chapters button
            <button
              onClick={handleBrowseChapters}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Chapters
            </button>
          ) : (
            // Scripture without chapter manifest - show simple Read button
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Read
            </button>
          )}
        </div>
      </div>

      {/* EditionsModal only for non-chapter scriptures (backward compatibility) */}
      {!chapterManifest && (
        <EditionsModal
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          scripture={scripture}
        />
      )}
    </>
  );
}


