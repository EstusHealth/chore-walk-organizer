
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
      
      const processAudio = async () => {
        try {
          console.log("Audio blob type:", audioBlob.type);
          console.log("Audio blob size:", audioBlob.size, "bytes");
          
          // Convert audio to base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          
          console.log("Base64 conversion successful");
          
          // Call the transcription function
          console.log("Calling transcribe-audio function...");
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audio: base64Data,
              mimeType: audioBlob.type 
            }
          });
          
          if (error) {
            console.error("Supabase function error:", error);
            throw new Error(error.message || "Error calling transcription function");
          }
          
          console.log("Transcription response received:", data);
          
          setIsProcessing(false);
          
          if (data?.text) {
            toast({
              title: "Transcription Complete",
              description: "Successfully transcribed your recording",
            });
            onTranscriptionComplete(data.text);
          } else {
            console.error("No text in transcription response:", data);
            toast({
              title: "Transcription Error",
              description: "Could not transcribe audio. Please try again.",
              variant: "destructive"
            });
            
            // Add fallback for testing if needed
            if (process.env.NODE_ENV === 'development') {
              console.log("Using fallback text in development mode");
              onTranscriptionComplete("This is fallback text since transcription failed.");
            }
          }
        } catch (error) {
          console.error('Transcription error:', error);
          setIsProcessing(false);
          toast({
            title: "Transcription Error",
            description: error instanceof Error ? error.message : "Failed to transcribe audio",
            variant: "destructive"
          });
        }
      };
      
      processAudio();
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
