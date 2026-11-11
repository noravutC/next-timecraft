'use client';

import { Archive, CircleCheck, Copy, Ellipsis } from 'lucide-react';
import { toggleTaskDone } from '@/components/project/task-completion';
import { ColumnMark } from '@/components/task-meta/column-mark';
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
import { offerUndo } from '@/components/undo/offer-undo';
import { Button } from '@/components/ui/button';

interface CardActionsMenuProps {
  card: TCard;
  allColumns: TColumn[];
}

export function CardActionsMenu({ card, allColumns }: CardActionsMenuProps) {
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const duplicateTask = useTaskStore((s) => s.duplicateTask);

  const otherColumns = allColumns.filter((c) => c.id !== card.columnId);
  const isFlagged = card.priority === 'high';
  const doneColumn = allColumns.find((c) => c.isDone);

  const handleArchive = () => {
    const base = { id: card.id, columnId: card.columnId, title: card.title };
    const setArchived = (archived: boolean) =>
      updateTasks([card.id], [{ ...base, archived }]);
    setArchived(true).catch(() => toast.error('Couldn’t archive the task'));
    offerUndo({
      icon: 'archive',
      title: 'Task archived',
      detail: card.title,
      undo: () => setArchived(false),
      undoneTitle: `Back in ${allColumns.find((c) => c.id === card.columnId)?.title ?? 'its column'}`,
      redo: { label: 'Archive again', run: () => setArchived(true) },
    });
  };

  const handleMoveTo = (target: TColumn) => {
    const newOrderFraction = generateFractionBetween(
      target.cards.at(-1)?.orderFraction ?? null,
      target.nextCursorFraction,
    );
    const placeAt = (columnId: string, orderFraction: string) =>
      updateTasks(
        [card.id],
        [{ id: card.id, columnId, title: card.title, orderFraction }],
      );
    const from = allColumns.find((c) => c.id === card.columnId);
    placeAt(target.id, newOrderFraction).catch(() =>
      toast.error('Couldn’t move the task'),
    );
    offerUndo({
      icon: 'move',
      title: 'Moved to',
      emphasis: target.title,
      undo: () => placeAt(card.columnId, card.orderFraction),
      undoneTitle: `Back in ${from?.title ?? 'its column'}`,
    });
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

  // the server copies subtasks and assignees too, right under the card
  const handleDuplicate = () => {
    duplicateTask(card.id).catch(() =>
      toast.error('Couldn’t duplicate the task'),
    );
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
        {doneColumn && (
          <>
            <DropdownMenuItem onClick={() => toggleTaskDone(card)}>
              <CircleCheck />
              {doneColumn.id === card.columnId
                ? 'Mark as not done'
                : 'Mark as done'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
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
                <ColumnMark
                  color={column.color}
                  done={column.isDone}
                  className="mx-0.75"
                />
                {column.title}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleArchive}>
          <Archive />
          Archive task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
