'use client';

import { UserAvatar } from '@/components/people/user-avatar';
import { Button } from '@/components/ui/button';
import { boardGuestMeta } from '@/helper/utils/workspace-members';
import { shortName } from '@/helper/utils/person-name';
import { cn } from '@/lib/utils';
import type { BoardGuest } from '@/types';

/** Someone on a board here but not in the workspace. */
export const BoardGuestRow = ({
  guest,
  bordered,
  onAdd,
}: {
  guest: BoardGuest;
  bordered: boolean;
  onAdd: () => void;
}) => (
  <li
    className={cn(
      'flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pr-2 pl-3.5',
      bordered && 'border-t border-line-soft',
    )}
  >
    <UserAvatar
      name={guest.fullName}
      image={guest.avatar}
      seed={guest.userId}
      size="xl"
    />
    <span className="flex min-w-0 flex-1 basis-40 flex-col">
      <span className="truncate text-base font-medium text-ink">
        {shortName(guest.fullName)}
      </span>
      <span className="truncate text-xs text-ink-subtle">
        {boardGuestMeta(guest)}
      </span>
    </span>
    <Button variant="outline" size="xs" onClick={onAdd} className="h-7.5">
      Add to workspace
    </Button>
  </li>
);
