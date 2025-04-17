
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
      
      // Simulate transcription with a timeout
      // In a real app, you would call a speech-to-text API here
      setTimeout(() => {
        setIsProcessing(false);
        const mockTranscription = "This is a simulated transcription. In a real app, this would be the text from your speech-to-text service. For now, you can add tasks manually.";
        onTranscriptionComplete(mockTranscription);
      }, 2500);
    }

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioBlob, onTranscriptionComplete]);

  if (!audioBlob || !audioUrl) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="font-medium mb-2">Recording Preview</h3>
      <audio src={audioUrl} controls className="w-full mb-3" />
      
      {isProcessing ? (
        <div className="flex items-center justify-center p-4 text-chore-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Processing your recording...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic">
          Note: This is a prototype. Real transcription would require integration with a speech-to-text API.
        </p>
      )}
    </div>
  );
};

export default RecordingTranscription;
