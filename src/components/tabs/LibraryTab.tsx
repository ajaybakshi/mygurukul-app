'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { categoryService } from '@/lib/database/categoryService';
import { CategoryWithTexts, SacredText } from '@/types/categories';

interface LibraryTabProps {
  className?: string;
}

interface AccordionItemProps {
  category: CategoryWithTexts;
  isExpanded: boolean;
  onToggle: () => void;
}

const LibraryTab: React.FC<LibraryTabProps> = ({ className = '' }) => {
  const [categoriesWithTexts, setCategoriesWithTexts] = useState<CategoryWithTexts[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithTexts[]>([]);

  // Load all categories with their texts
  useEffect(() => {
    const loadCategoriesWithTexts = async () => {
      setIsLoading(true);
      try {
        const categories = categoryService.getCategories();
        const categoriesWithTextsData = await Promise.all(
          categories.map(async (category) => {
            const categoryWithTexts = await categoryService.getCategoryWithTexts(category.id);
            return categoryWithTexts;
          })
        );
        
        // Filter out null results and sort by order
        const validCategories = categoriesWithTextsData
          .filter((cat): cat is CategoryWithTexts => cat !== null)
          .sort((a, b) => a.category.order - b.category.order);
        
        setCategoriesWithTexts(validCategories);
        setFilteredCategories(validCategories);
      } catch (error) {
        console.error('Error loading categories with texts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoriesWithTexts();
  }, []);

  // Handle search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categoriesWithTexts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = categoriesWithTexts.map(categoryWithTexts => {
      const filteredTexts = categoryWithTexts.texts.filter(text =>
        text.name.toLowerCase().includes(query) ||
        text.slug.toLowerCase().includes(query)
      );
      
      const categoryMatches = categoryWithTexts.category.name.toLowerCase().includes(query) ||
                            categoryWithTexts.category.description.toLowerCase().includes(query);
      
      if (categoryMatches || filteredTexts.length > 0) {
        return {
          ...categoryWithTexts,
          texts: categoryMatches ? categoryWithTexts.texts : filteredTexts
        };
      }
      return null;
    }).filter((cat): cat is CategoryWithTexts => cat !== null);

    setFilteredCategories(filtered);
  }, [searchQuery, categoriesWithTexts]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'coming_soon':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'coming_soon':
        return 'Coming Soon';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'coming_soon':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter out unknown and not_found texts as per UX review
  const getFilteredTexts = (texts: SacredText[]) => {
    return texts.filter(text => 
      text.status === 'available' || text.status === 'coming_soon'
    );
  };

  const AccordionItem: React.FC<AccordionItemProps> = ({ category, isExpanded, onToggle }) => {
    const filteredTexts = getFilteredTexts(category.texts);
    const availableCount = filteredTexts.filter(t => t.status === 'available').length;
    const comingSoonCount = filteredTexts.filter(t => t.status === 'coming_soon').length;

    if (filteredTexts.length === 0) {
      return null; // Don't render categories with no available/coming_soon texts
    }

    return (
      <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl shadow-lg overflow-hidden">
        {/* Category Header */}
        <button
          onClick={onToggle}
          className="w-full p-6 text-left hover:bg-amber-50/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
          aria-expanded={isExpanded}
          aria-controls={`category-${category.category.id}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-2xl">📚</div>
                <h3 className="text-xl font-bold text-amber-800">
                  {category.category.name}
                </h3>
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-amber-600 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-amber-600 transition-transform duration-200" />
                  )}
                </div>
              </div>
              <p className="text-amber-600 text-sm leading-relaxed">
                {category.category.description}
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {availableCount} Available
                  </span>
                </div>
                {comingSoonCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {comingSoonCount} Coming Soon
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div
            id={`category-${category.category.id}`}
            className="border-t border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"
          >
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTexts.map((text) => (
                  <div
                    key={text.id}
                    className="bg-white border border-amber-100 rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-amber-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                          {text.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(text.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(text.status)}`}
                      >
                        {getStatusText(text.status)}
                      </span>
                      
                      {text.status === 'available' && (
                        <button
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors duration-200"
                          onClick={() => {
                            // TODO: Implement text viewing functionality
                            console.log('View text:', text.name);
                          }}
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50 ${className}`}>
        <div className="relative z-10 max-w-6xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div 
                className="w-16 h-16 border-4 border-amber-200 rounded-full animate-spin"
                style={{ 
                  borderTopColor: '#D4AF37',
                  borderRightColor: '#D4AF37'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl animate-pulse">📚</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Loading Sacred Library
            </h3>
            <p className="text-amber-600 text-sm animate-pulse">
              Gathering ancient wisdom collections...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/50 ${className}`}>
      {/* Sacred background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-6">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Sacred Library
          </h1>
          <p className="text-amber-600 text-lg">
            Explore ancient wisdom texts organized by spiritual categories
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sacred texts and categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-amber-300 rounded-xl bg-gradient-to-r from-white to-amber-50/30 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200 hover:border-amber-400 hover:shadow-md text-base"
            />
          </div>
          <p className="text-center text-amber-600 text-sm mt-2">
            🔍 Search functionality - coming soon in future updates
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl text-green-600 mb-2">
              {categoriesWithTexts.reduce((acc, cat) => 
                acc + getFilteredTexts(cat.texts).filter(t => t.status === 'available').length, 0
              )}
            </div>
            <div className="text-green-800 font-semibold">Available Texts</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl text-amber-600 mb-2">
              {categoriesWithTexts.reduce((acc, cat) => 
                acc + getFilteredTexts(cat.texts).filter(t => t.status === 'coming_soon').length, 0
              )}
            </div>
            <div className="text-amber-800 font-semibold">Coming Soon</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl text-blue-600 mb-2">
              {filteredCategories.length}
            </div>
            <div className="text-blue-800 font-semibold">Categories</div>
          </div>
        </div>

        {/* Accordion Categories */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">
                No results found
              </h3>
              <p className="text-amber-600">
                Try adjusting your search query or clear the search to see all categories.
              </p>
            </div>
          ) : (
            filteredCategories.map((categoryWithTexts) => (
              <AccordionItem
                key={categoryWithTexts.category.id}
                category={categoryWithTexts}
                isExpanded={expandedCategories.has(categoryWithTexts.category.id)}
                onToggle={() => toggleCategory(categoryWithTexts.category.id)}
              />
            ))
          )}
        </div>

        {/* Sacred Footer */}
        <div className="text-center text-sm text-amber-600 border-t border-amber-200 pt-6 mt-12">
          <div className="font-serif">Explore the wisdom of ages through organized collections</div>
          <div className="mt-2 text-amber-500">
            🕉️ Growing library of sacred knowledge 🕉️
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryTab;
