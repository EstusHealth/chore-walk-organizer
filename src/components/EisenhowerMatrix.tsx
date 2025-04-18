
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Star, Clock, AlertCircle, CircleSlash } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdatePriority: (taskId: string, isUrgent: boolean, isImportant: boolean) => void;
}

const EisenhowerMatrix = ({ tasks, onToggleTask, onDeleteTask, onUpdatePriority }: EisenhowerMatrixProps) => {
  const getQuadrantTasks = (isImportant: boolean, isUrgent: boolean) => {
    return tasks.filter(
      task => task.isImportant === isImportant && task.isUrgent === isUrgent
    );
  };

  const QuadrantCard = ({ 
    title, 
    tasks, 
    icon: Icon,
    bgColor 
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ElementType;
    bgColor: string;
  }) => (
    <Card className={`${bgColor} h-full`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon size={16} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between gap-2 bg-white/90 p-2 rounded-md">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={() => onToggleTask(task.id)}
                />
                <span className={task.completed ? "line-through text-gray-400" : ""}>{task.text}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteTask(task.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <QuadrantCard 
        title="Do First" 
        tasks={getQuadrantTasks(true, true)}
        icon={Star}
        bgColor="bg-red-50"
      />
      <QuadrantCard 
        title="Schedule" 
        tasks={getQuadrantTasks(true, false)}
        icon={Clock}
        bgColor="bg-blue-50"
      />
      <QuadrantCard 
        title="Delegate" 
        tasks={getQuadrantTasks(false, true)}
        icon={AlertCircle}
        bgColor="bg-yellow-50"
      />
      <QuadrantCard 
        title="Don't Do" 
        tasks={getQuadrantTasks(false, false)}
        icon={CircleSlash}
        bgColor="bg-gray-50"
      />
    </div>
  );
};

export default EisenhowerMatrix;
