// Client-side service for checking corpus status via API
export class CorpusStatusClient {
  async checkCorpusAvailability(cloudFolderPath: string): Promise<'available' | 'coming_soon'> {
    try {
      const response = await fetch('/api/corpus-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cloudFolderPath }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.status;
      } else {
        console.error('Corpus status API error:', data.error);
        return 'coming_soon'; // Graceful fallback
      }
    } catch (error) {
      console.error(`Error checking corpus status for ${cloudFolderPath}:`, error);
      return 'coming_soon'; // Graceful fallback
    }
  }
}

export const corpusStatusClient = new CorpusStatusClient();
