
import { Mic, Square, Loader2, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import RecordingTimer from '@/components/recording/RecordingTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatTime } from '@/utils/timeFormat';

interface RecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

const RecordButton = ({ onRecordingComplete }: RecordButtonProps) => {
  const maxRecordingTime = 60;
  
  const {
    isRecording,
    isPulsing,
    recordingTime,
    permissionDenied,
    isLoading,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    maxRecordingTime,
    onRecordingComplete
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <RecordingTimer 
        recordingTime={recordingTime}
        isRecording={isRecording}
        maxRecordingTime={maxRecordingTime}
      />
      
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

