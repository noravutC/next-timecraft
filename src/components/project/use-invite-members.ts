import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useProjectStore, useUserStore } from '@/store';
import { projectServices } from '@/services/projects.service';
import { can } from '@/lib/rbac/can';
import type { InvitableRole, Member, PendingInvitation } from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const inviteLink = (token: string) =>
  `${window.location.origin}/invite/${token}`;

/**
 * State + handlers ของ Invite member dialog:
 * ฟอร์มเชิญ, ลิสต์คำเชิญค้างรับ (optimistic revoke), ถอดสมาชิก
 */
export function useInviteMembers({ open }: { open: boolean }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const projects = useProjectStore((s) => s.projects);
  const removeMember = useProjectStore((s) => s.removeMember);
  const users = useUserStore((s) => s.users);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  // เปิดใหม่ทุกครั้งเคลียร์ฟอร์ม (pattern เดียวกับ BoardSettingsDialog)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail('');
      setRole('editor');
      setInviting(false);
    }
  }

  const project = projectIsUsing ? projects[projectIsUsing] : null;
  const projectId = project?.id ?? null;
  const myRole = project?.members.find((m) => m.userId === currentUserId)?.role;
  const canInvite = myRole ? can(myRole, 'member:invite') : false;
  const canRemove = myRole ? can(myRole, 'member:remove') : false;
  const emailValid = EMAIL_PATTERN.test(email.trim());

  // pending list เห็นเฉพาะคนที่เชิญได้ (GET ฝั่ง server ก็บังคับ member:invite)
  useEffect(() => {
    if (!open || !canInvite || !projectId) return;
    let cancelled = false;
    projectServices
      .getInvitations(projectId)
      .then((res) => {
        if (!cancelled) setInvitations(res.data);
      })
      .catch(() => {
        if (!cancelled) setInvitations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, canInvite, projectId]);

  const handleInvite = async () => {
    if (!project || !emailValid || inviting) return;
    setInviting(true);
    try {
      const res = await projectServices.inviteMember(project.id, {
        email: email.trim(),
        role,
      });
      const created = res.created;
      if (created) {
        setInvitations((prev) => [created, ...prev]);
      }
      toast.success('Invitation sent');
      setEmail('');
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Unable to invite member',
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (invitation: PendingInvitation) => {
    const snapshot = invitations;
    setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    try {
      await projectServices.revokeInvitation(invitation.token);
      toast.success('Invitation revoked');
    } catch (error) {
      setInvitations(snapshot);
      toast.error(
        (error as { message?: string })?.message ??
          'Unable to revoke invitation',
      );
    }
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Unable to copy link');
    }
  };

  const handleRemoveMember = async () => {
    if (!project || !memberToRemove || removing) return;
    setRemoving(true);
    try {
      await removeMember(project.id, memberToRemove.userId);
      toast.success('Member removed');
      setMemberToRemove(null);
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Unable to remove member',
      );
    } finally {
      setRemoving(false);
    }
  };

  return {
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
    emailValid,
    handleInvite,
    handleRevoke,
    copyText,
    handleRemoveMember,
  };
}
