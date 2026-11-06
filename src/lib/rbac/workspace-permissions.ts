import type { organizationMembershipRoleEnum } from '@/db/schema/enums';

export type WorkspaceRole =
  (typeof organizationMembershipRoleEnum.enumValues)[number];

const BOARD_CREATORS: ReadonlySet<WorkspaceRole> = new Set<WorkspaceRole>([
  'owner',
  'admin',
]);

/** Who may create boards in a workspace. The server and the UI both ask here. */
export const canCreateBoards = (
  role: WorkspaceRole | null | undefined,
): boolean => Boolean(role && BOARD_CREATORS.has(role));
