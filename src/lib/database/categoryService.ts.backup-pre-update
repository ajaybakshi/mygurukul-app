import { TopicCategory, SacredText, CategoryWithTexts } from '@/types/categories';
// import { corpusChecker } from '@/lib/services/corpusChecker'; // Temporarily disabled for testing

// Import JSON data as a module
const categoriesData = {
  "categories": [
    {
      "id": "life-purpose-ethics",
      "name": "Life Purpose & Ethics",
      "slug": "life-purpose-ethics",
      "order": 1,
      "description": "Core texts on dharmic living, ethics, and life purpose.",
      "texts": [
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "BhagavadGita", "status": "available"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "Upanishads", "status": "available"},
        {"id": "mahabharata", "name": "Mahabharata", "slug": "mahabharata", "cloudFolderPath": "Mahabharata", "status": "coming_soon"},
        {"id": "ramayana", "name": "Ramayana", "slug": "ramayana", "cloudFolderPath": "Ramayana", "status": "available"},
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "Puranas", "status": "coming_soon"},
        {"id": "panchatantra", "name": "Panchatantra", "slug": "panchatantra", "cloudFolderPath": "Panchatantra", "status": "coming_soon"}
      ]
    },
    {
      "id": "yoga-meditation",
      "name": "Yoga & Meditation",
      "slug": "yoga-meditation",
      "order": 2,
      "description": "Texts on yoga philosophy and meditation practices.",
      "texts": [
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "BhagavadGita", "status": "available"},
        {"id": "yoga-sutras", "name": "Yoga Sutras of Patanjali", "slug": "yoga-sutras-of-patanjali", "cloudFolderPath": "YogaSutrasPatanjali", "status": "available"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "Upanishads", "status": "available"},
        {"id": "hatha-yoga", "name": "Hatha Yoga Pradipika", "slug": "hatha-yoga-pradipika", "cloudFolderPath": "HathaYogaPradipika", "status": "coming_soon"},
        {"id": "shiva-samhita", "name": "Shiva Samhita", "slug": "shiva-samhita", "cloudFolderPath": "ShivaSamhita", "status": "coming_soon"},
        {"id": "vedas", "name": "Vedas", "slug": "vedas", "cloudFolderPath": "Vedas", "status": "coming_soon"}
      ]
    },
    {
      "id": "health-wellbeing",
      "name": "Health & Well-being",
      "slug": "health-wellbeing",
      "order": 3,
      "description": "Ayurvedic and health-related scriptures.",
      "texts": [
        {"id": "charaka", "name": "Charaka Samhita", "slug": "charaka-samhita", "cloudFolderPath": "CharakaSamhita", "status": "coming_soon"},
        {"id": "sushruta", "name": "Sushruta Samhita", "slug": "sushruta-samhita", "cloudFolderPath": "SushrutaSamhita", "status": "coming_soon"},
        {"id": "ashtanga-hridayam", "name": "Ashtanga Hridayam & Ashtanga Sangraha", "slug": "ashtanga-hridayam-and-sangraha", "cloudFolderPath": "AshtangaHridayamSangraha", "status": "coming_soon"},
        {"id": "atharva-veda", "name": "Atharva Veda", "slug": "atharva-veda", "cloudFolderPath": "AtharvaVeda", "status": "coming_soon"},
        {"id": "rig-veda", "name": "Rig Veda", "slug": "rig-veda", "cloudFolderPath": "RigVeda", "status": "coming_soon"},
        {"id": "agni-purana", "name": "Agni Purana", "slug": "agni-purana", "cloudFolderPath": "AgniPurana", "status": "coming_soon"}
      ]
    },
    {
      "id": "relationships-love",
      "name": "Relationships & Love",
      "slug": "relationships-love",
      "order": 4,
      "description": "Texts on relationships and love.",
      "texts": [
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "BhagavadGita", "status": "available"},
        {"id": "ramayana", "name": "Ramayana", "slug": "ramayana", "cloudFolderPath": "Ramayana", "status": "available"},
        {"id": "mahabharata", "name": "Mahabharata", "slug": "mahabharata", "cloudFolderPath": "Mahabharata", "status": "coming_soon"},
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "Puranas", "status": "coming_soon"},
        {"id": "panchatantra", "name": "Panchatantra", "slug": "panchatantra", "cloudFolderPath": "Panchatantra", "status": "coming_soon"}
      ]
    },
    {
      "id": "arts-aesthetics",
      "name": "Arts & Aesthetics",
      "slug": "arts-aesthetics",
      "order": 5,
      "description": "Texts on arts, drama, and aesthetics.",
      "texts": [
        {"id": "natya-shastra", "name": "Natya Shastra", "slug": "natya-shastra", "cloudFolderPath": "NatyaShastra", "status": "coming_soon"},
        {"id": "abhinavabharati", "name": "Abhinavabharati", "slug": "abhinavabharati", "cloudFolderPath": "Abhinavabharati", "status": "coming_soon"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "Upanishads", "status": "available"},
        {"id": "vedas", "name": "Vedas", "slug": "vedas", "cloudFolderPath": "Vedas", "status": "coming_soon"},
        {"id": "kama-sutra", "name": "Kama Sutra", "slug": "kama-sutra", "cloudFolderPath": "KamaSutra", "status": "coming_soon"}
      ]
    },
    {
      "id": "wisdom-knowledge",
      "name": "Wisdom & Knowledge",
      "slug": "wisdom-knowledge",
      "order": 6,
      "description": "Philosophical and knowledge texts.",
      "texts": [
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "Upanishads", "status": "available"},
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "BhagavadGita", "status": "available"},
        {"id": "darshanas", "name": "Six Darshanas", "slug": "six-darshanas", "cloudFolderPath": "SixDarshanas", "status": "coming_soon"},
        {"id": "sutras", "name": "Various Sutras", "slug": "various-sutras", "cloudFolderPath": "VariousSutras", "status": "coming_soon"},
        {"id": "manusmriti", "name": "Manusmriti", "slug": "manusmriti", "cloudFolderPath": "Manusmriti", "status": "coming_soon"},
        {"id": "arthashastra", "name": "Arthashastra", "slug": "arthashastra", "cloudFolderPath": "Arthashastra", "status": "coming_soon"}
      ]
    },
    {
      "id": "prosperity-success",
      "name": "Prosperity & Dharmic Success",
      "slug": "prosperity-success",
      "order": 7,
      "description": "Texts on prosperity and dharmic success.",
      "texts": [
        {"id": "arthashastra", "name": "Arthashastra", "slug": "arthashastra", "cloudFolderPath": "Arthashastra", "status": "coming_soon"},
        {"id": "vedanga-jyotish", "name": "Vedanga Jyotish", "slug": "vedanga-jyotish", "cloudFolderPath": "VedangaJyotish", "status": "coming_soon"},
        {"id": "puranas", "name": "Various Puranas", "slug": "various-puranas", "cloudFolderPath": "Puranas", "status": "coming_soon"}
      ]
    }
  ]
};

