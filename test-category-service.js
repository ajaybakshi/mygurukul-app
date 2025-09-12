// Simple test to check if categoryService is working
const fs = require('fs');
const path = require('path');

// Read the categoryService.ts file
const categoryServicePath = path.join(__dirname, 'src/lib/database/categoryService.ts');
const content = fs.readFileSync(categoryServicePath, 'utf8');

console.log('CategoryService file exists:', fs.existsSync(categoryServicePath));
console.log('File size:', content.length);
console.log('Contains categoriesData:', content.includes('categoriesData'));
console.log('Contains getCategories:', content.includes('getCategories'));
console.log('Contains export class CategoryService:', content.includes('export class CategoryService'));

// Check if the categories array has data
const categoriesMatch = content.match(/const categoriesData = \{[\s\S]*?\};/);
if (categoriesMatch) {
  console.log('Found categoriesData structure');
  const categoriesData = categoriesMatch[0];
  const categoryCount = (categoriesData.match(/"id":/g) || []).length;
  console.log('Number of categories found:', categoryCount);
} else {
  console.log('No categoriesData structure found');
}
