'use client';

import { useMemo } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Member } from '@/types';
import { SectionCard } from './section-card';

interface MembersSectionProps {
  members: Member[];
  ownerId: string;
  isPrivate: boolean;
}

export const MembersSection = ({
  members,
  ownerId,
  isPrivate,
}: MembersSectionProps) => {
  const users = useUserStore((s) => s.users);

  const memberHint = useMemo(() => {
    const count = members.length;
    return `${count} member${count === 1 ? '' : 's'} · ${isPrivate ? 'Private' : 'Team can edit'}`;
  }, [members.length, isPrivate]);

  return (
    <SectionCard
      icon={Users}
      title="Members & permissions"
      hint={memberHint}
      action={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => toast.info('Member invites coming soon')}
            >
              <UserPlus className="size-3.5" />
              Invite
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      }
    >
      <div className="space-y-1.5">
        {members.map((member) => {
          const user = users[member.userId];
          const displayName = user?.fullName ?? 'Loading…';
          const email = user?.email ?? '';
          const initial = displayName.charAt(0).toUpperCase();
          const isOwner = member.userId === ownerId;
          const roleLabel = isOwner
            ? 'Owner'
            : member.role.charAt(0).toUpperCase() + member.role.slice(1);
          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
            >
              <Avatar className="size-9 ring-1 ring-border">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="text-xs font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                {email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};
