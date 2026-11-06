'use client';

import { Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Danger zone tab: archive/unarchive and delete (each opens a confirm). */
export const BoardDangerZone = ({
  archived,
  onArchiveClick,
  onDeleteClick,
}: {
  archived: boolean;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
}) => (
  <div className="flex flex-col overflow-hidden rounded-popover border border-danger-line">
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
      <Button variant="outline" onClick={onArchiveClick} className="shrink-0">
        {archived ? (
          <ArchiveRestore className="size-3.75" />
        ) : (
          <Archive className="size-3.75" />
        )}
        {archived ? 'Unarchive' : 'Archive'}
      </Button>
    </div>
    <div className="h-px bg-danger-line" />
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
  </div>
);
