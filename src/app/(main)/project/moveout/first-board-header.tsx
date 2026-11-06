'use client';

import { Logo } from '@/components/logo-space/logo';
import { UserMenu } from '@/components/menu-bar/user-menu';

/** Slim header for an empty workspace: logo / workspace, account menu. */
export const FirstBoardHeader = ({
  workspaceName,
}: {
  workspaceName: string | null;
}) => (
  <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-5">
    <Logo size={24} textSize="md" />
    {workspaceName && (
      <>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4.5 shrink-0 fill-none stroke-line-strong stroke-[1.5] [stroke-linecap:round]"
        >
          <path d="M15 4 9 20" />
        </svg>
        <span className="truncate text-base font-medium text-ink-muted">
          {workspaceName}
        </span>
      </>
    )}
    <span className="flex-1" />
    <UserMenu />
  </header>
);