export class CategoryService {
  private categories: any;

  constructor() {
    this.categories = categoriesData.categories;
  }

  getCategories(): TopicCategory[] {
    return this.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order
    })).sort((a: TopicCategory, b: TopicCategory) => a.order - b.order);
  }

  getCategoryById(categoryId: string): TopicCategory | null {
    const category = this.categories.find((cat: any) => cat.id === categoryId);
    if (!category) return null;
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: category.order
    };
  }

  async getTextsForCategory(categoryId: string): Promise<SacredText[]> {
    const category = this.categories.find((cat: any) => cat.id === categoryId);
    if (!category) return [];
    
    // Temporarily return static status for testing
    return category.texts || [];
    
    // TODO: Re-enable dynamic status checking once GCS issues are resolved
    // return Promise.all(category.texts.map(async (text: SacredText) => {
    //   const dynamicStatus = await corpusChecker.checkCorpusAvailability(text.cloudFolderPath);
    //   return { ...text, status: dynamicStatus };
    // })) || [];
  }

  async getCategoryWithTexts(categoryId: string): Promise<CategoryWithTexts | null> {
    const category = this.getCategoryById(categoryId);
    if (!category) return null;
    
    const texts = await this.getTextsForCategory(categoryId);
    
    return {
      category,
      texts
    };
  }

  async getAvailableTextsCount(categoryId: string): Promise<number> {
    const texts = await this.getTextsForCategory(categoryId);
    return texts.filter(text => text.status === 'available').length;
  }

  getAllTexts(): SacredText[] {
    const allTexts: SacredText[] = [];
    this.categories.forEach((category: any) => {
      if (category.texts) {
        allTexts.push(...category.texts);
      }
    });
    return allTexts;
  }
}

export const categoryService = new CategoryService();
