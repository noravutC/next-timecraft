'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/people/user-avatar';
import { shortName } from '@/helper/utils/person-name';
import type { Member, User } from '@/types';

/** A board member: avatar, name (you), email, role, remove. */
export const MemberRow = ({
  member,
  user,
  isYou,
  removable,
  bordered,
  onRemove,
}: {
  member: Member;
  user: User | undefined;
  isYou: boolean;
  removable: boolean;
  /** hairline above every row but the first */
  bordered: boolean;
  onRemove: () => void;
}) => (
  <li
    className={cn(
      'flex h-14 items-center gap-3 pr-2 pl-3.5 hover:bg-surface',
      bordered && 'border-t border-line-soft',
    )}
  >
    <UserAvatar
      name={user?.fullName}
      image={user?.avatar}
      seed={member.userId}
      size="xl"
      className="size-7.5"
    />
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-base font-medium text-ink">
        {user ? shortName(user.fullName) : '…'}
        {isYou && <span className="font-normal text-ink-subtle"> (you)</span>}
      </span>
      <span className="truncate text-xs leading-5 text-ink-subtle">
        {user?.email}
      </span>
    </span>
    <span className="shrink-0 px-2 text-sm text-ink-muted">
      {ROLE_LABELS[member.role]}
    </span>
    {removable ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={`Remove ${user?.fullName ?? 'member'} from board`}
        className="size-7.5 text-ink-subtle hover:bg-danger-soft hover:text-danger-text"
      >
        <Trash2 className="size-3.75" />
      </Button>
    ) : (
      <span aria-hidden="true" className="w-7.5 shrink-0" />
    )}
  </li>
);
