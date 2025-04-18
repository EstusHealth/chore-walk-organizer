
import { useRef, useState, useEffect } from 'react';

interface UseRecordingTimerProps {
  maxRecordingTime: number;
  onMaxTimeReached: () => void;
}

export const useRecordingTimer = ({ maxRecordingTime, onMaxTimeReached }: UseRecordingTimerProps) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= maxRecordingTime) {
          onMaxTimeReached();
          return maxRecordingTime;
        }
        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    recordingTime,
    startTimer,
    stopTimer
  };
};
