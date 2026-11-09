'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { InvitationRow } from '@/components/project/invitation-row';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { workspaceInvitationMeta } from '@/helper/utils/invitation-status';
import { WORKSPACE_ROLE_LABELS } from '@/lib/rbac/role-labels';
import { canManageWorkspace } from '@/lib/rbac/workspace-permissions';
import type { WorkspaceMember } from '@/types';
import { SettingsHeading } from '../_components/settings-heading';
import { BoardGuestRow } from './_components/board-guest-row';
import { RoleLegend } from './_components/role-legend';
import { SectionTitle } from './_components/section-title';
import { useWorkspaceInvitations } from './_components/use-workspace-invitations';
import { useWorkspaceMembers } from './_components/use-workspace-members';
import { WorkspaceInviteForm } from './_components/workspace-invite-form';
import { WorkspaceMemberRow } from './_components/workspace-member-row';

const LIST = 'flex flex-col overflow-hidden rounded-popover border border-line';

export default function WorkspaceMembersPage() {
  const { data: session } = useSession();
  const workspace = useWorkspace();
  const me = session?.user?.id ?? '';
  const canManage = canManageWorkspace(session?.user?.orgRole);
  const workspaceId = workspace?.id ?? session?.user?.organizationId ?? '';
  const members = useWorkspaceMembers(workspaceId);
  const invites = useWorkspaceInvitations(workspaceId, canManage, me);
  const [toRemove, setToRemove] = useState<WorkspaceMember | null>(null);
  const name = workspace?.name ?? 'your workspace';

  return (
    <>
      <SettingsHeading title="Members">
        People in {name}. Members can open and work on every board here.
      </SettingsHeading>

      {canManage && (
        <WorkspaceInviteForm
          workspaceName={name}
          sending={invites.sending}
          onInvite={invites.invite}
        />
      )}

      <section aria-labelledby="wm-list" className="flex flex-col gap-2.5">
        <SectionTitle
          id="wm-list"
          title="Members"
          count={members.data?.members.length}
        />
        {members.data ? (
          <ul className={LIST}>
            {members.data.members.map((member, index) => (
              <WorkspaceMemberRow
                key={member.userId}
                member={member}
                isYou={member.userId === me}
                manageable={canManage && member.userId !== me}
                bordered={index > 0}
                onRoleChange={(role) =>
                  void members.changeRole(member.userId, role)
                }
                onRemove={() => setToRemove(member)}
              />
            ))}
          </ul>
        ) : (
          <Skeleton className="h-45 w-full rounded-popover" />
        )}
        <RoleLegend />
      </section>

      {canManage && members.data && members.data.guests.length > 0 && (
        <section aria-labelledby="wm-guests" className="flex flex-col gap-2.5">
          <SectionTitle
            id="wm-guests"
            title="Board guests"
            count={members.data.guests.length}
          />
          <p className="text-xs text-ink-subtle">
            Invited to boards here, not to the workspace. They can’t see its
            other boards.
          </p>
          <ul className={LIST}>
            {members.data.guests.map((guest, index) => (
              <BoardGuestRow
                key={guest.userId}
                guest={guest}
                bordered={index > 0}
                onAdd={() => void members.addGuest(guest)}
              />
            ))}
          </ul>
        </section>
      )}

      {canManage && invites.invitations.length > 0 && (
        <section aria-labelledby="wm-pending" className="flex flex-col gap-2.5">
          <SectionTitle
            id="wm-pending"
            title="Pending invitations"
            count={invites.invitations.length}
          />
          <ul className={LIST}>
            {invites.invitations.map((invitation, index) => (
              <InvitationRow
                key={invitation.id}
                email={invitation.email}
                meta={workspaceInvitationMeta({
                  roleLabel: WORKSPACE_ROLE_LABELS[invitation.role],
                  invitedByName: invitation.invitedByName,
                  invitedByYou: invitation.invitedBy === me,
                  expiresAt: invitation.expiresAt,
                })}
                bordered={index > 0}
                onResend={() => void invites.resend(invitation)}
                onCopyLink={() => invites.copyLink(invitation)}
                onRevoke={() => void invites.revoke(invitation)}
              />
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        onOpenChange={(open) => !open && setToRemove(null)}
        variant="destructive"
        title={`Remove ${toRemove?.fullName ?? 'them'} from ${name}?`}
        description="They lose the boards the workspace gave them. Boards they were invited to on their own stay."
        primaryLabel="Remove"
        onConfirm={() => {
          if (toRemove) void members.remove(toRemove.userId);
          setToRemove(null);
        }}
      />
    </>
  );
}
