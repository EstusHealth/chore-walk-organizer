
import { useState } from 'react';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import RemoveRoomButton from './RemoveRoomButton';

interface RoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: (roomName: string) => void;
  onRemoveRoom: (roomId: string) => void;
}

const RoomList = ({ 
  rooms, 
  selectedRoomId, 
  onSelectRoom, 
  onAddRoom,
  onRemoveRoom
}: RoomListProps) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      onAddRoom(newRoomName.trim());
      setNewRoomName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Home size={18} />
          Rooms
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="text-chore-600 hover:text-chore-700 hover:bg-chore-100"
        >
          <PlusCircle size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="flex items-center mb-3 gap-2">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name"
            className="text-sm"
          />
          <Button onClick={handleAddRoom} size="sm">
            Add
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {rooms.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No rooms added yet</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between">
              <button
                onClick={() => onSelectRoom(room.id)}
                className={`flex-grow text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-chore-100 text-chore-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {room.name}
              </button>
              <RemoveRoomButton 
                roomId={room.id} 
                roomName={room.name} 
                onRemove={onRemoveRoom}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
