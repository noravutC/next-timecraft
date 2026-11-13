import { projectMembershipRoleEnum } from "@/db/schema/enums";

export type ProjectRole = (typeof projectMembershipRoleEnum.enumValues)[number];

export type Permission =
  | "project:view"
  | "project:update"
  | "project:delete"
  | "project:transfer_ownership"
  | "member:invite"
  | "member:remove"
  | "member:change_role"
  | "column:create"
  | "column:update"
  | "column:delete"
  | "task:create"
  | "task:update"
  | "task:move"
  | "task:delete"
  | "task:comment"
  | "comment:update"
  | "comment:delete"
  | "comment:react"
  | "comment:upload"
  // rules and webhooks: what the board does on its own
  | "automation:manage"
  // task templates
  | "template:manage";

const definePermissions = (
  map: Record<ProjectRole, Permission[]>,
): Record<ProjectRole, ReadonlySet<Permission>> => {
  const result = {} as Record<ProjectRole, ReadonlySet<Permission>>;
  for (const role of Object.keys(map) as ProjectRole[]) {
    result[role] = new Set(map[role]);
  }
  return result;
};

export const ROLE_PERMISSIONS = definePermissions({
  owner: [
    "project:view",
    "project:update",
    "project:delete",
    "project:transfer_ownership",
    "member:invite",
    "member:remove",
    "member:change_role",
    "column:create",
    "column:update",
    "column:delete",
    "task:create",
    "task:update",
    "task:move",
    "task:delete",
    "task:comment",
    "comment:update",
    "comment:delete",
    "comment:react",
    "comment:upload",
    "automation:manage",
    "template:manage",
  ],
  admin: [
    "project:view",
    "project:update",
    "member:invite",
    "member:remove",
    "member:change_role",
    "column:create",
    "column:update",
    "column:delete",
    "task:create",
    "task:update",
    "task:move",
    "task:delete",
    "task:comment",
    "comment:update",
    "comment:delete",
    "comment:react",
    "comment:upload",
    "automation:manage",
    "template:manage",
  ],
  editor: [
    "project:view",
    "task:create",
    "task:update",
    "task:move",
    "task:delete",
    "task:comment",
    "comment:react",
    "comment:upload",
    "template:manage",
  ],
  viewer: ["project:view", "comment:react"],
});

/**
 * Permissions that change what's on a board. An archived board is read-only,
 * so these are refused there until someone restores it. Settings, members
 * and deleting the board stay open, so it can still be restored or cleaned up.
 */
export const BLOCKED_ON_ARCHIVED_BOARD: ReadonlySet<Permission> = new Set<Permission>([
  "column:create",
  "column:update",
  "column:delete",
  "task:create",
  "task:update",
  "task:move",
  "task:delete",
  "task:comment",
  "comment:update",
  "comment:delete",
  "comment:react",
  "comment:upload",
  "member:invite",
  "automation:manage",
  "template:manage",
]);
