'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header/app-header';

interface NoBoardsYetProps {
  workspace: { name: string; logo: string | null } | null;
  /** the user is in no workspace and may start one */
  canStartWorkspace: boolean;
}

/** No boards, and no right to create one here: say who can. */
export const NoBoardsYet = ({
  workspace,
  canStartWorkspace,
}: NoBoardsYetProps) => (
  <div className="flex h-full flex-col overflow-y-auto bg-background">
    <AppHeader workspace={workspace} />
    <main className="flex flex-1 justify-center px-5 py-24">
      <div className="flex w-full max-w-105 flex-col items-center gap-4 text-center">
        <span className="grid size-11 place-items-center rounded-popover border border-line text-ink-muted">
          <LayoutGrid className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-title-sm font-semibold tracking-tight text-ink">
            No boards yet
          </h1>
          <p className="text-base leading-5.5 text-ink-muted">
            {workspace
              ? `When an owner or admin of ${workspace.name} creates a board, it shows up here.`
              : 'Boards you’re invited to show up here.'}
          </p>
        </div>
        {canStartWorkspace && (
          <Button variant="outline" size="lg" asChild>
            <Link href="/organization/create">Create your own workspace</Link>
          </Button>
        )}
      </div>
    </main>
  </div>
);
