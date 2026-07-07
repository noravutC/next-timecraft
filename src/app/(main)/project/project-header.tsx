'use client';

import { ChevronDown, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import { Logo } from '@/components/logo-space/logo';
import { UserMenu } from '@/components/menu-bar/user-menu';
import { ProjectAvatar } from '@/components/project/project-avatar';
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

const AVATAR_LIMIT = 3;

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

// เส้นคั่นแนวตั้งของ header ตาม design (1×22px)
const HeaderDivider = () => <div className="h-5.5 w-px shrink-0 bg-line" />;

export const ProjectHeader = () => {
  const { projectIsUsing, projects, status } = useProjectStore();
  const { users } = useUserStore();
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);

  const projectValue = projectIsUsing ? projects[projectIsUsing] : null;
  const members = projectValue?.members ?? [];
  const visibleMembers = members.slice(0, AVATAR_LIMIT);
  const overflowCount = members.length - AVATAR_LIMIT;
  const loading = status === 'fetching';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-5">
      {/* LEFT — logo | board identity (กดเปิด switcher แบบ design) */}
      <div className="flex items-center gap-4.5">
        <Logo size={20} textSize="base" />
        <HeaderDivider />
        {loading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-5 w-36 rounded" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBoardDialog('switch')}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface-hover"
          >
            {projectValue && (
              <ProjectAvatar
                project={projectValue}
                size="size-6"
                rounded="rounded-md"
              />
            )}
            <span className="text-md font-bold text-ink">
              {projectValue?.name ?? '—'}
            </span>
            <ChevronDown className="size-4 text-ink-faint" />
          </button>
        )}
      </div>

      {/* RIGHT — avatars | invite | bell | user */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3.5">
          {loading ? (
            <Skeleton className="h-7.5 w-44 rounded-full" />
          ) : (
            <>
              {members.length > 0 && (
                <AvatarGroup
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onClick={() => toast.info('Member invites coming soon')}
                >
                  {visibleMembers.map((member) => {
                    const user = users[member.userId];
                    const initials =
                      user?.fullName?.slice(0, 2).toUpperCase() ?? '?';
                    return (
                      <Tooltip key={member.userId}>
                        <TooltipTrigger asChild>
                          <Avatar className="size-7.5 ring-2 ring-background">
                            <AvatarImage
                              src={user?.avatar ?? undefined}
                              alt={user?.fullName}
                            />
                            <AvatarFallback className="text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="space-y-0.5">
                          <p className="text-sm font-semibold">
                            {user?.fullName ?? '…'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roleLabel[member.role] ?? member.role}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {overflowCount > 0 && (
                    <AvatarGroupCount className="size-7.5 bg-surface-active text-xs font-bold text-ink-muted ring-2 ring-background">
                      +{overflowCount}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>
              )}

              {/* Invite — ปุ่ม placeholder รอฟีเจอร์ invite (ยังไม่มี endpoint) */}
              <Button
                variant="outline"
                className="h-8.5 gap-1.5 rounded-lg border-line px-3 text-sm font-bold text-brand-dark shadow-none hover:border-brand-line hover:bg-brand-soft/40 hover:text-brand-dark"
                onClick={() => toast.info('Member invites coming soon')}
              >
                <UserPlus className="size-4" />
                Invite
              </Button>

              <HeaderDivider />

              <NotificationBell />

              <UserMenu />
            </>
          )}
        </div>
      </TooltipProvider>
    </header>
  );
};
