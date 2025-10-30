import {
  recognizeCharacters,
  generateEmbedding,
  cosineSimilarity,
  getCharacterDetails,
  type AnimeCharacterKnowledge,
} from './ml-models';

export interface CharacterAnalysisResult {
  name: string;
  englishName: string;
  anime: string;
  description: string;
  relatedCharacters: Array<{
    name: string;
    similarity: number;
    image?: string;
  }>;
  streamingPlatforms: Array<{
    name: string;
    url: string;
  }>;
  appearances: string[];
  image?: string;
}

export interface SuggestionsResult {
  recommended_anime: Array<{
    title: string;
    reason: string;
    genres: string[];
  }>;
  suggested_characters: Array<{
    name: string;
    anime: string;
    reason: string;
  }>;
  watch_next: Array<{
    title: string;
    episode: string;
    description: string;
  }>;
}

/**
 * Main function to analyze an image and identify anime characters
 * This runs entirely in the browser using your trained models
 */
export async function analyzeAnimeCharacters(
  imageUrl: string,
  onProgress?: (step: string) => void
): Promise<{
  characters: CharacterAnalysisResult[];
  suggestions: SuggestionsResult;
}> {
  try {
    // Step 1: Recognize characters from image
    onProgress?.('Recognizing characters...');
    const recognizedCharacters = await recognizeCharacters(imageUrl);

    // Step 2: Get detailed information for each character
    onProgress?.('Gathering character details...');
    const characters: CharacterAnalysisResult[] = [];

    for (const recognized of recognizedCharacters) {
      const details = getCharacterDetails(recognized.name);
      
      if (details) {
        // Step 3: Calculate embeddings and find similar characters
        onProgress?.(`Finding similar characters for ${recognized.name}...`);
        const mainEmbedding = await generateEmbedding(
          `${details.name} ${details.description}`
        );

        const relatedCharacters = await Promise.all(
          (details.relatedCharacters || []).map(async (relatedName) => {
            const relatedDetails = getCharacterDetails(relatedName);
            if (!relatedDetails) return null;

            const relatedEmbedding = await generateEmbedding(
              `${relatedDetails.name} ${relatedDetails.description}`
            );

            const similarity = cosineSimilarity(mainEmbedding, relatedEmbedding);

            return {
              name: relatedName,
              similarity,
              // You can add image generation here if you have a model
            };
          })
        );

        characters.push({
          name: details.name,
          englishName: details.name,
          anime: details.anime,
          description: details.description,
          relatedCharacters: relatedCharacters
            .filter((rc): rc is NonNullable<typeof rc> => rc !== null)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5),
          streamingPlatforms: details.streamingPlatforms,
          appearances: details.appearances,
        });
      }
    }

    // Step 4: Generate suggestions based on detected characters
    onProgress?.('Generating suggestions...');
    const suggestions = generateSuggestions(characters);

    return { characters, suggestions };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

/**
 * Generate personalized suggestions based on detected characters
 * You can implement a custom recommendation algorithm here
 */
function generateSuggestions(characters: CharacterAnalysisResult[]): SuggestionsResult {
  // Simple rule-based suggestions - replace with your own ML model
  const animes = new Set(characters.map((c) => c.anime));
  
  return {
    recommended_anime: Array.from(animes).map((anime) => ({
      title: anime,
      reason: 'Based on detected characters',
      genres: ['Action', 'Adventure'], // Add your own genre detection
    })),
    suggested_characters: characters.flatMap((c) =>
      c.relatedCharacters.slice(0, 2).map((rc) => ({
        name: rc.name,
        anime: c.anime,
        reason: `Similar to ${c.name}`,
      }))
    ),
    watch_next: Array.from(animes).map((anime) => ({
      title: anime,
      episode: 'Season 1, Episode 1',
      description: 'Continue your anime journey',
    })),
  };
}
