
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
      
      // Convert the blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          // Get base64 data from the result
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            throw new Error('Failed to convert audio to base64');
          }
          
          // Call the Supabase Edge Function for transcription
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          setIsProcessing(false);
          
          if (data.text) {
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
      
      reader.onerror = () => {
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
