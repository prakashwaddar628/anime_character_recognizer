import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Generate embeddings for a character description
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Generate character image using AI
async function generateCharacterImage(characterName: string, description: string, apiKey: string): Promise<string> {
  console.log(`Generating image for ${characterName}...`);
  
  const prompt = `A high-quality anime character portrait of ${characterName}. ${description}. Professional anime art style, detailed facial features, vibrant colors, studio quality.`;
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      modalities: ['image', 'text']
    }),
  });

  if (!response.ok) {
    console.error('Image generation failed:', await response.text());
    return '';
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return imageUrl || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    console.log('Received image analysis request');

    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Identify characters in the image using vision
    console.log('Step 1: Identifying characters in image...');
    const identifyResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert anime character recognition system. Analyze images and identify all anime characters present. Return ONLY a JSON array of character names, nothing else. Format: ["Character Name 1", "Character Name 2"]. If no anime characters are detected, return an empty array [].'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all anime characters in this image. Return only a JSON array of their full names.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!identifyResponse.ok) {
      const errorText = await identifyResponse.text();
      console.error('Character identification failed:', identifyResponse.status, errorText);
      throw new Error(`Character identification failed: ${identifyResponse.status}`);
    }

    const identifyData = await identifyResponse.json();
    console.log('Identification response:', identifyData);
    
    const identifiedText = identifyData.choices[0].message.content.trim();
    console.log('Identified characters text:', identifiedText);
    
    let characterNames: string[];
    try {
      characterNames = JSON.parse(identifiedText);
    } catch (e) {
      console.error('Failed to parse character names, trying to extract:', identifiedText);
      // Try to extract array from markdown code blocks
      const match = identifiedText.match(/\[.*\]/s);
      if (match) {
        characterNames = JSON.parse(match[0]);
      } else {
        characterNames = [];
      }
    }

    if (!Array.isArray(characterNames) || characterNames.length === 0) {
      console.log('No characters identified');
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Characters identified:', characterNames);

    // Step 2: Get detailed information for each character
    console.log('Step 2: Gathering detailed information...');
    const detailsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent anime knowledge assistant. Given a list of anime character names, generate detailed structured information about each character in JSON format.

For each character, provide:
- character_name: The character's full name
- anime_name: The anime/series they're from
- description: 2-4 sentences about the character (accurate and neutral)
- related_characters: Array of 3-4 related characters with "name" and "reason" fields
- streaming_platforms: Array of 2 platforms (if available) with "name" and "url" fields
- appearance: Object with "hair_color", "eye_color", and "notable_features" (array of 2-3 items)

If any data is missing, set that field to null. Return ONLY valid JSON, no additional text.`
          },
          {
            role: 'user',
            content: `Generate detailed information for these anime characters: ${JSON.stringify(characterNames)}\n\nReturn in this exact format:\n{"results": [array of character objects]}`
          }
        ],
        temperature: 0.5,
      }),
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Details gathering failed:', detailsResponse.status, errorText);
      throw new Error(`Details gathering failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Details response received');
    
    let detailsText = detailsData.choices[0].message.content.trim();
    console.log('Details text:', detailsText.substring(0, 200) + '...');
    
    // Try to extract JSON from markdown code blocks
    if (detailsText.includes('```')) {
      const match = detailsText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (match) {
        detailsText = match[1];
      }
    }
    
    let results;
    try {
      results = JSON.parse(detailsText);
    } catch (e) {
      console.error('Failed to parse details JSON:', e);
      throw new Error('Failed to parse character details');
    }

    console.log('Successfully processed', results.results?.length || 0, 'characters');

    // Step 3: Generate embeddings and find similar characters using cosine similarity
    console.log('Step 3: Computing character similarities...');
    
    const characters = results.results || [];
    const characterEmbeddings: { [key: string]: number[] } = {};
    
    // Generate embeddings for all detected characters
    for (const char of characters) {
      const embeddingText = `${char.character_name} from ${char.anime_name}. ${char.description}`;
      try {
        characterEmbeddings[char.character_name] = await generateEmbedding(embeddingText, LOVABLE_API_KEY);
      } catch (e) {
        console.error(`Failed to generate embedding for ${char.character_name}:`, e);
      }
    }

    // Generate embeddings for related characters and compute similarities
    const allRelatedCharacters = new Set<string>();
    for (const char of characters) {
      if (char.related_characters) {
        char.related_characters.forEach((rc: any) => allRelatedCharacters.add(rc.name));
      }
    }

    const relatedEmbeddings: { [key: string]: number[] } = {};
    for (const relatedName of allRelatedCharacters) {
      try {
        relatedEmbeddings[relatedName] = await generateEmbedding(relatedName, LOVABLE_API_KEY);
      } catch (e) {
        console.error(`Failed to generate embedding for related character ${relatedName}:`, e);
      }
    }

    // Calculate similarities and enhance related characters with similarity scores
    for (const char of characters) {
      if (char.related_characters && characterEmbeddings[char.character_name]) {
        const mainEmbedding = characterEmbeddings[char.character_name];
        
        char.related_characters = char.related_characters.map((rc: any) => {
          let similarity = 0;
          if (relatedEmbeddings[rc.name]) {
            similarity = cosineSimilarity(mainEmbedding, relatedEmbeddings[rc.name]);
          }
          return {
            ...rc,
            similarity: Math.round(similarity * 100) / 100,
            image: '' // Will be populated next
          };
        });

        // Sort by similarity (highest first)
        char.related_characters.sort((a: any, b: any) => b.similarity - a.similarity);
      }
    }

    // Step 4: Generate images for main characters
    console.log('Step 4: Generating character images...');
    
    for (const char of characters) {
      try {
        const imagePrompt = `${char.character_name} from ${char.anime_name}. ${char.description}`;
        char.image = await generateCharacterImage(char.character_name, imagePrompt, LOVABLE_API_KEY);
      } catch (e) {
        console.error(`Failed to generate image for ${char.character_name}:`, e);
        char.image = '';
      }
    }

    // Step 5: Generate images for top related characters
    console.log('Step 5: Generating related character images...');
    
    const generatedRelatedImages: { [key: string]: string } = {};
    
    for (const char of characters) {
      if (char.related_characters) {
        // Generate images for top 3 most similar characters
        const topRelated = char.related_characters.slice(0, 3);
        
        for (const rc of topRelated) {
          // Skip if already generated
          if (generatedRelatedImages[rc.name]) {
            rc.image = generatedRelatedImages[rc.name];
            continue;
          }

          try {
            const relatedImagePrompt = `${rc.name}, an anime character. ${rc.reason}. Professional anime art style, detailed portrait.`;
            const image = await generateCharacterImage(rc.name, relatedImagePrompt, LOVABLE_API_KEY);
            rc.image = image;
            generatedRelatedImages[rc.name] = image;
          } catch (e) {
            console.error(`Failed to generate image for related character ${rc.name}:`, e);
            rc.image = '';
          }
        }
      }
    }

    console.log('Analysis complete with images and similarities');

    // Step 6: Generate personalized suggestions
    console.log('Step 6: Generating personalized suggestions...');
    
    const characterList = characters.map((c: any) => `${c.character_name} from ${c.anime_name}`).join(', ');
    const suggestionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an anime recommendation expert. Based on detected anime characters, provide personalized suggestions in JSON format.

Return a JSON object with these fields:
- recommended_anime: Array of 3-4 anime recommendations with "title", "reason" (why it's similar), and "genre" fields
- suggested_characters: Array of 2-3 similar characters to explore with "name", "anime", and "why_similar" fields
- watch_next: Array of 2 specific episodes/arcs with "title", "description" fields

Return ONLY valid JSON, no additional text.`
          },
          {
            role: 'user',
            content: `Based on these detected characters: ${characterList}, generate personalized anime recommendations and suggestions.`
          }
        ],
        temperature: 0.7,
      }),
    });

    let suggestions = {
      recommended_anime: [],
      suggested_characters: [],
      watch_next: []
    };

    if (suggestionsResponse.ok) {
      const suggestionsData = await suggestionsResponse.json();
      let suggestionsText = suggestionsData.choices[0].message.content.trim();
      
      if (suggestionsText.includes('```')) {
        const match = suggestionsText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (match) {
          suggestionsText = match[1];
        }
      }
      
      try {
        suggestions = JSON.parse(suggestionsText);
        console.log('Suggestions generated successfully');
      } catch (e) {
        console.error('Failed to parse suggestions:', e);
      }
    }

    results.suggestions = suggestions;

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-anime-characters function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
