
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import RecordButton from '@/components/RecordButton';
import RecordingTranscription from '@/components/RecordingTranscription';
import RoomList from '@/components/RoomList';
import TaskList from '@/components/TaskList';
import RoomPhotos from '@/components/RoomPhotos';
import AllTasksView from '@/components/AllTasksView';
import ExportTasksButton from '@/components/ExportTasksButton';
import { Room, Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("by-room");
  const isMobile = useIsMobile();

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

  const handleRemoveRoom = (roomId: string) => {
    // Remove the room
    setRooms(rooms.filter(room => room.id !== roomId));
    
    // Remove all tasks associated with this room
    const updatedTasks = tasks.filter(task => task.roomId !== roomId);
    setTasks(updatedTasks);
    
    // If the selected room is being removed, select another room if available
    if (selectedRoomId === roomId) {
      const remainingRooms = rooms.filter(room => room.id !== roomId);
      setSelectedRoomId(remainingRooms.length > 0 ? remainingRooms[0].id : null);
    }
  };

  const handleAddTask = (text: string, roomId: string) => {
    const newTask = {
      id: nanoid(),
      text,
      completed: false,
      roomId
    };
    setTasks([...tasks, newTask]);
    toast.success('Task added');
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
    toast.success('Task removed');
  };

  const handleRoomPhotosUpdated = (roomId: string, photos: string[]) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId ? { ...room, photos } : room
      )
    );
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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-xl md:text-2xl font-bold text-chore-700">Chore Walk Organizer</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Record as you walk, organize tasks room by room
            </p>
            <ExportTasksButton tasks={tasks} rooms={rooms} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
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
              onTranscriptionComplete={handleTranscriptionComplete}
            />
          )}
        </div>

        <div className="mb-4">
          <Tabs defaultValue="by-room" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-room">By Room</TabsTrigger>
              <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="by-room">
              {/* For mobile, show lists in tabs or sequential order */}
              {isMobile ? (
                <div className="flex flex-col gap-4">
                  <RoomList
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={setSelectedRoomId}
                    onAddRoom={handleAddRoom}
                    onRemoveRoom={handleRemoveRoom}
                  />
                  
                  {selectedRoom && (
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <RoomPhotos 
                        room={selectedRoom}
                        onPhotosUpdated={handleRoomPhotosUpdated}
                      />
                    </div>
                  )}
                  
                  <TaskList
                    tasks={tasks}
                    selectedRoom={selectedRoom}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <RoomList
                      rooms={rooms}
                      selectedRoomId={selectedRoomId}
                      onSelectRoom={setSelectedRoomId}
                      onAddRoom={handleAddRoom}
                      onRemoveRoom={handleRemoveRoom}
                    />
                    
                    {selectedRoom && (
                      <div className="p-4 bg-white rounded-lg shadow-sm">
                        <RoomPhotos 
                          room={selectedRoom}
                          onPhotosUpdated={handleRoomPhotosUpdated}
                        />
                      </div>
                    )}
                  </div>
                  
                  <TaskList
                    tasks={tasks}
                    selectedRoom={selectedRoom}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all-tasks">
              <AllTasksView 
                tasks={tasks}
                rooms={rooms}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
