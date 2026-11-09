'use client';

import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/people/user-avatar';
import { shortName } from '@/helper/utils/person-name';
import type { InvitableRole, Member, User } from '@/types';
import { BoardRoleMenu } from './board-role-menu';

/** A board member: avatar, name (you), email, role (a menu when you may change it). */
export const MemberRow = ({
  member,
  user,
  isYou,
  assignable,
  canLeave,
  bordered,
  onRoleChange,
  onRemove,
  onLeave,
}: {
  member: Member;
  user: User | undefined;
  isYou: boolean;
  /** roles you may give this member; empty when you can't manage them */
  assignable: InvitableRole[];
  /** your own row, when you aren't the owner */
  canLeave: boolean;
  /** hairline above every row but the first */
  bordered: boolean;
  onRoleChange: (role: InvitableRole) => void;
  onRemove: () => void;
  onLeave: () => void;
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
    {assignable.length > 0 ? (
      <BoardRoleMenu
        name={user?.fullName ?? 'member'}
        role={member.role}
        options={assignable}
        onChange={onRoleChange}
        onRemove={onRemove}
      />
    ) : (
      <span className="shrink-0 px-2 text-sm text-ink-muted">
        {ROLE_LABELS[member.role]}
      </span>
    )}
    {canLeave && (
      <Button variant="outline" size="xs" onClick={onLeave} className="h-7.5">
        Leave
      </Button>
    )}
  </li>
);
