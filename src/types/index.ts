export interface Task {
  id: string;
  text: string;
  completed: boolean;
  roomId: string;
  isUrgent?: boolean;
  isImportant?: boolean;
}

export interface Room {
  id: string;
  name: string;
  photos?: string[]; // URLs to photos stored in Supabase
}

export interface RecordingState {
  isRecording: boolean;
  audioURL: string | null;
  recordingTime: number;
}
