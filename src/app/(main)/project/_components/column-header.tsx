'use client';

import type { RefObject } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnMenu } from './column-menu';
import type { TColumn } from './data';
import type { ColumnActions } from './use-column-actions';

interface ColumnHeaderProps {
  column: TColumn;
  headerRef: RefObject<HTMLDivElement | null>;
  actions: ColumnActions;
  canAddCards: boolean;
  /** owners and admins: the ⋯ menu */
  canManage: boolean;
  loading: boolean;
  onAddTop: () => void;
}

/** Dot, name (or the rename field), count, + and ⋯. */
export const ColumnHeader = ({
  column,
  headerRef,
  actions,
  canAddCards,
  canManage,
  loading,
  onAddTop,
}: ColumnHeaderProps) => {
  const overLimit = column.wipLimit > 0 && column.totalTasks > column.wipLimit;

  return (
    <div
      className="flex h-11 flex-row items-center gap-2 pr-1.5 pl-3.5"
      ref={headerRef}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: column.color ?? '#94A3B8' }}
      />
      {actions.renaming ? (
        <Input
          autoFocus
          aria-label="Column name"
          defaultValue={column.title}
          maxLength={100}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => actions.rename(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') actions.rename(e.currentTarget.value);
            if (e.key === 'Escape') actions.cancelRename();
          }}
          className="h-7 min-w-0 flex-1 px-1.5 text-sm font-semibold"
        />
      ) : (
        <>
          <h2 className="truncate text-sm font-semibold text-ink">
            {column.title}
          </h2>
          <span
            title={
              column.wipLimit > 0 ? `WIP limit ${column.wipLimit}` : undefined
            }
            className={cn(
              'font-mono text-xs',
              overLimit ? 'font-medium text-warning' : 'text-ink-subtle',
            )}
          >
            {column.wipLimit > 0
              ? `${column.totalTasks}/${column.wipLimit}`
              : column.totalTasks}
          </span>
          <div className="flex-1" />
          {canAddCards ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddTop}
              aria-label={`Add a card to the top of ${column.title}`}
              disabled={loading}
              className="size-7 text-ink-subtle hover:bg-surface-active hover:text-ink"
            >
              <Plus className="size-3.75" />
            </Button>
          ) : (
            <span aria-hidden className="size-7" />
          )}
          {canManage && <ColumnMenu column={column} actions={actions} />}
        </>
      )}
    </div>
  );
};
