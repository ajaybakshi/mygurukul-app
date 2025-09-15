import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock data simulating corpus file metadata
 * In production, this would be replaced with actual file reading logic
 */
interface MockCorpusFiles {
  [key: string]: any;
}

const mockCorpusFiles: MockCorpusFiles = {
  "bhagavad-gita-complete.json": {
    sourceName: "Bhagavad Gita",
    collection: "Sacred Scriptures",
    description: "The divine song of Lord Krishna, containing 700 verses of spiritual wisdom",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "dharma",
    fileSize: "2.1MB",
    lastUpdated: "2024-01-15"
  },
  "upanishads-principal.json": {
    sourceName: "Principal Upanishads",
    collection: "Vedic Literature",
    description: "Core philosophical texts exploring the nature of reality and consciousness",
    author: "Various Rishis",
    language: "Sanskrit",
    period: "Ancient",
    category: "meditation",
    fileSize: "1.8MB",
    lastUpdated: "2024-01-10"
  },
  "swami-vivekananda-complete-works.json": {
    sourceName: "Complete Works of Swami Vivekananda",
    collection: "Modern Spiritual Literature",
    description: "Comprehensive collection of lectures, writings, and teachings",
    author: "Swami Vivekananda",
    language: "English",
    period: "Modern",
    category: "general",
    fileSize: "5.2MB",
    lastUpdated: "2024-01-20"
  },
  "upanishads-meditation.json": {
    sourceName: "Meditation Upanishads",
    collection: "Vedic Literature",
    description: "Specialized texts focusing on meditation and spiritual practices",
    author: "Various Rishis",
    language: "Sanskrit",
    period: "Ancient",
    category: "meditation",
    fileSize: "1.5MB",
    lastUpdated: "2024-01-12"
  },
  "swami-vivekananda-meditation-works.json": {
    sourceName: "Swami Vivekananda on Meditation",
    collection: "Modern Spiritual Literature",
    description: "Specific teachings and practices of meditation from Swami Vivekananda",
    author: "Swami Vivekananda",
    language: "English",
    period: "Modern",
    category: "meditation",
    fileSize: "2.8MB",
    lastUpdated: "2024-01-18"
  },
  "yoga-sutras-patanjali.json": {
    sourceName: "Yoga Sutras of Patanjali",
    collection: "Classical Yoga Texts",
    description: "Foundational text on the philosophy and practice of yoga",
    author: "Patanjali",
    language: "Sanskrit",
    period: "Classical",
    category: "meditation",
    fileSize: "1.2MB",
    lastUpdated: "2024-01-08"
  },
  "bhagavad-gita-dharma.json": {
    sourceName: "Bhagavad Gita - Dharma Section",
    collection: "Sacred Scriptures",
    description: "Specific chapters focusing on dharma and righteous conduct",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "dharma",
    fileSize: "0.9MB",
    lastUpdated: "2024-01-14"
  },
  "ramayana-ethical-lessons.json": {
    sourceName: "Ramayana - Ethical Lessons",
    collection: "Epic Literature",
    description: "Moral and ethical teachings from the Ramayana epic",
    author: "Valmiki",
    language: "Sanskrit",
    period: "Ancient",
    category: "dharma",
    fileSize: "3.1MB",
    lastUpdated: "2024-01-16"
  },
  "mahabharata-dharma-teachings.json": {
    sourceName: "Mahabharata - Dharma Teachings",
    collection: "Epic Literature",
    description: "Dharma and ethical principles from the Mahabharata",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "dharma",
    fileSize: "4.2MB",
    lastUpdated: "2024-01-17"
  },
  "ramayana-family-values.json": {
    sourceName: "Ramayana - Family Values",
    collection: "Epic Literature",
    description: "Lessons on family relationships and values from Ramayana",
    author: "Valmiki",
    language: "Sanskrit",
    period: "Ancient",
    category: "relationships",
    fileSize: "2.7MB",
    lastUpdated: "2024-01-13"
  },
  "mahabharata-relationships.json": {
    sourceName: "Mahabharata - Relationships",
    collection: "Epic Literature",
    description: "Complex relationship dynamics and family bonds in Mahabharata",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "relationships",
    fileSize: "3.8MB",
    lastUpdated: "2024-01-19"
  },
  "upanishads-human-connections.json": {
    sourceName: "Upanishads - Human Connections",
    collection: "Vedic Literature",
    description: "Teachings on human relationships and social harmony",
    author: "Various Rishis",
    language: "Sanskrit",
    period: "Ancient",
    category: "relationships",
    fileSize: "1.3MB",
    lastUpdated: "2024-01-11"
  },
  "bhagavad-gita-purpose.json": {
    sourceName: "Bhagavad Gita - Life Purpose",
    collection: "Sacred Scriptures",
    description: "Chapters focusing on life purpose, goals, and self-realization",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "purpose",
    fileSize: "1.6MB",
    lastUpdated: "2024-01-15"
  },
  "swami-vivekananda-life-goals.json": {
    sourceName: "Swami Vivekananda on Life Goals",
    collection: "Modern Spiritual Literature",
    description: "Guidance on finding life purpose and achieving goals",
    author: "Swami Vivekananda",
    language: "English",
    period: "Modern",
    category: "purpose",
    fileSize: "2.3MB",
    lastUpdated: "2024-01-21"
  },
  "upanishads-self-realization.json": {
    sourceName: "Upanishads - Self-Realization",
    collection: "Vedic Literature",
    description: "Paths to self-realization and understanding one's true nature",
    author: "Various Rishis",
    language: "Sanskrit",
    period: "Ancient",
    category: "purpose",
    fileSize: "1.4MB",
    lastUpdated: "2024-01-09"
  },
  "bhagavad-gita-adversity.json": {
    sourceName: "Bhagavad Gita - Overcoming Adversity",
    collection: "Sacred Scriptures",
    description: "Teachings on facing challenges and building resilience",
    author: "Vyasa",
    language: "Sanskrit",
    period: "Ancient",
    category: "challenges",
    fileSize: "1.1MB",
    lastUpdated: "2024-01-14"
  },
  "ramayana-trials-tribulations.json": {
    sourceName: "Ramayana - Trials and Tribulations",
    collection: "Epic Literature",
    description: "Stories of overcoming difficulties and maintaining dharma",
    author: "Valmiki",
    language: "Sanskrit",
    period: "Ancient",
    category: "challenges",
    fileSize: "2.9MB",
    lastUpdated: "2024-01-16"
  },
  "swami-vivekananda-struggles.json": {
    sourceName: "Swami Vivekananda on Life Struggles",
    collection: "Modern Spiritual Literature",
    description: "Practical wisdom for facing life's challenges and difficulties",
    author: "Swami Vivekananda",
    language: "English",
    period: "Modern",
    category: "challenges",
    fileSize: "2.5MB",
    lastUpdated: "2024-01-22"
  }
};

