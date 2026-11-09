'use client';

import { Trash2 } from 'lucide-react';
import { RoleSelect } from '@/components/people/role-select';
import { UserAvatar } from '@/components/people/user-avatar';
import { Button } from '@/components/ui/button';
import { shortName } from '@/helper/utils/person-name';
import { workspaceMemberMeta } from '@/helper/utils/workspace-members';
import { WORKSPACE_ROLE_LABELS } from '@/lib/rbac/role-labels';
import {
  WORKSPACE_INVITABLE_ROLES,
  type WorkspaceInvitableRole,
} from '@/lib/rbac/workspace-permissions';
import { cn } from '@/lib/utils';
import type { WorkspaceMember } from '@/types';

interface WorkspaceMemberRowProps {
  member: WorkspaceMember;
  isYou: boolean;
  /** the owner and admins manage everyone but the owner and themselves */
  manageable: boolean;
  bordered: boolean;
  onRoleChange: (role: WorkspaceInvitableRole) => void;
  onRemove: () => void;
}

/** A member: who they are, their boards, their role. */
export const WorkspaceMemberRow = ({
  member,
  isYou,
  manageable,
  bordered,
  onRoleChange,
  onRemove,
}: WorkspaceMemberRowProps) => (
  <li
    className={cn(
      'flex min-h-15 flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pr-2.5 pl-3.5',
      bordered && 'border-t border-line-soft',
    )}
  >
    <UserAvatar
      name={member.fullName}
      image={member.avatar}
      seed={member.userId}
      size="xl"
    />
    <span className="flex min-w-0 flex-1 basis-40 flex-col">
      <span className="truncate text-base font-medium text-ink">
        {shortName(member.fullName)}
        {isYou && <span className="font-normal text-ink-subtle"> (you)</span>}
      </span>
      <span className="truncate text-xs text-ink-subtle">{member.email}</span>
    </span>
    <span className="text-xs text-ink-subtle">
      {workspaceMemberMeta(member)}
    </span>
    {manageable && member.role !== 'owner' ? (
      <>
        <RoleSelect
          aria-label={`Workspace role for ${member.fullName}`}
          value={member.role as WorkspaceInvitableRole}
          options={WORKSPACE_INVITABLE_ROLES}
          labels={WORKSPACE_ROLE_LABELS}
          onChange={onRoleChange}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove ${member.fullName} from the workspace`}
          className="size-7.5 text-ink-subtle hover:bg-danger-soft hover:text-danger-text"
        >
          <Trash2 className="size-3.75" />
        </Button>
      </>
    ) : (
      <span className="w-34.5 px-2.5 text-sm text-ink-muted">
        {WORKSPACE_ROLE_LABELS[member.role]}
      </span>
    )}
  </li>
);
