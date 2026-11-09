'use client';

import {
  ArrowLeft,
  ArrowRight,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { wipLimitLabel } from '@/helper/utils/column-copy';
import { ColumnColorSwatches } from './column-color-swatches';
import type { ColumnActions } from './use-column-actions';
import type { TColumn } from './data';

/** ⋯ on a column: rename, color, WIP limit, move, delete. */
export const ColumnMenu = ({
  column,
  actions,
}: {
  column: TColumn;
  actions: ColumnActions;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${column.title} column menu`}
        className="size-7 text-ink-subtle hover:bg-surface-active hover:text-ink data-[state=open]:bg-surface-active"
      >
        <MoreHorizontal className="size-3.75" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className="w-62"
      // the rename field takes focus, not the trigger
      onCloseAutoFocus={(e) => actions.renaming && e.preventDefault()}
    >
      <DropdownMenuItem onSelect={actions.startRename}>
        <Pencil />
        Rename
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <div className="flex flex-col gap-2 px-2 py-1.5">
        <span className="text-xs text-ink-subtle">Color</span>
        <ColumnColorSwatches
          label={`Color of ${column.title}`}
          value={column.color}
          onChange={actions.recolor}
        />
      </div>
      <DropdownMenuSeparator />
      <div className="flex items-center gap-3 px-2 py-1.5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm text-ink">WIP limit</span>
          <span className="text-xs leading-4 text-ink-subtle">
            Flags the column when it holds more cards
          </span>
        </span>
        <span className="flex shrink-0 items-center rounded-md border border-line">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Lower the WIP limit"
            disabled={column.wipLimit === 0}
            onClick={() =>
              actions.setWipLimit(Math.max(0, column.wipLimit - 1))
            }
          >
            <Minus className="size-3" />
          </Button>
          <span className="min-w-7 text-center font-mono text-xs text-ink">
            {wipLimitLabel(column.wipLimit)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Raise the WIP limit"
            onClick={() => actions.setWipLimit(column.wipLimit + 1)}
          >
            <Plus className="size-3" />
          </Button>
        </span>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={!actions.canMoveLeft}
        onSelect={() => actions.move(-1)}
      >
        <ArrowLeft />
        Move left
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={!actions.canMoveRight}
        onSelect={() => actions.move(1)}
      >
        <ArrowRight />
        Move right
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onSelect={() => actions.setConfirmDelete(true)}
      >
        <Trash2 />
        Delete column
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
