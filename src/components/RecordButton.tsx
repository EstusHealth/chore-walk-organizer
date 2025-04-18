
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

const RecordButton = ({ onRecordingComplete }: RecordButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const maxRecordingTime = 60; // Max recording time in seconds
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      
      console.log('Requesting microphone access...');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio recording');
      }
      
      // Request microphone access with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone access granted, initializing MediaRecorder...');
      
      streamRef.current = stream;
      
      // Create and configure the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Recorded chunk: ${event.data.size} bytes`);
        }
      };
      
      // Set up stop handling
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, processing audio...');
        
        if (audioChunksRef.current.length === 0 || !audioChunksRef.current.some(chunk => chunk.size > 0)) {
          toast({
            title: "Recording Error",
            description: "No audio data was captured. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        console.log(`Created audio blob: ${audioBlob.size} bytes, type: ${mimeType}`);
        
        if (audioBlob.size < 1000) { // If blob is too small, probably no real audio was recorded
          toast({
            title: "Recording Error",
            description: "Audio recording too short or empty. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        onRecordingComplete(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Reset timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast({
          title: "Recording Complete",
          description: `Recording saved (${formatTime(recordingTime)})`,
        });
      };
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording Error",
          description: "An error occurred while recording audio.",
          variant: "destructive"
        });
        stopRecording();
      };
      
      // Start the recording
      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
      setIsPulsing(true);
      setPermissionDenied(false);
      
      console.log('MediaRecorder started successfully');
      
      // Start the timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop recording at max time
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          
          return newTime;
        });
      }, 1000);
      
      // Auto-stop recording after max recording time
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, maxRecordingTime * 1000);
      
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      
      let errorMessage = "Please enable microphone access to record audio.";
      
      // More descriptive error messages
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
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping MediaRecorder...');
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPulsing(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center justify-center">
      {recordingTime > 0 && isRecording && (
        <div className="mb-2 text-lg font-semibold text-red-500">
          {formatTime(recordingTime)} {maxRecordingTime - recordingTime <= 5 && "(Ending soon...)"}
        </div>
      )}
      
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center focus:outline-none transition-all duration-300",
          isRecording 
            ? "bg-red-500 hover:bg-red-600" 
            : permissionDenied
            ? "bg-gray-400 hover:bg-gray-500"
            : "bg-chore-600 hover:bg-chore-700",
          isPulsing && "animate-pulse",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isLoading ? (
          <Loader2 size={32} className="text-white animate-spin" />
        ) : isRecording ? (
          <Square size={32} className="text-white" />
        ) : permissionDenied ? (
          <MicOff size={32} className="text-white" />
        ) : (
          <Mic size={32} className="text-white" />
        )}
      </button>
      <span className="mt-2 text-sm font-medium text-gray-700">
        {isLoading
          ? "Initializing..." 
          : isRecording 
          ? `Tap to stop (max ${formatTime(maxRecordingTime)})` 
          : permissionDenied 
          ? "Microphone access denied" 
          : "Tap to record"}
      </span>
      {permissionDenied && (
        <p className="mt-1 text-xs text-red-500 max-w-xs text-center">
          Please check your browser settings to enable microphone access
        </p>
      )}
    </div>
  );
};

export default RecordButton;
