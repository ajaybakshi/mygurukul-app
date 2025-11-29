'use client';

import { useState, useEffect } from 'react';
import type { Category } from '@/types/library';
import { getOrganizedLibrary } from '@/lib/libraryService';
import CategoryRow from '@/components/library/CategoryRow';

export default function LibraryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      try {
        setIsLoading(true);
        const organizedLibrary = await getOrganizedLibrary();
        setCategories(organizedLibrary);
      } catch (error) {
        console.error('Error loading library:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLibrary();
  }, []);

  const filteredCategories = categories
    .map(category => ({
      ...category,
      scriptures: category.scriptures.filter(scripture =>
        scripture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scripture.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.scriptures.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading Sacred Library...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">The Sacred Archive</h1>
        
        <input
          type="text"
          placeholder="Search scriptures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-6">
        {filteredCategories.map(category => (
          <CategoryRow key={category.name} category={category} />
        ))}
      </div>

      {filteredCategories.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 mt-8">
          No scriptures found matching &quot;{searchTerm}&quot;
        </p>
      )}
    </div>
  );
}

