
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
      audioChunksRef.current = []; // Clear any previous audio chunks
      
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
      
      // Create and configure the MediaRecorder with high quality settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Adding chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        } else {
          console.warn('Received empty data chunk');
        }
      };
      
      // Set up stop handling
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, processing audio...');
        console.log(`Total chunks: ${audioChunksRef.current.length}`);
        
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
        
        console.log(`Created audio blob: ${audioBlob.size} bytes, type: ${mimeType}`);
        
        if (audioBlob.size < 1000) { // If blob is too small, probably no real audio was recorded
          toast({
            title: "Recording Error",
            description: "Audio recording too short or empty. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        onRecordingComplete(audioBlob);
        
        // Clean up stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('Audio track stopped');
          });
          streamRef.current = null;
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
        
        setIsLoading(false);
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
        setIsLoading(false);
      };
      
      // Start the recording with smaller chunks for more accurate timing
      mediaRecorder.start(500); // Capture in 500ms chunks for more frequent updates
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
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Request one final data chunk before stopping
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
    } else {
      console.warn('MediaRecorder not active, nothing to stop');
    }
  };

  // Cleanup on component unmount
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
