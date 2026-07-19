'use client';

import { ArrowRight, Copy, Ellipsis, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '@/store/use-task.store';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { TCard, TColumn } from './data';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItemClass =
  'gap-2.5 rounded-lg px-2.5 py-2 font-medium text-ink-subtle focus:bg-surface-hover focus:text-brand [&_svg]:!text-current';

interface CardActionsMenuProps {
  card: TCard;
  allColumns: TColumn[];
}

export function CardActionsMenu({ card, allColumns }: CardActionsMenuProps) {
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const createTasks = useTaskStore((s) => s.createTasks);

  const currentIndex = allColumns.findIndex((c) => c.id === card.columnId);
  const nextColumn = allColumns[currentIndex + 1] ?? null;

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

  const handleMoveNext = () => {
    if (!nextColumn) return;
    const newOrderFraction = generateFractionBetween(
      nextColumn.cards.at(-1)?.orderFraction ?? null,
      nextColumn.nextCursorFraction,
    );
    updateTasks(
      [card.id],
      [
        {
          id: card.id,
          columnId: nextColumn.id,
          title: card.title,
          orderFraction: newOrderFraction,
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
          size={'xs'}
          variant={'ghost'}
          onClick={(e) => e.stopPropagation()}
          className="size-6 rounded-lg bg-white p-0 text-ink-faint opacity-0 group-hover:opacity-100 hover:bg-surface-hover hover:text-brand data-[state=open]:bg-surface-hover data-[state=open]:text-brand data-[state=open]:opacity-100"
          aria-label="Task actions"
        >
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-52 rounded-xl border-line p-1.5 shadow-[0_10px_34px_rgba(20,22,35,0.13)]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={handleMoveNext}
          disabled={!nextColumn}
          className={menuItemClass}
        >
          <ArrowRight />
          Move to next column
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate} className={menuItemClass}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1 bg-line/70" />
        <DropdownMenuItem
          onClick={handleDelete}
          className={cn(
            menuItemClass,
            'text-red-500 focus:bg-red-50 focus:text-red-500',
          )}
        >
          <Trash2 />
          Delete card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
