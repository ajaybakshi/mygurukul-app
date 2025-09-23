'use client';

import { categoryService } from '@/lib/database/categoryService';
import { useEffect, useState } from 'react';
import { TopicCategory, CategoryWithTexts } from '@/types/categories';

export default function TestCategoriesPage() {
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithTexts | null>(null);

  useEffect(() => {
    const cats = categoryService.getCategories();
    setCategories(cats);
    console.log('Categories loaded:', cats);
  }, []);

  const handleCategorySelect = async (categoryId: string) => {
    const categoryWithTexts = await categoryService.getCategoryWithTexts(categoryId);
    setSelectedCategory(categoryWithTexts);
    console.log('Selected category:', categoryWithTexts);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Category System Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl mb-4">Available Categories ({categories.length})</h2>
        <div className="grid gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="p-3 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-left transition-colors"
            >
              <div className="font-semibold">{category.name}</div>
              <div className="text-sm text-gray-600">{category.description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {selectedCategory.category.name} - Texts ({selectedCategory.texts.length})
          </h3>
          <div className="grid gap-2">
            {selectedCategory.texts.map((text) => (
              <div key={text.id} className="p-3 bg-white rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{text.name}</div>
                    <div className="text-sm text-gray-600">Folder: {text.cloudFolderPath}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    text.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {text.status === 'available' ? 'Available' : 'Coming Soon'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
