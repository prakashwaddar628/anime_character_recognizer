import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
- related_characters: Array of 1-2 related characters with "name" and "reason" fields
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
