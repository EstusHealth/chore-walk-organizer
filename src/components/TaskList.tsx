
import { Task, Room } from '@/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardList } from 'lucide-react';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  selectedRoom: Room | null;
  onAddTask: (text: string, roomId: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskList = ({
  tasks,
  selectedRoom,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) => {
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = () => {
    if (newTask.trim() && selectedRoom) {
      onAddTask(newTask.trim(), selectedRoom.id);
      setNewTask('');
      setIsAdding(false);
    }
  };

  const filteredTasks = selectedRoom
    ? tasks.filter((task) => task.roomId === selectedRoom.id)
    : [];

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardList size={18} />
          {selectedRoom ? `Tasks for ${selectedRoom.name}` : 'Select a room'}
        </h2>
        {selectedRoom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            disabled={!selectedRoom}
            className="text-chore-600 hover:text-chore-700 hover:bg-chore-100"
          >
            <PlusCircle size={16} className="mr-1" />
            Add
          </Button>
        )}
      </div>

      {isAdding && selectedRoom && (
        <div className="flex items-center mb-3 gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Task description"
            className="text-sm"
          />
          <Button onClick={handleAddTask} size="sm">
            Add
          </Button>
        </div>
      )}

      {!selectedRoom ? (
        <p className="text-sm text-gray-500 italic">Select a room to see tasks</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No tasks in this room</p>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
