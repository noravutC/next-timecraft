import { projectMembershipRoleEnum } from "@/db/schema/enums";

export type ProjectRole = typeof projectMembershipRoleEnum.enumValues[number];
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
  | "task:comment";

export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
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
  ],
  editor: [
    "project:view",
    "task:create",
    "task:update",
    "task:move",
    "task:delete",
    "task:comment",
  ],
  viewer: [
    "project:view",
  ],
};