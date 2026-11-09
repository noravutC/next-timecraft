'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { memberCountLabel } from '@/helper/utils/board-switcher';
import { boardInvitationMeta } from '@/helper/utils/invitation-status';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { InviteForm } from './invite-form';
import { MemberRow } from './member-row';
import { InvitationRow } from './invitation-row';
import { inviteLink, useInviteMembers } from './use-invite-members';

/** Members tab of Board settings: invite, current members, pending invites. */
export const MembersPanel = () => {
  const {
    project,
    currentUserId,
    users,
    email,
    setEmail,
    role,
    setRole,
    inviting,
    invitations,
    memberToRemove,
    setMemberToRemove,
    removing,
    canInvite,
    canRemove,
    emailError,
    handleInvite,
    handleRevoke,
    copyText,
    handleRemoveMember,
  } = useInviteMembers({ open: true });

  if (!project) return null;

  return (
    <div className="flex flex-col gap-5">
      {canInvite && (
        <InviteForm
          email={email}
          onEmailChange={setEmail}
          role={role}
          onRoleChange={setRole}
          error={emailError}
          inviting={inviting}
          onInvite={() => void handleInvite()}
        />
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm leading-5 font-medium text-ink">
          {memberCountLabel(project.members.length)}
        </h3>
        <ul className="flex flex-col overflow-hidden rounded-popover border border-line">
          {project.members.map((member, index) => (
            <MemberRow
              key={member.userId}
              member={member}
              user={users[member.userId]}
              isYou={member.userId === currentUserId}
              removable={
                canRemove &&
                member.role !== 'owner' &&
                member.userId !== currentUserId
              }
              bordered={index > 0}
              onRemove={() => setMemberToRemove(member)}
            />
          ))}
        </ul>
      </section>

      {canInvite && invitations.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm leading-5 font-medium text-ink">
            Pending invitations
          </h3>
          <ul className="flex flex-col overflow-hidden rounded-popover border border-line">
            {invitations.map((invitation, index) => (
              <InvitationRow
                key={invitation.id}
                email={invitation.email}
                meta={boardInvitationMeta(
                  ROLE_LABELS[invitation.role],
                  invitation.expiresAt,
                )}
                bordered={index > 0}
                onCopyLink={() =>
                  void copyText(
                    inviteLink(invitation.token),
                    'Invite link copied',
                  )
                }
                onRevoke={() => void handleRevoke(invitation)}
              />
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(next) => !next && setMemberToRemove(null)}
        variant="destructive"
        title={`Remove ${
          (memberToRemove && users[memberToRemove.userId]?.fullName) ??
          'this member'
        } from board?`}
        description="They will lose access to this board immediately and get a notification."
        primaryLabel={removing ? 'Removing…' : 'Remove'}
        onConfirm={handleRemoveMember}
        loading={removing}
      />
    </div>
  );
};
