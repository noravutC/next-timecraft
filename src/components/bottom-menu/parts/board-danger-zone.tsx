'use client';

import { Button } from '@/components/ui/button';

/** Danger zone ของ Board settings: archive/unarchive กับ delete (เปิด confirm ที่ parent) */
export const BoardDangerZone = ({
  archived,
  onArchiveClick,
  onDeleteClick,
}: {
  archived: boolean;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
}) => (
  <div className="mt-5 overflow-hidden rounded-xl border border-destructive/25">
    <p className="border-b border-destructive/25 bg-destructive/5 px-4 py-2.5 text-xs font-semibold tracking-wider text-destructive uppercase">
      Danger zone
    </p>
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {archived ? 'Unarchive board' : 'Archive board'}
        </p>
        <p className="text-xs text-ink-subtle">
          {archived
            ? 'Restore it to your active boards.'
            : 'Hide it from your active boards. You can restore it later.'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onArchiveClick}
        className="shrink-0 rounded-lg"
      >
        {archived ? 'Unarchive' : 'Archive'}
      </Button>
    </div>
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-destructive">Delete board</p>
        <p className="text-xs text-ink-subtle">
          Permanently remove this board and all its tasks.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDeleteClick}
        className="shrink-0 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        Delete
      </Button>
    </div>
  </div>
);
