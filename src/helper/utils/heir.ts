import type { ProjectRole } from '@/lib/rbac/permissions';
import type { WorkspaceRole } from '@/lib/rbac/workspace-permissions';

// most trusted first: the person who takes over when the owner leaves
const RANK: Record<ProjectRole | WorkspaceRole, number> = {
  owner: 0,
  admin: 1,
  editor: 2,
  member: 2,
  viewer: 3,
  guest: 4,
};

/**
 * Who takes over a board or workspace when its owner leaves: the highest
 * role, then whoever joined first. Null when nobody else is in it.
 */
export const pickHeir = <
  T extends {
    userId: string;
    role: ProjectRole | WorkspaceRole;
    joinedAt: Date | string;
  },
>(
  members: T[],
  leavingUserId: string,
): T | null =>
  members
    .filter((m) => m.userId !== leavingUserId)
    .sort(
      (a, b) =>
        RANK[a.role] - RANK[b.role] ||
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    )[0] ?? null;
