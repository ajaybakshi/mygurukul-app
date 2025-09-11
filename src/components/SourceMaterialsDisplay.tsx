'use client';

import { useState, useEffect } from 'react';
import { categoryService } from '@/lib/database/categoryService';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Badge } from '@chakra-ui/react';

const SacredSpaces = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = categoryService.getCategories();
      const enriched = await Promise.all(cats.map(async (cat) => {
        const texts = await categoryService.getTextsForCategory(cat.id);
        const availableCount = texts.filter(t => t.status === 'available').length;
        return { ...cat, availableCount, textCount: texts.length };
      }));
      setCategories(enriched);
    };
    fetchCategories();
  }, []);

  const handleSelect = async (catId) => {
    const texts = await categoryService.getTextsForCategory(catId);
    setSelectedCategory({ id: catId, texts });
  };

  return (
    <Box className="sacred-spaces" p={4}>
      <select onChange={(e) => handleSelect(e.target.value)} className="w-full p-2 mb-4 bg-yellow-100 rounded">
        <option value="">Select Spiritual Category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} ({cat.availableCount} available / {cat.textCount} total)
          </option>
        ))}
      </select>

      {selectedCategory ? (
        <Accordion allowToggle>
          {selectedCategory.texts.map(text => (
            <AccordionItem key={text.id}>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  {text.name}
                </Box>
                <Badge colorScheme={text.status === 'available' ? 'green' : 'yellow'}>
                  {text.status.toUpperCase()}
                </Badge>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                {text.description || 'Description coming soon.'}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Box textAlign="center" color="gray.600">Select a category to explore sacred texts</Box>
      )}
    </Box>
  );
};

export default SacredSpaces;