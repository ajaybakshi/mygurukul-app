export interface TopicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface SacredText {
  id: string;
  name: string;
  slug: string;
  cloudFolderPath: string;
  status: 'available' | 'coming_soon' | 'in_progress' | 'recently_added';
  description?: string;
  author?: string;
  language?: string;
  period?: string;
}

export interface CategoryMapping {
  categoryId: string;
  textId: string;
  priorityWeight: number;
}

export interface CategoryWithTexts {
  category: TopicCategory;
  texts: SacredText[];
}
