
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Room, Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/layout/Header';
import RecordingSection from '@/components/recording/RecordingSection';
import TasksView from '@/components/tasks/TasksView';

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

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
  };

  const handleRemoveRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
    setTasks(tasks.filter(task => task.roomId !== roomId));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header tasks={tasks} rooms={rooms} />
      
      <main className="max-w-5xl mx-auto p-4">
        <RecordingSection
          onTranscriptionComplete={(text) => handleAddTask(text, rooms[0]?.id || '')}
        />
        
        <TasksView
          rooms={rooms}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddRoom={handleAddRoom}
          onRemoveRoom={handleRemoveRoom}
          onRoomPhotosUpdated={handleRoomPhotosUpdated}
        />
      </main>
    </div>
  );
};

export default Index;
