import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecordingTranscriptionProps {
  audioBlob: Blob | null;
  onTranscriptionComplete: (text: string) => void;
}

const RecordingTranscription = ({
  audioBlob,
  onTranscriptionComplete
}: RecordingTranscriptionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (!audioBlob) {
      setAudioUrl(null);
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    setIsProcessing(true);

    const processAudio = async () => {
      let rawBase64: string;
      try {
        // 1) Read as Data‑URL
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror  = () => reject(new Error('Failed to read audio'));
          reader.readAsDataURL(audioBlob);
        });

        // 2) Strip off "data:…;base64," prefix
        const parts = dataUrl.split(',');
        if (parts.length !== 2) throw new Error('Invalid data URL');
        rawBase64 = parts[1];

        // 3) Invoke your Supabase Edge Function
        const payload = JSON.stringify({
          audio: rawBase64,
          mimeType: audioBlob.type
        });

        console.log('Invoking transcribe-audio with payload size:', payload.length);
        const { data, error, status } = await supabase.functions.invoke(
          'transcribe-audio',
          { body: payload }
        );

        if (error || status < 200 || status >= 300) {
          console.error('Edge Fn error:', { status, error, data });
          throw new Error(
            `Edge function returned ${status}${error?.message ? ': '+error.message : ''}`
          );
        }

        if (!data?.text) {
          console.error('No text in response:', data);
          throw new Error('Transcription succeeded but returned no text');
        }

        // 4) Success
        console.log('Transcription:', data.text);
        toast({ title: 'Transcription Complete', description: '✔︎' });
        onTranscriptionComplete(data.text);
      } catch (err: any) {
        console.error('Primary transcription failed:', err);

        // Optional: fall back to direct fetch so you can inspect the raw HTTP response
        try {
          console.log('Falling back to direct fetch() call…');
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-audio`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ audio: rawBase64, mimeType: audioBlob.type })
            }
          );
          const text = await resp.text();
          console.log('Fetch fallback raw response:', resp.status, resp.statusText, text);
          if (!resp.ok) throw new Error(`Fetch error ${resp.status}: ${text}`);
          const json = JSON.parse(text);
          if (json.text) {
            onTranscriptionComplete(json.text);
            return;
          }
          throw new Error('Fetch fallback had no `text` field');
        } catch (fetchErr: any) {
          console.error('Fetch fallback also failed:', fetchErr);
          toast({
            title: 'Transcription Error',
            description: fetchErr.message || 'Unknown error',
            variant: 'destructive'
          });
          if (process.env.NODE_ENV === 'development') {
            onTranscriptionComplete(
              '🛠️ Development fallback text — transcription failed.'
            );
          }
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processAudio();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioBlob, onTranscriptionComplete, toast]);

  if (!audioBlob || !audioUrl) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="font-medium mb-2">Recording Preview</h3>
      <audio src={audioUrl} controls className="w-full mb-3" />
      {isProcessing ? (
        <div className="flex items-center justify-center p-4 text-chore-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Transcribing your recording...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Ready to add tasks from this recording.
        </p>
      )}
    </div>
  );
};

export default RecordingTranscription;
