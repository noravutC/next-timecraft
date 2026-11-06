'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { invitesSummary } from '@/helper/utils/invite-result';
import { copyWithToast } from '@/lib/clipboard';
import type { WorkspaceInvitableRole } from '@/lib/rbac/workspace-permissions';
import { organizationServices } from '@/services/organization.service';
import { useOrganizationStore } from '@/store/use-organization.store';
import type { PendingWorkspaceInvitationWithInviter } from '@/types';

type Invitation = PendingWorkspaceInvitationWithInviter;

export const joinLink = (token: string) =>
  `${window.location.origin}/join/${token}`;

/** Pending workspace invitations: send, send again, copy, revoke. */
export function useWorkspaceInvitations(
  workspaceId: string,
  enabled: boolean,
  currentUserId: string,
) {
  const inviteToWorkspace = useOrganizationStore((s) => s.inviteToWorkspace);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    organizationServices
      .getInvitations(workspaceId)
      .then(({ data }) => alive && setInvitations(data))
      .catch(() => alive && setInvitations([]));
    return () => {
      alive = false;
    };
  }, [workspaceId, enabled]);

  /** Resolves true when the box can be cleared. */
  const invite = async (emails: string[], role: WorkspaceInvitableRole) => {
    setSending(true);
    try {
      const result = await inviteToWorkspace(workspaceId, { emails, role });
      setInvitations((list) => [
        ...result.invited.map((i) => ({
          ...i,
          invitedBy: currentUserId,
          invitedByName: null,
        })),
        ...list,
      ]);
      const summary = invitesSummary(result);
      if (summary) toast(summary);
      return true;
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Couldn’t send invitations',
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  const resend = async (invitation: Invitation) => {
    try {
      const { created } = await organizationServices.resendInvitation(
        workspaceId,
        invitation.id,
      );
      if (created) {
        setInvitations((list) =>
          list.map((i) =>
            i.id === invitation.id ? { ...i, expiresAt: created.expiresAt } : i,
          ),
        );
      }
      toast.success(`Sent again to ${invitation.email}`);
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Couldn’t send it again',
      );
    }
  };

  const revoke = async (invitation: Invitation) => {
    const before = invitations;
    setInvitations((list) => list.filter((i) => i.id !== invitation.id));
    try {
      await organizationServices.revokeInvitation(workspaceId, invitation.id);
    } catch (error) {
      setInvitations(before);
      toast.error(
        (error as { message?: string })?.message ?? 'Couldn’t revoke it',
      );
    }
  };

  const copyLink = (invitation: Invitation) =>
    void copyWithToast(joinLink(invitation.token), 'Invite link copied');

  return { invitations, sending, invite, resend, revoke, copyLink };
}
