
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
    
    // Convert base64 to binary in a safer way
    let binaryData;
    try {
      // Convert base64 to binary string
      const binaryString = atob(base64Data);
      // Create a Uint8Array from the binary string
      binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
    } catch (convError) {
      console.error('Base64 conversion error:', convError);
      throw new Error(`Failed to convert base64 to binary: ${convError.message}`);
    }
    
    const blob = new Blob([binaryData], { type: mimeType || 'audio/webm' });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log("Sending to OpenAI API...");
    
    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Transcription successful");

    return new Response(
      JSON.stringify({ 
        text: result.text,
        confidence: result.confidence || null 
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
