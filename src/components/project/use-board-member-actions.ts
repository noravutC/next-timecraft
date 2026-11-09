'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { pickHeir } from '@/helper/utils/heir';
import { assignableRoles, canManageMember } from '@/lib/rbac/can';
import { useNavStore, useProjectStore } from '@/store';
import type { InvitableRole, Member } from '@/types';

const failed = (error: unknown, fallback: string) =>
  toast.error((error as { message?: string })?.message ?? fallback);

/** Change roles, leave the board, hand it over: for the open board. */
export function useBoardMemberActions() {
  const { data: session } = useSession();
  const me = session?.user?.id ?? null;
  const project = useProjectStore((s) =>
    s.projectIsUsing ? (s.projects[s.projectIsUsing] ?? null) : null,
  );
  const changeMemberRole = useProjectStore((s) => s.changeMemberRole);
  const leaveProject = useProjectStore((s) => s.leaveProject);
  const transferOwnership = useProjectStore((s) => s.transferOwnership);
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [heirId, setHeirId] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [busy, setBusy] = useState(false);

  const myRole = project?.members.find((m) => m.userId === me)?.role ?? null;
  const others = project?.members.filter((m) => m.userId !== me) ?? [];
  // default to whoever would take over if the owner left
  const heir =
    others.find((m) => m.userId === heirId) ??
    (project && me ? pickHeir(project.members, me) : null);

  const assignableFor = (member: Member): InvitableRole[] =>
    myRole && member.userId !== me && canManageMember(myRole, member.role)
      ? (assignableRoles(myRole) as InvitableRole[])
      : [];

  const changeRole = (member: Member, role: InvitableRole) => {
    if (!project) return;
    changeMemberRole(project.id, member.userId, role).catch((error) =>
      failed(error, 'Couldn’t change the role'),
    );
  };

  const leave = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      await leaveProject(project.id);
      setConfirmLeave(false);
      setBoardDialog(null);
      toast.success(`You left ${project.name}`);
    } catch (error) {
      failed(error, 'Couldn’t leave the board');
    } finally {
      setBusy(false);
    }
  };

  const transfer = async () => {
    if (!project || !me || !heir || busy) return;
    setBusy(true);
    try {
      await transferOwnership(project.id, me, heir.userId);
      setConfirmTransfer(false);
      toast.success('Ownership transferred');
    } catch (error) {
      failed(error, 'Couldn’t transfer the board');
    } finally {
      setBusy(false);
    }
  };

  return {
    project,
    me,
    myRole,
    others,
    heir,
    setHeirId,
    assignableFor,
    changeRole,
    confirmLeave,
    setConfirmLeave,
    leave,
    confirmTransfer,
    setConfirmTransfer,
    transfer,
    busy,
  };
}
