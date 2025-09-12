import { TopicCategory, SacredText, CategoryWithTexts } from '@/types/categories';
import { corpusStatusClient } from '@/lib/services/corpusStatusClient';

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
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "bhagavad-gita", "status": "available"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "upanishads", "status": "available"},
        {"id": "mahabharata", "name": "Mahabharata", "slug": "mahabharata", "cloudFolderPath": "mahabharata", "status": "available"},
        {"id": "ramayana", "name": "Ramayana", "slug": "ramayana", "cloudFolderPath": "ramayana", "status": "available"},
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "puranas", "status": "coming_soon"},
        {"id": "panchatantra", "name": "Panchatantra by Vishnu Sharma", "slug": "panchatantra", "cloudFolderPath": "panchatantra", "status": "available"},
        {"id": "jataka-tales", "name": "Jataka Tales", "slug": "jataka-tales", "cloudFolderPath": "jataka-tales", "status": "available"},
        {"id": "manusmriti", "name": "Manusmriti", "slug": "manusmriti", "cloudFolderPath": "manusmriti", "status": "available"},
        {"id": "yajnavalkya-smiriti", "name": "Yajnavalkya Smiriti", "slug": "yajnavalkya-smiriti", "cloudFolderPath": "yajnavalkya-smiriti", "status": "coming_soon"},
        {"id": "narada-smiriti", "name": "Narada Smiriti", "slug": "narada-smiriti", "cloudFolderPath": "narada-smiriti", "status": "coming_soon"},
        {"id": "parashara-smriti", "name": "Parashara Smriti", "slug": "parashara-smriti", "cloudFolderPath": "parashara-smriti", "status": "coming_soon"}
      ]
    },
    {
      "id": "yoga-meditation",
      "name": "Yoga & Meditation",
      "slug": "yoga-meditation",
      "order": 2,
      "description": "Texts on yoga philosophy, meditation practices, and inner peace.",
      "texts": [
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "bhagavad-gita", "status": "available"},
        {"id": "yoga-sutras", "name": "Yoga Sutras of Patanjali", "slug": "yoga-sutras", "cloudFolderPath": "yoga-sutras", "status": "available"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "upanishads", "status": "available"},
        {"id": "hatha-yoga", "name": "Hatha Yoga Pradipika", "slug": "hatha-yoga-pradipika", "cloudFolderPath": "hatha-yoga-pradipika", "status": "available"},
        {"id": "shiva-samhita", "name": "Shiva Samhita", "slug": "shiva-samhita", "cloudFolderPath": "shiva-samhita", "status": "coming_soon"},
        {"id": "vedas", "name": "Vedas", "slug": "vedas", "cloudFolderPath": "vedas", "status": "available"}
      ]
    },
    {
      "id": "health-wellbeing",
      "name": "Health & Well-being",
      "slug": "health-wellbeing",
      "order": 3,
      "description": "Ayurvedic texts on health, wellness, and balanced living.",
      "texts": [
        {"id": "charaka", "name": "Charaka Samhita", "slug": "charaka-samhita", "cloudFolderPath": "charaka-samhita", "status": "available"},
        {"id": "sushruta", "name": "Sushruta Samhita", "slug": "sushruta-samhita", "cloudFolderPath": "sushruta-samhita", "status": "available"},
        {"id": "ashtanga-hridayam", "name": "Ashtanga Hridayam & Ashtanga Sangraha", "slug": "ashtanga-hridayam", "cloudFolderPath": "ashtanga-hridayam", "status": "coming_soon"},
        {"id": "atharva-veda", "name": "Atharva Veda", "slug": "atharva-veda", "cloudFolderPath": "atharva-veda", "status": "available"},
        {"id": "rig-veda", "name": "Rig Veda", "slug": "rig-veda", "cloudFolderPath": "rig-veda", "status": "available"},
        {"id": "yoga-sutras", "name": "Yoga Sutras of Patanjali", "slug": "yoga-sutras", "cloudFolderPath": "yoga-sutras", "status": "available"},
        {"id": "hatha-yoga", "name": "Hatha Yoga Pradipika", "slug": "hatha-yoga-pradipika", "cloudFolderPath": "hatha-yoga-pradipika", "status": "available"},
        {"id": "agni-purana", "name": "Agni Purana", "slug": "agni-purana", "cloudFolderPath": "agni-purana", "status": "coming_soon"}
      ]
    },
    {
      "id": "relationships-love",
      "name": "Relationships & Love",
      "slug": "relationships-love",
      "order": 4,
      "description": "Texts exploring sacred relationships, love, and human connections.",
      "texts": [
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "bhagavad-gita", "status": "available"},
        {"id": "ramayana", "name": "Ramayana", "slug": "ramayana", "cloudFolderPath": "ramayana", "status": "available"},
        {"id": "mahabharata", "name": "Mahabharata", "slug": "mahabharata", "cloudFolderPath": "mahabharata", "status": "available"},
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "puranas", "status": "coming_soon"},
        {"id": "kama-sutra", "name": "Kama Sutra", "slug": "kama-sutra", "cloudFolderPath": "kama-sutra", "status": "available"},
        {"id": "panchatantra", "name": "Panchatantra by Vishnu Sharma", "slug": "panchatantra", "cloudFolderPath": "panchatantra", "status": "available"}
      ]
    },
    {
      "id": "arts-aesthetics",
      "name": "Arts & Aesthetics",
      "slug": "arts-aesthetics",
      "order": 5,
      "description": "Texts on arts, aesthetics, and creative expression.",
      "texts": [
        {"id": "natya-shastra", "name": "Natya Shastra", "slug": "natya-shastra", "cloudFolderPath": "natya-shastra", "status": "available"},
        {"id": "abhinavabharati", "name": "Abhinavabharati by Abhinavagupta", "slug": "abhinavabharati", "cloudFolderPath": "abhinavabharati", "status": "coming_soon"},
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "upanishads", "status": "available"},
        {"id": "silpa-shastras", "name": "Silpa Shastras", "slug": "silpa-shastras", "cloudFolderPath": "silpa-shastras", "status": "coming_soon"},
        {"id": "vedas", "name": "Vedas", "slug": "vedas", "cloudFolderPath": "vedas", "status": "available"},
        {"id": "kama-sutra", "name": "Kama Sutra", "slug": "kama-sutra", "cloudFolderPath": "kama-sutra", "status": "available"},
        {"id": "abhijnanashakuntalam", "name": "Abhijnanashakuntalam by Kalidasa", "slug": "abhijnanashakuntalam", "cloudFolderPath": "abhijnanashakuntalam", "status": "coming_soon"},
        {"id": "malavikagnimitram", "name": "Malavikagnimitram by Kalidasa", "slug": "malavikagnimitram", "cloudFolderPath": "malavikagnimitram", "status": "coming_soon"},
        {"id": "vikramorvasiyam", "name": "Vikramorvaśīyam by Kalidasa", "slug": "vikramorvasiyam", "cloudFolderPath": "vikramorvasiyam", "status": "coming_soon"},
        {"id": "mricchakatika", "name": "Mricchakatika", "slug": "mricchakatika", "cloudFolderPath": "mricchakatika", "status": "coming_soon"},
        {"id": "mudraraksasa", "name": "Mudrārākṣasa by Vishakhadatta", "slug": "mudraraksasa", "cloudFolderPath": "mudraraksasa", "status": "coming_soon"},
        {"id": "bhasa-plays", "name": "Plays by Bhasa", "slug": "bhasa-plays", "cloudFolderPath": "bhasa-plays", "status": "coming_soon"},
        {"id": "shatakatraya", "name": "Shatakatraya by Bhartrhari", "slug": "shatakatraya", "cloudFolderPath": "shatakatraya", "status": "coming_soon"}
      ]
    },
    {
      "id": "wisdom-knowledge",
      "name": "Wisdom & Knowledge",
      "slug": "wisdom-knowledge",
      "order": 6,
      "description": "Philosophical texts on wisdom, knowledge, and enlightenment.",
      "texts": [
        {"id": "upanishads", "name": "Upanishads", "slug": "upanishads", "cloudFolderPath": "upanishads", "status": "available"},
        {"id": "bg", "name": "Bhagavad Gita", "slug": "bhagavad-gita", "cloudFolderPath": "bhagavad-gita", "status": "available"},
        {"id": "nyaya-sutras", "name": "Nyaya Sutras by Gautama", "slug": "nyaya-sutras", "cloudFolderPath": "nyaya-sutras", "status": "coming_soon"},
        {"id": "vaisheshika-sutras", "name": "Vaisheshika Sutras by Kanada", "slug": "vaisheshika-sutras", "cloudFolderPath": "vaisheshika-sutras", "status": "coming_soon"},
        {"id": "samkhya-karika", "name": "Samkhya Karika by Ishvarakrishna", "slug": "samkhya-karika", "cloudFolderPath": "samkhya-karika", "status": "coming_soon"},
        {"id": "yoga-sutras", "name": "Yoga Sutras by Patanjali", "slug": "yoga-sutras", "cloudFolderPath": "yoga-sutras", "status": "available"},
        {"id": "mimamsa-sutras", "name": "Mimamsa Sutras by Jaimini", "slug": "mimamsa-sutras", "cloudFolderPath": "mimamsa-sutras", "status": "coming_soon"},
        {"id": "brahma-sutras", "name": "Brahma Sutras (Vedanta Sutras) by Badarayana", "slug": "brahma-sutras", "cloudFolderPath": "brahma-sutras", "status": "available"},
        {"id": "samkhya-karika-2", "name": "Samkhya Karika by Ishvara Krishna", "slug": "samkhya-karika-2", "cloudFolderPath": "samkhya-karika", "status": "coming_soon"},
        {"id": "tattvartha-sutra", "name": "Tattvartha Sutra by Umasvami", "slug": "tattvartha-sutra", "cloudFolderPath": "tattvartha-sutra", "status": "coming_soon"},
        {"id": "aryabhatia", "name": "Aryabhatia by Aryabhata", "slug": "aryabhatia", "cloudFolderPath": "aryabhatia", "status": "coming_soon"},
        {"id": "brahmasputasiddhanta", "name": "Brahmasputasiddhanta by BrahmaGupta", "slug": "brahmasputasiddhanta", "cloudFolderPath": "brahmasputasiddhanta", "status": "coming_soon"},
        {"id": "mahabhaskariiya", "name": "Mahabhaskariiya by Bhaskara", "slug": "mahabhaskariiya", "cloudFolderPath": "mahabhaskariiya", "status": "coming_soon"},
        {"id": "manusmriti", "name": "Manusmriti", "slug": "manusmriti", "cloudFolderPath": "manusmriti", "status": "available"},
        {"id": "yajnavalkya-smiriti", "name": "Yajnavalkya Smiriti", "slug": "yajnavalkya-smiriti", "cloudFolderPath": "yajnavalkya-smiriti", "status": "coming_soon"},
        {"id": "narada-smiriti", "name": "Narada Smiriti", "slug": "narada-smiriti", "cloudFolderPath": "narada-smiriti", "status": "coming_soon"},
        {"id": "parashara-smriti", "name": "Parashara Smriti", "slug": "parashara-smriti", "cloudFolderPath": "parashara-smriti", "status": "coming_soon"},
        {"id": "arthashastra", "name": "Arthashastra by Kautilya/Chanakya", "slug": "arthashastra", "cloudFolderPath": "arthashastra", "status": "available"},
        {"id": "abhijnanashakuntalam", "name": "Abhijnanashakuntalam by Kalidasa", "slug": "abhijnanashakuntalam", "cloudFolderPath": "abhijnanashakuntalam", "status": "coming_soon"},
        {"id": "malavikagnimitram", "name": "Malavikagnimitram by Kalidasa", "slug": "malavikagnimitram", "cloudFolderPath": "malavikagnimitram", "status": "coming_soon"},
        {"id": "vikramorvasiyam", "name": "Vikramorvaśīyam by Kalidasa", "slug": "vikramorvasiyam", "cloudFolderPath": "vikramorvasiyam", "status": "coming_soon"},
        {"id": "mricchakatika", "name": "Mricchakatika (The Little Clay Cart)", "slug": "mricchakatika", "cloudFolderPath": "mricchakatika", "status": "coming_soon"},
        {"id": "mudraraksasa", "name": "Mudrārākṣasa by Vishakhadatta", "slug": "mudraraksasa", "cloudFolderPath": "mudraraksasa", "status": "coming_soon"},
        {"id": "bhasa-plays", "name": "Plays by Bhasa (3rd-4th century CE)", "slug": "bhasa-plays", "cloudFolderPath": "bhasa-plays", "status": "coming_soon"}
      ]
    },
    {
      "id": "prosperity-dharmic-success",
      "name": "Prosperity & Dharmic Success",
      "slug": "prosperity-dharmic-success",
      "order": 7,
      "description": "Texts on prosperity, success, and dharmic economics.",
      "texts": [
        {"id": "arthashastra", "name": "Arthashastra", "slug": "arthashastra", "cloudFolderPath": "arthashastra", "status": "available"},
        {"id": "vedanga-jyotish", "name": "Vedanga Jyotish", "slug": "vedanga-jyotish", "cloudFolderPath": "vedanga-jyotish", "status": "coming_soon"},
        {"id": "puranas", "name": "Puranas", "slug": "puranas", "cloudFolderPath": "puranas", "status": "coming_soon"}
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
    
    try {
      // Use dynamic status checking with real-time GCS lookup via API
      return Promise.all(category.texts.map(async (text: SacredText) => {
        const dynamicStatus = await corpusStatusClient.checkCorpusAvailability(text.cloudFolderPath);
        return { ...text, status: dynamicStatus };
      })) || [];
    } catch (error) {
      console.error(`Error getting dynamic status for category ${categoryId}:`, error);
      // Fallback to static status if dynamic checking fails
      return category.texts || [];
    }
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
