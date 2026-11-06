'use client';

import { ChevronsUpDown, UserPlus } from 'lucide-react';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import { useWorkspaceName } from '@/components/workspace/use-workspace-name';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Logo } from '@/components/logo-space/logo';
import { UserMenu } from '@/components/menu-bar/user-menu';
import { UserAvatar } from '@/components/people/user-avatar';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbSlash } from '@/components/breadcrumb/breadcrumb-slash';

const AVATAR_LIMIT = 4;

const HeaderDivider = () => (
  <div aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line" />
);

export const ProjectHeader = () => {
  const { projectIsUsing, projects, status } = useProjectStore();
  const { users } = useUserStore();
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const openBoardSettings = useNavStore((s) => s.openBoardSettings);
  const workspaceName = useWorkspaceName();

  const projectValue = projectIsUsing ? projects[projectIsUsing] : null;
  const members = projectValue?.members ?? [];
  const visibleMembers = members.slice(0, AVATAR_LIMIT);
  const overflowCount = members.length - AVATAR_LIMIT;
  const loading = status === 'fetching';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line bg-background px-5">
      {/* LEFT: logo / workspace / board (กดเปิดตัวสลับบอร์ด หรือ ⌘K) */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Logo size={24} textSize="md" textClassName="hidden sm:block" />
        <BreadcrumbSlash />
        {/* phones keep logo / board only */}
        {workspaceName && (
          <span className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <span className="truncate text-base font-medium text-ink-muted">
              {workspaceName}
            </span>
            <BreadcrumbSlash />
          </span>
        )}
        {loading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-sm" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBoardDialog('switch')}
            aria-label="Switch board"
            className="-ml-1.5 min-w-0 shrink gap-2 pr-2 pl-1.5 text-ink"
          >
            {projectValue && (
              <ProjectAvatar
                project={projectValue}
                size="size-5"
                rounded="rounded-sm"
                textSize="text-2xs"
              />
            )}
            <span className="truncate text-base font-semibold tracking-tight">
              {projectValue?.name ?? 'Board'}
            </span>
            <ChevronsUpDown className="size-3.5 text-ink-subtle" />
          </Button>
        )}
      </div>

      {/* RIGHT: members | invite | bell | user */}
      <TooltipProvider delayDuration={200}>
        {loading ? (
          <Skeleton className="h-7 w-40 rounded-full" />
        ) : (
          <>
            {members.length > 0 && (
              <AvatarGroup
                aria-label={`${members.length} members`}
                className="hidden cursor-pointer md:flex"
                onClick={() => openBoardSettings('members')}
              >
                {visibleMembers.map((member) => {
                  const user = users[member.userId];
                  return (
                    <Tooltip key={member.userId}>
                      <TooltipTrigger asChild>
                        <span className="rounded-full ring-2 ring-background">
                          <UserAvatar
                            name={user?.fullName}
                            image={user?.avatar}
                            seed={member.userId}
                            size="md"
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="flex flex-col">
                        <span className="font-medium">
                          {user?.fullName ?? 'Member'} ·{' '}
                          {ROLE_LABELS[member.role]}
                        </span>
                        {user?.email && (
                          <span className="text-white/70">{user.email}</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {overflowCount > 0 && (
                  <AvatarGroupCount className="size-6.5">
                    +{overflowCount}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-line"
              onClick={() => openBoardSettings('members')}
            >
              <UserPlus className="size-3.75" />
              <span className="sr-only sm:not-sr-only">Invite</span>
            </Button>

            <HeaderDivider />

            <NotificationBell />

            <UserMenu />
          </>
        )}
      </TooltipProvider>
    </header>
  );
};
