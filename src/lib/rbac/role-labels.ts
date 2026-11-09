import type { ProjectRole } from '@/lib/rbac/permissions';
import type { InvitableRole } from '@/types';
import type { WorkspaceRole } from './workspace-permissions';

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

// ลำดับตาม design ของ invite dialog — Editor เป็นค่า default
export const INVITABLE_ROLES: readonly InvitableRole[] = [
  'editor',
  'viewer',
  'admin',
];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};

/**
 * How an invited workspace role reads in a sentence, and what it lets you do
 * (see boardRoleForWorkspaceRole and canCreateBoards).
 */
export const WORKSPACE_JOIN_COPY: Record<
  WorkspaceRole,
  { article: 'a' | 'an'; hint: string }
> = {
  owner: { article: 'an', hint: 'You can manage everything once you join.' },
  admin: {
    article: 'an',
    hint: 'You can create boards, invite people and manage every board once you join.',
  },
  member: {
    article: 'a',
    hint: 'You can open and work on every board in it once you join.',
  },
  guest: {
    article: 'a',
    hint: 'You can open the boards you’re invited to once you join.',
  },
};

/** The role line under the workspace name in the workspace menu. */
export const YOUR_WORKSPACE_ROLE: Record<WorkspaceRole, string> = {
  owner: 'You’re the owner',
  admin: 'You’re an admin',
  member: 'You’re a member',
  guest: 'You’re a guest',
};

/** What each workspace role can do, for the legend on the Members page. */
export const WORKSPACE_ROLE_HINTS: Record<WorkspaceRole, string> = {
  owner: 'Everything, including members, roles and workspace settings.',
  admin:
    'Creates boards, invites people, changes roles and workspace settings.',
  member: 'Works on every board in the workspace.',
  guest: 'Sees only the boards they’re invited to.',
};

/** What each board role allows, in the role menu (see ROLE_PERMISSIONS). */
export const BOARD_ROLE_HINTS: Record<InvitableRole, string> = {
  admin: 'Invite people, change roles, edit columns and board settings',
  editor: 'Add, edit and move cards, and comment',
  viewer: 'See the board and react to comments',
};
