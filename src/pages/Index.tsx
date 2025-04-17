
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import RecordButton from '@/components/RecordButton';
import RecordingTranscription from '@/components/RecordingTranscription';
import RoomList from '@/components/RoomList';
import TaskList from '@/components/TaskList';
import { Room, Task } from '@/types';

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedRooms = localStorage.getItem('chore-walk-rooms');
    const savedTasks = localStorage.getItem('chore-walk-tasks');
    
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      // Add default rooms if none exist
      const defaultRooms = [
        { id: nanoid(), name: 'Living Room' },
        { id: nanoid(), name: 'Kitchen' },
        { id: nanoid(), name: 'Bedroom' },
        { id: nanoid(), name: 'Bathroom' }
      ];
      setRooms(defaultRooms);
      localStorage.setItem('chore-walk-rooms', JSON.stringify(defaultRooms));
    }
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chore-walk-rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('chore-walk-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddRoom = (name: string) => {
    const newRoom = { id: nanoid(), name };
    setRooms([...rooms, newRoom]);
    setSelectedRoomId(newRoom.id);
  };

  const handleAddTask = (text: string, roomId: string) => {
    const newTask = {
      id: nanoid(),
      text,
      completed: false,
      roomId
    };
    setTasks([...tasks, newTask]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    setCurrentAudioBlob(audioBlob);
  };

  const handleTranscriptionComplete = (text: string) => {
    setTranscription(text);
  };

  const selectedRoom = selectedRoomId 
    ? rooms.find(room => room.id === selectedRoomId) || null 
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto p-4">
          <h1 className="text-2xl font-bold text-chore-700">Chore Walk Organizer</h1>
          <p className="text-gray-600">
            Record as you walk, organize tasks room by room
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Record Your Walk-Through
          </h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Press record, walk through your home, and narrate chores or upgrades as you go.
          </p>
          
          <RecordButton onRecordingComplete={handleRecordingComplete} />
          
          {currentAudioBlob && (
            <RecordingTranscription 
              audioBlob={currentAudioBlob}
              onTranscriptionComplete={handleTranscriptionComplete}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RoomList
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            onAddRoom={handleAddRoom}
          />
          
          <TaskList
            tasks={tasks}
            selectedRoom={selectedRoom}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
