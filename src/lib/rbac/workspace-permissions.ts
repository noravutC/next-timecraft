import type { organizationMembershipRoleEnum } from '@/db/schema/enums';
import type { ProjectRole } from './permissions';

export type WorkspaceRole =
  (typeof organizationMembershipRoleEnum.enumValues)[number];

const WORKSPACE_MANAGERS: ReadonlySet<WorkspaceRole> = new Set<WorkspaceRole>([
  'owner',
  'admin',
]);

/** Who may create boards in a workspace. The server and the UI both ask here. */
export const canCreateBoards = (
  role: WorkspaceRole | null | undefined,
): boolean => Boolean(role && WORKSPACE_MANAGERS.has(role));

/** Who may invite people to a workspace. */
export const canInviteToWorkspace = (
  role: WorkspaceRole | null | undefined,
): boolean => Boolean(role && WORKSPACE_MANAGERS.has(role));

/** Roles an invitation can give: the owner is whoever created the workspace. */
export const WORKSPACE_INVITABLE_ROLES = ['member', 'admin'] as const;
export type WorkspaceInvitableRole = (typeof WORKSPACE_INVITABLE_ROLES)[number];

const BOARD_ROLE_FOR: Record<WorkspaceRole, ProjectRole> = {
  owner: 'admin',
  admin: 'admin',
  member: 'editor',
  guest: 'viewer',
};

/**
 * The role a workspace membership gives on each board in the workspace.
 * Whoever created a board stays its owner.
 */
export const boardRoleForWorkspaceRole = (role: WorkspaceRole): ProjectRole =>
  BOARD_ROLE_FOR[role];
