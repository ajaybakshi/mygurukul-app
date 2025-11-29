import type { Category } from '@/types/library';
import ScriptureCard from './ScriptureCard';

interface CategoryRowProps {
  category: Category;
}

export default function CategoryRow({ category }: CategoryRowProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
      
      <div className="flex flex-nowrap space-x-4 overflow-x-auto pb-4">
        {category.scriptures.map(scripture => (
          <ScriptureCard key={scripture.id} scripture={scripture} />
        ))}
      </div>
    </div>
  );
}


