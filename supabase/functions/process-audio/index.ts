
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
    const reader = new FileReader();
    const base64Audio = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(fileData);
    });

    // Send to OpenAI for transcription
    const formData = new FormData();
    formData.append('file', fileData);
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`OpenAI API error: ${await transcriptionResponse.text()}`);
    }

    const { text: transcribedText } = await transcriptionResponse.json();
    console.log('Transcribed text:', transcribedText);

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

    // Extract tasks and room assignments using GPT
    const taskResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract tasks from the transcription. Format as JSON array of {text: string, roomName: string}. Infer room names from context.'
          },
          {
            role: 'user',
            content: transcribedText
          }
        ]
      })
    });

    const { choices } = await taskResponse.json();
    const tasks = JSON.parse(choices[0].message.content);

    console.log('Extracted tasks:', tasks);

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
