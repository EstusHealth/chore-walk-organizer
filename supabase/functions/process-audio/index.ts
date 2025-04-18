
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = "https://vzghgjpsnzleoklcyptc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    console.log('Processing audio file:', filePath);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('audio-recordings')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Error downloading file: ${downloadError.message}`);
    }

    // Convert to base64
    const audioArrayBuffer = await fileData.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    // Send to Google's Speech-to-Text API
    const speechResponse = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'default',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: base64Audio
        }
      })
    });

    if (!speechResponse.ok) {
      throw new Error(`Google Speech API error: ${await speechResponse.text()}`);
    }

    const speechResult = await speechResponse.json();
    const transcribedText = speechResult.results?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('Transcribed text:', transcribedText);

    // Extract tasks using Gemini
    const taskResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Extract tasks from this transcription and format them as a JSON array of {text: string, roomName: string}. Infer room names from context. Here's the transcription: ${transcribedText}`
          }]
        }]
      })
    });

    if (!taskResponse.ok) {
      throw new Error(`Gemini API error: ${await taskResponse.text()}`);
    }

    const taskResult = await taskResponse.json();
    const tasks = JSON.parse(taskResult.candidates[0].content.parts[0].text);
    console.log('Extracted tasks:', tasks);

    // Update the transcription record
    const { error: updateError } = await supabase
      .from('audio_transcriptions')
      .update({
        transcribed_text: transcribedText,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('file_path', filePath);

    if (updateError) {
      throw new Error(`Error updating transcription: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, transcribedText, tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
