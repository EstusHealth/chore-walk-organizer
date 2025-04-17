
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
    // Clean up the previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (audioBlob) {
      // Create a new audio URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setIsProcessing(true);
      
      // Use FileReader to properly read the blob as ArrayBuffer first
      const reader = new FileReader();
      reader.readAsArrayBuffer(audioBlob);
      
      reader.onloadend = async () => {
        try {
          console.log("Audio blob type:", audioBlob.type);
          console.log("Audio blob size:", audioBlob.size);
          
          // Convert ArrayBuffer to base64
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 1024;
          
          // Process in smaller chunks to avoid call stack size exceeded
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          
          const base64Audio = btoa(binary);
          console.log("Base64 conversion successful, length:", base64Audio.length);
          
          // Call the Supabase Edge Function for transcription
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          setIsProcessing(false);
          
          if (data?.text) {
            onTranscriptionComplete(data.text);
          } else {
            toast({
              title: "Transcription Error",
              description: "Could not transcribe audio. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Transcription error:', error);
          setIsProcessing(false);
          toast({
            title: "Transcription Error",
            description: error instanceof Error ? error.message : "Failed to transcribe audio",
            variant: "destructive"
          });
          
          // Fall back to simulated transcription in case of error
          const mockTranscription = "This is a fallback transcription. It appears there was an issue with the transcription service. You can still add tasks manually.";
          onTranscriptionComplete(mockTranscription);
        }
      };
      
      reader.onerror = (event) => {
        console.error('FileReader error:', event);
        setIsProcessing(false);
        toast({
          title: "Audio Processing Error",
          description: "Failed to process the audio file",
          variant: "destructive"
        });
      };
    }

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioBlob, onTranscriptionComplete, toast]);

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
