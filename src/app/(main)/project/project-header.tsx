'use client';

import { useState } from 'react';
import { ChevronsUpDown, UserPlus } from 'lucide-react';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Logo } from '@/components/logo-space/logo';
import { UserMenu } from '@/components/menu-bar/user-menu';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { InviteMemberDialog } from '@/components/project/invite-member-dialog';
import { NotificationBell } from '@/components/notifications/notification-bell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const AVATAR_LIMIT = 4;

const HeaderDivider = () => <div className="h-5 w-px shrink-0 bg-line" />;

export const ProjectHeader = () => {
  const { projectIsUsing, projects, status } = useProjectStore();
  const { users } = useUserStore();
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const [inviteOpen, setInviteOpen] = useState(false);

  const projectValue = projectIsUsing ? projects[projectIsUsing] : null;
  const members = projectValue?.members ?? [];
  const visibleMembers = members.slice(0, AVATAR_LIMIT);
  const overflowCount = members.length - AVATAR_LIMIT;
  const loading = status === 'fetching';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-5">
      {/* LEFT — logo / board (กดเปิดตัวสลับบอร์ด, หรือ ⌘K) */}
      <div className="flex min-w-0 items-center gap-2">
        <Logo size={22} textSize="base" />
        <span aria-hidden className="text-lg font-light text-input">
          /
        </span>
        {loading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBoardDialog('switch')}
            aria-label="Switch board"
            className="min-w-0 gap-2 px-1.5"
          >
            {projectValue && (
              <ProjectAvatar
                project={projectValue}
                size="size-5"
                rounded="rounded-md"
              />
            )}
            <span className="truncate font-semibold tracking-tight text-ink">
              {projectValue?.name ?? '—'}
            </span>
            <ChevronsUpDown className="size-3.5 text-ink-subtle" />
          </Button>
        )}
      </div>

      {/* RIGHT — members | invite | bell | user */}
      <TooltipProvider delayDuration={200}>
        <div className="flex shrink-0 items-center gap-2.5">
          {loading ? (
            <Skeleton className="h-7 w-40 rounded-full" />
          ) : (
            <>
              {members.length > 0 && (
                <AvatarGroup
                  className="cursor-pointer -space-x-1.5 transition-opacity hover:opacity-90"
                  onClick={() => setInviteOpen(true)}
                >
                  {visibleMembers.map((member) => {
                    const user = users[member.userId];
                    const initials =
                      user?.fullName?.slice(0, 2).toUpperCase() ?? '?';
                    return (
                      <Tooltip key={member.userId}>
                        <TooltipTrigger asChild>
                          <Avatar className="size-6.5 ring-2 ring-background">
                            <AvatarImage
                              src={user?.avatar ?? undefined}
                              alt={user?.fullName}
                            />
                            <AvatarFallback className="text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {user?.fullName ?? '…'} · {ROLE_LABELS[member.role]}
                          </p>
                          <p className="text-xs opacity-75">{user?.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {overflowCount > 0 && (
                    <AvatarGroupCount className="size-6.5 bg-surface-active text-xs font-semibold text-ink-muted ring-2 ring-background">
                      +{overflowCount}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="size-3.5" />
                Invite
              </Button>

              <HeaderDivider />

              <NotificationBell />

              <UserMenu />
            </>
          )}
        </div>
      </TooltipProvider>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </header>
  );
};
