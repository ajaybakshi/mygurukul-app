export interface Edition {
  'Edition ID': string;
  'Text ID': string;
  'Edition Title': string;
  'Language': string;
  'Format': string;
  'GCS Path': string;
}

export interface Scripture {
  id: string;
  title: string;
  class: string;
  category: string;
  description: string;
  editions: Edition[];
  isConversational?: boolean;
}

export interface Category {
  name: string;
  scriptures: Scripture[];
}

// ============================================================================
// CHAPTER MANIFEST TYPES (v4.3 - Added Oct 16, 2025)
// ============================================================================

export interface ChapterMetadata {
  chapterId: string;
  chapterNumber: number;
  title: string;
  titleEnglish: string;
  metadataUrl: string;
  pdfUrl: string;
  hasMetadata: boolean;
}

export interface SectionMetadata {
  sectionId: string;
  sectionName: string;
  sectionNameEnglish: string;
  chapterCount: number;
  chapters: ChapterMetadata[];
}

export interface ChapterManifest {
  scriptureId: string;
  scriptureName: string;
  totalChapters: number;
  lastUpdated: string;
  sections: SectionMetadata[];
}
