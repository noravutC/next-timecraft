"use client";

import { EllipsisVertical, Trash2, Archive, Copy, Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/store/use-task.store";
import { TCard } from "./data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CardActionsMenuProps {
  card: TCard;
}

export function CardActionsMenu({ card }: CardActionsMenuProps) {
  const updateTasks = useTaskStore((s) => s.updateTasks);

  const handleDelete = () => {
    const base = { id: card.id, columnId: card.columnId, title: card.title };
    updateTasks([card.id], [{ ...base, archived: true }]);
    toast("Task deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => updateTasks([card.id], [{ ...base, archived: false }]),
      },
    });
  };

  const handleArchive = () => {
    updateTasks(
      [card.id],
      [{ id: card.id, columnId: card.columnId, title: card.title, archived: true }],
    );
    toast("Task archived");
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(card.title);
    toast("Copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size={'xs'}
          variant={'ghost'}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100"
          // className=" cursor-pointer rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Task actions"
        >
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleCopyTitle}>
          <Copy size={13} className="mr-2" />
          Copy title
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleArchive}>
          <Archive size={13} className="mr-2" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-500 focus:text-red-500 focus:bg-red-50"
        >
          <Trash2 size={13} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
