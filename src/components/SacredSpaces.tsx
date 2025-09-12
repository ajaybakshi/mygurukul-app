'use client';

import { useState } from 'react';
import { categoryConfig, getAllCategories, getAllDisplayNames } from '@/data/categoryConfig';
import SourceMaterialsDisplay from './SourceMaterialsDisplay';

const SacredSpaces = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = getAllCategories();
  const displayNames = getAllDisplayNames();

  return (
    <div className="sacred-spaces p-4">
      <div className="mb-4">
        <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Spiritual Category
        </label>
        <select 
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        >
          <option value="">Select Spiritual Category</option>
          {categories.map((category, index) => (
            <option key={category} value={category}>
              {displayNames[index]}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div className="mt-6">
          <SourceMaterialsDisplay selectedCategory={selectedCategory} />
        </div>
      )}
    </div>
  );
};

export default SacredSpaces;
