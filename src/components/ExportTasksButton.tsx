
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Task, Room } from '@/types';
import { FileDown } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ExportTasksButtonProps {
  tasks: Task[];
  rooms: Room[];
}

const ExportTasksButton = ({ tasks, rooms }: ExportTasksButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportTasks = () => {
    try {
      setIsExporting(true);
      
      // Create a formatted export with room names
      const roomMap = new Map(rooms.map(room => [room.id, room.name]));
      
      // Format data for export
      const exportData = {
        date: new Date().toISOString(),
        rooms: rooms.map(room => ({
          name: room.name,
          tasks: tasks.filter(task => task.roomId === room.id).map(task => ({
            text: task.text,
            completed: task.completed
          }))
        }))
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `chore-walk-tasks_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Tasks exported successfully');
    } catch (error) {
      console.error('Error exporting tasks:', error);
      toast.error('Failed to export tasks');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportTasks} 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1"
      disabled={isExporting || tasks.length === 0}
    >
      <FileDown size={16} />
      <span>Export Tasks</span>
    </Button>
  );
};

export default ExportTasksButton;
