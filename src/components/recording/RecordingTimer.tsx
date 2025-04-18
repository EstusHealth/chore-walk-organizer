
import { formatTime } from '@/utils/timeFormat';

interface RecordingTimerProps {
  recordingTime: number;
  isRecording: boolean;
  maxRecordingTime: number;
}

const RecordingTimer = ({ recordingTime, isRecording, maxRecordingTime }: RecordingTimerProps) => {
  if (recordingTime === 0 || !isRecording) return null;

  return (
    <div className="mb-2 text-lg font-semibold text-red-500">
      {formatTime(recordingTime)} {maxRecordingTime - recordingTime <= 5 && "(Ending soon...)"}
    </div>
  );
};

export default RecordingTimer;

