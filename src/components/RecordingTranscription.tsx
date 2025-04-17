```tsx
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
    // Clean up any previous object URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (!audioBlob) {
      return;
    }

    // Create a preview URL for the recorded audio
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    setIsProcessing(true);

    const processAudio = async () => {
      try {
        console.log("Starting transcription process");
        console.log("Audio blob type:", audioBlob.type);
        console.log("Audio blob size:", audioBlob.size, "bytes");

        // 1. Read the blob as a Data‑URL
        const reader = new FileReader();
        const base64DataWithPrefix: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            console.log("FileReader onloadend fired");
            resolve(reader.result as string);
          };
          reader.onerror = (e) => {
            console.error("FileReader error:", e);
            reject(new Error("Failed to read audio file"));
          };
          reader.readAsDataURL(audioBlob);
        });
        console.log("Base64 conversion successful, total length:", base64DataWithPrefix.length);

        // 2. Strip off the "data:...;base64," prefix
        const rawBase64 = base64DataWithPrefix.split(',')[1];
        if (!rawBase64) {
          throw new Error("Invalid base64 data");
        }

        // 3. Call your Supabase Edge Function with POST
        console.log("Calling transcribe-audio function...");
        const payload = JSON.stringify({
          audio: rawBase64,
          mimeType: audioBlob.type
        });

        const { data, error } = await supabase.functions.invoke(
          'transcribe-audio',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          }
        );

        if (error) {
          console.error("Supabase function error:", error);
          throw new Error(error.message || "Error calling transcription function");
        }

        console.log("Transcription response received:", data);
        setIsProcessing(false);

        if (data?.text) {
          toast({
            title: "Transcription Complete",
            description: "Successfully transcribed your recording"
          });
          onTranscriptionComplete(data.text);
        } else {
          console.error("No text in transcription response:", data);
          toast({
            title: "Transcription Error",
            description: "Could not transcribe audio. Please try again.",
            variant: "destructive"
          });
          if (process.env.NODE_ENV === 'development') {
            console.log("Using fallback text in development mode");
            onTranscriptionComplete("This is fallback text since transcription failed.");
          }
        }
      } catch (err) {
        console.error("Transcription error:", err);
        setIsProcessing(false);
        toast({
          title: "Transcription Error",
          description: err instanceof Error ? err.message : "Failed to transcribe audio",
          variant: "destructive"
        });
        if (process.env.NODE_ENV === 'development') {
          console.log("Using fallback text in development mode after error");
          onTranscriptionComplete("This is fallback text since transcription failed with an error.");
        }
      }
    };

    processAudio();

    return () => {
      // Clean up object URL when the component unmounts or audioBlob changes
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioBlob, audioUrl, onTranscriptionComplete, toast]);

  if (!audioBlob || !audioUrl) return null;

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
```