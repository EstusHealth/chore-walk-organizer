
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatTime } from '@/utils/timeFormat';
import { useMediaRecorder } from './audio/useMediaRecorder';
import { useRecordingTimer } from './audio/useRecordingTimer';

interface UseAudioRecorderProps {
  maxRecordingTime: number;
  onRecordingComplete: (audioBlob: Blob) => void;
}

export const useAudioRecorder = ({ maxRecordingTime, onRecordingComplete }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleRecordingError = (error: Error) => {
    toast({
      title: "Recording Error",
      description: error.message,
      variant: "destructive"
    });
    stopRecording();
  };

  const handleDataAvailable = (chunk: Blob) => {
    if (chunk.size > 0) {
      console.log(`Adding chunk: ${chunk.size} bytes`);
      audioChunksRef.current.push(chunk);
    }
  };

  const { startRecording: startMediaRecorder, stopRecording: stopMediaRecorder, isLoading, permissionDenied } = 
    useMediaRecorder({
      onDataAvailable: handleDataAvailable,
      onError: handleRecordingError
    });

  const { recordingTime, startTimer, stopTimer } = useRecordingTimer({
    maxRecordingTime,
    onMaxTimeReached: stopRecording
  });

  const stopRecording = () => {
    console.log('Stopping recording...');
    stopMediaRecorder();
    stopTimer();
    setIsRecording(false);
    setIsPulsing(false);

    const audioBlob = new Blob(audioChunksRef.current, { 
      type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    });

    if (audioBlob.size > 1000) {
      onRecordingComplete(audioBlob);
      toast({
        title: "Recording Complete",
        description: `Recording saved (${formatTime(recordingTime)})`,
      });
    } else {
      toast({
        title: "Recording Error",
        description: "Recording too short or empty. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    await startMediaRecorder();
    setIsRecording(true);
    setIsPulsing(true);
    startTimer();
  };

  return {
    isRecording,
    isPulsing,
    recordingTime,
    permissionDenied,
    isLoading,
    startRecording,
    stopRecording
  };
};
