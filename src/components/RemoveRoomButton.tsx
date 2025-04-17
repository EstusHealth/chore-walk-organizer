
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/sonner';

interface RemoveRoomButtonProps {
  roomId: string;
  roomName: string;
  onRemove: (roomId: string) => void;
  disabled?: boolean;
}

const RemoveRoomButton = ({ roomId, roomName, onRemove, disabled }: RemoveRoomButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleRemove = () => {
    onRemove(roomId);
    toast.success(`${roomName} removed`);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
          disabled={disabled}
        >
          <Trash2 size={16} />
          <span className="sr-only">Remove room</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {roomName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove this room and all associated tasks. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} className="bg-red-500 hover:bg-red-600">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveRoomButton;
