
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log("Received audio data. MIME type:", mimeType || "audio/webm");
    
    // Extract the base64 data if it's a data URL format
    let base64Data = audio;
    if (audio.includes(',')) {
      base64Data = audio.split(',')[1];
    }
    
    const dataLength = base64Data?.length || 0;
    console.log("Audio data length:", dataLength, "characters");
    
    if (dataLength < 1000) {
      throw new Error('Audio data too small, recording may be empty');
    }

    // Ensure we have an API key for Google Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Google Gemini API key is not configured');
    }
    
    try {
      console.log("Sending request to Google Speech-to-Text API...");
      
      // Send to Google Speech-to-Text API
      const response = await fetch('https://speech.googleapis.com/v1/speech:recognize?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            model: 'default', // Use the best available model
            useEnhanced: true, // Enhanced model for better transcription
          },
          audio: {
            content: base64Data
          }
        }),
      });

      console.log("Google Speech-to-Text API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Speech-to-Text API error:', response.status, errorText);
        throw new Error(`Google Speech-to-Text API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Transcription successful, response structure:", Object.keys(result).join(', '));

      // Extract text from Google Speech API response
      let transcribedText = '';
      let confidence = null;
      
      if (result.results && result.results.length > 0) {
        const topResult = result.results[0];
        if (topResult.alternatives && topResult.alternatives.length > 0) {
          transcribedText = topResult.alternatives[0].transcript;
          confidence = topResult.alternatives[0].confidence;
          console.log(`Transcription: "${transcribedText}" (confidence: ${confidence})`);
        } else {
          console.log("No alternatives found in results");
        }
      } else {
        console.log("No results found in response");
      }
      
      if (!transcribedText) {
        throw new Error('No transcription text was generated');
      }

      return new Response(
        JSON.stringify({ 
          text: transcribedText,
          confidence: confidence 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (conversionError) {
      console.error("Audio conversion or API error:", conversionError);
      throw new Error(`Audio processing error: ${conversionError.message}`);
    }
  } catch (error) {
    console.error('Transcription Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
