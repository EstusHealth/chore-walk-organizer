
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
      
      // Start the recording
      mediaRecorder.start();
      setIsRecording(true);
      setIsPulsing(true);
      setPermissionDenied(false);
      
      // Start the timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access to record audio.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPulsing(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
        <div className="mb-2 text-lg font-semibold text-chore-600">
          {formatTime(recordingTime)}
        </div>
      )}
      
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center focus:outline-none transition-all duration-300",
          isRecording 
            ? "bg-red-500 hover:bg-red-600" 
            : permissionDenied
            ? "bg-gray-400 hover:bg-gray-500"
            : "bg-chore-600 hover:bg-chore-700",
          isPulsing && "animate-pulse"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <Square size={32} className="text-white" />
        ) : permissionDenied ? (
          <MicOff size={32} className="text-white" />
        ) : (
          <Mic size={32} className="text-white" />
        )}
      </button>
      <span className="mt-2 text-sm font-medium text-gray-700">
        {isRecording ? "Tap to stop" : permissionDenied ? "Microphone access denied" : "Tap to record"}
      </span>
    </div>
  );
};

export default RecordButton;
