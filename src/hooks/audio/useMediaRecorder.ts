
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseMediaRecorderProps {
  onDataAvailable: (chunk: Blob) => void;
  onError: (error: Error) => void;
}

export const useMediaRecorder = ({ onDataAvailable, onError }: UseMediaRecorderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      setIsLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio recording');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          onDataAvailable(event.data);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        onError(new Error('MediaRecorder error'));
      };
      
      mediaRecorder.start(500);
      setPermissionDenied(false);
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      setIsLoading(false);
      
      let errorMessage = "Please enable microphone access to record audio.";
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No microphone detected. Please ensure a microphone is connected.";
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access was denied. Please allow microphone access in your browser settings.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Cannot access microphone. It may be in use by another application.";
      }
      
      toast({
        title: "Microphone Access Error",
        description: errorMessage,
        variant: "destructive"
      });

      onError(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
        onError(error as Error);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return {
    startRecording,
    stopRecording,
    isLoading,
    permissionDenied
  };
};