/**
 * Interface for source material metadata
 */
interface SourceMaterial {
  fileName: string;
  sourceName: string;
  collection: string;
  description: string;
  author: string;
  language: string;
  period: string;
  category: string;
  fileSize: string;
  lastUpdated: string;
  status: 'available' | 'not_found' | 'error';
  errorMessage?: string;
}

/**
 * Interface for API request body
 */
interface SourceDiscoveryRequest {
  fileNames: string[];
}

/**
 * Interface for API response
 */
interface SourceDiscoveryResponse {
  success: boolean;
  sources: SourceMaterial[];
  totalFound: number;
  totalRequested: number;
  errors?: string[];
}

/**
 * POST handler for source discovery
 * Accepts an array of backend file names and returns formatted source materials
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: SourceDiscoveryRequest = await request.json();
    
    // Validate request
    if (!body.fileNames || !Array.isArray(body.fileNames)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: fileNames array is required'
        },
        { status: 400 }
      );
    }

    const { fileNames } = body;
    const sources: SourceMaterial[] = [];
    const errors: string[] = [];

    // Process each requested file
    for (const fileName of fileNames) {
      try {
        // Check if file exists in mock data
        if (mockCorpusFiles[fileName]) {
          const fileData = mockCorpusFiles[fileName];
          
          sources.push({
            fileName,
            sourceName: fileData.sourceName,
            collection: fileData.collection,
            description: fileData.description,
            author: fileData.author,
            language: fileData.language,
            period: fileData.period,
            category: fileData.category,
            fileSize: fileData.fileSize,
            lastUpdated: fileData.lastUpdated,
            status: 'available'
          });
        } else {
          // File not found
          sources.push({
            fileName,
            sourceName: 'Unknown',
            collection: 'Unknown',
            description: 'File not found in corpus',
            author: 'Unknown',
            language: 'Unknown',
            period: 'Unknown',
            category: 'unknown',
            fileSize: '0MB',
            lastUpdated: 'Unknown',
            status: 'not_found',
            errorMessage: `File '${fileName}' not found in corpus`
          });
          
          errors.push(`File '${fileName}' not found`);
        }
      } catch (fileError) {
        // Error processing individual file
        sources.push({
          fileName,
          sourceName: 'Error',
          collection: 'Error',
          description: 'Error processing file',
          author: 'Unknown',
          language: 'Unknown',
          period: 'Unknown',
          category: 'error',
          fileSize: '0MB',
          lastUpdated: 'Unknown',
          status: 'error',
          errorMessage: `Error processing file '${fileName}': ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        });
        
        errors.push(`Error processing '${fileName}': ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    // Calculate statistics
    const totalFound = sources.filter(s => s.status === 'available').length;
    const totalRequested = fileNames.length;

    // Prepare response
    const response: SourceDiscoveryResponse = {
      success: true,
      sources,
      totalFound,
      totalRequested,
      ...(errors.length > 0 && { errors })
    };

    // Return success response
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    // Handle unexpected errors
    console.error('Source discovery API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check and API information
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Source Discovery API is running',
      version: '1.0.0',
      availableFiles: Object.keys(mockCorpusFiles).length,
      categories: Array.from(new Set(Object.values(mockCorpusFiles).map(f => f.category))),
      endpoints: {
        POST: '/api/source-discovery - Submit file names for discovery',
        GET: '/api/source-discovery - API information and health check'
      }
    },
    { status: 200 }
  );
}
