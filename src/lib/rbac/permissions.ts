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
  | "comment:upload";

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
  ],
  viewer: ["project:view", "comment:react"],
});
