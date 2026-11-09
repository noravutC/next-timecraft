'use client';

import Link from 'next/link';
import { BreadcrumbSlash } from '@/components/breadcrumb/breadcrumb-slash';
import { Logo } from '@/components/logo-space/logo';
import { UserMenu } from '@/components/menu-bar/user-menu';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { WorkspaceMenu } from '@/components/workspace/workspace-menu';

interface AppHeaderProps {
  workspace: { name: string; logo: string | null } | null;
  /** the page, after the workspace: "Settings" */
  current?: string;
}

/** Header away from the board: logo / workspace / page, bell, account. */
export const AppHeader = ({ workspace, current }: AppHeaderProps) => (
  <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line bg-background px-5">
    <Link
      href="/project"
      aria-label="TimeCraft, back to your boards"
      className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ink/10"
    >
      <Logo size={24} textSize="md" textClassName="hidden sm:block" />
    </Link>
    {workspace && (
      <>
        <BreadcrumbSlash />
        <WorkspaceMenu workspace={workspace} />
      </>
    )}
    {current && (
      <>
        <BreadcrumbSlash />
        <span className="truncate text-base font-semibold tracking-tight text-ink">
          {current}
        </span>
      </>
    )}
    <span className="flex-1" />
    <NotificationBell />
    <UserMenu />
  </header>
);
