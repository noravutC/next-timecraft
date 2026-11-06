'use client';

import { Copy, Ellipsis, Trash2 } from 'lucide-react';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '@/store/use-task.store';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { TCard, TColumn } from './data';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface CardActionsMenuProps {
  card: TCard;
  allColumns: TColumn[];
}

export function CardActionsMenu({ card, allColumns }: CardActionsMenuProps) {
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const createTasks = useTaskStore((s) => s.createTasks);

  const currentIndex = allColumns.findIndex((c) => c.id === card.columnId);
  const otherColumns = allColumns.filter((c) => c.id !== card.columnId);
  const isFlagged = card.priority === 'high';

  const handleDelete = () => {
    const base = { id: card.id, columnId: card.columnId, title: card.title };
    updateTasks([card.id], [{ ...base, archived: true }]);
    toast('Task deleted', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => updateTasks([card.id], [{ ...base, archived: false }]),
      },
    });
  };

  const handleMoveTo = (target: TColumn) => {
    const newOrderFraction = generateFractionBetween(
      target.cards.at(-1)?.orderFraction ?? null,
      target.nextCursorFraction,
    );
    updateTasks(
      [card.id],
      [
        {
          id: card.id,
          columnId: target.id,
          title: card.title,
          orderFraction: newOrderFraction,
        },
      ],
    );
  };

  const handleToggleFlag = () => {
    updateTasks(
      [card.id],
      [
        {
          id: card.id,
          columnId: card.columnId,
          title: card.title,
          priority: isFlagged ? 'medium' : 'high',
        },
      ],
    );
  };

  const handleDuplicate = () => {
    const column = allColumns[currentIndex];
    if (!column) return;
    const cardIndex = column.cards.findIndex((c) => c.id === card.id);
    const nextCard = column.cards[cardIndex + 1];
    const orderFraction = generateFractionBetween(
      card.orderFraction,
      nextCard?.orderFraction ?? null,
    );
    createTasks([
      {
        columnId: card.columnId,
        title: card.title,
        description: card.description,
        tags: card.tags,
        priority: card.priority,
        dueDate: card.dueDate,
        orderFraction,
      },
    ]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
          className="size-5.5 bg-surface-hover text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-active data-[state=open]:bg-surface-active data-[state=open]:text-ink data-[state=open]:opacity-100"
          aria-label="Task actions"
        >
          <Ellipsis className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-55"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleFlag}>
          <PriorityBars
            priority={isFlagged ? 'medium' : 'high'}
            decorative
            className="size-3.75"
          />
          {isFlagged ? 'Remove high priority' : 'Mark as high priority'}
        </DropdownMenuItem>
        {otherColumns.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {otherColumns.map((column) => (
              <DropdownMenuItem
                key={column.id}
                onClick={() => handleMoveTo(column)}
              >
                <span
                  className="mx-0.75 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: column.color ?? '#94a3b8' }}
                />
                {column.title}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 />
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
