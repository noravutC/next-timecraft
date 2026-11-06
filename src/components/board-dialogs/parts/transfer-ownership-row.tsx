'use client';

import { ChevronDown } from 'lucide-react';
import { UserAvatar } from '@/components/people/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { shortName } from '@/helper/utils/person-name';
import { useUserStore } from '@/store';
import type { Member } from '@/types';

interface TransferOwnershipRowProps {
  members: Member[];
  heir: Member | null;
  onPick: (userId: string) => void;
  onTransfer: () => void;
}

/** Owner only: pick another member, hand them the board. */
export const TransferOwnershipRow = ({
  members,
  heir,
  onPick,
  onTransfer,
}: TransferOwnershipRowProps) => {
  const users = useUserStore((s) => s.users);
  const heirUser = heir ? users[heir.userId] : undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4.5">
      <span className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
        <span className="text-base font-medium text-ink">
          Transfer ownership
        </span>
        <span className="text-sm leading-5 text-ink-subtle">
          {heir
            ? 'Hand this board to another member. You stay on it as an admin.'
            : 'Invite someone first: only a member can take it over.'}
        </span>
      </span>
      {heir && (
        <span className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                aria-label={`New owner: ${heirUser?.fullName ?? 'member'}`}
                className="gap-2 pr-2 pl-2.5 font-normal"
              >
                <UserAvatar
                  name={heirUser?.fullName}
                  image={heirUser?.avatar}
                  seed={heir.userId}
                  size="xs"
                />
                {shortName(heirUser?.fullName) || 'Member'}
                <ChevronDown className="size-3.5 text-ink-subtle" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.userId}
                  onClick={() => onPick(member.userId)}
                  className="gap-2"
                >
                  <UserAvatar
                    name={users[member.userId]?.fullName}
                    image={users[member.userId]?.avatar}
                    seed={member.userId}
                    size="xs"
                  />
                  <span className="truncate">
                    {users[member.userId]?.fullName ?? 'Member'}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={onTransfer}>
            Transfer
          </Button>
        </span>
      )}
    </div>
  );
};
