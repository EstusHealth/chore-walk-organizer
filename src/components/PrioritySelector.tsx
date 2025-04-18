
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, CircleSlash, Clock, Star } from "lucide-react";

interface PrioritySelectorProps {
  isUrgent: boolean;
  isImportant: boolean;
  onUpdatePriority: (isUrgent: boolean, isImportant: boolean) => void;
}

const PrioritySelector = ({ isUrgent, isImportant, onUpdatePriority }: PrioritySelectorProps) => {
  const getCurrentPriorityIcon = () => {
    if (isImportant && isUrgent) return <Star className="text-red-500" />;
    if (isImportant) return <Clock className="text-blue-500" />;
    if (isUrgent) return <ArrowUpCircle className="text-yellow-500" />;
    return <CircleSlash className="text-gray-500" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {getCurrentPriorityIcon()}
          <span className="sr-only">Open priority menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onUpdatePriority(true, true)}>
          <Star className="mr-2 h-4 w-4 text-red-500" />
          <span>Do First (Urgent & Important)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdatePriority(false, true)}>
          <Clock className="mr-2 h-4 w-4 text-blue-500" />
          <span>Schedule (Important)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdatePriority(true, false)}>
          <ArrowUpCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Delegate (Urgent)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdatePriority(false, false)}>
          <CircleSlash className="mr-2 h-4 w-4 text-gray-500" />
          <span>Don't Do (Neither)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrioritySelector;
