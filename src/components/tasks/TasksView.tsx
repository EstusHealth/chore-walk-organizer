
import { useState } from 'react';
import { Room, Task } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomList from '@/components/RoomList';
import TaskList from '@/components/TaskList';
import AllTasksView from '@/components/AllTasksView';
import RoomPhotos from '@/components/RoomPhotos';

interface TasksViewProps {
  rooms: Room[];
  tasks: Task[];
  onAddTask: (text: string, roomId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddRoom: (name: string) => void;
  onRemoveRoom: (roomId: string) => void;
  onRoomPhotosUpdated: (roomId: string, photos: string[]) => void;
  onUpdateTaskPriority: (taskId: string, isUrgent: boolean, isImportant: boolean) => void;
}

const TasksView = ({
  rooms,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddRoom,
  onRemoveRoom,
  onRoomPhotosUpdated,
  onUpdateTaskPriority,
}: TasksViewProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("by-room");

  const selectedRoom = selectedRoomId 
    ? rooms.find(room => room.id === selectedRoomId) || null 
    : null;

  return (
    <div className="mb-4">
      <Tabs defaultValue="by-room" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-room">By Room</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="by-room">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <RoomList
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={setSelectedRoomId}
                onAddRoom={onAddRoom}
                onRemoveRoom={onRemoveRoom}
              />
              
              {selectedRoom && (
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <RoomPhotos 
                    room={selectedRoom}
                    onPhotosUpdated={onRoomPhotosUpdated}
                  />
                </div>
              )}
            </div>
            
            <TaskList
              tasks={tasks}
              selectedRoom={selectedRoom}
              onAddTask={onAddTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="all-tasks">
          <AllTasksView 
            tasks={tasks}
            rooms={rooms}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onUpdateTaskPriority={onUpdateTaskPriority}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksView;
