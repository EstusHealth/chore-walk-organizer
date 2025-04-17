
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group">
      <div className="flex items-center gap-3">
        <Checkbox 
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={onToggle}
        />
        <label 
          htmlFor={`task-${task.id}`}
          className={cn(
            "text-sm font-medium cursor-pointer", 
            task.completed && "line-through text-gray-400"
          )}
        >
          {task.text}
        </label>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
      >
        <Trash2 size={16} />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
};

export default TaskItem;
