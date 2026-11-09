'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/store';
import { useBoardAccess } from '@/components/project/use-board-access';

/** Shown on an archived board: it stays read-only until someone restores it. */
export const ArchivedBoardBanner = () => {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const updateProject = useProjectStore((s) => s.updateProject);
  const access = useBoardAccess();
  const [restoring, setRestoring] = useState(false);

  if (!access.archived || !projectId) return null;
  const canRestore = access.can('project:update');

  const restore = async () => {
    setRestoring(true);
    try {
      await updateProject(projectId, { archived: false });
      toast.success('Board restored');
    } catch {
      toast.error('Couldn’t restore the board. Try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-2.5"
    >
      <Archive className="size-4 shrink-0 text-ink-muted" />
      <p className="min-w-60 flex-1 text-sm text-ink-muted">
        <strong className="font-semibold text-ink">
          This board is archived.
        </strong>{' '}
        It’s read-only and hidden from the board switcher.{' '}
        {canRestore
          ? 'Restore it to add or move cards.'
          : 'Ask an owner or admin to restore it.'}
      </p>
      {canRestore && (
        <Button
          variant="outline"
          size="xs"
          onClick={() => void restore()}
          disabled={restoring}
          className="border-line-strong"
        >
          Restore board
        </Button>
      )}
    </div>
  );
};
