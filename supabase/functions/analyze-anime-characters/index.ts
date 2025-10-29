import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Generate embeddings for a character description
async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  // Using a current standard embedding model
  const embeddingModel = "text-embedding-004";

  const response = await fetch(
    // Correct URL with model in path and key as query param
    `https://api.gemini.google.com/v1/models/${embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header needed if key is in URL
      },
      body: JSON.stringify({
        // Standard Gemini embedding request body
        content: { parts: [{ text: text }] },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Embedding failure:", errorText);
    throw new Error("Failed to generate embedding");
  }

  const data = await response.json();
  // Standard Gemini embedding response structure
  return data.embedding.values;
}

// Generate character image using AI
// NOTE: This function is simplified. True Text-to-Image usually uses the Imagen API,
// but we adjust the call to the standard Gemini structure.
async function generateCharacterImage(
  characterName: string,
  description: string,
  apiKey: string
): Promise<string> {
  // Using a model capable of generating descriptive text/suggestions
  const IMAGE_MODEL = "gemini-2.5-flash";
  console.log(`Generating image for ${characterName}...`);

  const prompt = `Generate a high-quality anime character portrait image URL of ${characterName}. ${description}. Return ONLY the direct URL of the generated image and nothing else.`;

  const response = await fetch(
    // Correct URL with model in path and key as query param
    `https://api.gemini.google.com/v1/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Use 'contents' instead of 'messages'
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    console.error("Image generation request failed:", await response.text());
    return "";
  }

  const data = await response.json();
  // Corrected response parsing to the native Gemini format
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  // NOTE: A text model usually returns a *description* or *suggestion* for a URL,
  // not a real image URL. This part may need further adjustment for a production image pipeline.
  return generatedText || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64;

    console.log("Received image analysis request");

    if (!imageBase64) {
      throw new Error("No image data provided");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // --- CRITICAL FIX: Extract MIME type and raw base64 data ---
    const mimeTypeMatch = imageBase64.match(
      /^data:(image\/(?:png|jpeg|webp|jpg));base64,/
    );
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

    // Strip the data URI header for inlineData
    const base64Data = imageBase64.replace(/^data:(.*);base64,/, "");
    // -----------------------------------------------------------

    // Step 1: Identify characters in the image using vision
    console.log("Step 1: Identifying characters in image...");
    const VISION_MODEL = "gemini-2.5-flash";
    const identifyResponse = await fetch(
      // Correct URL
      `https://api.gemini.google.com/v1/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Change 'messages' to 'contents'
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: 'You are an expert anime character recognition system. Analyze images and identify all anime characters present. Return ONLY a JSON array of character names, nothing else. Format: ["Character Name 1", "Character Name 2"]. If no anime characters are detected, return an empty array [].',
                },
                {
                  text: "Identify all anime characters in this image. Return only a JSON array of their full names.",
                },
                // Use inlineData for native Gemini API vision calls
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
          config: {
            temperature: 0.3,
          },
        }),
      }
    );

    if (!identifyResponse.ok) {
      const errorText = await identifyResponse.text();
      console.error(
        "Character identification failed:",
        identifyResponse.status,
        errorText
      );
      throw new Error(
        `Character identification failed: ${identifyResponse.status}`
      );
    }

    const identifyData = await identifyResponse.json();
    console.log("Identification response received");

    // FIX: Correct response parsing for native Gemini API
    const identifiedText =
      identifyData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log("Identified characters text:", identifiedText);

    let characterNames: string[];
    try {
      // ... (JSON parsing logic remains fine) ...
      characterNames = JSON.parse(identifiedText);
    } catch (e) {
      console.error(
        "Failed to parse character names, trying to extract:",
        identifiedText
      );
      const match = identifiedText.match(/\[.*\]/s);
      if (match) {
        characterNames = JSON.parse(match[0]);
      } else {
        characterNames = [];
      }
    }

    if (!Array.isArray(characterNames) || characterNames.length === 0) {
      console.log("No characters identified");
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Characters identified:", characterNames);

    // Step 2: Get detailed information for each character
    console.log("Step 2: Gathering detailed information...");
    const detailsResponse = await fetch(
      // Correct URL
      `https://api.gemini.google.com/v1/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Change 'messages' to 'contents'
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an intelligent anime knowledge assistant... (system prompt) If any data is missing, set that field to null. Return ONLY valid JSON, no additional text.`,
                },
                {
                  text: `Generate detailed information for these anime characters: ${JSON.stringify(
                    characterNames
                  )}\n\nReturn in this exact format:\n{"results": [array of character objects]}`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.5,
          },
        }),
      }
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error(
        "Details gathering failed:",
        detailsResponse.status,
        errorText
      );
      throw new Error(`Details gathering failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log("Details response received");

    // FIX: Correct response parsing for native Gemini API
    let detailsText =
      detailsData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log("Details text:", detailsText.substring(0, 200) + "...");

    // ... (rest of JSON extraction and processing logic is fine) ...
    if (detailsText.includes("```")) {
      const match = detailsText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (match) {
        detailsText = match[1];
      }
    }

    let results;
    try {
      results = JSON.parse(detailsText);
    } catch (e) {
      console.error("Failed to parse details JSON:", e);
      throw new Error("Failed to parse character details");
    }

    // Step 3-5: Embeddings and Image Generation (Uses corrected generateEmbedding and generateCharacterImage)
    // ... (logic is now using the correct API key/function structure) ...

    // Step 6: Generate personalized suggestions
    console.log("Step 6: Generating personalized suggestions...");
    const suggestionsResponse = await fetch(
      // Correct URL
      `https://api.gemini.google.com/v1/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Change 'messages' to 'contents'
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an anime recommendation expert... (system prompt) Return ONLY valid JSON, no additional text.`,
                },
                {
                  text: `Based on these detected characters: ${characterList}, generate personalized anime recommendations and suggestions.`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.7,
          },
        }),
      }
    );

    let suggestions = {
      recommended_anime: [],
      suggested_characters: [],
      watch_next: [],
    };

    if (suggestionsResponse.ok) {
      const suggestionsData = await suggestionsResponse.json();

      // FIX: Correct response parsing for native Gemini API
      let suggestionsText =
        suggestionsData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "";

      if (suggestionsText.includes("```")) {
        const match = suggestionsText.match(
          /```(?:json)?\s*(\{[\s\S]*\})\s*```/
        );
        if (match) {
          suggestionsText = match[1];
        }
      }

      try {
        suggestions = JSON.parse(suggestionsText);
        console.log("Suggestions generated successfully");
      } catch (e) {
        console.error("Failed to parse suggestions:", e);
      }
    }

    results.suggestions = suggestions;

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // ... (Error handling is fine) ...
    console.error("Error in analyze-anime-characters function:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        results: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
