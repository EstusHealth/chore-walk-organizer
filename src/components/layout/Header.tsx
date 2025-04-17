
import ExportTasksButton from '@/components/ExportTasksButton';
import { Room, Task } from '@/types';

interface HeaderProps {
  tasks: Task[];
  rooms: Room[];
}

const Header = ({ tasks, rooms }: HeaderProps) => {
  return (
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
  );
};

export default Header;
