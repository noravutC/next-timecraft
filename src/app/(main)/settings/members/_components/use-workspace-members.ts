'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { WorkspaceInvitableRole } from '@/lib/rbac/workspace-permissions';
import { organizationServices } from '@/services/organization.service';
import type { BoardGuest, WorkspaceMembersResponse } from '@/types';

const failed = (error: unknown, fallback: string) =>
  toast.error((error as { message?: string })?.message ?? fallback);

/** Members and board guests, with optimistic role changes and removals. */
export function useWorkspaceMembers(workspaceId: string) {
  const [data, setData] = useState<WorkspaceMembersResponse | null>(null);

  const load = useCallback(
    () =>
      organizationServices
        .getMembers(workspaceId)
        .then(({ data: next }) => next && setData(next))
        .catch((error) => failed(error, 'Couldn’t load members')),
    [workspaceId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (userId: string, role: WorkspaceInvitableRole) => {
    const before = data;
    setData(
      (d) =>
        d && {
          ...d,
          members: d.members.map((m) =>
            m.userId === userId ? { ...m, role } : m,
          ),
        },
    );
    try {
      await organizationServices.changeMemberRole(workspaceId, userId, role);
    } catch (error) {
      setData(before);
      failed(error, 'Couldn’t change the role');
    }
  };

  const remove = async (userId: string) => {
    const before = data;
    setData(
      (d) =>
        d && { ...d, members: d.members.filter((m) => m.userId !== userId) },
    );
    try {
      await organizationServices.removeMember(workspaceId, userId);
    } catch (error) {
      setData(before);
      failed(error, 'Couldn’t remove them');
    }
  };

  const addGuest = async (guest: BoardGuest) => {
    const before = data;
    setData(
      (d) =>
        d && {
          ...d,
          guests: d.guests.filter((g) => g.userId !== guest.userId),
          members: [
            ...d.members,
            {
              ...guest,
              role: 'member',
              joinedAt: new Date(),
              boardCount: guest.boards.length,
            },
          ],
        },
    );
    try {
      await organizationServices.addGuest(workspaceId, guest.userId);
      // their board count grows with the workspace's boards
      void load();
    } catch (error) {
      setData(before);
      failed(error, 'Couldn’t add them to the workspace');
    }
  };

  return { data, changeRole, remove, addGuest };
}
