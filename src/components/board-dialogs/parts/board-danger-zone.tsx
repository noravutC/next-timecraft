'use client';

import { Archive, ArchiveRestore, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Danger zone tab: archive/unarchive and delete (each opens a confirm). */
export const BoardDangerZone = ({
  archived,
  canArchive,
  canDelete,
  onArchiveClick,
  onDeleteClick,
}: {
  archived: boolean;
  /** owners and admins */
  canArchive: boolean;
  /** owners only */
  canDelete: boolean;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
}) =>
  !canArchive && !canDelete ? (
    <p className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-muted">
      <Lock className="size-3.75 shrink-0 text-ink-subtle" />
      Only the board’s owner can delete it, and owners or admins can archive it.
    </p>
  ) : (
    <div className="flex flex-col overflow-hidden rounded-popover border border-danger-line">
      {canArchive && (
        <div className="flex items-center gap-4 p-4.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">
              {archived ? 'Unarchive board' : 'Archive board'}
            </span>
            <span className="text-sm leading-5 text-ink-subtle">
              {archived
                ? 'Bring it back to your active boards.'
                : 'Hide it from your active boards. You can restore it later.'}
            </span>
          </span>
          <Button
            variant="outline"
            onClick={onArchiveClick}
            className="shrink-0"
          >
            {archived ? (
              <ArchiveRestore className="size-3.75" />
            ) : (
              <Archive className="size-3.75" />
            )}
            {archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      )}
      {canArchive && canDelete && <div className="h-px bg-danger-line" />}
      {canDelete && (
        <div className="flex items-center gap-4 bg-danger-soft/40 p-4.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">Delete board</span>
            <span className="text-sm leading-5 text-ink-subtle">
              Permanently remove this board and all of its tasks.
            </span>
          </span>
          <Button
            variant="destructive"
            onClick={onDeleteClick}
            className="shrink-0"
          >
            Delete board
          </Button>
        </div>
      )}
    </div>
  );
