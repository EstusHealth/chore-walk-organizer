import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatTime } from '@/utils/timeFormat';

interface UseAudioRecorderProps {
  maxRecordingTime: number;
  onRecordingComplete: (audioBlob: Blob) => void;
}

export const useAudioRecorder = ({ maxRecordingTime, onRecordingComplete }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const uploadAudioBlob = async (audioBlob: Blob) => {
    try {
      const fileName = `recording_${new Date().toISOString()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        toast({
          title: "Upload Error",
          description: "Failed to upload audio recording.",
          variant: "destructive"
        });
        return null;
      }

      const { error: transcriptionError } = await supabase
        .from('audio_transcriptions')
        .insert({
          file_path: uploadData.path,
          status: 'pending',
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (transcriptionError) {
        console.error('Error creating transcription record:', transcriptionError);
        return null;
      }

      const { error: processError } = await supabase.functions
        .invoke('process-audio', {
          body: { filePath: uploadData.path }
        });

      if (processError) {
        console.error('Error triggering transcription:', processError);
      }

      return uploadData.path;
    } catch (error) {
      console.error('Audio upload error:', error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive"
      });
      return null;
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder stopped');
        
        setIsRecording(false);
        setIsPulsing(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast({
          title: "Error",
          description: "Failed to stop recording properly.",
          variant: "destructive"
        });
      }
    }
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      audioChunksRef.current = [];
      
      console.log('Requesting microphone access...');
      
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
      
      console.log('Microphone access granted, initializing MediaRecorder...');
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Adding chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing audio...');
        
        if (audioChunksRef.current.length === 0) {
          toast({
            title: "Recording Error",
            description: "No audio data was captured. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 1000) {
          toast({
            title: "Recording Error",
            description: "Audio recording too short or empty. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        const uploadedFilePath = await uploadAudioBlob(audioBlob);
        
        onRecordingComplete(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        toast({
          title: "Recording Complete",
          description: `Recording saved (${formatTime(recordingTime)})${
            uploadedFilePath ? ' and uploaded to cloud' : ''
          }`,
        });
        
        setIsLoading(false);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording Error",
          description: "An error occurred while recording audio.",
          variant: "destructive"
        });
        stopRecording();
        setIsLoading(false);
      };
      
      mediaRecorder.start(500);
      setIsRecording(true);
      setIsPulsing(true);
      setPermissionDenied(false);
      
      console.log('MediaRecorder started successfully');
      
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            console.log('Maximum recording time reached, stopping...');
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
      
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
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Error stopping MediaRecorder during cleanup:', e);
        }
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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
