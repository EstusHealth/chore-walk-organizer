
import { useState } from 'react';
import RecordButton from '@/components/RecordButton';
import RecordingTranscription from '@/components/RecordingTranscription';

interface RecordingSectionProps {
  onTranscriptionComplete: (text: string) => void;
}

const RecordingSection = ({ onTranscriptionComplete }: RecordingSectionProps) => {
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (audioBlob: Blob) => {
    setCurrentAudioBlob(audioBlob);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6 flex flex-col items-center">
      <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Record Your Walk-Through
      </h2>
      <p className="text-gray-600 mb-4 md:mb-6 text-center text-sm md:text-base max-w-md">
        Press record, walk through your home, and narrate chores or upgrades as you go.
      </p>
      
      <RecordButton onRecordingComplete={handleRecordingComplete} />
      
      {currentAudioBlob && (
        <RecordingTranscription 
          audioBlob={currentAudioBlob}
          onTranscriptionComplete={onTranscriptionComplete}
        />
      )}
    </div>
  );
};

export default RecordingSection;
