import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '@/store';
import { canOnBoard } from '@/lib/rbac/can';
import type { Permission, ProjectRole } from '@/lib/rbac/permissions';

export type BoardAccess = {
  role: ProjectRole | null;
  archived: boolean;
  /** what the server will allow: the user's role on the board, and an
   *  archived board being read-only */
  can: (permission: Permission) => boolean;
};

/** The signed-in user's access to a board (the open one by default). */
export function useBoardAccess(projectId?: string | null): BoardAccess {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const project = useProjectStore((s) => {
    const id = projectId ?? s.projectIsUsing;
    return id ? (s.projects[id] ?? null) : null;
  });
  const role = project?.members?.find((m) => m.userId === userId)?.role ?? null;
  const archived = Boolean(project?.archived);

  const can = useCallback(
    (permission: Permission) =>
      role !== null && canOnBoard(role, permission, { archived }),
    [role, archived],
  );

  return { role, archived, can };
}
