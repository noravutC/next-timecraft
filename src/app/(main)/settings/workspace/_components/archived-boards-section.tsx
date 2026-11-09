'use client';

import Link from 'next/link';
import { Check, Undo2 } from 'lucide-react';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { archivedBoardMeta } from '@/helper/utils/archived-board';
import { boardUrl } from '@/helper/utils/board-url';
import { can } from '@/lib/rbac/can';
import { useArchivedBoards } from './use-archived-boards';

/** Archived boards you're on: open them read-only, or restore them. */
export const ArchivedBoardsSection = ({
  workspaceId,
}: {
  workspaceId: string;
}) => {
  const { boards, restoredName, restore } = useArchivedBoards(workspaceId);

  return (
    <section aria-labelledby="ws-arch" className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <h2 id="ws-arch" className="text-md font-semibold text-ink">
          Archived boards
        </h2>
        {boards && (
          <span className="font-mono text-xs text-ink-subtle">
            {boards.length}
          </span>
        )}
      </div>
      <p className="text-sm text-ink-subtle">
        Archived boards are read-only and hidden from the board switcher until
        you restore them.
      </p>

      {!boards && <Skeleton className="h-15 w-full rounded-popover" />}

      {boards?.map((board) => (
        <div
          key={board.id}
          className="flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2.5 rounded-popover border border-line py-2.5 pr-2.5 pl-3.5"
        >
          <ProjectAvatar
            project={board}
            size="size-7.5"
            rounded="rounded-lg"
            textSize="text-sm"
          />
          <span className="flex min-w-0 flex-1 basis-55 flex-col">
            <span className="truncate text-base font-medium text-ink">
              {board.name}
            </span>
            <span className="text-xs text-ink-subtle">
              {archivedBoardMeta(board)}
            </span>
          </span>
          <Button variant="ghost" size="xs" asChild className="h-7.5">
            <Link href={boardUrl({ board: board.id })}>Open</Link>
          </Button>
          {can(board.role, 'project:update') && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => void restore(board)}
              className="h-7.5"
            >
              <Undo2 className="size-3.25" />
              Restore
            </Button>
          )}
        </div>
      ))}

      {restoredName && (
        <div
          role="status"
          className="flex min-h-12 items-center gap-2.5 rounded-popover border border-success-soft bg-success-soft/40 px-3.5 text-sm text-success-text"
        >
          <Check className="size-3.75 shrink-0" />
          {restoredName} is back in the board switcher.
        </div>
      )}

      {boards?.length === 0 && !restoredName && (
        <p className="rounded-popover border border-dashed border-line px-3.5 py-4 text-center text-sm text-ink-subtle">
          No archived boards.
        </p>
      )}
    </section>
  );
};
