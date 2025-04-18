
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
    const { audioBase64, fileId } = await req.json();
    console.log('Processing audio data. File ID:', fileId);
    
    if (!audioBase64 || !fileId) {
      throw new Error('Missing required parameters: audioBase64 or fileId');
    }
    
    // Send to Google's Speech-to-Text API
    console.log('Sending to Google Speech-to-Text API');
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
          model: 'latest_short',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audioBase64
        }
      })
    });

    if (!speechResponse.ok) {
      const errorText = await speechResponse.text();
      console.error('Speech-to-Text API error:', errorText);
      throw new Error(`Google Speech API error: ${errorText}`);
    }

    const speechResult = await speechResponse.json();
    console.log('Speech API response structure:', Object.keys(speechResult));
    
    // Extract transcription
    const transcribedText = speechResult.results?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('Transcribed text:', transcribedText);

    if (!transcribedText) {
      throw new Error('No transcription was generated from the audio');
    }

    // Extract tasks using Gemini
    console.log('Extracting tasks with Gemini');
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
            text: `Extract tasks from this transcription and format them as a JSON array of {text: string, roomName: string} objects. 
            Infer room names from context. If no room is mentioned, use "General". 
            Here's the transcription: ${transcribedText}`
          }]
        }]
      })
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const taskResult = await taskResponse.json();
    console.log('Gemini response structure:', Object.keys(taskResult));
    
    // Parse tasks from Gemini response
    let tasks = [];
    try {
      const textContent = taskResult.candidates[0].content.parts[0].text;
      tasks = JSON.parse(textContent);
      console.log('Extracted tasks:', tasks);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      tasks = [{ text: transcribedText, roomName: "General" }];
    }

    // Update database record if fileId is provided
    if (fileId) {
      console.log('Updating database record for fileId:', fileId);
      const { error: updateError } = await supabase
        .from('audio_transcriptions')
        .update({
          transcribed_text: transcribedText,
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', fileId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Error updating transcription: ${updateError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcribedText, 
        tasks,
        fileId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing audio:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
