
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
    
    console.log("Audio data length:", base64Data.length, "characters");

    // Ensure we have an API key for Google Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Google Gemini API key is not configured');
    }
    
    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log("Converted to binary data of length:", bytes.length, "bytes");
    
    // Create form data with the audio blob
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: mimeType || 'audio/webm' });
    formData.append('audio', audioBlob, 'recording.webm');
    
    console.log("Sending request to Google Gemini API...");
    
    // Send to Google Gemini Speech-to-Text API
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: base64Data
        }
      }),
    });

    console.log("Google Gemini API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Gemini API error:', response.status, errorText);
      throw new Error(`Google Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Transcription successful:", result);

    // Extract text from Google Speech API response
    let transcribedText = '';
    let confidence = null;
    
    if (result.results && result.results.length > 0) {
      const topResult = result.results[0];
      if (topResult.alternatives && topResult.alternatives.length > 0) {
        transcribedText = topResult.alternatives[0].transcript;
        confidence = topResult.alternatives[0].confidence;
      }
    }

    return new Response(
      JSON.stringify({ 
        text: transcribedText,
        confidence: confidence 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
