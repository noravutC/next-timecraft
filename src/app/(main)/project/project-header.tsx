'use client';

import { useNavStore, useProjectStore, useUserStore } from '@/store';
import { Globe, Star } from 'lucide-react';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

const AVATAR_LIMIT = 3;

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ProjectHeader = () => {
  const { projectIsUsing, projects, status } = useProjectStore();
  const { users } = useUserStore();
  const { setView } = useNavStore();
  const [starred, setStarred] = useState(false);

  const projectValue = projectIsUsing ? projects[projectIsUsing] : null;
  const members = projectValue?.members ?? [];
  const visibleMembers = members.slice(0, AVATAR_LIMIT);
  const overflowCount = members.length - AVATAR_LIMIT;
  const loading = status === 'fetching';

  return (
    <div className="flex w-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
        {/* LEFT — project identity */}
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </>
          ) : (
            <>
              {projectValue && (
                <ProjectAvatar
                  project={projectValue}
                  size="size-6"
                  rounded="rounded"
                />
              )}
              <span className="text-md rounded px-1 py-0.5 font-semibold text-foreground transition-colors">
                {projectValue?.name ?? '—'}
              </span>

              <Separator orientation="vertical" className="mx-0.5 h-4" />

              <TooltipProvider delayDuration={200}>
                {/* Star */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setStarred((s) => !s)}
                    >
                      <Star
                        className={`size-3.5 transition-colors ${starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {starred ? 'Remove from starred' : 'Star this project'}
                  </TooltipContent>
                </Tooltip>

                {/* Visibility */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Globe className="size-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Visibility</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        {/* RIGHT — members + actions */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1.5">
            {loading ? (
              <Skeleton className="h-6 w-28 rounded-full" />
            ) : (
              <>
                <NotificationBell />
                {/* Member avatars */}
                {/* {members.length > 0 && (
                  <AvatarGroup>
                    {visibleMembers.map((member) => {
                      const user = users[member.userId];
                      const initials =
                        user?.fullName?.slice(0, 2).toUpperCase() ?? '?';
                      return (
                        <Tooltip key={member.userId}>
                          <TooltipTrigger asChild>
                            <Avatar className="size-7 cursor-pointer">
                              <AvatarImage
                                src={user?.avatar ?? undefined}
                                alt={user?.fullName}
                              />
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="space-y-0.5">
                            <p className="text-sm font-semibold">
                              {user?.fullName ?? '...'}
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
                      <AvatarGroupCount className="size-7 text-xs">
                        +{overflowCount}
                      </AvatarGroupCount>
                    )}
                  </AvatarGroup>
                )} */}

                <Separator orientation="vertical" className="h-4" />

                {/* Filter */}
                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Filter</TooltipContent>
                </Tooltip> */}

                {/* Settings */}
                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setView('settings')}
                    >
                      <Settings2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Settings</TooltipContent>
                </Tooltip> */}

                {/* More */}
                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">More</TooltipContent>
                </Tooltip> */}

                {/* <Separator orientation="vertical" className="h-4" /> */}

                {/* Share / Invite */}
                {/* <Button
                  // variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-sm"
                  onClick={() => setView('projects')}
                >
                  <UserPlus className="size-3.5" />
                  Share
                </Button> */}
              </>
            )}
          </div>
        </TooltipProvider>
      </header>

      {/* Breadcrumb sub-bar */}
      {/* {menuValue.key !== 'none' && (
        <div className="flex shrink-0 items-center px-4 py-2">
          <nav className="flex items-center gap-1 text-xs">
            <div
              onClick={() => setMenuValue('none')}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              {barValue.label}
            </div>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">
              {menuValue.label}
            </span>
          </nav>
        </div>
      )} */}
    </div>
  );
};
