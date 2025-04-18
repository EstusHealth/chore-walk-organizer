
import { Task, Room } from '@/types';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, ListFilter } from 'lucide-react';
import { useState } from 'react';
import EisenhowerMatrix from './EisenhowerMatrix';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import PrioritySelector from './PrioritySelector';

interface AllTasksViewProps {
  tasks: Task[];
  rooms: Room[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskPriority: (taskId: string, isUrgent: boolean, isImportant: boolean) => void;
}

const AllTasksView = ({ 
  tasks, 
  rooms, 
  onToggleTask, 
  onDeleteTask,
  onUpdateTaskPriority 
}: AllTasksViewProps) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  
  const roomMap = new Map(rooms.map(room => [room.id, room.name]));
  
  const filteredTasks = showCompleted 
    ? tasks 
    : tasks.filter(task => !task.completed);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ListFilter size={18} />
            All Tasks
          </h2>
          <RadioGroup
            defaultValue="list"
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'list' | 'matrix')}
            className="flex items-center space-x-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="list" id="list" />
              <Label htmlFor="list">List</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="matrix" id="matrix" />
              <Label htmlFor="matrix">Matrix</Label>
            </div>
          </RadioGroup>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No tasks created yet</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No incomplete tasks</p>
      ) : viewMode === 'matrix' ? (
        <EisenhowerMatrix
          tasks={filteredTasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onUpdatePriority={onUpdateTaskPriority}
        />
      ) : (
        <Table>
          <TableCaption>Tasks across all rooms</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Done</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow 
                key={task.id}
                className={task.completed ? "bg-gray-50" : ""}
              >
                <TableCell className="text-center">
                  <Checkbox 
                    id={`all-task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleTask(task.id)}
                  />
                </TableCell>
                <TableCell className={task.completed ? "text-gray-400 line-through" : ""}>
                  {task.text}
                </TableCell>
                <TableCell>{roomMap.get(task.roomId) || 'Unknown Room'}</TableCell>
                <TableCell>
                  <PrioritySelector
                    isUrgent={task.isUrgent || false}
                    isImportant={task.isImportant || false}
                    onUpdatePriority={(isUrgent, isImportant) => 
                      onUpdateTaskPriority(task.id, isUrgent, isImportant)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AllTasksView;
