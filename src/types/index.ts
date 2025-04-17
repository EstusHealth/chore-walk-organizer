
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface RecordingState {
  isRecording: boolean;
  audioURL: string | null;
  recordingTime: number;
}
