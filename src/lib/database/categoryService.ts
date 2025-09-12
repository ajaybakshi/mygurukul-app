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
        {"id": "panchatantra", "name": "Panchatantra by Vishnu Sharma", "slug": "panchatantra-by-vishnu-sharma", "cloudFolderPath": "Panchatantra", "status": "coming_soon"},
        {"id": "jataka-tales", "name": "Jataka Tales", "slug": "jataka-tales", "cloudFolderPath": "JatakaTales", "status": "coming_soon"},
        {"id": "manusmriti", "name": "Manusmriti", "slug": "manusmriti", "cloudFolderPath": "Manusmriti", "status": "coming_soon"},
        {"id": "yajnavalkya-smiriti", "name": "Yajnavalkya Smiriti", "slug": "yajnavalkya-smiriti", "cloudFolderPath": "YajnavalkyaSmiriti", "status": "coming_soon"},
        {"id": "narada-smiriti", "name": "Narada Smiriti", "slug": "narada-smiriti", "cloudFolderPath": "NaradaSmiriti", "status": "coming_soon"},
        {"id": "parashara-smriti", "name": "Parashara Smriti", "slug": "parashara-smriti", "cloudFolderPath": "ParasharaSmriti", "status": "coming_soon"}
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
        {"id": "ashtanga-hridayam", "name": "Ashtanga Hridayam (Ashtanga Sangraha)", "slug": "ashtanga-hridayam-ashtanga-sangraha", "cloudFolderPath": "AshtangaHridayamSangraha", "status": "coming_soon"},
        {"id": "atharva-veda", "name": "Atharva Veda", "slug": "atharva-veda", "cloudFolderPath": "AtharvaVeda", "status": "coming_soon"},
        {"id": "rig-veda", "name": "Rig Veda", "slug": "rig-veda", "cloudFolderPath": "RigVeda", "status": "coming_soon"},
        {"id": "yoga-sutras", "name": "Yoga Sutras of Patanjali", "slug": "yoga-sutras-of-patanjali", "cloudFolderPath": "YogaSutrasPatanjali", "status": "available"},
        {"id": "hatha-yoga", "name": "Hatha Yoga Pradipika", "slug": "hatha-yoga-pradipika", "cloudFolderPath": "HathaYogaPradipika", "status": "coming_soon"},
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
        {"id": "kama-sutra", "name": "Kama Sutra", "slug": "kama-sutra", "cloudFolderPath": "KamaSutra", "status": "coming_soon"},
        {"id": "panchatantra", "name": "Panchatantra by Vishnu Sharma", "slug": "panchatantra-by-vishnu-sharma", "cloudFolderPath": "Panchatantra", "status": "coming_soon"}
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
        {"id": "abhinavabharati", "name": "Abhinavabharati by Abhinavagupta (Commentary on Natya Shastra)", "slug": "abhinavabharati-by-abhinavagupta-commentary-on-natya-shastra", "cloudFolderPath": "Abhinavabharati", "status": "coming_soon"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "Upanishads", "status": "available"},
        {"id": "silpa-shastras", "name": "Silpa Shastras", "slug": "silpa-shastras", "cloudFolderPath": "SilpaShastras", "status": "coming_soon"},
        {"id": "vedas", "name": "Vedas", "slug": "vedas", "cloudFolderPath": "Vedas", "status": "coming_soon"},
        {"id": "kama-sutra", "name": "Kama Sutra", "slug": "kama-sutra", "cloudFolderPath": "KamaSutra", "status": "coming_soon"},
        {"id": "abhijnanashakuntalam", "name": "Abhijnanashakuntalam by Kalidasa", "slug": "abhijnanashakuntalam-by-kalidasa", "cloudFolderPath": "Abhijnanashakuntalam", "status": "coming_soon"},
        {"id": "malavikagnimitram", "name": "Malavikagnimitram by Kalidasa", "slug": "malavikagnimitram-by-kalidasa", "cloudFolderPath": "Malavikagnimitram", "status": "coming_soon"},
        {"id": "vikramorvayam", "name": "Vikramorvayam by Kalidasa", "slug": "vikramorvayam-by-kalidasa", "cloudFolderPath": "Vikramorvayam", "status": "coming_soon"},
        {"id": "mricchakatika", "name": "Mricchakatika (The Little Clay Cart)", "slug": "mricchakatika-the-little-clay-cart", "cloudFolderPath": "Mricchakatika", "status": "coming_soon"},
        {"id": "mudrarkasa", "name": "Mudrarkasa by Vishakhadatta", "slug": "mudrarkasa-by-vishakhadatta", "cloudFolderPath": "Mudrarkasa", "status": "coming_soon"},
        {"id": "plays-by-bhasa", "name": "Plays by Bhasa", "slug": "plays-by-bhasa", "cloudFolderPath": "PlaysByBhasa", "status": "coming_soon"},
        {"id": "shatakatraya", "name": "Shatakatraya by Bhartrhari", "slug": "shatakatraya-by-bhartrhari", "cloudFolderPath": "Shatakatraya", "status": "coming_soon"}
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
        {"id": "nyaya-sutras", "name": "Nyaya Sutras by Gautama", "slug": "nyaya-sutras-by-gautama", "cloudFolderPath": "NyayaSutras", "status": "coming_soon"},
        {"id": "vaisheshika-sutras", "name": "Vaisheshika Sutras by Kanada", "slug": "vaisheshika-sutras-by-kanada", "cloudFolderPath": "VaisheshikaSutras", "status": "coming_soon"},
        {"id": "samkhya-karika", "name": "Samkhya Karika by Ishvarakrishna", "slug": "samkhya-karika-by-ishvarakrishna", "cloudFolderPath": "SamkhyaKarika", "status": "coming_soon"},
        {"id": "yoga-sutras", "name": "Yoga Sutras by Patanjali", "slug": "yoga-sutras-by-patanjali", "cloudFolderPath": "YogaSutrasPatanjali", "status": "available"},
        {"id": "mimamsa-sutras", "name": "Mimamsa Sutras by Jaimini", "slug": "mimamsa-sutras-by-jaimini", "cloudFolderPath": "MimamsaSutras", "status": "coming_soon"},
        {"id": "brahma-sutras", "name": "Brahma Sutras (Vedanta Sutras) by Badarayana", "slug": "brahma-sutras-vedanta-sutras-by-badarayana", "cloudFolderPath": "BrahmaSutras", "status": "coming_soon"},
        {"id": "samkhya-karika-ishvara", "name": "Samkhya Karika by Ishvara Krishna", "slug": "samkhya-karika-by-ishvara-krishna", "cloudFolderPath": "SamkhyaKarikaIshvara", "status": "coming_soon"},
        {"id": "tattvartha-sutra", "name": "Tattvartha Sutra by Umasvami", "slug": "tattvartha-sutra-by-umasvami", "cloudFolderPath": "TattvarthaSutra", "status": "coming_soon"},
        {"id": "aryabhatia", "name": "Aryabhatia by Aryabhata (Math/Astronomy)", "slug": "aryabhatia-by-aryabhata-math-astronomy", "cloudFolderPath": "Aryabhatia", "status": "coming_soon"},
        {"id": "brahmasputasiddhanta", "name": "Brahmasputasiddhanta by BrahmaGupta (Math/Astronomy)", "slug": "brahmasputasiddhanta-by-brahmagupta-math-astronomy", "cloudFolderPath": "Brahmasputasiddhanta", "status": "coming_soon"},
        {"id": "mahabhaskariiya", "name": "Mahabhaskariiya by Bhaskara", "slug": "mahabhaskariiya-by-bhaskara", "cloudFolderPath": "Mahabhaskariiya", "status": "coming_soon"},
        {"id": "manusmriti", "name": "Manusmriti", "slug": "manusmriti", "cloudFolderPath": "Manusmriti", "status": "coming_soon"},
        {"id": "yajnavalkya-smiriti", "name": "Yajnavalkya Smiriti", "slug": "yajnavalkya-smiriti", "cloudFolderPath": "YajnavalkyaSmiriti", "status": "coming_soon"},
        {"id": "narada-smiriti", "name": "Narada Smiriti", "slug": "narada-smiriti", "cloudFolderPath": "NaradaSmiriti", "status": "coming_soon"},
        {"id": "parashara-smriti", "name": "Parashara Smriti", "slug": "parashara-smriti", "cloudFolderPath": "ParasharaSmriti", "status": "coming_soon"},
        {"id": "arthashastra", "name": "Arthashastra by Kautilya/Chanakya", "slug": "arthashastra-by-kautilya-chanakya", "cloudFolderPath": "Arthashastra", "status": "coming_soon"}
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
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "Puranas", "status": "coming_soon"}
      ]
    }
  ]
};

export class CategoryService {
  private categories: any;

  constructor() {
    console.log('CategoryService constructor called');
    console.log('categoriesData:', categoriesData);
    console.log('categoriesData.categories:', categoriesData.categories);
    console.log('categoriesData.categories length:', categoriesData.categories?.length);
    this.categories = categoriesData.categories;
    console.log('this.categories set to:', this.categories);
  }

  getCategories(): TopicCategory[] {
    console.log('CategoryService.getCategories() called');
    console.log('this.categories:', this.categories);
    console.log('this.categories length:', this.categories?.length);
    
    const result = this.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order
    })).sort((a: TopicCategory, b: TopicCategory) => a.order - b.order);
    
    console.log('getCategories result:', result);
    console.log('getCategories result length:', result.length);
    
    return result;
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

console.log('Creating categoryService instance...');
export const categoryService = new CategoryService();
console.log('categoryService created:', categoryService);
